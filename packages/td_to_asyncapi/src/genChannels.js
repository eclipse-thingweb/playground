const { Channel } = require("./definitions")

function genChannels(td) {
    // TODO: respect base server
    // TODO: find events to add
    const channels = {}

    scanProperties(td.properties, channels)

    return channels
}

/**
 * Iterate over all forms of properties
 * @param {object} properties The TD properties map
 */
function scanProperties(properties, channels) {
    Object.keys(properties).forEach( propertyName => {
        const property = properties[propertyName]
        if (property.forms) {
            property.forms.forEach( form => {
                scanPropForm(form, channels)
            })
        }
    })
}

/**
 * Check if form is relevant
 * @param {object} form One form
 */
function scanPropForm(form, channels) {
    if (form.href && form.href.startsWith("mqtt://")) {
        const opArray = (typeof form.op === "string") ? [form.op] : form.op
        if (opArray.some( op => (op === "observeproperty" || op === "unobserveproperty"))) {
            console.log("found mqtt observable property")
            const {channel, server} = extractChannel(form.href)
            if (!channels[channel]) {
                Object.assign(channels, new Channel(channel))
            }
        }
    }
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

module.exports = genChannels
