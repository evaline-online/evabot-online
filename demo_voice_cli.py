import os
import subprocess
import tempfile


def check_dependencies():
    try:
        import gtts
    except ImportError:
        print("Библиотека gTTS не найдена. Устанавливаем...")
        os.system("pip install gTTS")
        print("Пожалуйста, перезапустите скрипт.")
        exit(0)


check_dependencies()
from gtts import gTTS

print("=" * 40)
print(" EvaBot Terminal Voice Demo (gTTS)")
print(" Для премиум-голосов (Studio) нужен платный API ключ Google Cloud.")
print(" Этот скрипт использует стандартные голоса Google Translate.")
print("=" * 40)
print("Доступные языки: ru, uk, en, pl, ro")
lang = input("Выберите язык (по умолчанию ru): ").strip()
if not lang:
    lang = "ru"

print("\nВведите текст, и я его произнесу (для выхода введите 'выход'):")

while True:
    text = input("\n> Вы: ")
    if text.lower() == "выход":
        break
    if not text:
        continue

    print(f"EvaBot: Генерирую аудио для: '{text}'...")

    try:
        tts = gTTS(text, lang=lang)
        # Создаем временный файл
        fd, temp_path = tempfile.mkstemp(suffix=".mp3")
        os.close(fd)

        tts.save(temp_path)

        # Пытаемся воспроизвести через ffplay, paplay или aplay
        # ffplay -nodisp -autoexit -hide_banner
        # используем subprocess чтобы скрыть вывод ffplay
        print("EvaBot: 🔊 Воспроизвожу...")
        with open(os.devnull, "w") as devnull:
            # Сначала пробуем ffplay, если он есть
            result = subprocess.run(
                ["ffplay", "-nodisp", "-autoexit", "-hide_banner", temp_path],
                stdout=devnull,
                stderr=devnull,
            )
            if result.returncode != 0:
                # Фоллбэк на paplay
                result = subprocess.run(
                    ["paplay", temp_path], stdout=devnull, stderr=devnull
                )
                if result.returncode != 0:
                    print(
                        "Ошибка: не удалось воспроизвести звук. Убедитесь, что установлен ffplay или paplay."
                    )

        os.remove(temp_path)
    except Exception as e:
        print(f"Произошла ошибка: {e}")
