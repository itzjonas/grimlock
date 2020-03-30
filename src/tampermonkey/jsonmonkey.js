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

const getSearchBreakdowns = () => {
    // OLD METHOD
    // const breakdown = { desktop: {}, mobile: {} }
    // const points = document.getElementsByClassName('vsrewds_searchpoints');
    // const curMax = (str) => {
    //     const nums = str.split(' of ');

    //     return { current: nums[0], max: nums[1] };
    // }

    // for (var i = 0; i < points.length; i++) {
    //     if (points[i].previousElementSibling.innerText === 'PC Search Daily Points') {
    //         breakdown.desktop = curMax(points[i].innerText);
    //     } else if (points[i].previousElementSibling.innerText === 'Mobile Search Daily Points') {
    //         breakdown.mobile = curMax(points[i].innerText);
    //     }
    // }

    // breakdown.edge = { current: null, max: null };

    const breakdown = {};
    document.getElementById('id_rh').click();

    // TODO: wait till iframe loads instead (#bepfm or #bepfo)
    // w.addEventListener('load', () => {}, true);
    setTimeout(() => {
        const items = document.querySelectorAll('#credits .breakdown')[0].children;

        for (let i = 0; i < items.length; i++) {
            const nums = items[i].innerText.split('/');

            breakdown[items[i].className] = {
                current: Number(nums[0]),
                max: Number(nums[1]),
            };
        }
    }, 3000);

    return breakdown;
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
            GM_openInTab(newLink, true /* open in background */);
            // window.href(newLink);
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
            let breakdown;
            setTimeout(() => {
                breakdown = JSON.stringify(getSearchBreakdowns(), null, 4);
            }, 3000);

            GM_log(`Breakdown: ${breakdown}`); // undefined

            // See if we've maxed out and should stop searching
            if (breakdown.desktop.current < breakdown.desktop.max) {
                GM_setValue(searchCountKey, searchCount += 1);
                search();
            } else {
                GM_log('Setting searchCountKey to 0!');
                GM_setValue(searchCountKey, 0);
            }
        }
    } else {
        GM_log('You are NOT signed in, please sign in to automate.');
    }
});
