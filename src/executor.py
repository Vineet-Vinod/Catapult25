import subprocess
import os


rootdir = os.path.dirname(os.path.dirname(__file__))


def run_shell_cmd(cmd: str):
    try:
        result = subprocess.run(cmd, shell=True, check=True, text=True, capture_output=True)
        return result
    except subprocess.CalledProcessError as e:
        print(f"(run_shell_cmd) command failed: {cmd}")
        print(e.stderr)


def update_file(path: str, content: str) -> None:
    try:
        os.makedirs(os.path.dirname(f"{rootdir}{path}"), exist_ok=True)
        with open(f"{rootdir}{path}", 'w') as f:
            f.write(content)
    except Exception as e:
        print(f"(update_file) failed to update {path}: {e}")


def execute_output(output_json: dict) -> None:
    """Handles JSON output from LLM according to structure in src/prompt.py\n
    For file paths in { "files": { "path": ... } } please prefix filepath with '/' and specify relative to rootdir\n
    For example: '/src/services/executor.py'"""
    results = []
    for update_cmd in output_json["files"]:
        update_file(update_cmd["path"], update_cmd["content"])
    for cmd in output_json["commands"]:
        results.append(run_shell_cmd(cmd))
    return results
