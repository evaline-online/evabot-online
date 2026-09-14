# EvaBot Quickstart & User Guide

**Version:** 0.2.0  
**Pricing Standards:** Strictly USD ($) / EUR (€)  

---

## 1. Prerequisites & API Key Setup

EvaBot uses Google Gemini models through your Google AI Pro subscription.
You can supply your Gemini API key in one of three ways:
1. **Environment Variable:** Set `export GEMINI_API_KEY="your_api_key"` in your shell.
2. **Local Configuration File:** Create a `.env` file in the project root containing:
   ```env
   GEMINI_API_KEY="your_api_key"
   DEFAULT_MODEL="gemini-2.5-flash"
   PORT=3000
   ```
3. **Web Interface Settings:** Click the **API Key** button in the top navigation bar of the web app to save your key in browser storage.

---

## 2. Running in Terminal (CLI Mode)

### Interactive REPL Mode
Run the interactive terminal chat:
```bash
npm run cli
```

Inside the CLI REPL, the following slash commands are available:
- `/models`: Display all available Google Gemini models and tiers.
- `/model <model_id>`: Switch the active model (e.g. `/model gemini-2.5-pro`).
- `/key <api_key>`: Set or update your Gemini API key for the current session.
- `/system <prompt>`: Customize the assistant's persona and system instructions.
- `/clear`: Clear the conversation history.
- `/history`: Check current turn count.
- `/help`: Print command cheat sheet.
- `/exit` (or `exit`): Exit the CLI.

### Scripted One-Shot Mode
You can send a prompt directly from the terminal or in CI/CD scripts:
```bash
npx tsx src/cli/terminal-chat.ts --prompt "Explain quantum computing briefly" --model "gemini-2.5-flash"
```

---

## 3. Running Web Server & Browser Interface

Start the local server:
```bash
npm start
```
Then navigate to `http://localhost:3000` in your web browser.

### Features in the Web Interface:
1. **Dynamic Model Switcher:** Instantly select `gemini-2.5-flash`, `gemini-2.5-pro`, `gemini-2.0-flash`, or `gemini-1.5-pro`.
2. **Real-Time Streaming:** Responses stream token-by-token directly to the screen.
3. **Markdown & Code Highlighting:** Formatted text, lists, and code blocks with one-click **Copy** buttons.
4. **Local Key Storage:** Save your Google AI Pro API key locally without exposing it on public servers.

---

## 4. Automated Testing & Verification

Run the automated test suite:
```bash
npm test
```
The test suite verifies model registry integrity, chat session history management, server health endpoints, and strict financial compliance rules (USD `$` and EUR `€` only).
