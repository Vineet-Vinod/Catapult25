from llm import generate
from speech_to_text import wav_to_text
from prompt import *
from record import pygamer
from services.executor import execute_output
import json
import os


def main() -> None:
    # stt = SpeechToText()
    # stt.transcribe()
    
    save_file = pygamer()
    response = generate(file_editing_prompt(wav_to_text(save_file)))
    if os.path.exists(save_file):
        os.remove(save_file)
    st = response.find("{")
    end = response.rfind("}")
    print(response)
    execute_output(json.loads(response[st:end+1]))


if __name__ == "__main__":
    main()