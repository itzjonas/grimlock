import { chromium, Browser } from 'playwright';
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';

import { logger, sleep, checkLoginState, createStealthPage, launchBrowser, killBrowser } from './utils';
import { performDesktopSearches, performMobileSearches } from './searches';
import { completeRewardsDashboard } from './rewards';
import { runSemiAutomatedSignup } from './signup';

/**
 * Displays an interactive terminal menu with selection using arrow keys.
 */
function promptMenu(title: string, options: string[], defaultIndex = 0, timeoutMs?: number): Promise<number> {
  return new Promise((resolve) => {
    let cursor = defaultIndex;
    let timer: NodeJS.Timeout | undefined;

    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }

    // Hide standard cursor
    process.stdout.write('\u001B[?25l');

    const cleanUp = () => {
      if (timer) clearTimeout(timer);
      process.stdin.removeListener('keypress', onKeypress);
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
      }

      // Clear menu
      readline.cursorTo(process.stdout, 0);
      readline.clearScreenDown(process.stdout);
      process.stdout.write('\u001B[?25h'); // Restore cursor
    };

    const render = () => {
      readline.cursorTo(process.stdout, 0);
      readline.clearScreenDown(process.stdout);

      console.log(title);
      options.forEach((opt, idx) => {
        if (idx === cursor) {
          console.log(`  \x1b[36m●\x1b[0m ${opt}`);
        } else {
          console.log(`  ○ ${opt}`);
        }
      });

      // Move cursor back to top to prepare for next redraw
      process.stdout.write(`\u001B[${options.length + 1}A`);
    };

    render();

    if (timeoutMs) {
      timer = setTimeout(() => {
        cleanUp();
        const cleanTitle = title.replace(/:$/, '').trim();
        console.log(`\x1b[32m✔\x1b[0m ${cleanTitle}: \x1b[36m${options[cursor]} (Auto-selected due to timeout)\x1b[0m`);
        resolve(cursor);
      }, timeoutMs);
    }

    const onKeypress = (str: any, key: any) => {
      if (timer) {
        clearTimeout(timer);
        timer = undefined;
      }

      if (key.ctrl && key.name === 'c') {
        cleanUp();
        process.exit();
      }

      if (key.name === 'up') {
        cursor = (cursor - 1 + options.length) % options.length;
        render();
      } else if (key.name === 'down') {
        cursor = (cursor + 1) % options.length;
        render();
      } else if (key.name === 'return' || key.name === 'enter') {
        cleanUp();
        const cleanTitle = title.replace(/:$/, '').trim();
        console.log(`\x1b[32m✔\x1b[0m ${cleanTitle}: \x1b[36m${options[cursor]}\x1b[0m`);
        resolve(cursor);
      }
    };

    process.stdin.on('keypress', onKeypress);
  });
}

async function ensureLoggedIn(browser: Browser): Promise<boolean> {
  logger.info('Verifying login status...');
  const context = browser.contexts()[0];
  const page = await createStealthPage(context);
  
  try {
    await page.goto('https://rewards.bing.com/');
    await page.waitForLoadState('load').catch(() => {});
    await sleep(2000);

    let loggedIn = await checkLoginState(page);
    if (loggedIn) {
      logger.success('Already logged in to your account.');
      await page.close();
      return true;
    }

    logger.warn('You are not logged in. Redirecting to rewards dashboard...');
    logger.warn('⏳ Please log in manually in the active browser window now. Grimlock will auto-resume once logged in...');

    // Wait up to 5 minutes (100 iterations of 3 seconds)
    for (let attempt = 1; attempt <= 100; attempt++) {
      await sleep(3000);
      
      const currentUrl = page.url();
      if (!currentUrl.includes('login.live.com')) {
        loggedIn = await checkLoginState(page);
        if (loggedIn) {
          logger.success('Login detected! Resuming execution.');
          await page.close();
          return true;
        }
      }
      
      if (attempt % 5 === 0) {
        logger.info('⏳ Waiting for manual browser login...');
      }
    }

    logger.error('Login wait timeout exceeded.');
    await page.close();
    return false;
  } catch (err: any) {
    logger.error(`Error during login check: ${err.message}`);
    await page.close().catch(() => {});
    return false;
  }
}

