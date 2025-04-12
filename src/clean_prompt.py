# Take in a speech-to-text instruction from the user and generate 3 possible instructions (to account for translation errors)
# Ask user to pick the closest instruction/reroll - optional text edit

from typing import Dict
from llm import generate
import json


def build_prompt(original_command: str) -> str:
    prompt = f"""
You are a language model specialized in interpreting and correcting voice commands that may have been mistranscribed by a speech-to-text system.

Given the original input below, return a JSON object with three possible cleaned-up versions of what the user most likely intended to say.

Guidelines:
- Return only valid JSON. No explanations or extra formatting.
- Keys should be: "first", "second", and "third".
- Values should be natural, corrected versions of the input.
- Keep the command's original intent intact.
- Handle common speech-to-text issues like homophones, missing or extra words, and misheard phrases.

Original Input:
"{original_command}"

Respond only with JSON like:
{{
  "first": "...",
  "second": "...",
  "third": "..."
}}
"""
    return prompt.strip()


def get_cleaned_command_variations(original_command: str) -> Dict[str, str]:
    prompt = build_prompt(original_command)
    response = generate(prompt)
    return parse_json_response(response)


def parse_json_response(response: str) -> Dict[str, str]:
    try:
        return json.loads(response)
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse LLM response as JSON: {e}\n\nRaw response:\n{response}")
