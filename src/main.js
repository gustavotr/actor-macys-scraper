const Apify = require('apify');
const cheerio = require('cheerio');
const safeEval = require('safe-eval');

const { getUrlType, log, getSearchUrl, getProductIdFromURL } = require('./tools');
const { EnumBaseUrl, EnumURLTypes } = require('./constants');
const { parseCategory, parseMainPage } = require('./parsers');

Apify.main(async () => {
    const input = await Apify.getInput();
    const { proxy, startUrls, maxItems, search } = input;

    if (!startUrls && !search) {
        throw new Error('startUrls or search parameter must be provided!');
    }

    if (startUrls && !startUrls.length && !search) {
        startUrls.push(EnumBaseUrl.HOME);
    }

    const requestQueue = await Apify.openRequestQueue();

    if (startUrls && startUrls.length) {
        await Promise.all(startUrls.map((url) => {
            const type = getUrlType(url);
            requestQueue.addRequest({
                url,
                userData: { type },
            });
        }));
    }

    if (search) {
        await requestQueue.addRequest({ url: getSearchUrl(search), userData: { type: EnumURLTypes.SEARCH } });
    }

    const dataset = await Apify.openDataset();
    let { itemCount } = await dataset.getInfo();

    const crawler = new Apify.BasicCrawler({
        requestQueue,
        useSessionPool: true,

        handleRequestFunction: async ({ request, session }) => {
            if (itemCount >= maxItems) {
                log.info('Actor reached the max items limit. Crawler is going to halt...');
                log.info('Crawler Finished.');
                process.exit();
            }

            log.info(`Processing ${request.url}...`);

            const requestOptions = {
                url: request.url,
                proxyUrl: Apify.getApifyProxyUrl({
                    groups: proxy.apifyProxyGroups,
                    session: session.id,
                }),
            };

            const { type } = request.userData;

            if (type === EnumURLTypes.PRODUCT) {
                const productId = getProductIdFromURL(request.url);
                const url = `https://www.macys.com/xapi/digital/v1/product/${
                    productId
                }?size=small&clientId=PROS&_shoppingMode=SITE&_customerState=GUEST&currencyCode=USD&_regionCode=US`;
                const { body: product } = await Apify.utils.requestAsBrowser({
                    url,
                    abortFunction: () => false,
                    proxyUrl: Apify.getApifyProxyUrl({
                        groups: proxy.apifyProxyGroups,
                        session: session.id,
                    }),
                    followRedirect: false,
                    json: true,
                });
                await Apify.pushData(product);
                itemCount++;
            } else {
                const { body } = await Apify.utils.requestAsBrowser(requestOptions);
                const $ = cheerio.load(body);
                const title = $('title')
                    .text();

                if (title === 'Access Denied') {
                    log.warning('Access Denied');
                }

                session.markGood();


                if (type === EnumURLTypes.START_URL) {
                    log.debug('Start url...');
                    await parseMainPage({
                        requestQueue,
                        $,
                        body,
                    });
                }

                if (type === EnumURLTypes.CATEGORY || type === EnumURLTypes.SEARCH) {
                    log.debug('Category or Search url...');
                    await parseCategory({
                        requestQueue,
                        $,
                        body,
                        userData: { ...request.userData },
                    });
                }
            }
        },

        handleFailedRequestFunction: async ({ request }) => {
            console.log(`Request ${request.url} failed too many times`);
        },
    });

    await crawler.run();
});
