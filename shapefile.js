const fs = require('fs')

function ringClockwise(ring) {
    if ((n = ring.length) < 4) return false;
    var i = 0, n, area = ring[n - 1][1] * ring[0][0] - ring[n - 1][0] * ring[0][1];
    while (++i < n) area += ring[i - 1][1] * ring[i][0] - ring[i - 1][0] * ring[i][1];
    return area >= 0;
}

function ringContainsSome(ring, hole) {
    var i = -1, n = hole.length, c;
    while (++i < n) {
        if (c = ringContains(ring, hole[i])) {
            return c > 0;
        }
    }
    return false;
}

function ringContains(ring, point) {
    var x = point[0], y = point[1], contains = -1;
    for (var i = 0, n = ring.length, j = n - 1; i < n; j = i++) {
        var pi = ring[i], xi = pi[0], yi = pi[1],
            pj = ring[j], xj = pj[0], yj = pj[1];
        if (segmentContains(pi, pj, point)) {
            return 0;
        }
        if (((yi > y) !== (yj > y)) && ((x < (xj - xi) * (y - yi) / (yj - yi) + xi))) {
            contains = -contains;
        }
    }
    return contains;
}

function segmentContains(p0, p1, p2) {
    var x20 = p2[0] - p0[0], y20 = p2[1] - p0[1];
    if (x20 === 0 && y20 === 0) return true;
    var x10 = p1[0] - p0[0], y10 = p1[1] - p0[1];
    if (x10 === 0 && y10 === 0) return false;
    var t = (x20 * x10 + y20 * y10) / (x10 * x10 + y10 * y10);
    return t < 0 || t > 1 ? false : t === 0 || t === 1 ? true : t * x10 === x20 && t * y10 === y20;
}

function parseNull(buf, start) {
    return {
        type: 'Null',
        coordinates: []
    };
}

function parsePoint(buf, start) {
    return {
        type: 'Point',
        coordinates: [
            buf.readDoubleLE(start + 4),
            buf.readDoubleLE(start + 12)
        ]
    }
}

function parsePolyLine(buf, start) {
    let NumParts = buf.readInt32LE(start + 36)
    let partStartIndex = []
    for (let i = 0; i < NumParts; i++) {
        partStartIndex.push(buf.readInt32LE(44 + i * 4 + start))
    }

    let NumPoints = buf.readInt32LE(40 + start)
    let X = 44 + (4 * NumParts) + start
    let Y = X + (16 * NumPoints) + 16
    let points = []
    for (let i = 0; i < NumPoints; i++) {
        let xy_step = X + i * 16
        points.push([
            buf.readDoubleLE(xy_step),
            buf.readDoubleLE(xy_step + 8)
        ])
    }

    return NumParts === 1
        ? { type: "LineString", coordinates: points }
        : { type: "MultiLineString", coordinates: partStartIndex.map(function (i, j) { return points.slice(i, partStartIndex[j + 1]); }) }
}

function parsePolygon(buf, start) {
    const NumParts = buf.readInt32LE(start + 36)
    const partStartIndex = []
    for (let i = 0; i < NumParts; i++) {
        partStartIndex.push(buf.readInt32LE(44 + i * 4 + start))
    }

    const NumPoints = buf.readInt32LE(40 + start)
    const X = 44 + (4 * NumParts) + start
    const points = []
    for (let i = 0; i < NumPoints; i++) {
        const xy_step = X + i * 16
        points.push([
            buf.readDoubleLE(xy_step),
            buf.readDoubleLE(xy_step + 8)
        ])
    }

    if (NumParts === 1) {
        return { type: "Polygon", coordinates: points }
    } else {
        let coor = partStartIndex.map((i, j) => points.slice(i, partStartIndex[j + 1]))
        return { type: "MultiPolygon", coordinates: coor }
    }
}

function parseMultiPoint(buf, start) {
    const NumPoints = buf.readInt32LE(start + 36)
    let points = []
    for (let i = 0; i < NumPoints; i++) {
        points.push([
            buf.readDoubleLE(start + i * 16 + 40),
            buf.readDoubleLE(start + i * 16 + 48)
        ])
    }

    return { type: "MultiPoint", coordinates: points };
}

