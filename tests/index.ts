import { runModelTests } from './models.test.js';
import { runChatTests } from './chat.test.js';
import { runServerTests } from './server.test.js';
import { runCoreEngineTests } from './core-engine.test.js';
import { runUniversalClientTests } from './universal_client.test.js';
import { runConsiliumTests } from './consilium.test.js';
import { runRolesTests } from './roles.test.js';
import { runAnsiStreamEngineTests } from './ansi_stream_engine.test.js';
import { runPluginManagerTests, runEventBusTests } from './plugin-manager.test.js';
import { runLLMProvidersTests } from './llm-providers.test.js';
import { runKnowledgeBaseTests } from './knowledge-base.test.js';
import { runPluginConsiliumTests } from './consilium-new.test.js';
import { runAccountingAndBuilderTests } from './accounting_and_builder.test.js';
import { runCommandsAndHistoryTests } from './commands_and_history.test.js';
import { runProductsTests } from './products.test.js';
import { runTelegramTests } from './telegram.test.js';
import { runResilienceTests } from './resilience.test.js';
import { runDebugLogTests } from './debug_log.test.js';
import { runTranslateTests } from './translate.test.js';
import { runCloudTtsTests } from './cloudtts.test.js';
import { runCloudSttTests } from './cloudstt.test.js';
import { runDeveloperModeTests } from './developer_mode.test.js';
import { runUiParityTests } from './ui_parity.test.js';
import { runGeminiRoutingTests } from './gemini_routing.test.js';
import { runCliTuiTests } from './cli_tui.test.js';
import { runTelegramDeepTests } from './telegram_deep.test.js';
import { runRouterTests } from './routers.test.js';
import { runSubagentEngineTests } from './subagent_engine.test.js';
import { runLanguagePolicyTests } from './language_policy.test.js';
import { runEdgeTtsTests } from './edge_tts.test.js';
import { runAutoModelRouterTests } from './auto_model_router.test.js';
import { runCoveragePushTests } from './coverage_push.test.js';
import { runAddCommandTests } from './add_command.test.js';
import { runReportsCommandsTests } from './reports_commands.test.js';
import { runGeminiVisionTests } from './gemini_vision.test.js';

async function runAllTests(): Promise<void> {
  const suiteRunners: Array<[string, () => Promise<boolean>]> = [
    ['ModelTests', runModelTests],
    ['ChatTests', runChatTests],
    ['ServerTests', runServerTests],
    ['CoreEngineTests', runCoreEngineTests],
    ['UniversalClientTests', runUniversalClientTests],
    ['ConsiliumTests', runConsiliumTests],
    ['RolesTests', runRolesTests],
    ['AnsiStreamEngineTests', runAnsiStreamEngineTests],
    ['PluginManagerTests', runPluginManagerTests],
    ['EventBusTests', runEventBusTests],
    ['LLMProvidersTests', runLLMProvidersTests],
    ['KnowledgeBaseTests', runKnowledgeBaseTests],
    ['ConsiliumNewTests', runPluginConsiliumTests],
    ['AccountingAndBuilderTests', runAccountingAndBuilderTests],
    ['CommandsAndHistoryTests', runCommandsAndHistoryTests],
    ['ProductsTests', runProductsTests],
    ['TelegramTests', runTelegramTests],
    ['ResilienceTests', runResilienceTests],
    ['DebugLogTests', runDebugLogTests],
    ['TranslateTests', runTranslateTests],
    ['CloudTtsTests', runCloudTtsTests],
    ['CloudSttTests', runCloudSttTests],
    ['DeveloperModeTests', runDeveloperModeTests],
    ['UiParityTests', runUiParityTests],
    ['GeminiRoutingTests', runGeminiRoutingTests],
    ['CliTuiTests', runCliTuiTests],
    ['TelegramDeepTests', runTelegramDeepTests],
    ['RouterTests', runRouterTests],
    ['SubagentEngineTests', runSubagentEngineTests],
    ['LanguagePolicyTests', runLanguagePolicyTests],
    ['EdgeTtsTests', runEdgeTtsTests],
    ['AutoModelRouterTests', runAutoModelRouterTests],
    ['CoveragePushTests', runCoveragePushTests],
    ['AddCommandTests', runAddCommandTests],
    ['ReportsCommandsTests', runReportsCommandsTests],
    ['GeminiVisionTests', runGeminiVisionTests],
  ];

  console.log('================================================================');
  console.log(`⚡ EVABOT v0.1.0 — FULL TEST SUITE (${suiteRunners.length} test suites)`);
  console.log('================================================================\n');

  const results: boolean[] = [];
  const testNames: string[] = [];
  for (const [name, run] of suiteRunners) {
    testNames.push(name);
    results.push(await run());
  }

  let allPassed = true;
  console.log('\n================================================================');
  results.forEach((res, i) => {
    if (res) {
      console.log(`✓ Suite PASSED: ${testNames[i]}`);
    } else {
      console.error(`❌ Suite FAILED: ${testNames[i]}`);
      allPassed = false;
    }
  });

  console.log('\n================================================================');
  if (allPassed) {
    console.log(`✅ ALL ${testNames.length} TEST SUITES (100% OF TESTS) PASSED SUCCESSFULLY!`);
    console.log('================================================================\n');
    process.exit(0);
  } else {
    console.error('❌ SOME TESTS FAILED.');
    console.log('================================================================\n');
    process.exit(1);
  }
}

runAllTests();
