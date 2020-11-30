const { dataToAsyncSchema, extractChannel } = require( './utils' )
const { Channel, Operation, Tag, Message, MqttOperationBinding, Server } = require("./definitions")

/**
 * Maps TD interactions and their forms to AsyncAPI channels
 * @param {object} td The Thing Description input
 * @param {object} servers The AsyncAPI servers map
 */
function genChannels(td, servers) {
    // TODO: add http-longpoll, ws, sse?
    const channels = {}

    scanProperties(td.properties, channels, servers)
    scanEvents(td.events, channels, servers)

    return channels
}

/**
 * Iterate over all forms of properties
 * @param {object} properties The TD properties map
 */
function scanProperties(properties, channels, servers) {

    const propertyInfo = {
        ops: ["observeproperty", "unobserveproperty"],
        tdOp: "observe",
        interaction: "property"
    }

    Object.keys(properties).forEach( propertyName => {
        const property = properties[propertyName]
        if (property.forms) {
            property.forms.forEach( form => {
                scanPropForm(form, channels, propertyName, dataToAsyncSchema(property), servers, propertyInfo)
            })
        }
    })
}

/**
 * Iterate over all forms of properties
 * @param {object} properties The TD properties map
 */
function scanEvents(events, channels, servers) {

    const eventInfo = {
        ops: ["subscribeevent", "unsubscribeevent"],
        tdOp: "subscribe",
        interaction: "event"
    }

    Object.keys(events).forEach( eventName => {
        const event = events[eventName]
        if (event.forms) {
            event.forms.forEach( form => {
                scanPropForm(form, channels, eventName, dataToAsyncSchema(event.data), servers, eventInfo)
            })
        }
    })
}

/**
 * Array containing all protocols to convert and their relevant properties
 */
const tryProtocols = [{
    id: "mqtt",
    checkForm: form => (form["mqv:controlPacketValue"] === "SUBSCRIBE"),
    addBinding: form => {
        let bindings
        if (form["mqv:options"]) {
            let qos
            let retain
            form["mqv:options"].forEach( mqvOption => {
                if (mqvOption["mqv:optionName"] && mqvOption["mqv:optionValue"]) {
                    if(mqvOption["mqv:optionName"] === "qos") {
                        qos = mqvOption["mqv:optionValue"]
                    }
                    else if (mqvOption["mqv:optionName"] === "retain") {
                        retain = mqvOption["mqv:optionValue"]
                    }
                }
            })
            if (qos !== undefined || retain !== undefined) {
                bindings = new MqttOperationBinding({qos, retain})
            }
        }
        return bindings
    }
}]

/**
 * Check if form is relevant
 * @param {object} form One form
 */
function scanPropForm(form, channels, propertyName, payload, servers, interactionInfo) {

    const hasBase = servers.base !== undefined ? true : false
    const isRelative = form.href && form.href.search("://") === -1 ? true : false

    tryProtocols.forEach( tryProtocol => {
        if (form.href && (form.href.startsWith(tryProtocol.id + "://") || (hasBase && isRelative))) {

            const opArray = (typeof form.op === "string") ? [form.op] : form.op
            if (opArray.some( op => (interactionInfo.ops.some( intOp => op === intOp))) ||
                tryProtocol.checkForm(form)) {

                const {channel, server} = extractChannel(form.href)
                // add server
                addServer(servers, server, tryProtocol.id)

                // add channel
                if (!channels[channel]) {
                    Object.assign(channels, new Channel(channel, {
                        subscribe: new Operation({
                            tdOp: interactionInfo.tdOp,
                            opName: propertyName,
                            ixType: interactionInfo.interaction,
                            message: new Message({
                                contentType: form.contentType,
                                payload
                            }),
                            bindings: tryProtocol.addBinding(form)
                        })
                    }))
                }
            }
        }
    })
}

/**
 * Add a new server if it doesn't already exist in the servers object
 * @param {[key:string]:Server} servers The AsyncAPI servers map
 * @param {string|undefined} newServerUri
 * @param {string} protocol
 */
function addServer(servers, newServerUri, newServerProtocol) {
    if (newServerUri && Object.keys(servers).every(asyncServer => (
        servers[asyncServer].url !== newServerUri || servers[asyncServer].protocol !== newServerProtocol
    ))) {
        let i = 0
        while(Object.keys(servers).some( asyncServer => asyncServer === i.toString()))
        {
            i++
        }
        servers[i.toString()] = new Server(newServerUri, newServerProtocol)
    }
}

module.exports = genChannels
