const Apify = require('apify');
const { EnumURLTypes } = require('./constants');
const { log } = require('./tools');


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
    if (nextPage) {
        await requestQueue.addRequest({
            url: `https://www.macys.com${nextPage}`,
            userData: {
                type: EnumURLTypes.CATEGORY,
            },
        });
    }
};

const parseProduct = async ({ $, userResult }) => {
    const data = JSON.parse($('#productMktData').html());
    for (const offer of data.offers) {
        const product = {
            ...data,
            offers: undefined,
            brand: data.brand.name,
            price: offer.price,
            currency: offer.priceCurrency,
            availability: offer.availability,
            priceValidUntil: 'Sale ends 1/1/20',
            color: offer.itemOffered.color,
            SKU: offer.SKU,
        };

        Object.assign(product, userResult);

        await Apify.pushData(product);
    }
};

module.exports = {
    parseMainPage,
    parseCategory,
    parseProduct,
};
