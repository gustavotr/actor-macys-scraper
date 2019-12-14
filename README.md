### Macys Scraper

Macys Scraper is an [Apify actor](https://apify.com/actors) for extracting data about actors from [Macys](https://macys.com/). It allows you to extract all products. It is build on top of [Apify SDK](https://sdk.apify.com/) and you can run it both on [Apify platform](https://my.apify.com) and locally.

- [Input](#input)
- [Output](#output)
- [Compute units consumption](#compute-units-consumption)
- [Extend output function](#extend-output-function)

### Input

| Field | Type | Description | Default value
| ----- | ---- | ----------- | -------------|
| startUrls | array | List of [Request](https://sdk.apify.com/docs/api/request#docsNav) objects that will be deeply crawled. The URL can be home page like `https://macys.com/` or category page `https://www.macys.com/shop/furniture/living-room-furniture?id=35319&cm_sp=c2_1111US_catsplash_furniture-_-row3-_-icon_living-room&edge=hybrid` or detail page `https://www.macys.com/shop/product/radley-fabric-sectional-sofa-collection-created-for-macys?ID=1101381&CategoryID=35319`. | `["https://macys.com/"]`|
| maxItems | number | Maximum number of products that will be scraped | all found |
| search | string | Keyword that will be used to search Macys`s products |  |
| extendOutputFunction | string | Function that takes a Cheerio handle ($) as argument and returns data that will be merged with the result output. More information in [Extend output function](#extend-output-function) | |
| proxyConfiguration | object | Proxy settings of the run. This actor works better with the Apify proxy group SHADER. If you have access to this Apify proxy group, leave the default settings. If not, you can use other Apify proxy groups or you can set `{ "useApifyProxy": false" }` to disable proxy usage | `{"useApifyProxy": true, "apifyProxyGroups": ["SHADER"] }`|

### Output

Output is stored in a dataset. Each item is an information about a product. Example:

```json
{}
```

### Compute units consumption
Keep in mind that it is much more efficient to run one longer scrape (at least one minute) than more shorter ones because of the startup time.

The average consumption is **0.2 Compute unit for 1000 actor pages** scraped

### Extend output function

You can use this function to update the result output of this actor. This function gets a Cheerio handle `$` as an argument so you can choose what data from the page you want to scrape. The output from this will function will get merged with the result output.

The return value of this function has to be an object!

You can return fields to achive 3 different things:
- Add a new field - Return object with a field that is not in the result output
- Change a field - Return an existing field with a new value
- Remove a field - Return an existing field with a value `undefined`


```js
($) => {
  return {
        saleEnd: $('._3p7kp').text().trim(),
        salePrice: 0,
        url: undefined
    }
}
```
This example will add a new field `saleEnd`, change the `salePrice` field and remove `url` field
```json
{

}
```
