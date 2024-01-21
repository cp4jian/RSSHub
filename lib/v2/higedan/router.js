module.exports = (router) => {
    router.get('/hp/information/:maxPages?', require('./hp-information'));
};
