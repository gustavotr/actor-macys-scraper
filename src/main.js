const Apify = require('apify');
const cheerio = require('cheerio');

const { parseMainPage, parseCategory, getUrlType, parseProduct, EnumURLTypes } = require('./tools');

const { log } = Apify.utils;
log.setLevel(log.LEVELS.DEBUG);

Apify.main(async () => {
    const input = await Apify.getInput();
    const { proxy, startUrls } = input;

    const requestQueue = await Apify.openRequestQueue();
    await Promise.all(startUrls.map((url) => {
        const type = getUrlType(url);
        requestQueue.addRequest({ url, userData: { type } });
    }));

    const crawler = new Apify.BasicCrawler({
        requestQueue,
        useSessionPool: true,
        maxRequestsPerCrawl: 50,

        handleRequestFunction: async ({ request, session }) => {
            log.info(`Processing ${request.url}...`);

            const requestOptions = {
                url: request.url,
                proxyUrl: Apify.getApifyProxyUrl({
                    groups: proxy.apifyProxyGroups,
                    session: session.id,
                }),
            };
            const { body, headers } = await Apify.utils.requestAsBrowser(requestOptions);
            const $ = cheerio.load(body);
            const title = $('title').text();

            if (title === 'Access Denied') {
                session.markBad();
                throw new Error('Access Denied');
            }

            session.markGood();

            const { type } = request.userData;

            if (type === EnumURLTypes.START_URL) {
                log.debug('Start url...');
                await parseMainPage({ requestQueue, $, body });
            }

            if (type === EnumURLTypes.CATEGORY) {
                log.debug('Category url...');
                await parseCategory({ requestQueue, $, body, userData: { ...request.userData } });
            }

            if (type === EnumURLTypes.PRODUCT) {
                log.debug('Product url...');
                await parseProduct({ requestQueue, $, body, userData: { ...request.userData, headers } });
            }
        },

        handleFailedRequestFunction: async ({ request }) => {
            console.log(`Request ${request.url} failed too many times`);
        },
    });

    await crawler.run();
});
