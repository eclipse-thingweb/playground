/**
 * Convert a TD Data Schema object to an AsyncAPI Schema
 * @param {object} source The TD data Schema object
 * @returns {object} An AsyncAPI Schema instance
 */
function dataToAsyncSchema(source) {
    const target = {}
    const tdCustoms = ["@type", "titles", "descriptions", "unit"]
    const commons = ["title", "type", "description", "const", "oneOf", "enum", "readOnly", "writeOnly", "format"]

    tdCustoms.forEach( customKey => {
        if (source[customKey] !== undefined) {
            if (customKey.startsWith("@")) {
                target["x-AT-" + customKey.slice(1)] = source[customKey]
            }
            else {
                target["x-" + customKey] = source[customKey]
            }
        }
    })

    commons.forEach( commonKey => {
        if (source[commonKey] !== undefined) {
            target[commonKey] = source[commonKey]
        }
    })

    // recursively parse oneOf subschemas
    if (source.oneOf !== undefined) {
        target.oneOf = []
        source.oneOf.forEach( subschema => {
            const newAsyncSchema = dataToAsyncSchema(subschema)
            target.oneOf.push(newAsyncSchema)
        })
    }

    return target
}

/**
 * Detect type of link and separate into server and channel, e.g.:
 * @param {string} link The whole or partial URL, e.g. `http://example.com/asdf/1`
 * @returns {{server:string|undefined, channel:string}} Channel and Server if given,
 * e.g., `{server: "http://example.com", channel: "/asdf/1"}`
 */
function extractChannel(link) {
    let server; let channel
    if (link.search("://") !== -1) {
        const [protocol, sLink] = link.split("://")
        server = protocol + "://" + sLink.split("/").shift()
        channel = "/" + sLink.split("/").slice(1).join("/")
    }
    else {
        channel = link
        if (!channel.startsWith("/")) {channel = "/" + channel}
    }
    return {channel, server}
}

module.exports = { dataToAsyncSchema, extractChannel }