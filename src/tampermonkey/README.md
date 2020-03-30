# Grimlock (TM Script)

This script requires [Microsoft Edge](https://www.microsoft.com/en-us/edge/) with the [Tampermonkey extension](https://microsoftedge.microsoft.com/addons/detail/iikmkjmpaadaobahmlepeloendndfphd?hl=en-US) installed.

## Installation

To install Grimlock, click [here](https://github.com/itzjonas/grimlock/raw/master/grimlock.user.js). If Tampermonkey is correctly installed, you will be asked to add the script to your dashboard. Confirm the installation and start scoring some rewards.

## Usage

Once installed, ensure Tampermonkey is enabled and navigate to [https://www.bing.com](https://www.bing.com/).

## TODO

- Create unified source code
- Split code into components
- Use parcel to combine src to grimlock.user.js (with grimlock.meta.js)
- Look into [adding](https://www.tampermonkey.net/documentation.php):
  - @icon64 or @icon64URL
  - GM_notification(text, title, image, onclick)
  - GM_xmlhttpRequest
