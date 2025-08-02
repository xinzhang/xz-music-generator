# xz-music-generator

xz-music-generator is a project for music generation, featuring a backend powered by the ACE-Step model. This project enables users to generate music from text prompts and lyrics, with advanced options for customization and editing.

## Features

- Text-to-music generation using state-of-the-art models
- Support for lyric alignment and genre presets
- User interface for easy interaction (via ACE-Step)
- Advanced options for editing, repainting, and extending generated music

## Project Structure

- `backend/`  
  Contains the main backend code, including:
  - `main.py`: Entry point for backend services
  - `prompts.py`: Prompt templates and utilities
  - `ACE-Step/`: Submodule with the ACE-Step model and UI

## Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/xz-music-generator.git
   cd xz-music-generator/backend/ACE-Step
   ```

2. **Set up a Python virtual environment (recommended):**

   ```bash
   conda create -n ace_step python=3.10 -y
   conda activate ace_step
   ```

3. **Install dependencies:**
   ```bash
   pip install -e .
   ```

## Usage

### Basic Usage

To launch the ACE-Step user interface:

```bash
acestep --port 7865
```

### Advanced Usage

You can specify additional options such as checkpoint path, device, and precision:

```bash
acestep --checkpoint_path /path/to/checkpoint --port 7865 --device_id 0 --share true --bf16 true
```

## License

This project is licensed under the [Apache License 2.0](backend/ACE-Step/LICENSE).

## Acknowledgements

- [ACE-Step](https://github.com/ace-step/ACE-Step) by ACE Studio and StepFun AI

## Citation

If you use this project in your research, please cite ACE-Step as follows:

```BibTeX
@misc{gong2025acestep,
  title={ACE-Step: A Step Towards Music Generation Foundation Model},
  author={Junmin Gong, Wenxiao Zhao, Sen Wang, Shengyuan Xu, Jing Guo},
  howpublished={\url{https://github.com/ace-step/ACE-Step}},
  year={2025},
  note={GitHub repository}
```
