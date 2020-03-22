// ==UserScript==
// @name         Grimlock
// @version      0.1.0
// @description  try to take over the world!
// @author       JSON
// @match        https://www.bing.com/*
// @grant        none
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
    }, 2000);

    return breakdown;
};

// TODO: store in localhost?
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

window.addEventListener('load', () => {
    const { log } = console;
    const signedIn = document.getElementById('id_s');
    const isSignedIn = signedIn && signedIn.style.display === 'none';
    let breakdowns;

    setTimeout(() => breakdowns = getSearchBreakdowns(), 3000);

    // 1) Check that we can get more rewards
    // 2) Check that there aren't pending links
    // 3) Get new links

    log(`Is user signed in? ${isSignedIn}`);
    log(`Rewards Total: ${getRewardsTotal()}`);

    setTimeout(() => {
        log(`Breakdown: ${JSON.stringify(getSearchBreakdowns(), null, 4)}`);
    }, 3000);
});
