import { Page, Browser, Locator } from 'playwright';
import { createCursor } from 'ghost-cursor-playwright';
import { logger, sleep, createStealthPage } from './utils';

// Helper to click an element using ghost-cursor with fallback to locator click
async function clickElement(page: Page, cursor: any, locator: Locator): Promise<boolean> {
  try {
    await locator.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    const box = await locator.boundingBox();
    if (box) {
      const x = box.x + box.width / 4 + Math.random() * (box.width / 2);
      const y = box.y + box.height / 4 + Math.random() * (box.height / 2);
      await cursor.actions.click({ target: { x, y } });
      return true;
    }
  } catch (err: any) {
    logger.warn(`Ghost-cursor click failed: ${err.message}. Falling back to default click.`);
  }
  await locator.click({ force: true }).catch(() => {});
  return false;
}

// Simulates human character-by-character typing
async function typeLikeHuman(page: Page, text: string): Promise<void> {
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    let delay = 40 + Math.random() * 60; // 40-100ms base
    if (char === ' ') {
      delay = 120 + Math.random() * 120; // 120-240ms space
    }
    await page.keyboard.type(char);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

// Generates a random realistic search query
const TOPICS = [
  'weather', 'news', 'recipe', 'how to fix', 'history of', 'best movies', 'restaurants near me',
  'stock price', 'lyrics', 'meaning of', 'tutorial', 'travel guide', 'map of', 'review of'
];
const SUBJECTS = [
  'apple pie', 'tesla stocks', 'bitcoin', 'javascript async await', 'playwright browser', 'mount everest',
  'macbook pro M3', 'healthy breakfast', 'diy gardening', 'ancient Rome', 'space exploration',
  'origami patterns', 'quantum computing', 'home workout no equipment', 'learning guitar chords',
  'coffee brewing methods', 'french bulldogs', 'national parks', 'renewable energy', 'black holes'
];

function generateRandomQuery(): string {
  const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
  const subject = SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)];
  return Math.random() > 0.5 ? `${topic} ${subject}` : `${subject} ${topic}`;
}

