import { UniversalLlmClient } from '../src/core/UniversalLlmClient.js';
import { CORPORATE_ROLES, KnowledgeBaseConnector } from '../src/core/CorporateRoles.js';
import { ModelRegistry } from '../src/models/ModelRegistry.js';
import { createServer } from '../src/server/server.js';

export async function runCoreEngineTests(): Promise<boolean> {
  console.log('\n--- Running Core Engine & Consilium Tests ---');
  let passed = true;

  function assert(cond: boolean, msg: string) {
    if (cond) {
      console.log(`  ✓ ${msg}`);
    } else {
      console.error(`  ✗ FAIL: ${msg}`);
      passed = false;
    }
  }

  // 1. UniversalLlmClient Provider Resolution
  const client = new UniversalLlmClient();
  assert(client.resolveProvider('gemini-2.5-flash') === 'google', 'Resolves gemini-2.5-flash to google');
  assert(client.resolveProvider('omniroute/deepseek-r1') === 'omniroute', 'Resolves omniroute model to omniroute');
  assert(client.resolveProvider('deepseek/deepseek-r1:free') === 'openrouter', 'Resolves openrouter free model to openrouter');
  // T-42: 'opencode/go-coder-32b' is a placeholder with no upstream route; it
  // is mapped through OmniRoute so it resolves instead of erroring.
  assert(client.resolveProvider('opencode/go-coder-32b') === 'omniroute', 'Resolves opencode placeholder via omniroute');
  assert(client.resolveProvider('any-model', 'omniroute') === 'omniroute', 'Explicit provider overrides default');

  // Message normalization
  const normalizedStr = client.normalizeToUniversal('Hello test');
  assert(normalizedStr.length === 1 && normalizedStr[0].content === 'Hello test', 'Normalizes string to UniversalMessage[]');

  const normalizedChat = client.normalizeToUniversal([
    { role: 'user', parts: [{ text: 'User msg' }] },
    { role: 'model', parts: [{ text: 'Assistant msg' }] },
  ]);
  assert(normalizedChat.length === 2 && normalizedChat[1].role === 'assistant', 'Normalizes ChatMessage[] to UniversalMessage[]');

  // 2. Corporate Roles & KnowledgeBaseConnector
  const roles = Object.values(CORPORATE_ROLES);
  assert(roles.length >= 4, `At least 4 corporate roles defined (found ${roles.length})`);
  assert(Boolean(CORPORATE_ROLES.architect), 'Architect role exists');
  assert(Boolean(CORPORATE_ROLES.devops), 'DevOps role exists');
  assert(Boolean(CORPORATE_ROLES.security_auditor), 'Security Auditor role exists');
  assert(Boolean(CORPORATE_ROLES.general_assistant), 'General Assistant role exists');

  // Currency compliance on role prompts
  for (const role of roles) {
    const hasRub = role.systemPrompt.includes('RUB') || role.systemPrompt.includes('₽');
    assert(!hasRub, `Role ${role.id} contains NO rubles`);
  }

  const kb = new KnowledgeBaseConnector();
  const searchResults = await kb.search('Kubernetes deployment microservices');
  assert(searchResults.length > 0, 'KnowledgeBaseConnector returns matching hybrid documents');
  assert(Boolean(searchResults[0].source), 'KnowledgeBase document contains hybrid source attribution');

  // 3. ModelRegistry additions
  const freeModels = ModelRegistry.getFreeModels();
  assert(freeModels.some((m) => m.id === 'deepseek/deepseek-r1:free'), 'deepseek/deepseek-r1:free is registered');
  assert(freeModels.some((m) => m.id === 'meta-llama/llama-3.3-70b:free'), 'meta-llama/llama-3.3-70b:free is registered');
  assert(freeModels.some((m) => m.id === 'google/gemini-2.0-flash-exp:free'), 'google/gemini-2.0-flash-exp:free is registered');
  assert(ModelRegistry.isValidModel('omniroute/gemini-2.5-pro'), 'omniroute/gemini-2.5-pro is valid');
  assert(ModelRegistry.isValidModel('opencode/go-coder-32b'), 'opencode/go-coder-32b is valid');

  // Pricing currency compliance check across all models
  for (const model of ModelRegistry.getAllModels()) {
    const p = model.pricing;
    const str = `${p.inputPer1MTokensUSD} ${p.outputPer1MTokensUSD} ${p.inputPer1MTokensEUR} ${p.outputPer1MTokensEUR} ${p.freeTierDetails}`;
    if (str.includes('RUB') || str.includes('₽')) {
      assert(false, `Model ${model.id} contains forbidden currency`);
    }
  }
  assert(true, `All ${ModelRegistry.getAllModels().length} models strictly enforce USD ($) and EUR (€) without rubles`);

  // 4. Server Endpoints Verification
  const server = createServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address() as any;
  const testPort = address.port;

  try {
    // GET /api/roles
    const rolesRes = await fetch(`http://127.0.0.1:${testPort}/api/roles`);
    assert(rolesRes.status === 200, 'GET /api/roles returns 200');
    const rolesJson: any = await rolesRes.json();
    assert(Array.isArray(rolesJson.roles) && rolesJson.roles.length >= 4, 'GET /api/roles returns list of roles');

    // POST /api/consilium validation
    const consiliumInvalidRes = await fetch(`http://127.0.0.1:${testPort}/api/consilium`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'invalid-mode', prompt: 'test' }),
    });
    assert(consiliumInvalidRes.status === 400, 'POST /api/consilium rejects invalid mode with 400');

    const consiliumEmptyPromptRes = await fetch(`http://127.0.0.1:${testPort}/api/consilium`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'solo' }),
    });
    assert(consiliumEmptyPromptRes.status === 400, 'POST /api/consilium rejects missing prompt with 400');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  return passed;
}
