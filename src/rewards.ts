import { Page, Browser, Locator } from 'playwright';
import { createCursor } from 'ghost-cursor-playwright';
import { logger, sleep, checkLoginState, createStealthPage } from './utils';

// Helper to click an element with ghost-cursor
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

// Solve a poll activity
async function solvePoll(page: Page, cursor: any): Promise<boolean> {
  logger.info('Detected Poll activity. Attempting to vote...');
  await sleep(3000);

  // Poll options are typically #btoption0, #btoption1, or class .btoption
  const pollOptionSelectors = ['#btoption0', '#btoption1', '[id^="btoption"]', '.btoption', '.rqOption'];
  
  for (const selector of pollOptionSelectors) {
    const option = page.locator(selector).first();
    if (await option.isVisible()) {
      logger.info(`Voting on poll option: ${selector}`);
      await clickElement(page, cursor, option);
      await sleep(5000);
      return true;
    }
  }
  
  logger.warn('Could not find poll option buttons. Waiting just in case...');
  await sleep(4000);
  return false;
}

// Solve a quiz activity (Trivia, Warp Speed, Lightning, etc.)
async function solveQuiz(page: Page, cursor: any): Promise<void> {
  logger.info('Detected Quiz activity. Attempting to solve...');
  await sleep(3000);

  // 1. Click "Start playing" or "Start quiz" if it exists
  const startQuizSelectors = ['#rqStartQuiz', 'input[value="Start playing"]', 'input[value="Start quiz"]', 'button:has-text("Start")'];
  for (const selector of startQuizSelectors) {
    const startBtn = page.locator(selector).first();
    if (await startBtn.isVisible()) {
      logger.info('Clicking start quiz button...');
      await clickElement(page, cursor, startBtn);
      await sleep(3000);
      break;
    }
  }

  // 2. Loop through questions (up to 10 questions to avoid infinite loops)
  for (let q = 1; q <= 10; q++) {
    logger.info(`Solving Quiz Question #${q}...`);
    
    // Check if quiz is complete
    const completeIndicators = ['#quizCompleteContainer', '.quiz-complete', '.quizComplete', 'h2:has-text("completed")'];
    let isComplete = false;
    for (const indicator of completeIndicators) {
      if (await page.locator(indicator).first().isVisible()) {
        logger.success('Quiz completed successfully.');
        isComplete = true;
        break;
      }
    }
    if (isComplete) break;

    // Look for options to click
    const optionSelectors = ['.rqOption', '.btOptions', '.wk_paddingBtm', '.textBasedMultiChoice', '[id^="btoption"]', '.cico.bt_clkImg'];
    let optionClicked = false;
    
    for (const selector of optionSelectors) {
      const options = page.locator(selector);
      const count = await options.count();
      if (count > 0) {
        logger.info(`Found ${count} options matching selector: ${selector}`);
        for (let i = 0; i < count; i++) {
          const opt = options.nth(i);
          if (await opt.isVisible() && await opt.isEnabled()) {
            await clickElement(page, cursor, opt);
            await sleep(1500 + Math.random() * 1000); // Wait for feedback
            
            // Check if we advanced or if next button appeared
            const nextBtn = page.locator('input[value="Next question"], button:has-text("Next question"), input[value="Get your score"]').first();
            if (await nextBtn.isVisible()) {
              logger.info('Clicking Next Question / Get your score button...');
              await clickElement(page, cursor, nextBtn);
              await sleep(2000);
            }
          }
        }
        optionClicked = true;
        break;
      }
    }

    if (!optionClicked) {
      logger.warn('Could not find any quiz options. Checking for next question button fallback...');
      const nextBtn = page.locator('input[value="Next question"], button:has-text("Next question"), input[value="Get your score"]').first();
      if (await nextBtn.isVisible()) {
        await clickElement(page, cursor, nextBtn);
        await sleep(2000);
      } else {
        await sleep(2000);
      }
    }

    await sleep(2000);
  }
}

