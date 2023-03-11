const jsonMap = require("json-source-map");

module.exports.configure = configure;
module.exports.checkTypos = checkTypos;

const REF = "$ref";
const PROPERTIES = "properties";
const PATTERN_PROPERTIES = "patternProperties";
const ADDITONAL_PROPERTIES = "additionalProperties";
const PATH = "#/";

let SCHEMA = require("./examples/schema/td-schema.json");
// Minimum similarity value to be able to say that two words are similar
let SIMILARITY_THRESHOLD = 0.85;
// Maximum value of length difference between two words
let MAX_LENGTH_DIFFERENCE = 2;
let TYPO_LOOKUP_TABLE = createSchemaLookupTable(SCHEMA);

/**
 * Configures the settings of the spell checker
 * @param {*} similarityThreshold Threshold that decides whether the words are similar or not.
 * @param {*} maxLengthDifference Maximum value of the length difference of words to run the algorithm
 */
function configure(
    schema = SCHEMA,
    similarityThreshold = SIMILARITY_THRESHOLD,
    maxLengthDifference = MAX_LENGTH_DIFFERENCE
) {
    SCHEMA = schema;
    TYPO_LOOKUP_TABLE = createSchemaLookupTable(SCHEMA);
    SIMILARITY_THRESHOLD = similarityThreshold;
    MAX_LENGTH_DIFFERENCE = maxLengthDifference;
}

/**
 * Checks possible typos in a stringified JSON
 * @param {object} json The JSON to apply typo check on
 * @returns List of possible typos where the typo consists of string value of typo itself and the message,
 * another string value, to be prompted to the user for the fix
 */
function checkTypos(json) {
    const typos = [];

    const lookupTable = TYPO_LOOKUP_TABLE;
    const searchDepth = 1;
    const searchPath = PATH;
    let parsedJson = {};

    try {
        parsedJson = JSON.parse(json);
    } catch (err) {
        return typos;
    }

    searchTypos(typos, parsedJson, lookupTable, searchDepth, searchPath, searchPath);

    const mappedJson = jsonMap.parse(json);
    const pointers = mappedJson.pointers;

    typos.forEach((typo) => {
        const pointer = pointers[typo.path.substr(1, typo.path.length - 2)];

        if (pointer) {
            // Every pointer get plus 1 because indexes start from 0
            typo.startLineNumber = pointer.key.line + 1;
            typo.endLineNumber = pointer.keyEnd.line + 1;
            typo.startColumn = pointer.key.column + 1 + 1;
            typo.endColumn = pointer.keyEnd.column + 1 - 1;
        }
    });

    return typos;
}

/**
 * Searching typos on a specific path and depth
 * @param {Array} typos The list that typo objects are stored
 * @param {object} json The JSON to apply typo check on
 * @param {Map} lookupTable The map that stores paths and their available word list according to their path depth
 * @param {integer} searchDepth The integer that decides the depth of the typo check search
 * @param {string} searchPath The string that decided the path of the typo check search
 */
function searchTypos(typos, json, lookupTable, searchDepth, searchPath, realPath) {
    if (typeof json !== "object") {
        return;
    }

    for (const key in json) {
        const pathMap = lookupTable.get(searchDepth);
        const wordSet = pathMap.get(searchPath);

        if (!wordSet) {
            if (!searchPath.endsWith("*/")) {
                searchTypos(typos, json[key], lookupTable, searchDepth + 1, searchPath + "*/", realPath + `${key}/`);
                continue;
            } else {
                continue;
            }
        }

        if (json.hasOwnProperty(key)) {
            searchTypos(typos, json[key], lookupTable, searchDepth + 1, searchPath + `${key}/`, realPath + `${key}/`);

            if (!wordSet || wordSet.has(key)) {
                continue;
            }

            wordSet.forEach((word) => {
                if (doesTypoExist(key, word)) {
                    typos.push({
                        path: `${realPath}${key}/`,
                        word: key,
                        desiredWord: word,
                        message: `Did you mean ${word}?`,
                    });

                    return;
                }
            });
        }
    }
}

/**
 * Creates a lookup table using JSON schema
 * @param {object} jsonSchema JSON Schema to create a lookup table from
 * @returns The map that constructs lookup table for typo check using JSON Schema
 */
