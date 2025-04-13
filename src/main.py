import os
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from executor import execute_output
from llm import generate
from record import pygamer
from speech_to_text import wav_to_text
import json


app = Flask(__name__)


@app.route('/process_audio', methods=['POST'])
def main():
    """
    Receives an audio file via POST request's FormData,
    processes it through the backend LLM pipeline and returns success.
    """
    if 'audio_file' not in request.files:
        return jsonify({'error': 'No audio file part in the request'}), 400

    audio_file = request.files['audio_file']

    if audio_file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if audio_file:
        filename = secure_filename(audio_file.filename)
        if not filename.lower().endswith('.wav'):
            base = os.path.splitext(filename)[0]
            filename = f"{base}.wav"

        try:
            audio_file.save(filename)

            response = generate(wav_to_text(filename))
            # st = response.find("{")
            # end = response.rfind("}")
            # execute_output(json.loads(response[st:end+1]))
            print(response)

            return jsonify({
                'message': 'Audio uploaded and saved successfully!',
                'updatedFiles': os.listdir(filename)
            }), 200

        except Exception as e:
            return jsonify({'error': f'Failed to save or process file: {str(e)}'}), 500

    # This part should ideally not be reached if the checks above are correct
    return jsonify({'error': 'An unexpected error occurred'}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
