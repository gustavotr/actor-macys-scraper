const Apify = require('apify');
const { EnumURLTypes, BaseUrls } = require('./constants');
const { log } = require('./tools');

const parseMainPage = async ({ requestQueue, $ }) => {
    log.debug('PARSING MAIN PAGE');
    const data = $('script[type=\'application/json\'][data-mcom-header-menu-desktop=\'context.header.menu\']')
        .html();
    const departments = JSON.parse(data);
    for (const dpt of departments) {
        if (dpt.children) {
            for (const child of dpt.children) {
                await Promise.all(child.group.map(async ({ text: department, mediaGroupType, children: categories }) => {
                    if (mediaGroupType === 'FLEXIBLE_LINKS') {
                        try {
                            await Promise.all(categories.map(({ group: childrenGroup }) => childrenGroup.map(async ({ text: category, url }) => {
                                await requestQueue.addRequest({
                                    url: `https://www.macys.com${url}`,
                                    userData: {
                                        type: EnumURLTypes.CATEGORY,
                                        department,
                                        category,
                                    },
                                });
                            })));
                        } catch (e) {
                            log.warning(e);
                        }
                    }
                }));
            }
        }
    }
};

const parseCategory = async ({ requestQueue, $, userData }) => {
    log.debug('PARSING CATEGORY');
    $('.productDetail')
        .each(async (idx, el) => {
            const href = $('.productDescLink', el)
                .attr('href');
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
    const nextPage = $('.next-page a')
        .attr('href');
    if (nextPage) {
        await requestQueue.addRequest({
            url: `https://www.macys.com${nextPage}`,
            userData: {
                type: EnumURLTypes.CATEGORY,
            },
        });
    }
};

const parseProduct = async (rawProductInfo, apiData) => {
    log.debug('PARSING PRODUCT');
    const { meta: { analytics: { data } }, product: prod } = rawProductInfo;
    const colors = prod[0].traits.colors.colorMap;
    const productInfo = prod[0];
    const product = {
        id: productInfo.id,
        name: productInfo.detail.name,
        rating: data.product_rating[0],
        brand: data.product_brand[0],
        url: BaseUrls.HOME + productInfo.identifier.productUrl,
        category: productInfo.identifier.toLevelCategoryName,
        description: productInfo.detail.description,
        images: productInfo.imagery.images.map((image) => {
            return BaseUrls.IMAGE + image.filePath;
        }),
        apiData: apiData ? rawProductInfo : undefined,
    };
    if (!colors) {
        await Apify.pushData(product);
        return;
    }
    await Promise.all(Object.values(colors)
        .map(async (color) => {
            const prices = color.pricing.price.tieredPrice;
            const price = prices.filter(({ label }) => label.includes('Orig'))[0];
            const salePrice = prices.filter(({ label }) => label.includes('Sale'))[0];
            const productWithColors = {
                ...product,
                color: color.name,
                images: color.imagery.images.map((image) => {
                    return BaseUrls.IMAGE + image.filePath;
                }),
                sizes: color.sizes,
                price: price ? price.values[0].value : prices[0].values[0].value,
                salePrice: salePrice ? salePrice.values[0].value : null,
                apiData: apiData ? rawProductInfo : undefined,
            };
            return Apify.pushData(productWithColors);
        }));
};

module.exports = {
    parseMainPage,
    parseCategory,
    parseProduct,
};
