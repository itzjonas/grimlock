const puppeteer = require('puppeteer');
// const devices = require('puppeteer/DeviceDescriptors');
// const iPhonex = devices['iPhone X'];

// const executablePath = () => {
//     // Chrome
//     '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
//     // Edge
//     '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
// };

(async () => {
    const browser = await puppeteer.launch({
        devtools: true,
        executablePath: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
        headless: false,
    });
    const page = await browser.newPage();
    // await page.emulate(iPhonex);
    // Emulates an iPhone X
    // await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1');
    // await page.setViewport({ width: 375, height: 812 });

    await page.goto('https://bing.com', {
        waitUntil: 'networkidle2',
    });

    // await browser.close();
})();
