module.exports = addDefaults

/**
 * Extends a given Td with the default values of fields that aren't filled
 * @param {object|string} td The Td to extend with default values
 */
function addDefaults(td) {
    if (typeof td === "string") {td = JSON.parse(td)}

    // find objects to extend

    // extend properly

    return td
}

/**
 * the TD default value definitions according to 
 * https://www.w3.org/TR/2020/REC-wot-thing-description-20200409/
 * 
 * represented with:
 * property -> ...Classes -> value
 */
const defaultLookup = {
    contentType: {
        Form: "application/json"
    },
    readOnly: {
        DataSchema: false
    },
    writeOnly: {
        DataSchema: false
    },
    safe: {
        ActionAffordance: false
    },
    idempotent: {
        ActionAffordance: false
    },
    op: {
        PropertyAffordance: {
            Form: ["readproperty", "writeproperty"]
        },
        ActionAffordance: {
            Form: "invokeaction"
        },
        EventAffordance: {
            Form: "subscribeevent" // will be ["subscribeevent", "unsubscribeevent"] in the future
        }
    },
    in: {
        BasicSecuritySchema: "header",
        DigestSecurityScheme: "header",
        BearerSecurityScheme: "header",
        APIKeySecurityScheme: "query"
    },
    qop: {
        DigestSecurityScheme: "auth"
    },
    alg: {
        BearerSecurityScheme: "ES256"
    },
    format: {
        BearerSecurityScheme: "jwt"
    }
}
