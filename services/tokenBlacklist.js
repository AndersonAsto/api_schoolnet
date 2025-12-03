const blacklist = new Map();

function sweep() {
    const now = Math.floor(Date.now() / 1000);
    for (const [jti, exp] of blacklist.entries()) {
        if (exp <= now) blacklist.delete(jti);
    }
}

setInterval(sweep, 60 * 1000).unref();

module.exports = {
    add(jti, exp) {
        blacklist.set(jti, exp);
    },
    has(jti) {
        return blacklist.has(jti);
    },
};
