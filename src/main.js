const Apify = require('apify');

const { log } = Apify.utils;
log.setLevel(log.LEVELS.DEBUG);

Apify.main(async () => {
    const input = await Apify.getInput();
    console.log('Input:');
    console.dir(input);

    const { proxy, startUrls } = input;

    const requestQueue = await Apify.openRequestQueue();
    await Promise.all(startUrls.map(url => requestQueue.addRequest({ url, userData: { type: 'startUrl' } })));

    const sessionPool = await Apify.openSessionPool({
        maxPoolSize: 25,
        sessionOptions: {
            maxAgeSecs: 10,
            maxUsageCount: 150,
        },
        persistStateKeyValueStoreId: 'SESSIONS',
        persistStateKey: 'my-session-pool',
    });

    await sessionPool.initialize();

    const crawler = new Apify.CheerioCrawler({
        requestQueue,
        ...proxy,
        minConcurrency: 10,
        maxConcurrency: 50,

        prepareRequestFunction: ({ request }) => {
            request.headers = {
                'User-Agent': Apify.utils.getRandomUserAgent(),
            };
            return request;
        },

        handlePageFunction: async ({ request, body, $ }) => {
            console.log(`Processing ${request.url}...`);

            const title = $('title').text();
            if (title === 'Access Denied') {
                throw new Error('Access Denied');
            }

            console.log(body);
            const { type } = request.userData;

            if (type === 'startUrl') {
                const departments = $('#shopByDepartmentDropdownList ul li a');
                Object.keys(departments).forEach((key) => {
                    const item = departments[key];
                    if (item.type === 'tag' && item.name === 'a') {
                        const url = `https://www.macys.com${item.attribs.href}`;
                        const name = $(item).text();
                        log.debug(name);
                        log.debug(url);
                        requestQueue.addRequest({ url, userDate: { type: 'department', name } });
                    }
                });
            }

            if (type === 'department') {
                log.debug('Departmanet', request.userData.name);
            }

        },

        handleFailedRequestFunction: async ({ request }) => {
            console.log(`Request ${request.url} failed too many times`);
        },
    });

    await crawler.run();
});
