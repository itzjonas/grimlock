import { Page, BrowserContext } from 'playwright';
import { ChildProcess, spawn } from 'child_process';
import * as http from 'http';
import * as path from 'path';
import * as fs from 'fs';

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

export const logger = {
  info: (msg: string) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}✔ ${colors.bold}${msg}${colors.reset}`),
  warn: (msg: string) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  error: (msg: string) => console.log(`${colors.red}✖ ${colors.bold}${msg}${colors.reset}`),
  step: (msg: string) => console.log(`\n${colors.bold}${colors.cyan}➤ ${msg}${colors.reset}`),
  divider: () => console.log(`${colors.dim}──────────────────────────────────────────────────${colors.reset}`),
  header: (title: string) => {
    const width = 50;
    const border = '━'.repeat(width);
    console.log(`\n${colors.magenta}${colors.bold}${border}`);
    console.log(`  ${title.toUpperCase()}`);
    console.log(`${border}${colors.reset}`);
  }
};

/**
 * Utility to pause execution. Capped at 500ms only if FAST_MODE=true is explicitly set.
 */
export const sleep = (ms: number): Promise<void> => {
  const actualMs = process.env.FAST_MODE === 'true' ? Math.min(ms, 500) : ms;
  return new Promise((resolve) => setTimeout(resolve, actualMs));
};

/**
 * Returns a random number of milliseconds between min and max seconds.
 */
export const getJitteredMs = (minSec: number, maxSec: number): number => {
  return (minSec + Math.random() * (maxSec - minSec)) * 1000;
};

/**
 * Return a random integer between min and max (inclusive).
 */
export const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

/**
 * Checks if the browser session is logged in by inspecting the page state.
 */
export const checkLoginState = async (page: Page): Promise<boolean> => {
  try {
    return await page.evaluate(() => {
      // If daily set cards or activity cards are visible, we are logged in
      const cards = document.querySelectorAll('.promontory-card, .promo-card, .daily-set-item, [class*="promo-card"]');
      if (cards.length > 0) {
        return true;
      }
      const signInBtn = document.getElementById('id_s');
      if (signInBtn && signInBtn.style.display !== 'none') {
        return false;
      }
      const links = Array.from(document.querySelectorAll('a'));
      const hasSignInLink = links.some(a => {
        const text = (a.textContent || '').toLowerCase();
        const href = (a.href || '').toLowerCase();
        return text.includes('sign in') && href.includes('login');
      });
      return !hasSignInLink;
    });
  } catch (err) {
    return false;
  }
};

export const createStealthPage = async (context: BrowserContext): Promise<Page> => {
  // Reuse the existing tab if one is open to prevent forcing Playwright's default viewport emulation
  const pages = context.pages();
  const page = pages.length > 0 ? pages[0] : await context.newPage();
  
  // Inject script to hide automation indicator
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });
  });

  return page;
};

/**
 * Checks if the CDP debugging port is active and responding.
 */
export const checkCdpReady = (port: number): Promise<boolean> => {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/json/version`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => {
      resolve(false);
    });
    req.end();
  });
};

/**
 * Ensures a directory exists by creating it recursively.
 */
export const ensureDirExists = (dirPath: string): string => {
  const resolved = path.resolve(dirPath);
  if (!fs.existsSync(resolved)) {
    fs.mkdirSync(resolved, { recursive: true });
  }
  return resolved;
};

/**
 * Programmatically launches the browser with debugging enabled and optional proxy.
 */
export const launchBrowser = async (
  executablePath: string,
  userDataDir: string,
  port = 9222,
  proxy?: string
): Promise<ChildProcess> => {
  const resolvedUserDataDir = ensureDirExists(userDataDir);

  let actualPath = executablePath;
  if (!fs.existsSync(actualPath)) {
    logger.warn(`Configured browser path not found: "${executablePath}"`);
    
    // Auto-detection fallbacks on macOS
    const candidates = [
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    ];
    
    let found = false;
    for (const cand of candidates) {
      if (fs.existsSync(cand)) {
        logger.info(`Auto-detected fallback browser at: "${cand}"`);
        actualPath = cand;
        found = true;
        break;
      }
    }
    
    if (!found) {
      throw new Error(`Could not find a valid browser executable. Please install Google Chrome or Microsoft Edge, or configure the correct path in profiles.json.`);
    }
  }

  const args = [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${resolvedUserDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
  ];

  if (proxy && proxy.trim().length > 0) {
    args.push(`--proxy-server=${proxy.trim()}`);
  }

  logger.info(`Spawning browser process: "${actualPath}"`);
  logger.info(`Arguments: ${args.join(' ')}`);

  const proc = spawn(actualPath, args, {
    stdio: 'ignore',
    detached: true,
  });

  // Attach error handler to prevent unhandled exceptions on failed launches
  proc.on('error', (err) => {
    logger.error(`Browser process failed to start or was terminated: ${err.message}`);
  });

  proc.unref();

  // Wait up to 15 seconds for the port to open
  logger.info('Waiting for remote debugging port to become active...');
  for (let i = 0; i < 30; i++) {
    await sleep(500);
    const ready = await checkCdpReady(port);
    if (ready) {
      logger.success('CDP remote debugging port is ready.');
      return proc;
    }
  }

  throw new Error(`Failed to connect to browser CDP on port ${port} after 15 seconds.`);
};


/**
 * Gracefully terminates the spawned browser process.
 */
export const killBrowser = async (proc: ChildProcess): Promise<void> => {
  logger.info('Terminating browser process...');
  if (!proc || proc.pid === undefined) {
    return;
  }

  try {
    proc.kill('SIGKILL');
  } catch (err: any) {
    logger.warn(`Failed to kill browser process: ${err.message}`);
  }

  await sleep(1000);
};
