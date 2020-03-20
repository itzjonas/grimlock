import dotenv from 'dotenv';

dotenv.config();

const login = async (browser) => {
    const {
        LIVE_USERNAME,
        LIVE_PASSWORD,
    } = process.env;
    const page = await browser.newPage();

    // Navigate to the login page
    // Ensure username and password are given
    if (!LIVE_USERNAME) {
        console.error('Please setup \x1b[93mLIVE_USERNAME\x1b[m your \x1b[93m.env\x1b[m file per the README.md!');
        process.exit(1);
    } else if (!LIVE_PASSWORD) {
        console.error('Please setup \x1b[93mLIVE_PASSWORD\x1b[m your \x1b[93m.env\x1b[m file per the README.md!');
        process.exit(1);
    }

    await page.goto('https://login.live.com');

    // Login
    await page.type('[name="loginfmt"]', LIVE_USERNAME, { delay: 32 });
    const formHandle = await page.$('form');
    await formHandle.press('Enter');
    await page.waitFor('.has-identity-banner');
    // // TODO: skip this if authenticator is active on account
    // await page.type('[name="passwd"]', LIVE_PASSWORD, { delay: 32 });
    // await formHandle.press('Enter');
    // await page.waitForNavigation();
    // page.close();
};

export default login;
