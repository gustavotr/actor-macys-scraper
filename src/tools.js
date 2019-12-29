const Apify = require('apify');

const { log } = Apify.utils;

const EnumURLTypes = {
    PRODUCT: 'product',
    CATEGORY: 'category',
    START_URL: 'startUrl',
};

const parseMainPage = async ({ requestQueue, $ }) => {
    const data = $("script[type='application/json'][data-mcom-header-menu-desktop='context.header.menu']").html();
    const departments = JSON.parse(data);
    departments.forEach(({ children }) => {
        if (children) {
            children.forEach(({ group }) => group.forEach(({ text: department, mediaGroupType, children: categories }) => {
                if (mediaGroupType === 'FLEXIBLE_LINKS') {
                    try {
                        categories.forEach(({ group: childrenGroup }) => childrenGroup.forEach(async ({ text: category, url }) => {
                            await requestQueue.addRequest({
                                url: `https://www.macys.com${url}`,
                                userData: {
                                    type: EnumURLTypes.CATEGORY,
                                    department,
                                    category,
                                },
                            });
                        }));
                    } catch (e) {
                        log.warning(e);
                    }
                }
            }));
        }
    });
};

const parseCategory = async ({ requestQueue, $, userData }) => {
    $('.productDetail').each(async (idx, el) => {
        const href = $('.productDescLink', el).attr('href');
        await requestQueue.addRequest({
            url: `https://www.macys.com${href}`,
            userData: {
                ...userData,
                type: EnumURLTypes.PRODUCT,
            },
        }, {
            forefront: true,
        });
    });
    const nextPage = $('.next-page a').attr('href');
    await requestQueue.addRequest({
        url: `https://www.macys.com${nextPage}`,
        userData: {
            type: EnumURLTypes.CATEGORY,
        },
    });
};

const parseProduct = async ({ requestQueue, $ }) => {
    const title = $('title').text();
    await Apify.pushData({ type: 'product', title });
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
    return type;
};


module.exports = {
    parseMainPage,
    parseCategory,
    parseProduct,
    getUrlType,
    EnumURLTypes,
};
