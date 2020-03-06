export const credentials = {
    username: process.env.LIVE_USERNAME,
    password: process.env.LIVE_PASSWORD,
};

/**
 * Return a partially-random number between two values.
 */
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

export default randomInt;
