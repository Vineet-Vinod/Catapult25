from llm import generate
from speech_to_text import SpeechToText
from prompt import *
from clean_prompt import get_cleaned_command_variations
from services.executor import execute_output
import json


def main() -> None:
    stt = SpeechToText()
    stt.transcribe()
    
    response = generate(file_editing_prompt(get_cleaned_command_variations(stt.get_prompt())["first"]))
    # st = response.find("{")
    # end = response.rfind("}")
    print(response)
    # execute_output(json.loads(response[st:end+1]))


if __name__ == "__main__":
    main()