async function main() {
  logger.header('Grimlock - Undetectable Rewards Automator');

  // Load config
  const configPath = path.resolve('./profiles.json');
  let config: any = { browserPath: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge', profiles: [] };
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (_) {}
  }

  // 1. Menu selection
  const choice = await promptMenu('Select task to execute:', [
    'Run Multi-Account Rotator Workflow',
    'Run All Tasks (Dashboard + Desktop Searches + Mobile Searches) [Single Profile]',
    'Complete Dashboard Activities [Single Profile]',
    'Perform Desktop Searches [Single Profile]',
    'Perform Mobile Searches [Single Profile]',
    'Create New Microsoft Account (Semi-Automated)',
    'Exit'
  ], 0, 30000); // 30s timeout

  if (choice === 6) {
    logger.info('Exiting Grimlock.');
    process.exit(0);
  }

  // Handle Semi-Automated Account Signup
  if (choice === 5) {
    await runSemiAutomatedSignup(config.browserPath);
    process.exit(0);
  }

  // Handle Multi-Account Rotator
  if (choice === 0) {
    const activeProfiles = (config.profiles || []).filter((p: any) => p.active);
    if (activeProfiles.length === 0) {
      logger.error('No active profiles found in profiles.json. Please run the Signup Assistant first or configure profiles.');
      process.exit(1);
    }

    logger.info(`Starting Multi-Account Rotator for ${activeProfiles.length} active profiles...`);
    const results: { name: string; status: string; info: string }[] = [];

    for (const profile of activeProfiles) {
      logger.divider();
      logger.step(`Processing Account: ${profile.name}`);
      let browserProc: any;
      let browser: Browser | undefined;

      try {
        // Launch browser programmatically
        browserProc = await launchBrowser(config.browserPath, profile.userDataDir, 9222, profile.proxy);
        
        // Connect via CDP
        browser = await chromium.connectOverCDP('http://localhost:9222');
        logger.success('Connected to browser debugging port.');

        // Ensure logged in
        const success = await ensureLoggedIn(browser);
        if (!success) {
          throw new Error('Verification failed / Login required');
        }

        // Run all tasks
        await completeRewardsDashboard(browser);
        await sleep(5000);
        await performDesktopSearches(browser, profile.desktopSearches ?? 35);
        await sleep(5000);
        await performMobileSearches(browser, profile.mobileSearches ?? 25);

        results.push({ name: profile.name, status: 'Completed', info: 'Success' });
      } catch (err: any) {
        logger.error(`Failed during run for ${profile.name}: ${err.message}`);
        results.push({ name: profile.name, status: 'Failed', info: err.message });
      } finally {
        if (browser) {
          logger.info('Closing connection to browser...');
          await browser.close().catch(() => {});
        }
        if (browserProc) {
          await killBrowser(browserProc).catch(() => {});
        }
        await sleep(3000); // Cool-down delay before next profile
      }
    }

    // Print final summary
    logger.header('Multi-Account Run Summary');
    console.log('┌' + '─'.repeat(25) + '┬' + '─'.repeat(15) + '┬' + '─'.repeat(30) + '┐');
    console.log(`│ ${'Profile Name'.padEnd(23)} │ ${'Status'.padEnd(13)} │ ${'Details'.padEnd(28)} │`);
    console.log('├' + '─'.repeat(25) + '┼' + '─'.repeat(15) + '┼' + '─'.repeat(30) + '┤');
    for (const r of results) {
      const statusColor = r.status === 'Completed' ? '\x1b[32m' : '\x1b[31m';
      const cleanStatus = `${statusColor}${r.status}\x1b[0m`;
      const paddedStatus = cleanStatus + ' '.repeat(13 - r.status.length);
      console.log(`│ ${r.name.padEnd(23)} │ ${paddedStatus} │ ${r.info.substring(0, 28).padEnd(28)} │`);
    }
    console.log('└' + '─'.repeat(25) + '┴' + '─'.repeat(15) + '┴' + '─'.repeat(30) + '┘');

    logger.success('Grimlock finished rotating all active accounts.');
    process.exit(0);
  }

  // Handle single-profile runs (using existing manual CDP)
  const cdpEndpoint = process.env.CDP_ENDPOINT || 'http://localhost:9222';
  logger.info(`Connecting to running browser instance via CDP at ${cdpEndpoint}...`);

  let browser: Browser | undefined;
  try {
    browser = await chromium.connectOverCDP(cdpEndpoint);
    logger.success('Successfully connected to Chrome/Edge debugging instance.');
  } catch (error: any) {
    logger.error('Failed to connect to browser via CDP. Make sure Chrome/Edge is running with remote debugging enabled.');
    console.log('\nLaunch command example (macOS Edge):');
    console.log('  /Applications/Microsoft\\ Edge.app/Contents/MacOS/Microsoft\\ Edge --remote-debugging-port=9222 --user-data-dir="/Users/jasonseegmiller/Desktop/git/grimlock/.edge-profile"\n');
    process.exit(1);
  }

  try {
    if (browser) {
      // Ensure we are logged in before running any workflow
      const success = await ensureLoggedIn(browser);
      if (!success) {
        process.exit(1);
      }

      if (choice === 1) {
        // Run All (Single)
        await completeRewardsDashboard(browser);
        await sleep(5000);
        await performDesktopSearches(browser);
        await sleep(5000);
        await performMobileSearches(browser);
      } else if (choice === 2) {
        await completeRewardsDashboard(browser);
      } else if (choice === 3) {
        await performDesktopSearches(browser);
      } else if (choice === 4) {
        await performMobileSearches(browser);
      }
    }
  } catch (err: any) {
    logger.error(`Execution error: ${err.message}`);
  } finally {
    if (browser) {
      logger.info('Closing connection to browser...');
      await browser.close();
    }
    logger.success('Grimlock finished rollout.');
    process.exit(0);
  }
}

main();
