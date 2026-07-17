import { chromium, Browser } from 'playwright';
import * as readline from 'readline';

import { logger, sleep, checkLoginState, createStealthPage } from './utils';
import { performDesktopSearches, performMobileSearches } from './searches';
import { completeRewardsDashboard } from './rewards';

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

  // 1. Menu selection
  const choice = await promptMenu('Select task to execute:', [
    'Run All Tasks (Dashboard + Desktop Searches + Mobile Searches)',
    'Complete Dashboard Activities',
    'Perform Desktop Searches',
    'Perform Mobile Searches',
    'Exit'
  ], 0, 30000); // 30s timeout

  if (choice === 4) {
    logger.info('Exiting Grimlock.');
    process.exit(0);
  }

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

      if (choice === 0) {
        // Run All
        await completeRewardsDashboard(browser);
        await sleep(5000);
        await performDesktopSearches(browser);
        await sleep(5000);
        await performMobileSearches(browser);
      } else if (choice === 1) {
        await completeRewardsDashboard(browser);
      } else if (choice === 2) {
        await performDesktopSearches(browser);
      } else if (choice === 3) {
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
