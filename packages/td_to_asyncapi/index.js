const apiParser = require('@asyncapi/parser')
const YAML = require("json-to-pretty-yaml")

/**
 * Create an AsyncAPI document from a Web of Things Thing Description
 * @param {object} td A Thing Description object as input
 * @returns {Promise<{json:object, yaml:String}>} Resolves as object containing the OAP document or rejects
 */
function toAsyncAPI(td) {
    return new Promise( (res, rej) => {

        if (typeof td !== "object") {rej("TD has wrong type, should be an object")}

        /* required */
        const API = {
            asyncapi: "2.0.0",
            info: {
                title: "ASDF",
                version: "unknown"
            },
            channels: {
                "example-channel": {}
            }
        }



        apiParser.parse(API).then( () => {
            res({json: API, yaml: YAML.stringify(API)})
        }, err => {
            console.log(JSON.stringify(API, undefined, 4))
            rej(err)
        })
    })
}

module.exports = toAsyncAPI
