import asyncio
import json

import aiohttp
import edge_tts
from aiohttp import web

HTML = """
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EvaBot: Real-Time WebSocket Streaming</title>
    <style>
        body { font-family: 'Segoe UI', sans-serif; background: #0f172a; color: #fff; text-align: center; margin: 0; padding-top: 40px; }
        .container { max-width: 600px; margin: 0 auto; background: #1e293b; padding: 30px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        h1 { color: #38bdf8; margin-top: 0;}
        .mic { font-size: 50px; background: #e11d48; color: white; border-radius: 50%; width: 120px; height: 120px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; border: none; box-shadow: 0 0 20px rgba(225,29,72,0.4); margin-bottom: 15px; transition: 0.2s;}
        .mic:hover { transform: scale(1.05); }
        .mic.listening { background: #10b981; animation: pulse 1s infinite; }
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(16,185,129, 0.7); } 70% { box-shadow: 0 0 0 20px rgba(16,185,129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16,185,129, 0); } }
        select { padding: 12px; font-size: 16px; margin-bottom: 20px; width: 100%; border-radius: 8px; background: #0f172a; color: white; border: 1px solid #334155;}
        #log { margin-top: 20px; background: #000; padding: 15px; border-radius: 10px; text-align: left; height: 250px; overflow-y: auto; color: #10b981; font-family: monospace; font-size: 14px; line-height: 1.4;}
        .user-msg { color: #38bdf8; }
        .bot-msg { color: #f43f5e; }
        #status { color: #94a3b8; font-size: 14px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Streaming Pipeline</h1>
        <p style="color: #cbd5e1; font-size: 14px;">WebSockets + LLM Stream + Chunked Audio</p>

        <select id="voice">
            <option value="ru-RU-DmitryNeural">Русский (Дмитрий, Edge)</option>
            <option value="ru-RU-SvetlanaNeural">Русский (Светлана, Edge)</option>
            <option value="uk-UA-OstapNeural">Український (Остап, Edge)</option>
            <option value="en-US-ChristopherNeural">English (Christopher, Edge)</option>
        </select>

        <button id="micBtn" class="mic">🎤</button>
        <div id="status">Нажмите на микрофон. WebSocket: подключается...</div>

        <div id="log"></div>
    </div>

    <script>
        const ws = new WebSocket(`ws://${window.location.host}/ws`);
        const logEl = document.getElementById('log');
        const micBtn = document.getElementById('micBtn');
        const statusEl = document.getElementById('status');
        const voiceSel = document.getElementById('voice');

        function log(msg, type='info') {
            const color = type==='user' ? '#38bdf8' : (type==='bot' ? '#f43f5e' : '#10b981');
            logEl.innerHTML += `<div style="color: ${color};">> ${msg}</div>`;
            logEl.scrollTop = logEl.scrollHeight;
        }

        // Audio Queue System for seamless playback of incoming audio chunks
        let audioQueue = [];
        let isPlaying = false;
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        ws.onopen = () => { statusEl.innerText = "🟢 Подключено (WebSocket). Готов."; };
        ws.onclose = () => { statusEl.innerText = "🔴 Отключено от сервера."; };

        ws.onmessage = async (event) => {
            if (typeof event.data === "string") {
                const msg = JSON.parse(event.data);
                if (msg.type === "text") {
                    log(`EvaBot (Чанк): ${msg.content}`, 'bot');
                }
            } else {
                // Получены бинарные данные (MP3 поток)
                log("🔊 Получен аудио-байты. Добавлено в очередь.", 'info');
                const arrayBuffer = await event.data.arrayBuffer();
                audioCtx.decodeAudioData(arrayBuffer, (buffer) => {
                    audioQueue.push(buffer);
                    playNextAudio();
                }, (err) => console.error(err));
            }
        };

        function playNextAudio() {
            if (isPlaying || audioQueue.length === 0) return;
            isPlaying = true;
            const source = audioCtx.createBufferSource();
            source.buffer = audioQueue.shift();
            source.connect(audioCtx.destination);
            source.onended = () => {
                isPlaying = false;
                playNextAudio();
            };
            source.start();
        }

        // Web Speech API (STT)
        let recognition = null;
        if (window.SpeechRecognition || window.webkitSpeechRecognition) {
            recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            recognition.continuous = false;
            recognition.interimResults = false;

            recognition.onstart = () => {
                micBtn.classList.add('listening');
                statusEl.innerText = "Слушаю вас...";
            };
            recognition.onend = () => {
                micBtn.classList.remove('listening');
                statusEl.innerText = "🟢 Подключено. Готов.";
            };

            recognition.onresult = (e) => {
                const text = e.results[0][0].transcript;
                log(`Вы сказали: "${text}"`, 'user');
                statusEl.innerText = "Идет потоковая генерация...";

                // Очистка очереди перед новым ответом
                audioQueue = [];
                if(isPlaying) { audioCtx.suspend(); audioCtx.resume(); isPlaying = false; }

                // Отправка по WebSocket
                ws.send(JSON.stringify({ type: "prompt", text: text, voice: voiceSel.value }));
            };
        } else {
            statusEl.innerText = "Ваш браузер не поддерживает микрофон.";
        }

        micBtn.onclick = () => {
            if(audioCtx.state === 'suspended') audioCtx.resume();
            recognition.start();
        };
    </script>
</body>
</html>
"""


async def handle_index(request):
    return web.Response(text=HTML, content_type="text/html")


async def handle_ws(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    async for msg in ws:
        if msg.type == aiohttp.WSMsgType.TEXT:
            data = json.loads(msg.data)
            if data["type"] == "prompt":
                user_text = data["text"]
                voice = data["voice"]

                # ЭМУЛЯЦИЯ ПОТОКОВОЙ LLM (Gemini Stream).
                # ИИ не ждет всей генерации. Он выдает ответ кусками (чанками)
                # по мере того как "думает".
                response_clauses = [
                    "Здравствуйте!",
                    f"Я моментально приняла ваш запрос: {user_text}.",
                    "Благодаря технологии WebSockets,",
                    "и потоковой аудио-архитектуре,",
                    "мы добились минимальных задержек.",
                    "Я произношу слова сразу же, как только они были сгенерированы!",
                ]

                for clause in response_clauses:
                    # 1. Отправляем текст куска на клиент
                    await ws.send_json({"type": "text", "content": clause})

                    # 2. Немедленно генерируем аудио ИМЕННО для этого короткого куска
                    communicate = edge_tts.Communicate(clause, voice)

                    # 3. Собираем аудио-байты в память
                    audio_data = bytearray()
                    async for chunk in communicate.stream():
                        if chunk["type"] == "audio":
                            audio_data.extend(chunk["data"])

                    # 4. Отправляем бинарный MP3-чанк клиенту по WebSocket!
                    if audio_data:
                        await ws.send_bytes(bytes(audio_data))

                    # Задержка 0.4 сек для реалистичности работы реальной LLM API
                    await asyncio.sleep(0.4)

    return ws


if __name__ == "__main__":
    app = web.Application()
    app.router.add_get("/", handle_index)
    app.router.add_get("/ws", handle_ws)
    print("==================================================")
    print(" 🚀 Realtime Streaming Server Running (Port 8086)")
    print(" Open http://localhost:8086 in your browser")
    print("==================================================")
    web.run_app(app, host="0.0.0.0", port=8086)
