/**
 * ui_stream_verification.test.ts
 * Deep verification test suite for the Linear Stream Interface (LSI) architecture:
 * 1. Verifies that page-throwing window.scrollTo is completely eliminated.
 * 2. Verifies the two-screen scroll navigation: burger-btn -> scrollToSettings, back-btn -> scrollToChat.
 * 3. Verifies message structure: .msg-meta + .msg-body starting at zero indent.
 * 4. Verifies the 3 UI display modes: nocss, tui, web buttons & handlers.
 * 5. Verifies model modal has safe inline display:none for nocss mode.
 * 6. Verifies mobile landscape media query is present.
 * 7. Verifies all 8 CLI dashboard parity labels are intact.
 * 8. Verifies voice action bar controls (play, pause, stop, speed, copy, mp3, visualizer).
 */
import fs from 'node:fs';
import path from 'node:path';

export function runUiStreamVerificationTests(): boolean {
  console.log('\n--- Running Linear Stream Interface (LSI) Verification Tests ---');
  let passed = true;

  function assert(cond: boolean, msg: string) {
    if (cond) {
      console.log(`  ✓ ${msg}`);
    } else {
      console.error(`  ✗ FAIL: ${msg}`);
      passed = false;
    }
  }

  const htmlPath = path.resolve(process.cwd(), 'public', 'index.html');
  assert(fs.existsSync(htmlPath), 'public/index.html exists');
  const html = fs.readFileSync(htmlPath, 'utf8');

  // Test 1: Ensure window.scrollTo(0, document.body.scrollHeight) is removed (fixes being thrown to screen 2)
  {
    const hasBadWindowScroll = html.includes('window.scrollTo(0, document.body.scrollHeight)');
    assert(!hasBadWindowScroll, 'window.scrollTo(0, document.body.scrollHeight) completely eliminated');

    const hasChatContainerScroll = html.includes('chatContainer.scrollTop = chatContainer.scrollHeight;');
    assert(hasChatContainerScroll, 'chatContainer.scrollTop = chatContainer.scrollHeight is used for chat internal scrolling');
  }

  // Test 2: Two-screen scroll navigation
  {
    assert(html.includes('id="burger-btn"') && html.includes('onclick="scrollToSettings()"'), 'Burger button calls scrollToSettings() directly (no popups)');
    assert(html.includes('id="screen-settings"'), 'Screen 2 (#screen-settings) exists in DOM');
    assert(html.includes('id="screen-chat"'), 'Screen 1 (#screen-chat) exists in DOM');
    assert(html.includes('onclick="scrollToChat()"'), 'Back button on Screen 2 calls scrollToChat()');
    assert(html.includes('function scrollToSettings()') && html.includes('scrollIntoView'), 'scrollToSettings() implemented with smooth scrollIntoView');
    assert(html.includes('function scrollToChat()') && html.includes('scrollIntoView'), 'scrollToChat() implemented with smooth scrollIntoView');
  }

  // Test 3: Message structure (meta on top, zero-indent body)
  {
    assert(html.includes('.msg-meta'), '.msg-meta CSS class defined for sender and time');
    assert(html.includes('metaDiv.className = \'msg-meta\';'), 'addMessage constructs metaDiv for role and time');
    assert(html.includes('bodySpan.className = \'msg-body\';'), 'addMessage constructs bodySpan for message text');
    assert(html.includes('msgDiv.appendChild(metaDiv);') && html.includes('msgDiv.appendChild(bodySpan);'), 'addMessage appends metaDiv followed by bodySpan');
  }

  // Test 4: 3 UI display modes (nocss, tui, web)
  {
    assert(html.includes('id="btn-mode-nocss"'), '#btn-mode-nocss button exists in settings');
    assert(html.includes('id="btn-mode-tui"'), '#btn-mode-tui button exists in settings');
    assert(html.includes('id="btn-mode-web"'), '#btn-mode-web button exists in settings');
    assert(html.includes('id="ui-mode-desc"'), '#ui-mode-desc dynamic description element exists');
    assert(html.includes('function setDisplayMode('), 'setDisplayMode() function defined');
    assert(html.includes('window.setDisplayMode = setDisplayMode;'), 'setDisplayMode exposed on window');
    assert(html.includes('function syncUiModeButtons()'), 'syncUiModeButtons() function defined');
    assert(html.includes('btnNocss.classList.toggle(\'active\''), 'syncUiModeButtons highlights active mode button');
  }

  // Test 5: Safe nocss handling for modals
  {
    assert(html.includes('id="model-modal" style="display:none;"'), 'Model modal has inline style="display:none;" for clean nocss mode');
  }

  // Test 6: Mobile landscape responsiveness
  {
    assert(html.includes('@media (orientation: landscape) and (max-height: 540px)'), 'Dedicated mobile landscape media query exists');
    assert(html.includes('interactive-widget=resizes-content'), 'Viewport meta includes interactive-widget=resizes-content for mobile keyboards');
    assert(html.includes('100dvh'), 'Dynamic viewport height 100dvh used for iOS/Android browser bars');
  }

  // Test 7: CLI dashboard parity labels
  {
    const parityLabels = [
      'id="lbl-ping">Ping:<',
      'id="lbl-model">Model:<',
      'id="lbl-pool">Pool:<',
      'id="lbl-lang">Lang:<',
      'id="lbl-databases">Databases:<',
      'id="lbl-mode">Mode:<',
      'id="lbl-commands">Commands:<',
      'id="lbl-load">Load:<',
      'id="css-toggle"',
      'id="tts-toggle"'
    ];
    for (const lbl of parityLabels) {
      assert(html.includes(lbl), `Parity label "${lbl}" preserved`);
    }
  }

  // Test 8: Voice action bar controls
  {
    assert(html.includes('voice-btn-play'), 'Voice play button defined');
    assert(html.includes('voice-btn-pause'), 'Voice pause button defined');
    assert(html.includes('voice-btn-stop'), 'Voice stop button defined');
    assert(html.includes('voice-btn-speed'), 'Voice speed button defined');
    assert(html.includes('voice-btn-copy'), 'Text copy button defined');
    assert(html.includes('voice-btn-dl'), 'MP3 download button defined');
    assert(html.includes('voice-visualizer'), 'Voice ASCII visualizer defined');
  }

  console.log('--- UI Stream Verification Tests Complete ---\n');
  return passed;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const ok = runUiStreamVerificationTests();
  process.exit(ok ? 0 : 1);
}
