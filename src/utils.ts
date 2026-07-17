import { Page, BrowserContext } from 'playwright';

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
  return await context.newPage();
};
