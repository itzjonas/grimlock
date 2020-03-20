import puppeteer from 'puppeteer';

import login from './login';
import search from './search';

const { error } = console;
// const devices = require('puppeteer/DeviceDescriptors');
// const iPhonex = devices['iPhone X'];

// const executablePath = () => {
//     // Chrome
//     '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
//     // Edge
//     '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
// };

const main = async () => {
    const {
        LIVE_USERNAME,
        LIVE_PASSWORD,
    } = process.env;

    if (
        LIVE_USERNAME !== ''
        && LIVE_PASSWORD !== ''
    ) {
        error('Please setup your \x1b[93m.env\x1b[m file per the README.md!');

        process.exit(1);
    }

    const browser = await puppeteer.launch({
        devtools: true,
        // executablePath: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
        headless: false,
    });

    // await page.emulate(iPhonex);
    // Emulates an iPhone X
    // await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1');
    // await page.setViewport({ width: 375, height: 812 });

    const [
        _, // eslint-disable-line no-unused-vars
        searchLinks,
    ] = await Promise.all([
        // Set the cookies necessary from logging in
        login(browser),
        // Get list of text to search for
        // getSearchLinks(browser),
    ]);

    // Create a list of searches to run, but don't run them yet
    const runnableSearches = searchLinks.map((textContent) => () => search(browser, textContent));

    // TODO: Open searches in browser serially
    // iterators/generators require regenerator-runtime, which is too heavyweight for this guide to allow them. Separately, loops should be avoided in favor of array iterations.
    // eslint-disable-next-line no-restricted-syntax
    for (const query of runnableSearches) {
        // eslint-disable-next-line no-await-in-loop
        await query();
    }

    await browser.close();
};

// (async () => {
//     await page.goto('https://bing.com', {
//         waitUntil: 'networkidle2',
//     });

//     // TODO: login if not logged in
//     checkCredentials().then(async () => {
//         // ('$id_s').click();
//         const signInElement = await page.$('#id_s');
//         await signInElement.click();

//         const usernameElement = await page.$('input[name=loginfmt]');
//         await usernameElement.type('itzjonas@hotmail.com');
//         // 'input[type=submit][value="Next"]';

//         // const searchBox = await page.$('input[type=text]');
//         // await searchBox.type('cookies');
//         // const inputElement = await page.$(
//         //     'input[type=submit][value="Google Search"]',
//         // );
//         // await inputElement.click();
//         // const [ response ] = await Promise.all([
//         //     page.waitForNavigation(),
//         //     page.once('load', () => console.log('Cookies loaded!')),
//         // ]);


//     });
// })();


main();
