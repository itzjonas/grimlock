// ==UserScript==
// @name        Grimlock
// @version     0.2.0
// @description Coming soon...
// @author      JSON
// @contributor Chester.js
// @match       https://www.bing.com/*
// @match       https://account.microsoft.com/rewards*
// @homepage    https://github.com/itzjonas/grimlock/#readme
// @supportURL  https://github.com/itzjonas/grimlock/issues
// @downloadURL https://raw.githubusercontent.com/itzjonas/grimlock/master/grimlock.meta.js
// @updateURL   https://raw.githubusercontent.com/itzjonas/grimlock/master/grimlock.user.js
// @grant       GM_deleteValue
// @grant       GM_getValue
// @grant       GM_log
// @grant       GM_notification
// @grant       GM_openInTab
// @grant       GM_setValue
// @grant       window.focus
// @run-at      document-start
// @noframes    true
// ==/UserScript==

(function () {
  // ASSET: /Users/jasonseegmiller/Desktop/Personal/git/grimlock/src/tampermonkey/index.js
  const $a4e02fc050b09319e642c10e7c46e5d$var$setup = async () => {
    // Testing my comment
    GM_log('Parcel');
  };

  window.addEventListener('load', async () => {
    window.stop();
    await $a4e02fc050b09319e642c10e7c46e5d$var$setup();
  }, {
    capture: true,
    once: true
  });
  window.addEventListener('unload', async () => {
    GM_log('Bot stopped');
  }, false);
})();
//# sourceMappingURL=sludge.user.js.map