// Handle the opened reward offer popup tab
async function handleCardPopup(popup: Page): Promise<void> {
  try {
    await popup.waitForLoadState('load').catch(() => {});
    await sleep(3000);
    const popupUrl = popup.url();
    logger.info(`Opened card target URL: ${popupUrl}`);

    const popupCursor = await createCursor(popup);

    // Detect page type
    if (popupUrl.includes('rewardsQuiz') || popupUrl.includes('quiz') || await popup.locator('#rqStartQuiz, .rqOption, #ListOfQuestionAndAnswerPanes').first().isVisible()) {
      await solveQuiz(popup, popupCursor);
    } else if (popupUrl.includes('poll') || await popup.locator('[id^="btoption"], .btoption').first().isVisible()) {
      await solvePoll(popup, popupCursor);
    } else {
      // Standard search/link cards
      logger.info('Standard link offer. Simulating page interaction...');
      await popup.evaluate(() => window.scrollTo({ top: 300, behavior: 'smooth' })).catch(() => {});
      await sleep(3000 + Math.random() * 3000);
      await popup.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' })).catch(() => {});
      await sleep(2000);
    }

    logger.info('Closing activity popup...');
    await popup.close();
  } catch (err: any) {
    logger.error(`Error handling activity popup: ${err.message}`);
    try {
      await popup.close();
    } catch (_) {}
  }
}

/**
 * Complete Daily Set and Activity Cards on rewards page.
 */
export async function completeRewardsDashboard(browser: Browser): Promise<void> {
  logger.header('Rewards Dashboard Automation Started');
  
  const context = browser.contexts()[0];
  const page = await createStealthPage(context);
  const cursor = await createCursor(page);

  logger.info('Navigating to rewards dashboard...');
  await page.goto('https://rewards.bing.com/');
  await page.waitForLoadState('load').catch(() => {});
  await sleep(4000);

  const loggedIn = await checkLoginState(page);

  if (!loggedIn) {
    logger.error('You do not seem to be logged in on this browser profile.');
    logger.error('Please log in manually in Edge/Chrome, then run the script again.');
    await page.close();
    return;
  }

  // Iterate a few times to handle cards that appear or require dashboard reload
  for (let round = 1; round <= 2; round++) {
    logger.step(`Dashboard Scanning Round ${round}...`);
    await page.goto('https://rewards.bing.com/');
    await page.waitForLoadState('load').catch(() => {});
    await sleep(4000);

    const cardLocators = page.locator('.promontory-card, .promo-card, .daily-set-item, [class*="promo-card"]');
    const count = await cardLocators.count();
    logger.info(`Found ${count} total activity card modules on page.`);

    let completedAny = false;

    for (let i = 0; i < count; i++) {
      const card = cardLocators.nth(i);
      if (!(await card.isVisible())) continue;

      // Check if card is completed
      const isCompleted = await card.evaluate((el) => {
        const checkmarks = el.querySelectorAll('.mee-icon-Complete, .mee-icon-Accept, [aria-label="Completed"], .mee-icon-ok, svg[class*="complete"]');
        return checkmarks.length > 0;
      });

      // Get card title
      const title = await card.evaluate((el) => {
        const titleEl = el.querySelector('h3, h2, h4, .title, p');
        return titleEl ? titleEl.textContent.trim() : 'Unknown Activity';
      });

      if (isCompleted) {
        logger.success(`Card: "${title}" is already completed.`);
        continue;
      }

      logger.info(`Card: "${title}" is NOT completed. Launching...`);

      const link = card.locator('a, button, [role="button"]').first();
      if (await link.isVisible()) {
        try {
          completedAny = true;
          const [popup] = await Promise.all([
            page.waitForEvent('popup', { timeout: 15000 }),
            clickElement(page, cursor, link)
          ]);

          logger.info(`Successfully intercepted popup for "${title}".`);
          await handleCardPopup(popup);

          await sleep(3000 + Math.random() * 3000);

        } catch (err: any) {
          logger.error(`Failed to execute card "${title}": ${err.message}`);
        }
      } else {
        logger.warn(`Could not find clickable link on card "${title}".`);
      }
    }

    if (!completedAny) {
      logger.info('No uncompleted cards found in this round.');
      break;
    }
  }

  await page.close();
  logger.success('Dashboard processing finished.');
}
