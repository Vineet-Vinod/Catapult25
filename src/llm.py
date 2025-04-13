# LLM API calls

from prompt import *
from google import genai
import requests


def prompt_chooser(input: str) -> int:
    response = requests.post(
        "http://10.186.86.44:11434/api/generate",
        json={
            "model": "deepseek-r1",
            "prompt": f"""You are a task classification assistant. The user needs you to classifiy given prompts into the best category among
                          1. File Creation
                          2. File Editing
                          3. Debugging
                          4. Script Execution
                          5. Dependancy Management
                          6. Refactoring
                          You will return your response as a single digit number between 1-6, indicating the best classification. You WILL NOT EXPLAIN YOUR THINKING/REASONING.
                          For example, your output may be: "2"
                          Return only 2 in that case.
                          Do not add extra text!
                          
                          Prompt: {input.strip()}
                          """,
            "stream": False
        }
    )

    response = str(response.json()["response"])
    idx = response.find("</think>")
    response = response[idx+8:]

    try:
        return int(response)
    except:
        return 2


def generate(input: str) -> str:
    mapping = [None, file_creation_prompt, file_editing_prompt, debugging_prompt, execution_prompt, dependancy_management_prompt, refactoring_prompt]
    idx = prompt_chooser(input)
    url = "http://10.186.27.233:5010/llama-run"
    data = {"prompt": mapping[idx](input)}
    # data = {"model": "deepseek-r1", "prompt": mapping[idx](input), "stream": False}

    response = requests.post(url, json=data)
    print(response.json())
    response = str(response.json()["response"])
    idx = response.find("</think>")
    return response[idx+8:]

    # genai.configure(api_key="AIzaSyCRRWsQBCnUBZ2wTxqg7w1-xoLqFft93tc")

    # model = genai.GenerativeModel("")
    # response = model.generate_content("Explain the concept of quantum entanglement.")

    # return response.text



if __name__ == "__main__":
    print(generate("What is the distance of the sun from the earth"))