function parsePointZ(buf, start) {
    return {
        type: 'PointZ',
        coordinates: [
            buf.readDoubleLE(start + 4),
            buf.readDoubleLE(start + 12),
            buf.readDoubleLE(start + 20)
        ]
    }
}

function parsePolyLineZ(buf, start) {
    let NumParts = buf.readInt32LE(start + 36)
    let partStartIndex = []
    for (let i = 0; i < NumParts; i++) {
        partStartIndex.push(buf.readInt32LE(44 + i * 4 + start))
    }

    let NumPoints = buf.readInt32LE(40 + start)
    let X = 44 + (4 * NumParts) + start
    let Y = X + (16 * NumPoints) + 16
    let points = []
    for (let i = 0; i < NumPoints; i++) {
        let xy_step = X + i * 16
        let z_step = Y + i * 8
        points.push([
            buf.readDoubleLE(xy_step),
            buf.readDoubleLE(xy_step + 8),
            buf.readDoubleLE(z_step)
        ])
    }

    return NumParts === 1
        ? { type: "LineStringZ", coordinates: points }
        : { type: "MultiLineStringZ", coordinates: partStartIndex.map(function (i, j) { return points.slice(i, partStartIndex[j + 1]); }) }
}

function parsePolygonZ(buf, start) {
    const NumParts = buf.readInt32LE(start + 36)
    const partStartIndex = []
    for (let i = 0; i < NumParts; i++) {
        partStartIndex.push(buf.readInt32LE(44 + i * 4 + start))
    }

    const NumPoints = buf.readInt32LE(40 + start)
    const X = 44 + (4 * NumParts) + start
    const Y = X + (16 * NumPoints) + 16
    const points = []
    for (let i = 0; i < NumPoints; i++) {
        const xy_step = X + i * 16
        const z_step = Y + i * 8
        points.push([
            buf.readDoubleLE(xy_step),
            buf.readDoubleLE(xy_step + 8),
            buf.readDoubleLE(z_step)
        ])
    }

    if (NumParts === 1) {
        return { type: "PolygonZ", coordinates: points }
    } else {
        let coor = partStartIndex.map((i, j) => points.slice(i, partStartIndex[j + 1]))
        return { type: "MultiPolygonZ", coordinates: coor }
    }
}

function parseMultiPointZ(buf, start) {
    const NumPoints = buf.readInt32LE(start + 36)
    let points = []
    for (let i = 0; i < NumPoints; i++) {
        points.push([
            buf.readDoubleLE(start + (40 + i * 16)),
            buf.readDoubleLE(start + (40 + i * 16 + 8)),
            buf.readDoubleLE(start + (40 + NumPoints * 16 + 16 + i * 8))
        ])
    }
    return { type: "MultiPointZ", coordinates: points };
}

function parsePointM(buf, start) { }// TODO:

function parsePolyLineM(buf, start) { }// TODO:

function parsePolygonM(buf, start) { }// TODO:

function parseMultiPointM(buf, start) { }// TODO:

function readNumber(value) {
    return !(value = value.trim()) || isNaN(value = +value) ? null : value;
}

function readString(value) {
    return value.trim() || null;
}

function readDate(value) {
    return new Date(+value.substring(0, 4), value.substring(4, 6) - 1, +value.substring(6, 8));
}

function readBoolean(value) {
    return /^[nf]$/i.test(value) ? false : /^[yt]$/i.test(value) ? true : null;
}

const parsers = {
    0: parseNull,
    1: parsePoint, // 测试通过
    3: parsePolyLine, // 测试通过
    5: parsePolygon,// 测试通过
    8: parseMultiPoint, // 测试通过
    11: parsePointZ, // 测试通过
    13: parsePolyLineZ,// 测试通过
    15: parsePolygonZ, // 测试通过
    18: parseMultiPointZ,   // 测试通过
    21: parsePointM,
    23: parsePolyLineM,
    25: parsePolygonM,
    28: parseMultiPointM
}

