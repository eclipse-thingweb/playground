module.exports = addDefaults

/**
 * Extends a given Td with the default values of fields that aren't filled
 * @param {object|string} td The Td to extend with default values
 */
function addDefaults(td) {
    if (typeof td === "string") {td = JSON.parse(td)}

    // find objects to extend

    // -- Action Affordances
    if (td.actions) {
        Object.keys(td.actions).forEach( actionName => {
            extendOneObject(td.actions[actionName], defaultClasses.actionAffordance)
        })
    }

    // -- Forms
    const interactionTypes = {
        properties: defaultClasses.formPropertyAffordance, 
        actions: defaultClasses.formActionAffordance, 
        events: defaultClasses.formEventAffordance
    }
    Object.keys(interactionTypes).forEach( interactionType => {
        if (td[interactionType]) {
            Object.keys(td[interactionType]).forEach( interactionName => {
                const interaction = td[interactionType][interactionName]
                if (interaction.forms) {
                    interaction.forms.forEach( form => {
                        extendOneObject(form, interactionTypes[interactionType])
                    })
                }
            })
        }
    })



    return td
}

/**
 * the TD default value definitions according to 
 * https://www.w3.org/TR/2020/REC-wot-thing-description-20200409/
 * 
 * represented with:
 * class[-superClass] -> property -> value
 */
const defaultLookup = {
    Form: {
        contentType: "application/json",
    },
    "Form-PropertyAffordance": {
        op: ["readproperty", "writeproperty"]
    },
    "Form-ActionAffordance": {
        op: "invokeaction"
    },
    "Form-EventAffordance": {
        op: "subscribeevent" // will be ["subscribeevent", "unsubscribeevent"] in the future
    },
    DataSchema: {
        readOnly: false,
        writeOnly: false
    },
    ActionAffordance: {
        safe: false,
        idempotent: false
    },
    BasicSecuritySchema: {
        in: "header"
    },
    DigestSecurityScheme: {
        in: "header",
        qop: "auth"
    },
    BearerSecurityScheme: {
        in: "header",
        alg: "ES256",
        format: "jwt"
    },
    APIKeySecurityScheme: {
        in: "query"
    }
}

/**
 * The possible types of objects to extend
 */
const defaultClasses = {
    formPropertyAffordance: "Form-PropertyAffordance",
    formActionAffordance: "Form-ActionAffordance",
    formEventAffordance: "Form-EventAffordance",
    dataSchema: "DataSchema",
    actionAffordance: "ActionAffordance",
    basicSecuritySchema: "BasicSecuritySchema",
    digestSecurityScheme: "DigestSecurityScheme",
    bearerSecurityScheme: "BearerSecurityScheme",
    apiKeySecurityScheme: "APIKeySecurityScheme"
}

/**
 * Adds default values to one given object,
 * using the defaultLookup table
 * @param {{}} target the object to extend
 * @param {string} type The type according to the defaultLookup table
 */
function extendOneObject(target, type) {
    if (typeof target !== "object") {throw new Error("target has to be of type 'object' not: " + typeof target)}
    if (typeof type !== "string") {throw new Error("type has to be of type 'string' not: " + typeof type)}
    if (Object.keys(defaultLookup).every(key => (key !== type))) {throw new Error("type has to be a defaultLookup entry, type: " + type)}

    const defaultSource = defaultLookup[type]
    Object.keys(defaultSource).forEach( key => {
        if (target[key] === undefined) {
            target[key] = defaultSource[key]
        }
    })

    // handle default values with superClasses (e.g. Form-EventAffordance)
    if (type.includes("-")) {
        const superType = type.split("-").slice(0,-1).join("-")
        extendOneObject(target, superType)
    }
}
