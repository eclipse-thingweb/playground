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
 * @param {object} dataSchema An TD dataSchema object
 */
function extendDataSchema(dataSchema) {
    sharedDataSchema(dataSchema, extendOneObject)
}

/**
 * Recursively reduces nested data Schemas
 * @param {object} dataSchema An TD dataSchema object
 */
function reduceDataSchema(dataSchema) {
    sharedDataSchema(dataSchema, reduceOneObject)
}


/**
 * Adds default values to one given object,
 * using the defaultLookup table
 * @param {{}} target the object to extend
 * @param {string} type The type according to the defaultLookup table
 */
function extendOneObject(target, type) {

    const callback = (cTarget, cType) => {
        const defaultSource = defaultLookup[cType]
        Object.keys(defaultSource).forEach( key => {
            if (cTarget[key] === undefined) {
                cTarget[key] = defaultSource[key]
            }
        })
    }

    sharedOneObject(target, type, callback)
}

/**
 * Remove properties from one object if they
 * equal default values, using the defaultLookup table
 * @param {object} target the object to extend
 * @param {string} type The type according to the defaultLookup table
 */
function reduceOneObject(target, type) {

    const callback = (cTarget, cType) => {
        const defaultSource = defaultLookup[cType]
        Object.keys(defaultSource).forEach( key => {
            if (objEquality(cTarget[key], defaultSource[key])) {
                delete cTarget[key]
            }
        })
    }

    sharedOneObject(target, type, callback)
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
