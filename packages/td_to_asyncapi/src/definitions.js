const apiParser = require('@asyncapi/parser')
const YAML = require("json-to-pretty-yaml")

/**
 * AsyncAPI Constructor
 * @param {{asyncapi: string, info: Info, channels: {[key:string]: Channel},
 *          id?, servers?: {[key:string]: Server}, components?, tags?: Tag[], externalDocs?: ExternalDocs
 *         }} props The AsyncAPI instance properties
 */
function AsyncAPI(props) {

    this.asYaml = function () {
       return YAML.stringify(props)
    }
    this.parse = function () {
        return new Promise( (res, rej) => {
            apiParser.parse(props).then( parsedAapi => {
                this.aap = parsedAapi
                res({json: props, yaml: this.asYaml()})
            })
        })
    }
}

/**
 * The AsyncAPI Info object
 * @param {string} title The title of the application
 * @param {string} version The API version (NOT async specification version), defaults to undefined
 * @param {{description?, termsOfService?, contact?, license?} | undefined} opts Optional properties
 */
function Info(title, version, opts) {
    if (title === undefined || version === undefined) {throw new Error("title or version for infos object missing")}
    if (opts === undefined) {opts = {}}
    this.title = title
    this.version = version
    this.description = opts.description
    this.termsOfService = opts.termsOfService
    this.contact = opts.contact
    this.license = opts.license
}

/**
 * An AsyncAPI ExternalDocs object
 * @param {string} url  e.g. "https://example.com/docs/iot"
 * @param {string} description e.g. "An explanation of the Internet of Things"
 */
function ExternalDocs(url, description) {
    if (url === undefined) {throw new Error("url for external docs object missing")}
    this.url = url
    if (description) {this.description = description}
}

/**
 * The AsyncAPI Tag object
 * @param {string} name The Tag name
 * @param {{description?: string, externalDocs?: ExternalDocs}| undefined} opts optional properties
 */
function Tag(name, opts) {
    if (name === undefined) {throw new Error("name for tag missing")}
    this.name = name
    if (opts === undefined) {opts = {}}
    this.description = opts.description
    this.externalDocs = opts.externalDocs
}

/**
 * One AsyncAPI Channel Item Object
 * @param {string} channel The channel, e.g. "user/signup"
 * @param {{description?: string,
 *          subscribe?: Operation,
 *          publish?: Operation,
 *          parameters?,
 *          bindings?
 *          }|undefined} opts The possible object properties
 */
function Channel(channel, opts) {
    if (typeof channel !== "string") {throw new Error("Channel was constructed with wrong channel type: " + typeof channel)}
    this[channel] = {}
    Object.assign(this[channel], opts)
}

/**
 * An Async API Operation object
 * @param {{
 *          tdOp?: "observe" | "read" | "write" | "subscribe",
 *          opName?: string,
 *          ixType?: "property" | "action" | "event",
 *          summary?: string,
 *          description?: string,
 *          tags?: Tag[],
 *          externalDocs?: ExternalDocs,
 *          bindings?: HttpOperationBinding | MqttOperationBinding,
 *          message?: Message | {oneOf: Message[]}
 * }} opts All parameters are optional
 */
function Operation(opts) {
    if (opts.tdOp !== undefined && opts.opName !== undefined && opts.ixType !== undefined) {
        this.operationId = "" + opts.tdOp + opts.opName + opts.ixType
    }
    if (opts.tags === undefined && opts.ixType) {
        if (opts.ixType === "property") {
            this.tags = [new Tag("properties")]
        }
        else if (opts.ixType === "action" || opts.ixType === "event") {
            this.tags = [new Tag(opts.ixType + "s")]
        }
    }
    delete opts.tdOp
    delete opts.opName
    delete opts.ixType

    Object.assign(this, opts)
}

/**
 * An AsyncAPI message object
 * @param {{
 *          headers?,
 *          payload?,
 *          schemaFormat?,
 *          contentType?,
 *          examples?
 *        }} opts All parameters are optional
 */
function Message(opts) {
    this.headers = opts.headers
    this.payload = opts.payload
    this.schemaFormat = opts.schemaFormat
    this.contentType = opts.contentType
    this.examples = opts.examples
}

/**
 * An AsyncAPI http protocol operation binding
 * @param {"request" | "response"} type Type of the operation
 * @param {{
 *          method?: string,
 *          query?
 *         }} opts optional properties
 */
function HttpOperationBinding(type, opts) {
    if (type === undefined) {throw new Error("type is required")}
    this.http = {}
    this.http.type = type
    this.http.bindingVersion = "0.1.0"
    Object.assign(this.http, opts)
}

/**
 * An AsyncAPI http protocol message binding
 * @param {*} headers A Schema object containing the definitions for HTTP-specific headers.
 *                    This schema MUST be of type object and have a properties key.
 *                    E.g. `headers: {type: object, properties: {Content-Type: {type: string, enum: ["application/json"]}}}`
 */
function HttpMessageBinding(headers) {
    this.http = {}
    this.http.headers = headers
    this.http.bindingVersion = "0.1.0"
}

/**
 * An AsyncAPI mqtt protocol server binding
 * @param {{
 *          clientId?: string,
 *          cleanSession?: boolean,
 *          lastWill?: {
 *            topic: string,
 *            qos: 0 | 1 | 2,
 *            message?: string,
 *            retain?: boolean
 *          },
 *          keepAlive?: number
 * }} opts All parameters are optional
 */
function MqttServerBinding(opts) {
    this.mqtt = {}
    this.mqtt.bindingVersion = "0.1.0"
    Object.assign(this.mqtt, opts)
}

/**
 * An AsyncAPI mqtt protocol operation binding
 * @param {{
 *          qos?: 0 | 1 | 2,
 *          retain?: boolean
 * }} opts All parameters are optional
 */
function MqttOperationBinding(opts) {
    this.mqtt = {}
    this.mqtt.bindingVersion = "0.1.0"
    Object.assign(this.mqtt, opts)
}

/**
 * An AsyncAPI server
 * @param {string} url e.g. subdomain.example.com
 * @param {"http"|"https"|"mqtt"} protocol
 * @param {{
 *          protocolVersion?: string,
 *          security?,
 *          variables?,
 *          bindings?: MqttServerBinding
 * }} opts Optional parameters
 */
function Server(url, protocol, opts) {
    if (typeof url !== "string" || typeof protocol !== "string") {throw new Error("url and protocol have to be type string")}
    this.url = url
    this.protocol = protocol
    Object.assign(this, opts)
}

module.exports = {
    AsyncAPI,
    Info,
    ExternalDocs,
    Tag,
    Channel,
    Operation,
    Message,
    HttpOperationBinding,
    HttpMessageBinding,
    MqttServerBinding,
    MqttOperationBinding,
    Server
}
