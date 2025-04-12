# Speech to text module using Vosk

from queue import Queue
from vosk import Model, KaldiRecognizer
from typing import Any
import sounddevice as sd
import vosk
import json


class SpeechToText:
    __instance: "SpeechToText" = None
    __MODEL_PATH: str = "model_medium"
    __SAMPLE_RATE: int = 16000
    queue: Queue = Queue()
    __MODEL: Model = Model(__MODEL_PATH)
    __REC: KaldiRecognizer = KaldiRecognizer(__MODEL, __SAMPLE_RATE)
    __PROMPT: str = ""


    def __new__(cls):
        if cls.__instance is None:
           cls.__instance = super().__new__(cls)
        
        return cls.__instance


    @staticmethod
    def callback(indata: str, frames: Any, time: Any, status: Any) -> None:
        SpeechToText.queue.put(bytes(indata))


    def transcribe(self) -> None:
        prompt: str = ""
        try:
            with sd.RawInputStream(samplerate=SpeechToText.__SAMPLE_RATE, blocksize = 8000, dtype="int16", channels=1, callback=SpeechToText.callback):
                while True:
                    data = SpeechToText.queue.get()
                    if SpeechToText.__REC.AcceptWaveform(data):
                        try:
                            translation = json.loads(SpeechToText.__REC.Result())
                            prompt += f"{translation["text"]} "
                            if "terminate" in prompt:
                                SpeechToText.__PROMPT = prompt
                                return
                        except:
                            raise Exception(f"Error in converting model output to JSON!")
                    
        except Exception as e:
            print("Error:", str(e))
            exit(1)

    def get_prompt(self) -> None:
        return SpeechToText.__PROMPT


if __name__ == "__main__":
    stt = SpeechToText()
    stt.transcribe()
    print(stt.get_prompt())
