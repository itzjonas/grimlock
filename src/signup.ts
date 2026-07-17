import { chromium, Browser } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { logger, sleep, createStealthPage, launchBrowser, killBrowser, checkLoginState } from './utils';

function waitForKeypress(): Promise<void> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question('', () => {
      rl.close();
      resolve();
    });
  });
}

const FIRST_NAMES = ['John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth', 'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'];

function generateRandomName(): { first: string; last: string; email: string; pass: string; dob: { day: string; month: string; year: string } } {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const email = `${first.toLowerCase()}.${last.toLowerCase()}${randNum}@outlook.com`;
  
  // Strong password mixing chars, caps, nums, and specs
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const caps = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const nums = '0123456789';
  const specs = '!@#$';
  let pass = '';
  pass += caps[Math.floor(Math.random() * caps.length)];
  pass += specs[Math.floor(Math.random() * specs.length)];
  for (let i = 0; i < 4; i++) {
    pass += chars[Math.floor(Math.random() * chars.length)];
    pass += nums[Math.floor(Math.random() * nums.length)];
  }
  pass += '!';

  // DOB
  const day = String(Math.floor(1 + Math.random() * 28));
  // Month: 1-12
  const month = String(Math.floor(1 + Math.random() * 12));
  const year = String(Math.floor(1985 + Math.random() * 15)); // 1985 to 2000

  return { first, last, email, pass, dob: { day, month, year } };
}

