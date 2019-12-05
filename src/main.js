const Apify = require('apify');

const { log } = Apify.utils;
log.setLevel(log.LEVELS.DEBUG);

Apify.main(async () => {
    const input = await Apify.getInput();
    const { proxy, startUrls } = input;

    const requestQueue = await Apify.openRequestQueue();
    await Promise.all(startUrls.map(url => requestQueue.addRequest({ url, userData: { type: 'startUrl' } })));

    const crawler = new Apify.CheerioCrawler({
        requestQueue,
        ...proxy,
        minConcurrency: 10,
        maxConcurrency: 50,

        maxRequestRetries: 3,

        handlePageTimeoutSecs: 60,

        handlePageFunction: async ({ request, body, $ }) => {
            console.log(`Processing ${request.url}...`);

            const title = $('title').text();
            if (title === 'Access Denied') {
                throw new Error('Access Denied');
            }
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
            // departments.each(item => console.log(item));
            // await Apify.pushData({
            //     url: request.url,
            //     title,
            //     h1texts,
            //     body,
            // });
        },

        handleFailedRequestFunction: async ({ request }) => {
            console.log(`Request ${request.url} failed 3 times.`);
        },
    });

    await crawler.run();

    console.log('Crawler finished.');
});
