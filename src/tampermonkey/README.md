# Sludge

Like Grimlock, Sludge works best when he's on the [Edge](https://www.microsoft.com/en-us/edge/) with the [Tampermonkey extension](https://microsoftedge.microsoft.com/addons/detail/iikmkjmpaadaobahmlepeloendndfphd?hl=en-US) installed.

## Installation

To activate Sludge, click [here](https://github.com/itzjonas/grimlock/raw/master/sludge.user.js). If Tampermonkey is correctly installed, you will be asked to add the script to your dashboard. Confirm the installation and start scoring some rewards.

## Usage

Once activated, ensure Tampermonkey is enabled and navigate to .

## Contributing

Tinker around, then:

```sh
yarn assemble:sludge
```

## TODO

- Create unified source code
- Split code into components
- Use parcel to combine src to sludge.user.js (with sludge.meta.js)
- Look into [adding](https://www.tampermonkey.net/documentation.php):
  - @icon64 or @icon64URL
  - GM_notification(text, title, image, onclick)
  - GM_xmlhttpRequest
