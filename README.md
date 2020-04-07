<div style="text-align: center">
    <img src="./grimlock.png" />
</div>

# Grimlock

Autobots (Sludge & Grimlock) used to reap great rewards!

**NOTE:**

There are currently two Autobots:
1) Partial automation via Sludge (Tampermonkey) (active development)
2) Full automation via Grimlock (Puppeteer)

## Sludge (Tampermonkey)

The trusty yet dimwitted sidekick to Grimlock is surveying the current landscape. After enough intel has been gathered, it will be relayed to Grimlock for full deployment.

To activate Sludge [click here](./src/tampermonkey/README.md).

## Grimlock (Puppeteer)

This will support full automation for up to five (5) accounts.

### Prerequisite

Grimlock works best when he's on the [Edge](https://www.microsoft.com/en-us/edge/). Make sure he gets there...

### Setup

**Take the Autobot Vow** (store your credentials locally)

```sh
export LIVE_USERNAME='youremail@hotmail.com'
export LIVE_PASSWORD='yourpassword'
```

**Assemble All Autobots** (install dependencies)
```sh
yarn
```
Then:
```sh
yarn assemble
```

### Activate Grimlock

```sh
yarn autobots:rollout
```
