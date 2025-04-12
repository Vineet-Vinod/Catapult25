import sounddevice as sd
import numpy as np
import wave
import pygame
import threading


sample_rate = 44100
channels = 1
is_recording = False
audio_data = []
save_file = "temp_voice.wav"


def start_recording():
    global is_recording, audio_data
    is_recording = True
    audio_data = []
    threading.Thread(target=record).start()


def stop_recording():
    global is_recording
    is_recording = False
    filename = save_file
    save_wav(filename)
    return filename


def record():
    global audio_data
    with sd.InputStream(samplerate=sample_rate, channels=channels, dtype='int16') as stream:
        while is_recording:
            data, _ = stream.read(1024)
            audio_data.append(data.copy())


def save_wav(filename):
    full_data = np.concatenate(audio_data)
    with wave.open(filename, 'wb') as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(2)  # 16-bit audio
        wf.setframerate(sample_rate)
        wf.writeframes(full_data.tobytes())


# Pygame UI
def pygamer():
    pygame.init()
    screen = pygame.display.set_mode((400, 200))
    pygame.display.set_caption("Voice Recorder (sounddevice)")
    font = pygame.font.SysFont(None, 36)

    def draw_text(text, color=(0, 255, 0)):
        screen.fill((0, 0, 0))
        img = font.render(text, True, color)
        screen.blit(img, (20, 80))
        pygame.display.flip()

    draw_text("Press [R] to Record")

    running = True
    while running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                if is_recording:
                    stop_recording()
                running = False
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_r and not is_recording:
                    start_recording()
                    draw_text("Recording... Press [S] to Stop", (255, 0, 0))
                if event.key == pygame.K_s and is_recording:
                    file = stop_recording()
                    running = False
                    draw_text(f"Saved: {file}", (0, 255, 0))

    pygame.quit()
    return save_file
