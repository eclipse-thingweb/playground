const { AsyncAPI, ExternalDocs } = require( './src/definitions' )
const genInfo = require( './src/genInfos' )

/**
 * Create an AsyncAPI document from a Web of Things Thing Description
 * @param {object} td A Thing Description object as input
 * @returns {Promise<{json:object, yaml:String}>} Resolves as object containing the OAP document or rejects
 */
function toAsyncAPI(td) {
    return new Promise( (res, rej) => {

        if (typeof td !== "object") {rej("TD has wrong type, should be an object")}

        const asyncApiInstance = new AsyncAPI({
            asyncapi: "2.0.0",
            info: genInfo(td),
            channels: {},
            id: td.id,
            externalDocs: new ExternalDocs(
                "http://plugfest.thingweb.io/playground/",
                "This AsyncAPI instance was generated from a Web of Things (WoT) - Thing Description by the WoT Playground"
            )
        })

        console.log(asyncApiInstance.asYaml())
        asyncApiInstance.parse().then( apiExport => {
            res(apiExport)
        }, err => {
            console.log(asyncApiInstance.asYaml())
            rej(err)
        })
    })
}

module.exports = toAsyncAPI
