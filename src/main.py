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


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
