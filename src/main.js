const Apify = require('apify');
const cheerio = require('cheerio');

const { getUrlType, log, getProductIdFromURL, setDebugMode } = require('./tools');
const { BaseUrls, EnumURLTypes } = require('./constants');
const { parseCategory, parseMainPage, parseProduct } = require('./parsers');
const { createProxyWithValidation } = require('./proxy-validation');

Apify.main(async () => {
    const input = await Apify.getInput();
    const { proxy, startUrls, maxItems, search, apiData, debugMode } = input;

    if (debugMode) {
        setDebugMode();
    }

    if (!startUrls && !search) {
        throw new Error('startUrls or search parameter must be provided!');
    }

    if (startUrls && !startUrls.length && !search) {
        startUrls.push(BaseUrls.HOME);
    }

    const requestList = await Apify.openRequestList('start-urls', startUrls);
    const requestQueue = await Apify.openRequestQueue();

    if (search) {
        await requestQueue.addRequest({ url: `${BaseUrls.SEARCH}/${search}`, userData: { type: EnumURLTypes.SEARCH } });
    }

    const dataset = await Apify.openDataset();
    let { itemCount } = await dataset.getInfo();

    const proxyConfiguration = await createProxyWithValidation({
        proxyConfig: proxy,
    });

    const crawler = new Apify.BasicCrawler({
        requestList,
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
                proxyUrl: proxyConfiguration.newUrl(session.id),
            };

            const type = getUrlType(request.url);

            if (type === EnumURLTypes.PRODUCT) {
                const productId = getProductIdFromURL(request.url);
                const url = `https://www.macys.com/xapi/digital/v1/product/${
                    productId
                }?size=small&clientId=PROS&_shoppingMode=SITE&_customerState=GUEST&currencyCode=USD&_regionCode=US`;
                const { body } = await Apify.utils.requestAsBrowser({
                    url,
                    abortFunction: () => false,
                    proxyUrl: proxyConfiguration.newUrl(session.id),
                    followRedirect: false,
                });

                try {
                    const product = JSON.parse(body);
                    await parseProduct(product, apiData);
                } catch (err) {
                    const $ = cheerio.load(body);
                    const title = $('title')
                        .text();

                    if (title === 'Access Denied') {
                        session.markBad();
                        throw new Error('Access Denied');
                    }
                    throw new Error(err);
                }
                itemCount++;
            } else {
                const { body } = await Apify.utils.requestAsBrowser(requestOptions);
                const $ = cheerio.load(body);
                const title = $('title')
                    .text();

                if (title === 'Access Denied') {
                    log.error('Access Denied');
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
