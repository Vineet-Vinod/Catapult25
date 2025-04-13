# Speech to text module using SpeechRecognition (which uses the Google Speech-To-Text API)

import speech_recognition as sr


def wav_to_text(wavfile: str) -> str:
    recognizer = sr.Recognizer()

    try:
        with sr.AudioFile(wavfile) as source:
            audio_data = recognizer.record(source)
            text = recognizer.recognize_google(audio_data)
            return text
    except sr.UnknownValueError:
        print("(wav_to_text): Could not understand audio")
    except sr.RequestError as e:
        print(f"(wav_to_text): Could not request results from Google Speech Recognition service; {e}")
    except FileNotFoundError:
        print("(wav_to_text): File not found. Please check the file path.")