function createSchemaLookupTable(jsonSchema) {
    const lookupTable = new Map();
    const filteredLookupTable = new Map();

    findPathsInSchema(jsonSchema, PATH, "", lookupTable);

    lookupTable.forEach((value, key) => {
        if (value.size > 0) {
            const pathDepth = (key.match(/\//gi) || []).length;

            let pathDepthMap = filteredLookupTable.get(pathDepth);

            if (pathDepthMap) {
                pathDepthMap.set(key.replace(/^r/g, ""), value);
                filteredLookupTable.set(pathDepth, pathDepthMap);
            } else {
                pathDepthMap = new Map();
                pathDepthMap.set(key.replace(/^r/g, ""), value);
                filteredLookupTable.set(pathDepth, pathDepthMap);
            }
        }
    });

    return filteredLookupTable;
}

/**
 * Finds the paths under a parent path by parsing schema and adds them to a lookup table
 * @param {object} schema The schema to find the paths from
 * @param {string} path The parent path that search is going under
 * @param {string} references All of the reference paths used
 * @param {Map} lookupTable The map that stores the paths in the schema
 */
function findPathsInSchema(schema, path, references, lookupTable) {
    const keys = new Set();

    if (schema[REF]) {
        if (path[0] === "r" && references.includes(schema[REF])) {
            return;
        }

        if (references.includes(schema[REF])) {
            // Add 'r'  to the path, so in future we could check for recursive ref paths
            path = "r" + path;
        }

        findPathsInSchema(getRefObjectOfSchema(SCHEMA, schema[REF]), path, references + `${schema[REF]},`, lookupTable);
    }

    if (schema.type === "object") {
        const properties = schema[PROPERTIES];
        for (const key in properties) {
            if (properties.hasOwnProperty(key)) {
                if (key === REF) {
                    if (path[0] === "r" && references.includes(properties[key])) {
                        continue;
                    }

                    if (references.includes(properties[key])) {
                        // Add 'r'  to the path, so in future we could check for recursive ref paths
                        path = "r" + path;
                    }

                    findPathsInSchema(
                        getRefObjectOfSchema(SCHEMA, properties[key]),
                        path,
                        references + `${properties[key]},`,
                        lookupTable
                    );
                } else {
                    findPathsInSchema(properties[key], `${path}${key}/`, references, lookupTable);
                    keys.add(key);
                }
            }
        }

        const additionalProperties = schema[ADDITONAL_PROPERTIES];
        for (const key in additionalProperties) {
            if (additionalProperties.hasOwnProperty(key)) {
                if (key === REF) {
                    if (path[0] === "r" && references.includes(additionalProperties[key])) {
                        continue;
                    }

                    if (references.includes(additionalProperties[key])) {
                        path = "r" + path;
                    }

                    findPathsInSchema(
                        getRefObjectOfSchema(SCHEMA, additionalProperties[key]),
                        `${path}*/`,
                        references + `${additionalProperties[key]},`,
                        lookupTable
                    );
                }
            }
        }

        const patternProperties = schema[PATTERN_PROPERTIES];
        for (const key in patternProperties) {
            if (patternProperties.hasOwnProperty(key)) {
                if (key === REF) {
                    if (path[0] === "r" && references.includes(patternProperties[key])) {
                        continue;
                    }

                    if (references.includes(patternProperties[key])) {
                        // Add 'r'  to the path, so in future we could check for recursive ref paths
                        path = "r" + path;
                    }

                    findPathsInSchema(
                        getRefObjectOfSchema(SCHEMA, patternProperties[key]),
                        `${path}*/`,
                        references + `${patternProperties[key]},`,
                        lookupTable
                    );
                } else {
                    findPathsInSchema(patternProperties[key], `${path}*/`, references, lookupTable);
                }
            }
        }

        putKeysToPath(lookupTable, path, keys);
    }

    if (schema.type === "array") {
        const items = schema.items;

        for (const item in items) {
            if (items.hasOwnProperty(item)) {
                if (item === REF) {
                    if (path[0] === "r" && references.includes(items[item])) {
                        continue;
                    }

                    if (references.includes(items[item])) {
                        // Add 'r'  to the path, so in future we could check for recursive ref paths
                        path = "r" + path;
                    }

                    findPathsInSchema(
                        getRefObjectOfSchema(SCHEMA, items[item]),
                        `${path}*/`,
                        references + `${items[item]},`,
                        lookupTable
                    );
                }
            }
        }

        putKeysToPath(lookupTable, path, keys);
    }

    for (const key in schema) {
        if (schema.hasOwnProperty(key)) {
            if (["allOf", "oneOf", "anyOf"].includes(key)) {
                if (Array.isArray(schema[key])) {
                    schema[key].forEach((element) => {
                        findPathsInSchema(element, path, references, lookupTable);
                    });
                }
            }
        }
    }
}

/**
 * Stores the keys under a specific path
 * @param {Map} lookupTable The map that stores the paths in the schema
 * @param {string} path The path that is owner of the current keys
 * @param {Set} keys The set of keys that is going to be put
 */
function putKeysToPath(lookupTable, path, keys) {
    pathKeys = lookupTable.get(path);

    if (pathKeys) {
        const union = new Set(pathKeys);
        keys.forEach((k) => {
            union.add(k);
        });

        lookupTable.set(path, union);
    } else {
        lookupTable.set(path, keys);
    }
}

/**
 * Gets the reference object in the schema
 * @param {object} schema The object that represent the schema
 * @param {string} ref The reference value in the schema
 * @returns The reference object the ref maps to
 */
function getRefObjectOfSchema(schema, ref) {
    const splitRef = ref.split("/");
    if (splitRef[0] !== "#") {
        console.log("Parsing not implemented for between files");
        return;
    }

    let result = schema;

    for (let i = 1; i < splitRef.length; i++) {
        result = result[splitRef[i]];
    }

    return result;
}

/**
 * Checks whether typo exists or not by comparing similarity of the two words
 * @param {string} actual The property name of the JSON entered by user
 * @param {string} desired The desired property name that is retrieved from JSON Schema
 * @returns Boolean value that tell whether typo exists or not
 */
function doesTypoExist(actual, desired) {
    if (Math.abs(actual.length - desired.length) > MAX_LENGTH_DIFFERENCE) {
        return false;
    }

    const similarity = calculateSimilarity(actual, desired);
    return similarity > SIMILARITY_THRESHOLD && similarity !== 1.0;
}

/**
 * Similarity of words calculated using Jaro-Winkler algorithm
 * @param {string} actual The property name of the JSON entered by user
 * @param {string} desired The desired propert name that is retrieved from JSON Schema
 * @returns Similarity of value the two inputs
 */
function calculateSimilarity(actual, desired) {
    let m = 0;

    if (actual.length === 0 || desired.length === 0) {
        return 0;
    }

    if (actual === desired) {
        return 1;
    }

    const range = Math.floor(Math.max(actual.length, desired.length) / 2) - 1;
    const actualMatches = new Array(actual.length);
    const desiredMatches = new Array(desired.length);

    // check lower and upper bounds to find the matches
    for (let i = 0; i < actual.length; i++) {
        const lowerBound = i >= range ? i - range : 0;
        const upperBound = i + range <= desired.length ? i + range : desired.length - 1;

        for (let j = lowerBound; j <= upperBound; j++) {
            if (actualMatches[i] !== true && desiredMatches[j] !== true && actual[i] === desired[j]) {
                m++;
                actualMatches[i] = desiredMatches[j] = true;
                break;
            }
        }
    }

    if (m === 0) {
        return 0;
    }

    let k = 0;
    let transpositionCount = 0;

    // count transpositions
    for (let i = 0; i < actual.length; i++) {
        if (actualMatches[i] === true) {
            let j = 0;
            for (j = k; j < desired.length; j++) {
                if (desiredMatches[j] === true) {
                    k = j + 1;
                    break;
                }
            }

            if (actual[i] !== desired[j]) {
                transpositionCount++;
            }
        }
    }

    let similarity = (m / actual.length + m / desired.length + (m - transpositionCount / 2) / m) / 3;
    let l = 0;
    const p = 0.1;

    // strengthen the similarity if the words start with same letters
    if (similarity < 0.7) {
        while (actual[l] === desired[l] && l < 4) {
            l++;
        }

        similarity += l * p * (1 - similarity);
    }

    return similarity;
}
