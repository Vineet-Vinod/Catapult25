from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from pydub import AudioSegment
from executor import execute_output
from llm import generate
from speech_to_text import wav_to_text
import os
import json


app = Flask(__name__)
CORS(app)


@app.route('/process_audio', methods=['POST'])
def main():
    """
    Receives an audio file via POST request's FormData,
    processes it through the backend LLM pipeline and returns success.
    """
    if 'audio_file' not in request.files:
        print("A")
        return jsonify({'error': 'No audio file part in the request'}), 400

    audio_file = request.files['audio_file']

    if audio_file.filename == '':
        print("B")
        return jsonify({'error': 'No selected file'}), 400

    try:
        if audio_file:
            filename = secure_filename(audio_file.filename)
            audio_file.save(filename)

            audio = AudioSegment.from_file(filename)
            base = os.path.splitext(filename)[0]
            wav_path = f"{base}.wav"
            audio.export(wav_path, format="wav")


            response = wav_to_text(wav_path) # generate(wav_to_text(wav_path))
            # st = response.find("{")
            # end = response.rfind("}")
            # execute_output(json.loads(response[st:end+1]))
            print(response)

            return jsonify({
                'message': 'Audio uploaded and saved successfully!',
                'updatedFiles': ["regex.pdf"]#os.listdir(filename)
            }), 200

    except Exception as e:
        print(filename)
        return jsonify({'error': f'Failed to save or process file: {str(e)}'}), 500

    # This part should ideally not be reached if the checks above are correct
    print("D")
    return jsonify({'error': 'An unexpected error occurred'}), 500

@app.route("/save_file", methods=["POST"])
def save_file():
    try:
        data = request.get_json()
        if not data or 'filePath' not in data or 'content' not in data:
            return jsonify({"success": False, "error": "Missing filePath or content"}), 400

        relative_path = data['filePath']
        content = data['content']

        # --- Security Check: Prevent path traversal ---
        # Ensure the relative_path doesn't try to go "up" the directory tree
        if ".." in relative_path.split(os.path.sep):
             return jsonify({"success": False, "error": "Invalid path (contains '..')"}), 400
        # Basic check for absolute paths (might need refinement depending on OS)
        if os.path.isabs(relative_path):
             return jsonify({"success": False, "error": "Invalid path (absolute path detected)"}), 400

        # Construct the full path safely
        # TODO: SHOULD GET FULL PATH AS ARG
        full_path = os.path.join(CODE_BASE_DIR, relative_path)

        # Ensure the directory exists before writing
        try:
            directory = os.path.dirname(full_path)
            if not os.path.exists(directory):
                os.makedirs(directory) # Create parent directories if they don't exist
        except Exception as e:
             print(f"Error creating directory for {full_path}: {e}")
             return jsonify({"success": False, "error": f"Could not create directory structure: {e}"}), 500


        # Write the file content
        try:
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Successfully saved: {full_path}")
            return jsonify({"success": True})
        except IOError as e:
            print(f"Error writing file {full_path}: {e}")
            return jsonify({"success": False, "error": f"Could not write file: {e}"}), 500
        except Exception as e:
             print(f"Unexpected error saving file {full_path}: {e}")
             return jsonify({"success": False, "error": f"An unexpected error occurred: {e}"}), 500

    except Exception as e:
        print(f"Error in /save_file endpoint: {e}")
        return jsonify({"success": False, "error": "An internal server error occurred"}), 500
    
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
