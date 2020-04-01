// ==UserScript==
// @name        Grimlock (JSON)
// @version     0.1.1
// @description Coming soon...
// @author      JSON
// @match       https://www.bing.com*
// @match       https://www.bing.com/*
// @match       https://account.microsoft.com/rewards/*
// @grant       GM_deleteValue
// @grant       GM_getValue
// @grant       GM_log
// @grant       GM_notification
// @grant       GM_openInTab
// @grant       GM_setValue
// @grant       window.focus
// ==/UserScript==

const getRewardsTotal = () => {
    // Below only works after full load of page
    // return Number(document.getElementById('vsrewds_total_points'));
    const rewards = document.getElementById('id_rc');

    return rewards ? Number(rewards.innerText) : 0;
};

const getSearchBreakdowns = async () => {
    // TODO: replace ridiculous iframe drilling to just a fetch to /rewardsapp/bepflyoutpage?style=modular&date=03/31/2020
    const breakdowns = await fetch(`/rewardsapp/bepflyoutpage?style=modular&date=${new Date().toLocaleDateString()}`)
        .then((response) => response.text())
        .then((text) => {
            const breakdown = {};
            const parser = new DOMParser();
            const htmlDocument = parser.parseFromString(text, 'text/html');
            const items = htmlDocument.documentElement.querySelector('#credits .breakdown').children;
            for (let i = 0; i < items.length; i++) {
                const nums = items[i].innerText.split('/');

                breakdown[items[i].className] = {
                    current: Number(nums[0]),
                    max: Number(nums[1]),
                };
            }

            return breakdown;
        });

    return breakdowns;
};

const getSearchLinks = () => {
    const allLinks = document.links;
    const links = [];

    for (let i = 0; i < allLinks.length; i++) {
        if (allLinks[i].pathname === '/search') {
            links.push(allLinks[i].href);
        }
    }

    return links;
};

const search = () => {
    const { sessionStorage } = window;
    const storageKey = 'grimlockLinks';
    const storedLinks = JSON.parse(sessionStorage.getItem(storageKey));

    if (storedLinks) {
        const newLink = storedLinks.pop();

        setTimeout(() => {
            GM_log(`Heading to: ${newLink}`);
            GM_openInTab(newLink, false /* open in background */);
        }, 1500);

        if (storedLinks.length === 0) {
            sessionStorage.removeItem(storageKey);
        } else {
            sessionStorage.setItem(storageKey, JSON.stringify(storedLinks));
        }
    } else {
        sessionStorage.setItem(storageKey, JSON.stringify(getSearchLinks()));
    }
};

window.addEventListener('load', () => {
    const signedIn = document.getElementById('id_s');
    const isSignedIn = signedIn && signedIn.style.display === 'none';

    if (isSignedIn) {
        const searchCountKey = 'searchCount';
        let searchCount = GM_getValue(searchCountKey);
        GM_log(`Total Rewards: ${getRewardsTotal()}`);

        GM_log(`Search Count: ${searchCount}`); // undefined
        if (searchCount > 0 && searchCount < 10) {
            // Proceed
            GM_setValue(searchCountKey, searchCount += 1);
            search();
        } else {
            // Get breakdowns
            // const { desktop } = async () => {
            //     setTimeout(() => JSON.stringify(, null, 4), 3000);
            // };
            getSearchBreakdowns()
                .then((breakdown) => {
                    GM_log(`Breakdown: ${breakdown.desktop}`); // undefined

                    // See if we've maxed out and should stop searching
                    if (breakdown.desktop.current < breakdown.desktop.max) {
                        GM_setValue(searchCountKey, searchCount += 1);
                        search();
                    } else {
                        GM_log('Setting searchCountKey to 0!');
                        GM_setValue(searchCountKey, 0);
                    }
                });
        }
    } else {
        GM_log('You are NOT signed in, please sign in to automate.');
    }
});
