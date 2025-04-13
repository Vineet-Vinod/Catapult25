from flask import Flask, Response
import paramiko
import os
import shlex
app = Flask(__name__)

# SSH configuration
hostname = "gautschi.rcac.purdue.edu"
port = 22
username = "briggs49"  # Remote server username
remote_script_path = "/home/briggs49/test_tunnel.sh"  # Path to remote script
ssh_key_path = os.path.expanduser("~/.ssh/id_ed25519")

def run_remote_script(prompt):
    quoted_prompt = shlex.quote(prompt) # safe string for shell execution
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(
            hostname=hostname,
            port=port,
            username=username,
            key_filename=ssh_key_path,
            look_for_keys=False
        )
        stdin, stdout, stderr = ssh.exec_command(f'bash {remote_script_path} {quoted_prompt}')

        output = stdout.read().decode("utf-8")
        errors = stderr.read().decode("utf-8")
        
        print("=== STDOUT ===")
        print(output)

        print("=== STDERR ===")
        print(errors)
        ssh.close()
        return output, errors
    except Exception as e:
        return "", f"Error: {e}"

@app.route("/test_tunnel.sh")
def handle_request():
    output, errors = run_remote_script()
    if errors:
        return Response(f"Errors:\n{errors}", status=500, mimetype="text/plain")
    return Response(f"Output:\n{output}", status=200, mimetype="text/plain")

if __name__ == "__main__":
    print(run_remote_script());
    # app.run(host="0.0.0.0", port=5000)