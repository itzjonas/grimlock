/**
 * Return a partially-random number between two values.
 */
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

const search = async (browser, text) => {
    const searchPage = await browser.newPage();

    await searchPage.goto('https://bing.com/');

    // Check if log in carried over
    await searchPage.evaluate(async () => {
        const signInAnchor = document.querySelector('#id_l');
        const loggedInUsername = signInAnchor.textContent;
        const signedOut = loggedInUsername.toLocaleLowerCase() === 'sign in';

        if (!signedOut) return signedOut;

        // Click sign in if necessary
        signInAnchor.click();

        // HACK: Wait arbitrary time for cookies to be loaded.
        return new Promise((resolve) => setTimeout(resolve, 1000));
    });

    await searchPage.type('[name="q"]', text, { delay: 26 });
    const formHandle = await searchPage.$('#sb_form');
    await formHandle.press('Enter');
    await searchPage.waitForNavigation();
    await searchPage.waitFor(randomInt(2000, 5000));

    await searchPage.close();
};

export default search;
