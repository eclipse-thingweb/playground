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
        op: ["readproperty", "writeproperty"],
    },
    "Form-ActionAffordance": {
        op: "invokeaction",
    },
    "Form-EventAffordance": {
        op: ["subscribeevent", "unsubscribeevent"],
    },
    AdditionalExpectedResponse: {
        success: false,
        contentType: "application/json",
    },
    DataSchema: {
        readOnly: false,
        writeOnly: false,
    },
    PropertyAffordance: {
        observable: false,
    },
    ActionAffordance: {
        safe: false,
        idempotent: false,
    },
    BasicSecuritySchema: {
        in: "header",
    },
    DigestSecurityScheme: {
        in: "header",
        qop: "auth",
    },
    BearerSecurityScheme: {
        in: "header",
        alg: "ES256",
        format: "jwt",
    },
    APIKeySecurityScheme: {
        in: "query",
    },
};

/**
 * The possible types of objects to extend
 */
const defaultClasses = {
    form: "Form",
    formPropertyAffordance: "Form-PropertyAffordance",
    formActionAffordance: "Form-ActionAffordance",
    formEventAffordance: "Form-EventAffordance",
    additionalExpectedResponse: "AdditionalExpectedResponse",
    dataSchema: "DataSchema",
    propertyAffordance: "PropertyAffordance",
    actionAffordance: "ActionAffordance",
    basicSecuritySchema: "BasicSecuritySchema",
    digestSecurityScheme: "DigestSecurityScheme",
    bearerSecurityScheme: "BearerSecurityScheme",
    apiKeySecurityScheme: "APIKeySecurityScheme",
};

module.exports = { defaultLookup, defaultClasses };
