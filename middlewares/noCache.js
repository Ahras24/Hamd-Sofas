



const noCache = (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
};

module.exports = noCache;
