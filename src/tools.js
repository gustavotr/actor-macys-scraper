const Apify = require('apify');
const { EnumURLTypes, EnumBaseUrl } = require('./constants');

const { log } = Apify.utils;
log.setLevel(log.LEVELS.DEBUG);

const getSearchUrl = (keyword) => {
    return `${EnumBaseUrl.SEARCH}/${keyword}`;
};

const getUrlType = (url) => {
    let type = null;
    if (url.match(/macys\.com\/*$/)) {
        type = EnumURLTypes.START_URL;
    }

    if (url.match(/macys\.com(\/shop)*\/product\/.+/)) {
        type = EnumURLTypes.PRODUCT;
    }

    if (url.match(/macys\.com\/shop\/.+/)) {
        type = EnumURLTypes.CATEGORY;
    }
    if (url.match(/macys\.com\/shop\/featured\/.+/)) {
        type = EnumURLTypes.SEARCH;
    }

    return type;
};

const isObject = val => typeof val === 'object' && val !== null && !Array.isArray(val);

module.exports = {
    getUrlType,
    getSearchUrl,
    isObject,
    log,
};
