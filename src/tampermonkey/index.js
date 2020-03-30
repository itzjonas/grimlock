const setup = async () => {
    // Testing my comment

    GM_log('Parcel');
};

window.addEventListener(
    'load',
    async () => {
        window.stop();
        await setup();
    },
    { capture: true, once: true },
);

window.addEventListener(
    'unload',
    async () => {
        GM_log('Bot stopped');
    },
    false,
);
