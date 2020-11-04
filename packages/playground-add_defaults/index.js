/**
 * Extends a given Td with the default values of fields that aren't filled
 * @param {object|string} td The Td to extend with default values
 */
function addDefaults(td) {
    if (typeof td === "string") {td = JSON.parse(td)}

    // -- Action Affordances
    forEvery(td.actions, action => {
        extendOneObject(action, defaultClasses.actionAffordance)
    })

    // -- Forms
    const interactionTypes = {
        properties: defaultClasses.formPropertyAffordance, 
        actions: defaultClasses.formActionAffordance, 
        events: defaultClasses.formEventAffordance
    }
    Object.keys(interactionTypes).forEach( interactionType => {
        forEvery(td[interactionType], interaction => {
            if (interaction.forms) {
                interaction.forms.forEach( form => {
                    extendOneObject(form, interactionTypes[interactionType])
                })
            }
        })
    })
    if (td.forms) {
        td.forms.forEach( form => {
            extendOneObject(form, defaultClasses.form)
        })
    }

    // -- DataSchema
    forEvery(td.properties, extendDataSchema)
    forEvery(td.actions, action => {
        if(action.input) {extendDataSchema(action.input)}
        if(action.output) {extendDataSchema(action.output)}
    })
    forEvery(td.events, event => {
        if(event.subscription) {extendDataSchema(event.subscription)}
        if(event.data) {extendDataSchema(event.data)}
        if(event.cancellation) {extendDataSchema(event.cancellation)}
    })
    Object.keys(interactionTypes).forEach( interactionType => {
        forEvery(td[interactionType], interaction => {
            forEvery(interaction.uriVariables, extendDataSchema)
        })
    })

    // -- SecurityScheme's (Basic, Digest, Bearer, APIKey)
    const secSchemes = {
        basic: defaultClasses.basicSecuritySchema,
        digest: defaultClasses.digestSecurityScheme,
        bearer: defaultClasses.bearerSecurityScheme,
        apikey: defaultClasses.apiKeySecurityScheme
    }
    if (td.securityDefinitions) {
        forEvery(td.securityDefinitions, securityDefinition => {
            const aSecScheme = Object.keys(secSchemes).find(secScheme => secScheme === securityDefinition.scheme)
            if (aSecScheme !== undefined) {
                extendOneObject(securityDefinition, secSchemes[aSecScheme])
            }
        })
    }

    return td
}

/**
 * Applies the specified callback to every element of an object
 * (like forEach does on an Array)
 * @param {object} obj the target object
 * @param {(element:any)=>void} callback function to apply for every element
 */
function forEvery(obj, callback) {
    if (typeof obj === "object" && !Array.isArray(obj)) {
        Object.keys(obj).forEach( key => {
            const element = obj[key]
            callback(element)
        })
    }
}

/**
 * Recursively extends nested data Schemas
 * @param {object} dataSchema An Td dataSchema object
 */
function extendDataSchema(dataSchema) {
    extendOneObject(dataSchema, defaultClasses.dataSchema)
    if (dataSchema.oneOf) {
        dataSchema.oneOf.forEach(childScheme => {
            extendDataSchema(childScheme)
        })
    }
    if (dataSchema.items) {
        if (Array.isArray(dataSchema.items)) {
            dataSchema.items.forEach(item => {
                extendDataSchema(item)
            })
        }
        else {
            extendDataSchema(dataSchema.items)
        }
    }
    if (dataSchema.properties) {
        Object.keys(dataSchema.properties).forEach(key => {
            extendDataSchema(dataSchema.properties[key])
        })
    }
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
    form: "Form",
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

module.exports = addDefaults
module.exports.extendDataSchema = extendDataSchema
module.exports.extendOneObject = extendOneObject
module.exports.defaultLookup = defaultLookup
module.exports.defaultClasses = defaultClasses
