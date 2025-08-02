import modal
import os
import uuid
import base64
import requests
from pydantic import BaseModel

app = modal.App("music-generator")

image = (
    modal.Image.debian_slim()
        .apt_install('git')
        .pip_install_from_requirements('requirements.txt')
        .run_commands([
            'git clone https://github.com/ace-step/ACE-Step.git /tmp/ACE-Step',
            'cd /tmp/ACE-Step && pip install .',
        ])
        .env({"HF_HOME": "/.cache/huggingface"})
        .add_local_python_source("prompts")
)

model_volume = modal.Volume.from_name(
    "ace-step-modals", create_if_missing=True)
hf_volume = modal.Volume.from_name("qwen-hf-cache", create_if_missing=True)
music_gen_secrets = modal.Secret.from_name("music-gen-secret")

class GenerateMusicResponse(BaseModel):
    audio_data: str
    

@app.cls(
    image=image,
    gpu="L40S",
    volumes={"/models": model_volume, "/.cache/huggingface": hf_volume},
    secrets=[music_gen_secrets],
    scaledown_window=15
)
class MusicGenServer:
    @modal.enter()
    def load_model(self):
        from acestep.pipeline_ace_step import ACEStepPipeline
        from transformers import AutoModelForCausalLM, AutoTokenizer
        from diffusers import AutoPipelineForText2Image
        import torch
        
        self.music_model = ACEStepPipeline(
            checkpoint_dir = "/models",
            dtype="bfloat16",
            torch_compile=False,
            cpu_offload=False,
            overlapped_decode=False        
        )
        
        # llm model
        model_id = "Qwen/Qwen2-7B-Instruct"
        self.tokenizer = AutoTokenizer.from_pretrained(model_id)
        self.llm_model = AutoModelForCausalLM.from_pretrained(
            model_id,
            torch_dtype="auto",
            device_map="auto",
            cache_dir="/.cache/huggingface"
        )
        
        # stable diffusion model (thumbnails)
        diffuser_id="stabilityai/sdxl-turbo"
        self.image_pipe = AutoPipelineForText2Image.from_pretrained(
            diffuser_id, torch_dtype=torch.float16, variant="fp16", cache_dir="/.cache/huggingface"
        )
        self.image_pipe.to("cuda")
    
    @modal.fastapi_endpoint(method="POST")
    def generate(self) -> GenerateMusicResponse:
        output_dir = "/tmp/outputs"
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, f"{uuid.uuid4()}.wav")
        
        self.music_model(
            prompt="hip-hop, rap, new york, joyful, 120bpm ",
            lyrics="[instrumental]",
            audio_duration=120,
            infer_step=60,
            guidance_scale=15,
            save_path=output_path
        )
        
        with open(output_path, "rb") as f:
            audio_bytes = f.read()
        
        audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
        
        os.remove(output_path)
        return GenerateMusicResponse(audio_data=audio_b64)

@app.local_entrypoint()
def main():
    server = MusicGenServer()
    endpoint_url = server.generate.get_web_url()
    
    response = requests.post(endpoint_url)
    response.raise_for_status()
    result = GenerateMusicResponse(**response.json())
    
    audio_bytes = base64.b64decode(result.audio_data)
    output_filename = "generated.wav"
    with open(output_filename, "wb") as f:
        f.write(audio_bytes)
        
        
