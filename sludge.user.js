(() => {
"use strict";
const $b958964703c55533$var$setup = async ()=>{
    // Testing my comment
    GM_log('Parcel');
};
window.addEventListener('load', async ()=>{
    window.stop();
    await $b958964703c55533$var$setup();
}, {
    capture: true,
    once: true
});
window.addEventListener('unload', async ()=>{
    GM_log('Bot stopped');
}, false);

})();
