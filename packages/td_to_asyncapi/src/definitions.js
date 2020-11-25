const apiParser = require('@asyncapi/parser')
const YAML = require("json-to-pretty-yaml")

/**
 * AsyncAPI Constructor
 * @param {{asyncapi, info: Info, channels,
 *          id?, servers?, components?, tags?, externalDocs?: ExternalDocs
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
 * @param {{description?, termsOfService?, contact?, license?}|undefined} opts Optional properties
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
 * @param {{description?: string, externalDocs?: ExternalDocs}|undefined} opt optional properties
 */
function Tag(name, opt) {
    if (name === undefined) {throw new Error("name for tag missing")}
    this.name = name
    if (opt === undefined) {opt = {}}
    this.description = opt.description
    this.externalDocs = opt.externalDocs
}

/**
 * One AsyncAPI Channel Item Object
 * @param {string} channel The channel, e.g. "user/signup"
 * @param {{description, subscribe, publish, parameters, bindings }|undefined} opts The possible object properties
 */
function Channel(channel, opts) {
    if (typeof channel !== "string") {throw new Error("Channel was constructed with wrong channel type: " + typeof channel)}
    this[channel] = {}
    Object.assign(this[channel], opts)
}

module.exports = { AsyncAPI, Info, ExternalDocs, Tag, Channel }
