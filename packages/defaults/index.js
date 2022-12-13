const {defaultLookup, defaultClasses} = require("./src/definitions")
const {sharedDefaults, sharedDataSchema, sharedOneObject} = require("./src/shared")
const {objEquality} = require( './src/util' )

/**
 * Extends a given TD with the default values of fields that aren't filled.
 * @param {object} td The TD to extend with default values
 * @returns {void}
 */
function addDefaults(td) {
    sharedDefaults(td, extendOneObject, extendDataSchema)
}

/**
 * Remove explicitly given default values from a TD.
 * @param {object} td The TD to remove default values from
 * @returns {void}
 */
function removeDefaults(td) {
    sharedDefaults(td, reduceOneObject, reduceDataSchema)
}

/**
 * Recursively extends nested data Schemas
 * @param {object} dataSchema A TD dataSchema object
 */
function extendDataSchema(dataSchema) {
    sharedDataSchema(dataSchema, extendOneObject)
}

/**
 * Recursively reduces nested data Schemas
 * @param {object} dataSchema A TD dataSchema object
 */
function reduceDataSchema(dataSchema) {
    sharedDataSchema(dataSchema, reduceOneObject)
}


/**
 * Adds default values to one given object,
 * using the defaultLookup table
 * @param {{}} target the object to extend
 * @param {string} type The type according to the defaultLookup table
 * @param {{}} parentInteraction Only for read/writeOnly special case
 */
function extendOneObject(target, type, parentInteraction) {

    const callback = (cTarget, cType, cParent) => {
        // treat special case, that readOnly / writeOnly should be respected
        if (cType === "Form-PropertyAffordance" && (cParent.readOnly || cParent.writeOnly)) {
            if (cTarget.op === undefined) {
                if (cParent.readOnly && cParent.writeOnly) {
                    console.warn("readOnly and writeOnly are both true for: ", cParent)
                    // do not set op in this case
                }
                else if (cParent.readOnly) {
                    cTarget.op = "readproperty"
                }
                else {
                    cTarget.op = "writeproperty"
                }
            }
        }
        // additionalResponses case
        else if (cType === "AdditionalExpectedResponse") {
            const defaultSource = defaultLookup[cType]

            if (cTarget.contentType) {
                defaultSource.additionalResponses[0].contentType = cTarget.contentType
            }

            Object.keys(defaultSource).forEach( key => {
                if (cTarget[key] === undefined) {
                    cTarget[key] = defaultSource[key]
                }
            })
        }
        // default behavior
        else {
            const defaultSource = defaultLookup[cType]
            Object.keys(defaultSource).forEach( key => {
                if (cTarget[key] === undefined) {
                    cTarget[key] = defaultSource[key]
                }
            })
        }
    }

    sharedOneObject(target, type, callback, parentInteraction)
}

/**
 * Remove properties from one object if they
 * equal default values, using the defaultLookup table
 * @param {object} target the object to extend
 * @param {string} type The type according to the defaultLookup table
 * @param {{}} parentInteraction Only for read/writeOnly special case
 */
function reduceOneObject(target, type, parentInteraction) {

    const callback = (cTarget, cType, cParent) => {
        // treat special case, that readOnly / writeOnly should be respected
        if (cType === "Form-PropertyAffordance" && (cParent.readOnly || cParent.writeOnly) && typeof cTarget.op === "string") {
            if (cParent.readOnly && cParent.writeOnly) {
                console.warn("readOnly and writeOnly are both true for: ", cParent)
                // do not set op in this case
            }
            else if (cParent.readOnly && cTarget.op === "readproperty") {
                delete cTarget.op
            }
            else if (cParent.writeOnly && cTarget.op === "writeproperty") {
                delete cTarget.op
            }
            else {
                // do nothing
            }
        }
        else {
            const defaultSource = defaultLookup[cType]
            Object.keys(defaultSource).forEach( key => {
                if (objEquality(cTarget[key], defaultSource[key])) {
                    console.log(`Key: ${key}`)
                    delete cTarget[key]
                }
            })
        }
    }

    sharedOneObject(target, type, callback, parentInteraction)
}

module.exports = {
    addDefaults,
    removeDefaults,
    extendDataSchema,
    extendOneObject,
    reduceDataSchema,
    reduceOneObject,
    defaultLookup,
    defaultClasses
}
