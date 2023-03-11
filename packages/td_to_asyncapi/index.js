const { AsyncAPI, ExternalDocs } = require("./src/definitions");
const genChannels = require("./src/genChannels");
const { genInfo, genTags, genBaseServer } = require("./src/genRoot");
const defaults = require("@thing-description-playground/defaults");

/**
 * Create an AsyncAPI instance from a Web of Things Thing Description
 * @param {object} td A Thing Description object as input
 * @returns {Promise<{json:object, yaml:String}>} Resolves as object containing the OAP document or rejects
 */
function toAsyncAPI(td) {
    return new Promise((res, rej) => {
        if (typeof td !== "object") {
            rej("TD has wrong type, should be an object");
        }

        defaults.addDefaults(td);

        const servers = genBaseServer(td);
        const asyncApiInstance = new AsyncAPI("2.0.0", genInfo(td), genChannels(td, servers), {
            id: td.id,
            servers,
            tags: genTags(td),
            externalDocs: new ExternalDocs(
                "http://plugfest.thingweb.io/playground/",
                "This AsyncAPI instance was generated from a Web of Things (WoT) - Thing Description by the WoT Playground"
            ),
        });

        asyncApiInstance.parse().then(
            (apiExport) => {
                res(apiExport);
            },
            (err) => {
                console.log(asyncApiInstance.asYaml());
                rej(err);
            }
        );
    });
}

module.exports = toAsyncAPI;
