### Macys Scraper

Macys Scraper is an [Apify actor](https://apify.com/actors) for extracting data about actors from [Macys](https://macys.com/). It allows you to extract all products. It is build on top of [Apify SDK](https://sdk.apify.com/) and you can run it both on [Apify platform](https://my.apify.com) and locally.

- [Input](#input)
- [Output](#output)
- [Compute units consumption](#compute-units-consumption)

### Input

| Field | Type | Description | Default value
| ----- | ---- | ----------- | -------------|
| startUrls | array | List of [Request](https://sdk.apify.com/docs/api/request#docsNav) objects that will be deeply crawled. The URL can be home page like `https://macys.com/` or category page `https://www.macys.com/shop/furniture/living-room-furniture?id=35319&cm_sp=c2_1111US_catsplash_furniture-_-row3-_-icon_living-room&edge=hybrid` or detail page `https://www.macys.com/shop/product/radley-fabric-sectional-sofa-collection-created-for-macys?ID=1101381&CategoryID=35319`. | `["https://macys.com/"]`|
| maxItems | number | Maximum number of products that will be scraped | all found |
| search | string | Keyword that will be used to search Macys`s products |  |
| proxyConfiguration | object | Proxy settings of the run. This actor works better with the Apify proxy group SHADER. If you have access to this Apify proxy group, leave the default settings. If not, you can use other Apify proxy groups or you can set `{ "useApifyProxy": false" }` to disable proxy usage | `{"useApifyProxy": true, "apifyProxyGroups": ["SHADER"] }`|

### Output

Output is stored in a dataset. Each item is an information about a product. Example:

```json
{
  "id": "9229574",
  "name": "Belted Toggle Wrap Coat",
  "rating": "4.2193",
  "brand": "Calvin Klein",
  "url": "https://www.macys.com/shop/product/calvin-klein-belted-toggle-wrap-coat?ID=9229574",
  "description": "Pull your look together in this classic wrap coat from Calvin Klein, designed with a belted closure and a stylish shawl collar.",
  "color": "Black",
  "images": [
    "https://slimages.macysassets.com/is/image/MCY/products4/optimized/13986824_fpx.tif",
    "https://slimages.macysassets.com/is/image/MCY/products6/optimized/13986826_fpx.tif",
    "https://slimages.macysassets.com/is/image/MCY/products7/optimized/13986827_fpx.tif",
    "https://slimages.macysassets.com/is/image/MCY/products8/optimized/13986828_fpx.tif"
  ],
  "sizes": [
    0,
    1,
    2,
    3,
    4,
    5,
    6
  ],
  "price": 300,
  "salePrice": 144.99,
}
```

### Compute units consumption
Keep in mind that it is much more efficient to run one longer scrape (at least one minute) than more shorter ones because of the startup time.

The average consumption is **0.2 Compute unit for 1000 actor pages** scraped
