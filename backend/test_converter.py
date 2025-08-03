#!/usr/bin/env python3

import os
from pydub import AudioSegment

def convert_wav_to_mp3(input_file):
    """Convert WAV file to MP3 in the same folder"""
    if not os.path.exists(input_file):
        print(f"Error: File '{input_file}' not found")
        return False
    
    if not input_file.lower().endswith('.wav'):
        print(f"Error: '{input_file}' is not a WAV file")
        return False
    
    try:
        # Load WAV file
        audio = AudioSegment.from_wav(input_file)
        
        # Create output filename
        output_file = input_file.replace('.wav', '.mp3')
        
        # Convert to MP3 with 192k bitrate
        audio.export(output_file, format="mp3", bitrate="192k")
        
        print(f"Successfully converted '{input_file}' to '{output_file}'")
        return True
        
    except Exception as e:
        print(f"Error converting file: {e}")
        return False

if __name__ == "__main__":
    # Convert generated.wav to generated.mp3
    convert_wav_to_mp3("generated.wav")