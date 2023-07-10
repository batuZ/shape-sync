# shape-sync
read shapefile on electron.

```js
const { Shapefile } = require('./shapefile')

const shp = new Shapefile('file.shp')

console.log("feature_count: ", shp.feature_count)
console.log("wkt: ", shp.wkt)
console.log("bbox: ", shp.bbox)
console.log("bbox: ", shp.fieldDef())

for (let i = 0; i < shp.feature_count; i++) {
    const feature = shp.get(i)
    const geometry = feature.geometry
    console.log("geometry: ", geometry.coordinates)
    const properties = feature.properties
    console.log("properties: ", properties)
}

shp.close()

```