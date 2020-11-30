const { dataToAsyncSchema, extractChannel } = require( './utils' )
const { Channel, Operation, Tag, Message, MqttOperationBinding, Server } = require("./definitions")

/**
 * Maps TD interactions and their forms to AsyncAPI channels
 * @param {object} td 
 * @param {object} servers The AsyncAPI servers map
 */
function genChannels(td, servers) {
    // TODO: find events to add
    // TODO: add http-longpoll, ws, sse?
    const channels = {}

    scanProperties(td.properties, channels, servers)

    return channels
}

/**
 * Iterate over all forms of properties
 * @param {object} properties The TD properties map
 */
function scanProperties(properties, channels, servers) {
    Object.keys(properties).forEach( propertyName => {
        const property = properties[propertyName]
        if (property.forms) {
            property.forms.forEach( form => {
                scanPropForm(form, channels, propertyName, dataToAsyncSchema(property), servers)
            })
        }
    })
}
/**
 * Check if form is relevant
 * @param {object} form One form
 */
function scanPropForm(form, channels, propertyName, payload, servers) {

    const hasBase = servers.base !== undefined ? true : false
    const isRelative = form.href && form.href.search("://") === -1 ? true : false

    if (form.href && (form.href.startsWith("mqtt://") || (hasBase && isRelative))) {
        const opArray = (typeof form.op === "string") ? [form.op] : form.op
        if (opArray.some( op => (op === "observeproperty" || op === "unobserveproperty")) || form["mqv:controlPacketValue"] === "SUBSCRIBE") {
            console.log("found mqtt observable property")
            const {channel, server} = extractChannel(form.href)
            // add server
            if (server && Object.keys(servers).every(asyncServer => servers[asyncServer].url !== server)) {
                let i = 0
                while(Object.keys(servers).some( asyncServer => asyncServer === i.toString()))
                {
                    i++
                }
                servers[i.toString()] = new Server(server, "mqtt")
            }
            // add channel
            if (!channels[channel]) {
                let bindings
                if (form["mqv:options"]) {
                    let qos
                    let retain
                    form["mqv:options"].forEach( mqvOption => {
                        if(mqvOption["mqv:optionName"] && mqvOption["mqv:optionName"] === "qos" && mqvOption["mqv:optionValue"]) {
                            qos = mqvOption["mqv:optionValue"]
                        }
                        else if (mqvOption["mqv:optionName"] && mqvOption["mqv:optionName"] === "retain" && mqvOption["mqv:optionValue"]) {
                            retain = mqvOption["mqv:optionValue"]
                        }
                    })
                    if (qos !== undefined || retain !== undefined) {
                        bindings = new MqttOperationBinding({qos, retain})
                    }
                }
                Object.assign(channels, new Channel(channel, {
                    subscribe: new Operation({
                        tdOp: "observe",
                        opName: propertyName,
                        ixType: "property",
                        message: new Message({
                            contentType: form.contentType,
                            payload
                        }),
                        bindings
                    })
                }))
            }
        }
    }
}

module.exports = genChannels
