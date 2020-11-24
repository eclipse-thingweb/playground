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
 * @param {{description, termsOfService, contact, license}} opt Optional properties
 */
function Info(title, version, opt) {
    if (title === undefined || version === undefined) {throw new Error("title or version for infos object missing")}
    if (opt === undefined) {opt = {}}
    this.title = title
    this.version = version
    this.description = opt.description
    this.termsOfService = opt.termsOfService
    this.contact = opt.contact
    this.license = opt.license
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

module.exports = {AsyncAPI, Info, ExternalDocs}