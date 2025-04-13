# LLM API calls

import requests


def generate(input: str) -> str:
    response = requests.post(
        "http://10.186.92.201:11434/api/generate",
        json={
            "model": "deepseek-r1",
            "prompt": input,
            "stream": False
        }
    )

    return (response.json()["response"])


if __name__ == "__main__":
    print(generate("What is the distance of the sun from the earth"))
