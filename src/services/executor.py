import subprocess
import os


def run_shell_cmd(cmd):
    try:
        result = subprocess.run(cmd, shell=True, check=True, text=True, capture_output=True)
        return result
    except subprocess.CalledProcessError as e:
        print(f"(run_shell_cmd) command failed: {cmd}")
        print(e.stderr)


def update_file(path, content):
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, 'w') as f:
            f.write(content)
    except Exception as e:
        print(f"(update_file) failed to update {path}: {e}")


def execute_output(output_json: dict) -> None:
    for cmd in output_json["commands"]:
        run_shell_cmd(cmd)
    for update_cmd in output_json["files"]:
        update_file(update_cmd["path"], update_cmd["content"])


if __name__ == "__main__":
    pass
