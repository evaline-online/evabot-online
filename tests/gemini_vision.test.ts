import { GeminiClient, ChatMessage, ImageInput } from '../src/core/GeminiClient.js';
import { UniversalLlmClient } from '../src/core/UniversalLlmClient.js';
import { Config } from '../src/core/Config.js';
import { GoogleAuthProvider } from '../src/core/GoogleAuthProvider.js';

/**
 * Vision (image input) payload-shape tests.
 *
 * Live generation against Gemini currently returns 403 (project denied for
 * generateContent) — that is an external blocker. These tests therefore assert
 * the exact request payload: inlineData parts for Gemini and image_url data
 * URLs for OpenAI-compatible providers. No network is used.
 */

const OK_BODY = { candidates: [{ content: { parts: [{ text: 'ok' }] } }] };
const OMNI_OK_BODY = { choices: [{ message: { content: 'ok' } }] };

const PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const originalFetch = globalThis.fetch;
let captured: Array<{ url: string; body: any }> = [];

function installFetchMock(): void {
  (globalThis as any).fetch = async (url: any, init: any = {}) => {
    let body: any = undefined;
    try {
      body = init && init.body ? JSON.parse(init.body) : undefined;
    } catch {
      body = init && init.body;
    }
    captured.push({ url: String(url), body });
    const isOpenAi = String(url).includes('/chat/completions');
    return new Response(JSON.stringify(isOpenAi ? OMNI_OK_BODY : OK_BODY), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };
}

function restoreFetch(): void {
  globalThis.fetch = originalFetch;
  captured = [];
}

const SAMPLE_MSGS: ChatMessage[] = [{ role: 'user', parts: [{ text: 'describe this image' }] }];
const IMAGES: ImageInput[] = [
  { mimeType: 'image/jpeg', dataBase64: `data:image/jpeg;base64,${PNG_B64}` },
  { mimeType: 'image/png', dataBase64: PNG_B64 },
];

export async function runGeminiVisionTests(): Promise<boolean> {
  console.log('\n--- Running Gemini Vision (Image Input) Tests ---');
  let passed = true;

  function assert(cond: boolean, msg: string) {
    if (cond) {
      console.log(`  ✓ ${msg}`);
    } else {
      console.error(`  ✗ FAIL: ${msg}`);
      passed = false;
    }
  }

  const savedKey = Config.geminiApiKey;
  const savedVertex = Config.vertexEnabled;
  const savedGetCreds = GoogleAuthProvider.getCredentials;
  (Config as any).geminiApiKey = 'AIzaSyVISION_TEST_KEY_000000000000';
  (Config as any).vertexEnabled = false;
  (GoogleAuthProvider as any).getCredentials = async () => {
    throw new Error('TRAP: getCredentials must not be called on the free-tier key path');
  };

  installFetchMock();
  try {
    const gemini = new GeminiClient('AIzaSyVISION_TEST_KEY_000000000000');

    captured = [];
    await gemini.generateContent('gemini-2.5-flash', SAMPLE_MSGS);
    let parts = captured[0].body.contents[0].parts;
    assert(parts.length === 1 && parts[0].text === 'describe this image', 'Text-only call keeps a single text part (backward compatible)');
    assert(!('inlineData' in parts[0]), 'Text-only call sends no inlineData');

    captured = [];
    await gemini.generateContent('gemini-2.5-flash', SAMPLE_MSGS, { images: IMAGES });
    parts = captured[0].body.contents[0].parts;
    const inline = parts.filter((p: any) => p.inlineData);
    assert(parts.length === 3, 'Image call appends inlineData parts to the last user turn');
    assert(inline.length === 2, 'Both images forwarded as inlineData');
    assert(inline[0].inlineData.mimeType === 'image/jpeg', 'Data-URL mimeType is honored');
    assert(inline[0].inlineData.data === PNG_B64, 'data: prefix stripped from base64 payload');
    assert(inline[1].inlineData.mimeType === 'image/png', 'Explicit mimeType honored for raw base64');
    assert(captured[0].body.contents.length === 1 && captured[0].body.contents[0].role === 'user', 'Original message array shape preserved');

    const universal = new UniversalLlmClient('AIzaSyVISION_TEST_KEY_000000000000');
    captured = [];
    await universal.generateContent('gemini-2.5-flash', 'describe this image', { images: IMAGES });
    const gParts = captured[0].body.contents[0].parts.filter((p: any) => p.inlineData);
    assert(gParts.length === 2, 'UniversalLlmClient google provider forwards images to Gemini');

    captured = [];
    await universal.generateContent('omniroute/gpt-4o', 'describe this image', { images: IMAGES });
    const omniMsg = captured[0].body.messages.find((m: any) => m.role === 'user');
    assert(Array.isArray(omniMsg.content), 'OpenAI-compatible provider builds multimodal content array');
    assert(omniMsg.content[0].type === 'text', 'Multimodal content keeps text first');
    assert(omniMsg.content.filter((c: any) => c.type === 'image_url').length === 2, 'OpenAI-compatible content has 2 image_url parts');
    assert(omniMsg.content[1].image_url.url.startsWith('data:image/jpeg;base64,'), 'image_url uses a proper data URL');
    assert(!omniMsg.content[1].image_url.url.includes('data:image/jpeg;base64,data:'), 'data URL prefix not duplicated');
  } catch (err: any) {
    console.error(`  ✗ FAIL: unexpected error: ${err.message}`);
    passed = false;
  } finally {
    restoreFetch();
    (Config as any).geminiApiKey = savedKey;
    (Config as any).vertexEnabled = savedVertex;
    (GoogleAuthProvider as any).getCredentials = savedGetCreds;
  }

  return passed;
}
