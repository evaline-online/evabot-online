import { ModelRegistry, GEMINI_MODELS } from '../src/models/ModelRegistry.js';

export function runModelTests(): boolean {
  console.log('\n--- Running ModelRegistry Tests ---');
  let passed = true;

  function assert(cond: boolean, msg: string) {
    if (cond) {
      console.log(`  ✓ ${msg}`);
    } else {
      console.error(`  ✗ FAIL: ${msg}`);
      passed = false;
    }
  }

  const all = ModelRegistry.getAllModels();
  assert(all.length >= 4, `At least 4 Gemini models registered (found ${all.length})`);

  const flash25 = ModelRegistry.getModelById('gemini-2.5-flash');
  assert(Boolean(flash25), 'gemini-2.5-flash is registered');

  const pro25 = ModelRegistry.getModelById('gemini-2.5-pro');
  assert(Boolean(pro25), 'gemini-2.5-pro is registered');

  const defaultModel = ModelRegistry.getDefaultModel();
  assert(Boolean(defaultModel && defaultModel.id), `Default model is defined (${defaultModel?.id})`);

  assert(ModelRegistry.isValidModel('gemini-2.0-flash'), 'gemini-2.0-flash is valid');
  assert(!ModelRegistry.isValidModel('non-existent-gpt-model'), 'Invalid model returns false');

  // Gemini 3.x Frontier Models Verification
  const flash38 = ModelRegistry.getModelById('gemini-3.8-flash');
  assert(Boolean(flash38), 'gemini-3.8-flash is registered');
  assert(flash38?.contextWindow === 1048576, 'gemini-3.8-flash context window is 1M tokens');
  assert(flash38?.maxOutputTokens === 8192, 'gemini-3.8-flash max output tokens is 8192');
  assert(Boolean(flash38?.pricing.inputPer1MTokensUSD.includes('$')), 'gemini-3.8-flash has USD pricing');
  assert(Boolean(flash38?.pricing.inputPer1MTokensEUR.includes('€')), 'gemini-3.8-flash has EUR pricing');

  const pro31 = ModelRegistry.getModelById('gemini-3.1-pro');
  assert(Boolean(pro31), 'gemini-3.1-pro is registered');
  assert(pro31?.contextWindow === 2097152, 'gemini-3.1-pro context window is 2M tokens');
  assert(pro31?.maxOutputTokens === 8192, 'gemini-3.1-pro max output tokens is 8192');
  assert(Boolean(pro31?.pricing.inputPer1MTokensUSD.includes('$')), 'gemini-3.1-pro has USD pricing');
  assert(Boolean(pro31?.pricing.inputPer1MTokensEUR.includes('€')), 'gemini-3.1-pro has EUR pricing');

  assert(ModelRegistry.isValidModel('omniroute/gemini-3.8-flash'), 'omniroute/gemini-3.8-flash is valid');
  assert(ModelRegistry.isValidModel('omniroute/gemini-3.1-pro'), 'omniroute/gemini-3.1-pro is valid');

  return passed;
}
