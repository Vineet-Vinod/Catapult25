from executor import execute_output
from llm import generate
from record import pygamer
from speech_to_text import wav_to_text
import json
import os


def main() -> None:
    save_file = pygamer()
    response = generate(wav_to_text(save_file))
    if os.path.exists(save_file):
        os.remove(save_file)

    st = response.find("{")
    end = response.rfind("}")
    execute_output(json.loads(response[st:end+1]))


if __name__ == "__main__":
    main()