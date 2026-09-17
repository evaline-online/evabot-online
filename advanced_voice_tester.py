import asyncio
import os

from aiohttp import web

HTML_CONTENT = """
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EvaBot: Voice Sync Demo</title>
    <style>
        body { font-family: 'Segoe UI', sans-serif; background: #0f172a; color: #f8fafc; margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; text-align: center; }
        .container { background: #1e293b; padding: 40px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); max-width: 500px; width: 90%; }
        h1 { margin-top: 0; color: #38bdf8; }
        select { width: 100%; padding: 15px; border-radius: 10px; border: 1px solid #475569; background: #0f172a; color: #fff; font-size: 16px; margin-bottom: 30px; outline: none; }
        .mic-btn { background: #e11d48; color: white; border: none; width: 120px; height: 120px; border-radius: 50%; font-size: 50px; cursor: pointer; box-shadow: 0 4px 15px rgba(225, 29, 72, 0.4); transition: transform 0.2s, background 0.2s; display: flex; align-items: center; justify-content: center; margin: 0 auto; }
        .mic-btn:hover { transform: scale(1.05); background: #be123c; }
        .mic-btn.active { background: #10b981; box-shadow: 0 0 30px rgba(16, 185, 129, 0.6); animation: pulse 1.5s infinite; }
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(16,185,129, 0.7); } 70% { box-shadow: 0 0 0 20px rgba(16,185,129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16,185,129, 0); } }
        .status { margin-top: 20px; font-size: 16px; color: #94a3b8; min-height: 24px; }
        .log-box { margin-top: 20px; background: #000; padding: 15px; border-radius: 10px; font-family: monospace; color: #10b981; font-size: 13px; text-align: left; max-height: 120px; overflow-y: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎙️ EvaBot Voice</h1>
        <p style="color: #cbd5e1; margin-bottom: 30px;">Выберите голос в списке, затем нажмите большую кнопку по центру и скажите фразу.</p>

        <select id="voiceSelect">
            <optgroup label="Нейросети Edge TTS (Лучшее качество)">
                <option value="edge|ru-RU-DmitryNeural">🇷🇺 Русский (Дмитрий, Муж)</option>
                <option value="edge|ru-RU-SvetlanaNeural">🇷🇺 Русский (Светлана, Жен)</option>
                <option value="edge|uk-UA-OstapNeural">🇺🇦 Український (Остап, Муж)</option>
                <option value="edge|uk-UA-PolinaNeural">🇺🇦 Український (Поліна, Жін)</option>
                <option value="edge|en-US-ChristopherNeural">🇺🇸 English (Christopher, Male)</option>
                <option value="edge|en-US-AriaNeural">🇺🇸 English (Aria, Female)</option>
            </optgroup>
            <optgroup label="Локальные голоса вашего устройства" id="webVoicesGroup">
            </optgroup>
        </select>

        <button id="micBtn" class="mic-btn">🎤</button>
        <div class="status" id="statusText">Готов к работе. Нажмите на микрофон.</div>

        <div class="log-box" id="log"></div>
        <audio id="audioPlayer" style="display:none;"></audio>
    </div>

    <script>
        const logEl = document.getElementById('log');
        const statusEl = document.getElementById('statusText');
        const micBtn = document.getElementById('micBtn');
        const voiceSelect = document.getElementById('voiceSelect');
        const audioPlayer = document.getElementById('audioPlayer');

        function log(msg) {
            logEl.innerHTML += `<div>> ${msg}</div>`;
            logEl.scrollTop = logEl.scrollHeight;
        }

        // Загрузка локальных голосов браузера
        const synth = window.speechSynthesis;
        let webVoices = [];
        function loadWebVoices() {
            webVoices = synth.getVoices().filter(v => ['ru', 'uk', 'en'].some(lang => v.lang.includes(lang)));
            const group = document.getElementById('webVoicesGroup');
            group.innerHTML = '';
            webVoices.forEach((v, i) => {
                group.innerHTML += `<option value="web|${i}">💻 ${v.name} (${v.lang})</option>`;
            });
        }
        loadWebVoices();
        if (speechSynthesis.onvoiceschanged !== undefined) speechSynthesis.onvoiceschanged = loadWebVoices;

        // Распознавание речи
        let recognition = null;
        let isListening = false;

        if (window.SpeechRecognition || window.webkitSpeechRecognition) {
            recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            recognition.continuous = false; // Режим рации: слушаем до паузы и отвечаем
            recognition.interimResults = false;
            recognition.lang = 'ru-RU'; // По умолчанию слушаем русскую речь

            recognition.onstart = () => {
                isListening = true;
                micBtn.classList.add('active');
                statusEl.innerText = "Слушаю вас... Говорите.";
            };

            recognition.onend = () => {
                isListening = false;
                micBtn.classList.remove('active');
            };

            recognition.onresult = async (e) => {
                const text = e.results[0][0].transcript;
                log(`Вы: "${text}"`);
                statusEl.innerText = "Генерация ответа ИИ...";
                await speak(text);
                statusEl.innerText = "Готов. Нажмите микрофон снова.";
            };
        } else {
            statusEl.innerText = "К сожалению, ваш браузер не поддерживает голосовой ввод.";
        }

        // Клик по кнопке микрофона
        micBtn.onclick = () => {
            if (synth.speaking) synth.cancel();
            audioPlayer.pause();

            if (isListening) {
                recognition.stop();
            } else {
                if(recognition) recognition.start();
            }
        };

        // Генерация голоса
        async function speak(text) {
            const selected = voiceSelect.value.split('|');
            const type = selected[0];
            const voiceId = selected[1];

            // Простой эхо-ответ от ИИ (в будущем тут будет запрос к Gemini)
            const reply = "Я вас услышал. Вы сказали: " + text;
            log(`EvaBot: ${reply}`);

            if (type === 'web') {
                const utter = new SpeechSynthesisUtterance(reply);
                utter.voice = webVoices[voiceId];
                synth.speak(utter);
            } else if (type === 'edge') {
                try {
                    const res = await fetch('/tts', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({text: reply, voice: voiceId})
                    });
                    if (res.ok) {
                        const blob = await res.blob();
                        audioPlayer.src = URL.createObjectURL(blob);
                        audioPlayer.play();
                    } else {
                        log("Ошибка сервера генерации Edge TTS");
                    }
                } catch(e) {
                    log("Ошибка соединения с сервером");
                }
            }
        }
    </script>
</body>
</html>
"""


async def handle_index(request):
    return web.Response(text=HTML_CONTENT, content_type="text/html")


async def handle_tts(request):
    try:
        data = await request.json()
        text = data.get("text", "Hello")
        voice = data.get("voice", "ru-RU-DmitryNeural")

        output_file = "/tmp/output.mp3"
        if os.path.exists(output_file):
            os.remove(output_file)

        cmd = (
            f'edge-tts --voice "{voice}" --text "{text}" --write-media "{output_file}"'
        )
        process = await asyncio.create_subprocess_shell(cmd)
        await process.communicate()

        if os.path.exists(output_file):
            return web.FileResponse(output_file)
        else:
            return web.Response(status=500, text="Failed to generate audio")

    except Exception as e:
        return web.Response(status=500, text=str(e))


if __name__ == "__main__":
    app = web.Application()
    app.router.add_get("/", handle_index)
    app.router.add_post("/tts", handle_tts)

    print("========================================")
    print(" Voice Sync Server v2 (Centered Button)")
    print(" Откройте в браузере: http://localhost:8085")
    print("========================================")
    web.run_app(app, host="0.0.0.0", port=8085)