// Smooth scroll behavior simulation
async function simulateReadingScroll(page: Page): Promise<void> {
  try {
    const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
    const clientHeight = await page.evaluate(() => window.innerHeight);

    if (scrollHeight > clientHeight) {
      const steps = 2 + Math.floor(Math.random() * 3); // 2 to 4 scroll steps
      const maxScroll = Math.min(scrollHeight - clientHeight, 1200); // don't scroll too far down
      const stepSize = maxScroll / steps;

      for (let i = 1; i <= steps; i++) {
        const top = stepSize * i;
        await page.evaluate((scrollTarget) => {
          window.scrollTo({ top: scrollTarget, behavior: 'smooth' });
        }, top);
        await sleep(1500 + Math.random() * 1500); // Pause to "read"
      }

      // Scroll back up occasionally
      if (Math.random() > 0.5) {
        await page.evaluate(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        await sleep(1000);
      }
    }
  } catch (err: any) {
    logger.warn(`Scroll simulation error: ${err.message}`);
  }
}

// Try to click a random search result or related search
async function clickRandomResult(page: Page, cursor: any): Promise<void> {
  try {
    const selectors = [
      '#b_results .b_algo h2 a', // Main search results
      '.b_rrsr a',               // Related searches
      '#b_results .b_ans a'      // Answers/Cards links
    ];

    for (const selector of selectors) {
      const links = page.locator(selector);
      const count = await links.count();
      if (count > 0) {
        const randomIndex = Math.floor(Math.random() * Math.min(count, 5));
        const link = links.nth(randomIndex);
        if (await link.isVisible()) {
          logger.info(`Simulating result click on link #${randomIndex}...`);
          await clickElement(page, cursor, link);
          await page.waitForLoadState('load').catch(() => {});
          await sleep(4000 + Math.random() * 4000); // Stay on clicked page
          await page.goBack().catch(() => {});
          await page.waitForLoadState('load').catch(() => {});
          break;
        }
      }
    }
  } catch (err: any) {
    logger.warn(`Could not perform result click simulation: ${err.message}`);
  }
}

// Scrape trending search terms from the Bing homepage carousel
async function getTrendingQueries(page: Page): Promise<string[]> {
  const queries = new Set<string>();
  try {
    // Open Bing
    await page.goto('https://www.bing.com/');
    await page.waitForLoadState('load').catch(() => {});
    await sleep(2000);

    // Common selectors for trending carousel/news
    const trendingSelectors = [
      '#crs_pane a', 
      '.news-card a', 
      '#trending-carousel a', 
      '.trending-words a',
      '.ti_simplenewsitem'
    ];

    for (const sel of trendingSelectors) {
      const locators = page.locator(sel);
      const count = await locators.count();
      for (let i = 0; i < count; i++) {
        const text = await locators.nth(i).textContent();
        if (text && text.trim().length > 2) {
          queries.add(text.trim());
        }
      }
    }
  } catch (err: any) {
    logger.warn(`Failed to scrape trending searches: ${err.message}`);
  }
  return Array.from(queries);
}

// Run a search cycle
async function runSearchLoop(page: Page, cursor: any, queries: string[], count: number): Promise<void> {
  logger.step(`Starting search cycle of ${count} queries...`);

  for (let idx = 0; idx < count; idx++) {
    const query = queries[idx] || generateRandomQuery();
    logger.info(`Search #${idx + 1}/${count}: "${query}"`);

    try {
      // Go to bing homepage only if we aren't already on the search page
      const currentUrl = page.url();
      if (!currentUrl.includes('bing.com/search')) {
        await page.goto('https://www.bing.com/');
        await page.waitForLoadState('load').catch(() => {});
        await sleep(1500);
      }

      // Locate search input (both homepage and search results page have [name="q"])
      const searchInput = page.locator('[name="q"]').first();
      await clickElement(page, cursor, searchInput);
      await sleep(500);

      // Clear existing query (Select all + backspace)
      await searchInput.focus();
      await page.keyboard.down('Meta');
      await page.keyboard.press('a');
      await page.keyboard.up('Meta');
      await page.keyboard.down('Control');
      await page.keyboard.press('a');
      await page.keyboard.up('Control');
      await page.keyboard.press('Backspace');
      await sleep(300);

      // Type and search
      await typeLikeHuman(page, query);
      await sleep(200);
      await page.keyboard.press('Enter');

      // Wait for results
      await page.waitForLoadState('load').catch(() => {});
      await sleep(2000);

      // Verify page is search results
      if (page.url().includes('bing.com/search')) {
        // Read page
        await simulateReadingScroll(page);

        // Occasional click on a result (25% chance)
        if (Math.random() < 0.25) {
          await clickRandomResult(page, cursor);
        }
      }

      // Randomized pause between queries (8-16s)
      const delay = 8000 + Math.random() * 8000;
      logger.info(`Completed search. Cooldown for ${(delay / 1000).toFixed(1)}s...`);
      await sleep(delay);

    } catch (err: any) {
      logger.error(`Error during search query "${query}": ${err.message}`);
      await sleep(3000);
    }
  }
}

/**
 * Perform Desktop Bing Searches.
 */
export async function performDesktopSearches(browser: Browser, numSearches = 35): Promise<void> {
  logger.header('Desktop searches started');
  const context = browser.contexts()[0];
  const page = await createStealthPage(context);
  const cursor = await createCursor(page);

  // Scrape trending queries from homepage, back-fill with generator
  const scraped = await getTrendingQueries(page);
  logger.info(`Scraped ${scraped.length} trending topics.`);

  const finalQueries: string[] = [];
  for (let i = 0; i < numSearches; i++) {
    finalQueries.push(scraped[i] || generateRandomQuery());
  }

  // Shuffle finalQueries list to randomize order
  for (let i = finalQueries.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [finalQueries[i], finalQueries[j]] = [finalQueries[j], finalQueries[i]];
  }

  await runSearchLoop(page, cursor, finalQueries, numSearches);
  await page.close();
  logger.success('Desktop searches completed.');
}

/**
 * Perform Mobile Bing Searches.
 */
export async function performMobileSearches(browser: Browser, numSearches = 25): Promise<void> {
  logger.header('Mobile searches started');
  
  // 1. Get cookies from desktop context to authenticate
  const defaultContext = browser.contexts()[0];
  const cookies = await defaultContext.cookies();

  // 2. Create an isolated mobile context with native device emulation parameters
  logger.info('Creating isolated mobile context with native device emulation...');
  const mobileContext = await browser.newContext({
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true
  });

  // 3. Inject login cookies
  await mobileContext.addCookies(cookies);

  // 4. Create stealth page in the mobile context
  const page = await createStealthPage(mobileContext);
  const cursor = await createCursor(page);

  // Generate mobile queries
  const mobileQueries = Array.from({ length: numSearches }, () => generateRandomQuery());

  await runSearchLoop(page, cursor, mobileQueries, numSearches);

  // Close context and all pages associated with it
  await mobileContext.close();
  logger.success('Mobile searches completed.');
}