const types = {
    B: readNumber,
    C: readString,
    D: readDate,
    F: readNumber,
    L: readBoolean,
    M: readNumber,
    N: readNumber
}

class Shapefile {
    constructor(shp, opt) {
        if (fs.existsSync(shp)) {
            let dbf_path = shp.substring(0, shp.length - 4) + ".dbf"
            if (fs.existsSync(dbf_path)) {

                //http://www.dbase.com/Knowledgebase/INT/db7_file_fmt.htm
                this._dbf = fs.readFileSync(dbf_path)

                // 如果'gbk'和'utf-8'都乱码，就要自己去找编码了，设置到opt里 {encoding: 'utf-16le'}
                // 在这里 https://nodejs.org/api/util.html#class-utiltextdecoder
                // 根据文件头判断编码
                let LDID = this._dbf.readUint8(29)
                opt ||= LDID === 77 ? 'gbk' : 'utf-8'

                const TDecoder = new TextDecoder(opt.encoding)
                this._decode = TDecoder.decode.bind(TDecoder)
                this.feature_count = this._dbf.readUint32LE(4)
                this._fields = [];
                for (let i = 32; this._dbf.readUint8(i) !== 0x0d; i += 32) {
                    for (var j = 0; j < 11; ++j) {
                        if (this._dbf.readUint8(i + j) === 0) {
                            break;
                        }
                    }
                    this._fields.push({
                        name: this._decode(this._dbf.subarray(i, i + j)),
                        type: String.fromCharCode(this._dbf.readUint8(i + 11)),
                        length: this._dbf.readUint8(i + 16)
                    })
                }


                //https://www.esri.com/content/dam/esrisites/sitecore-archive/Files/Pdfs/library/whitepapers/pdfs/shapefile.pdf
                this._shp = fs.readFileSync(shp)
                this.type = parsers[this._shp.readInt32LE(32)].name.slice(5) // get Shape Type name of main header, ex: PointZ
                this.bbox = [
                    this._shp.readDoubleLE(36), this._shp.readDoubleLE(44),
                    this._shp.readDoubleLE(52), this._shp.readDoubleLE(60)];

                // check featre index
                this._shp_indexies = []
                let curr = 100
                for (let i = 0; i < this.feature_count; i++) {
                    let index = this._shp.readInt32BE(curr)
                    let len = this._shp.readInt32BE(curr + 4)
                    this._shp_indexies.push(curr)
                    curr = curr + (len + 4) * 2
                }

                // srs
                let prj = shp.substring(0, shp.length - 4) + ".prj"
                if (fs.existsSync(prj)) {
                    this.wkt = fs.readFileSync(prj).toString()
                }
            } else {
                throw `${dbf} not find! `
            }
        } else {
            throw `${shp} not find! `
        }
    }

    get(index = 0) {
        let shp_start = this._shp_indexies[index] + 8
        let geometry = parsers[this._shp.readInt32LE(32)](this._shp, shp_start)

        let dbf_start = this._dbf.readUint16LE(8) + this._dbf.readUint16LE(10) * index
        let properties = {}
        for (let fi = 0; fi < this._fields.length; fi++) {
            const f = this._fields[fi]
            let sub_buf = this._dbf.subarray(dbf_start, dbf_start += f.length)
            properties[f.name] = types[f.type](this._decode(sub_buf))
        }
        return { geometry, properties }
    }

    fieldDef() {
        const type_str = {
            'B': 'Binary',
            'C': 'String',
            'D': 'Date',
            'N': 'Numeric',
            'L': 'Boolean',
            'M': 'Number',
            '@': 'Timestamp',
            'I': 'Long',
            '+': 'Long',
            'F': 'Float',
            'O': 'Double',
            'G': 'OLE',
        }

        return this._fields.map(f => {
            return {
                name: f.name,
                type: type_str[f.type],
                length: f.length
            }
        })
    }

    close() {
        this._shp = null
        this._dbf = null
    }
}
module.exports.Shapefile = Shapefile