export async function runSemiAutomatedSignup(browserPath: string): Promise<void> {
  logger.header('Microsoft Account Signup Assistant');
  
  const accountInfo = generateRandomName();
  const accountId = `acc_${Date.now()}`;
  const userDataDir = `./data/profiles/${accountId}`;
  
  logger.info(`Generated Account Details:`);
  logger.info(`  Name: ${accountInfo.first} ${accountInfo.last}`);
  logger.info(`  Suggested Email: ${accountInfo.email}`);
  logger.info(`  Password: ${accountInfo.pass}`);
  logger.info(`  DOB: ${accountInfo.dob.month}/${accountInfo.dob.day}/${accountInfo.dob.year}`);
  logger.info(`  Profile Dir: ${userDataDir}`);
  
  let browserProc: any;
  let browser: Browser | undefined;
  
  try {
    // 1. Launch Browser
    browserProc = await launchBrowser(browserPath, userDataDir);
    
    // 2. Connect Playwright via CDP
    browser = await chromium.connectOverCDP('http://localhost:9222');
    
    const context = browser.contexts()[0];
    const page = await createStealthPage(context);
    
    logger.info('Navigating to Microsoft signup page...');
    await page.goto('https://signup.live.com/signup');
    await page.waitForLoadState('load').catch(() => {});
    await sleep(4000);

    let emailSubmitted = false;
    let passwordSubmitted = false;
    let nameSubmitted = false;
    let dobSubmitted = false;
    let signupSuccessful = false;

    logger.info('Starting selector-agnostic signup automation loop...');

    // Poll every 2 seconds, checking current screen and filling details
    for (let loop = 0; loop < 180; loop++) {
      await sleep(2000);
      const url = page.url();

      // Check if stay signed in screen is visible
      const staySignedInBtn = page.locator('input#idSIButton9, button#idSIButton9, button:has-text("Yes")').first();
      if (await staySignedInBtn.isVisible()) {
        logger.info('Detected "Stay signed in?" screen. Clicking "Yes"...');
        await staySignedInBtn.click().catch(() => {});
        await sleep(2000);
        continue;
      }

      // Check if successfully registered and redirected
      if (
        url.includes('account.microsoft.com') ||
        url.includes('rewards.bing.com') ||
        (url.includes('microsoft.com') && !url.includes('signup.live.com'))
      ) {
        logger.success('Login redirection detected!');
        logger.info('Navigating to rewards.bing.com to confirm login state...');
        await page.goto('https://rewards.bing.com/').catch(() => {});
        await page.waitForLoadState('load').catch(() => {});
        await sleep(4000);
        
        const loggedIn = await checkLoginState(page);
        if (loggedIn) {
          signupSuccessful = true;
          logger.success(`Successfully registered and logged into account: ${accountInfo.email}`);
          break;
        } else {
          logger.warn('Redirect detected but rewards login state check failed. Still waiting...');
        }
        continue;
      }

      // Screen A: Email input
      const emailInput = page.locator('input#MemberName, [name="MemberName"], input#floatingLabelInput4, input[aria-label="Email"], input[type="email"]').first();
      if (await emailInput.isVisible() && !emailSubmitted) {
        logger.info('Email input screen detected. Filling email...');
        // Focus, clear autofill/junk, type email
        await emailInput.focus();
        await page.keyboard.down('Meta');
        await page.keyboard.press('a');
        await page.keyboard.up('Meta');
        await page.keyboard.down('Control');
        await page.keyboard.press('a');
        await page.keyboard.up('Control');
        await page.keyboard.press('Backspace');
        await sleep(200);
        await emailInput.fill(accountInfo.email);
        await sleep(1000);

        const emailNextBtn = page.locator('input#iSignupAction, button#iSignupAction, button:has-text("Next")').first();
        await emailNextBtn.click();
        emailSubmitted = true;
        logger.success('Email submitted.');
        await sleep(2000);
        continue;
      }

      // Screen B: Password input
      const passInput = page.locator('input#PasswordInput, [name="Password"], input#Password, input[aria-label="Create password"], input[type="password"]').first();
      if (await passInput.isVisible() && !passwordSubmitted) {
        logger.info('Password input screen detected. Filling password...');
        await passInput.fill(accountInfo.pass);
        await sleep(500);

        // Uncheck optin checkbox if visible
        const optinCheckbox = page.locator('input#ShowOptinUX, [name="ShowOptinUX"]').first();
        if (await optinCheckbox.isVisible()) {
          await optinCheckbox.uncheck().catch(() => {});
          await sleep(500);
        }

        const passNextBtn = page.locator('input#iSignupAction, button#iSignupAction, button:has-text("Next")').first();
        await passNextBtn.click();
        passwordSubmitted = true;
        logger.success('Password submitted.');
        await sleep(2000);
        continue;
      }

      // Screen C: Name input
      const firstInput = page.locator('input#FirstName, [name="FirstName"], input#firstNameInput, input[aria-label="First name"]').first();
      if (await firstInput.isVisible() && !nameSubmitted) {
        logger.info('Name input screen detected. Filling First/Last Name...');
        await firstInput.fill(accountInfo.first);
        await sleep(500);

        const lastInput = page.locator('input#LastName, [name="LastName"], input#lastNameInput, input[aria-label="Last name"]').first();
        await lastInput.fill(accountInfo.last);
        await sleep(1000);

        const nameNextBtn = page.locator('input#iSignupAction, button#iSignupAction, button:has-text("Next")').first();
        await nameNextBtn.click();
        nameSubmitted = true;
        logger.success('Name submitted.');
        await sleep(2000);
        continue;
      }

      // Screen D: DOB / Country Screen
      const monthInput = page.locator('select#BirthMonth, button#BirthMonthDropdown, button[aria-label*="Month"]').first();
      if (await monthInput.isVisible() && !dobSubmitted) {
        logger.info('DOB/Country screen detected. Selecting values...');
        
        // Month dropdown selection (handles both select element and Fluent UI custom button)
        await monthInput.click();
        await sleep(800);
        if (await monthInput.evaluate(el => el.tagName.toLowerCase() === 'select')) {
          await (monthInput as any).selectOption({ value: accountInfo.dob.month });
        } else {
          const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
          const monthName = months[parseInt(accountInfo.dob.month) - 1];
          await page.keyboard.type(monthName);
          await sleep(800);
          await page.keyboard.press('Enter');
        }
        await sleep(1000);

        // Day dropdown
        const dayInput = page.locator('select#BirthDay, button#BirthDayDropdown, button[aria-label*="Day"]').first();
        await dayInput.click();
        await sleep(800);
        if (await dayInput.evaluate(el => el.tagName.toLowerCase() === 'select')) {
          await (dayInput as any).selectOption({ value: accountInfo.dob.day });
        } else {
          await page.keyboard.type(accountInfo.dob.day);
          await sleep(800);
          await page.keyboard.press('Enter');
        }
        await sleep(1000);

        // Year input
        const yearInput = page.locator('input#BirthYear, input#floatingLabelInput24, input[aria-label="Year"]').first();
        await yearInput.click();
        await yearInput.fill(accountInfo.dob.year);
        await sleep(1000);

        const dobNextBtn = page.locator('input#iSignupAction, button#iSignupAction, button:has-text("Next")').first();
        await dobNextBtn.click();
        dobSubmitted = true;
        logger.success('DOB/Country submitted.');
        await sleep(4000);
        
        logger.warn('⚠️  Microsoft requires verification/CAPTCHA.');
        logger.warn('👉 PLEASE SOLVE THE CAPTCHA OR SMS CHALLENGES IN THE OPEN BROWSER WINDOW NOW.');
        logger.info('👉 ONCE YOU HAVE COMPLETED THE SIGNUP AND SEE THE ACCOUNT DASHBOARD/HOME, PRESS ENTER HERE TO RESUME...');
        
        // Wait for user to press Enter in the terminal
        await waitForKeypress();
        logger.info('Resuming automation. Checking login status...');
        
        // Navigate to rewards to double-verify login
        logger.info('Navigating to rewards.bing.com to confirm login state...');
        await page.goto('https://rewards.bing.com/').catch(() => {});
        await page.waitForLoadState('load').catch(() => {});
        await sleep(4000);
        
        const loggedIn = await checkLoginState(page);
        if (loggedIn) {
          signupSuccessful = true;
          logger.success(`Successfully registered and logged into account: ${accountInfo.email}`);
          break;
        } else {
          logger.error('Could not confirm login state. Please make sure you completed the signup successfully.');
          break;
        }
      }
    }

    if (signupSuccessful) {
      logger.info('Registering new profile to profiles.json...');
      const configPath = path.resolve('./profiles.json');
      let configData: any = { browserPath, profiles: [] };
      if (fs.existsSync(configPath)) {
        try {
          configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } catch (_) {}
      }

      configData.profiles = configData.profiles || [];
      configData.profiles.push({
        id: accountId,
        name: `${accountInfo.first} ${accountInfo.last} (${accountInfo.email.split('@')[0]})`,
        userDataDir: userDataDir,
        active: true,
        proxy: "",
        desktopSearches: 35,
        mobileSearches: 25
      });

      fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), 'utf8');
      logger.success(`Profile stored successfully under id: ${accountId}`);
    } else {
      logger.error('Signup detection timed out or failed. Profile was not added to config.');
    }

  } catch (err: any) {
    logger.error(`Signup assistant encountered an error: ${err.message}`);
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
    if (browserProc) {
      await killBrowser(browserProc).catch(() => {});
    }
    logger.info('Signup assistant finished.');
  }
}
