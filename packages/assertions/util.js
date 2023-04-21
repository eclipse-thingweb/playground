/* 
 *   Copyright (c) 2023 Contributors to the Eclipse Foundation
 *   
 *   See the NOTICE file(s) distributed with this work for additional
 *   information regarding copyright ownership.
 *   
 *   This program and the accompanying materials are made available under the
 *   terms of the Eclipse Public License v. 2.0 which is available at
 *   http://www.eclipse.org/legal/epl-2.0, or the W3C Software Notice and
 *   Document License (2015-05-13) which is available at
 *   https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document.
 *   
 *   SPDX-License-Identifier: EPL-2.0 OR W3C-20150513
 */

// The usual library used for validation

const Ajv = require("ajv");
const addFormats = require("ajv-formats");
const apply = require("ajv-formats-draft2019");

module.exports = {
    validate,
    createParents,
    mergeIdenticalResults,
};

/**
 * validates the any jsonData in the first argument according to a schema given in the second argument
 * return is a JSON array of result JSON objects
 * if there is a throw, it gives the failed assertion id
 * @param {Buffer} jsonData Buffer of the TD data, has to be utf8 encoded (e.g. by fs.readFileSync(file.json) )
 * @param {object} schema An array containing all assertion objects (already parsed)
 * @param {function} logFunc Logging function
 * @returns {{valid: boolean, ajvObject: object}} true if validation passes, else false
 */
function validate(jsonData, schema, logFunc) {
    // Validation starts here

    const ajvOptions = {
        allErrors: true,
        strict: false,
    };
    let ajv = new Ajv(ajvOptions);
    ajv = addFormats(ajv); // ajv does not support formats by default anymore
    ajv = apply(ajv); // new formats that include iri
    ajv.addSchema(schema, "assertion");
    ajv.addVocabulary(["is-complex", "also"]);

    return { valid: ajv.validate("assertion", jsonData), ajvObject: ajv };
}

/**
 * first generate a list of results that appear more than once
 * it should be a JSON object, keys are the assertion ids and the value is an array
 * while putting these results, remove them from the results FIRST
 * then for each key, find the resulting result:
 * if one fail total fail, if one pass and no fail then pass, otherwise not-impl
 *
 * @param {Array<object>} results Current results array
 */
function mergeIdenticalResults(results) {
    const identicalResults = {};
    results.forEach((curResult, index) => {
        const curId = curResult.ID;

        // remove this one, but add it back if there is no duplicate
        results.splice(index, 1);
        // check if there is a second one
        const identicalIndex = results.findIndex((x) => x.ID === curId);

        if (identicalIndex > 0) {
            // there is a second one

            // check if it already exists
            if (identicalResults.hasOwnProperty(curId)) {
                // push if it already exists
                identicalResults[curId].push(curResult.Status);
            } else {
                // create a new array with values if it does not exist
                identicalResults[curId] = [curResult.Status];
            }
            // put it back such that the last identical can find its duplicate that appeared before
            results.unshift(curResult);
        } else {
            // if there is no duplicate, put it back into results but at the beginning
            results.unshift(curResult);
        }
    });

    // get the keys to iterate through
    const identicalKeys = Object.keys(identicalResults);

    // iterate through each duplicate, calculate the new result, set the new result and then remove the duplicates
    identicalKeys.forEach((curKey) => {
        const curResults = identicalResults[curKey];
        let newResult;

        if (curResults.indexOf("fail") >= 0) {
            newResult = "fail";
        } else if (curResults.indexOf("pass") >= 0) {
            newResult = "pass";
        } else {
            newResult = "not-impl";
        }
        // delete each of the duplicate
        while (results.findIndex((x) => x.ID === curKey) >= 0) {
            results.splice(
                results.findIndex((x) => x.ID === curKey),
                1
            );
        }

        // push back the new result
        results.push({
            ID: curKey,
            Status: newResult,
            Comment: "result of a merge",
        });
    });
    return results;
}

/**
 * create a json object with parent name keys and then each of them an array of children results
 *
 * @param {Array<object>} results Current results array
 */
function createParents(results) {
    const parentsJson = {};
    results.forEach((curResult, index) => {
        const curId = curResult.ID;
        const underScoreLoc = curId.indexOf("_");
        if (underScoreLoc === -1) {
            // this assertion is not a child assertion
        } else {
            const parentResultID = curId.slice(0, underScoreLoc);
            // if it already exists push otherwise create an array and push
            if (parentsJson.hasOwnProperty(parentResultID)) {
                parentsJson[parentResultID].push(curResult);
            } else {
                parentsJson[parentResultID] = [];
                parentsJson[parentResultID].push(curResult);
            }
        }
    });

    /*
        Go through the object and push a result that is an OR of each children
        if one children is fail, result is fail
        if one children is not-impl, result is not-impl
        if none of these happen, then it implies it is pass, so result is pass
        "ID": schema.title,
        "Status": "not-impl"
    */

    parentsJsonArray = Object.getOwnPropertyNames(parentsJson);
    parentsJsonArray.forEach((curParentName, indexParent) => {
        const curParent = parentsJson[curParentName];

        for (let index = 0; index < curParent.length; index++) {
            const curChild = curParent[index];
            if (curChild.Status === "fail") {
                // push fail and break, i.e stop going through children, we are done here!
                results.push({
                    ID: curParentName,
                    Status: "fail",
                    Comment: "Error message can be seen in the children assertions",
                });
                break;
            } else if (curChild.Status === "not-impl") {
                // push not-impl and break, i.e stop going through children, we are done here!
                results.push({
                    ID: curParentName,
                    Status: "not-impl",
                    Comment: "Error message can be seen in the children assertions",
                });
                break;
            } else {
                // if reached the end without break, push pass
                if (index === curParent.length - 1) {
                    results.push({
                        ID: curParentName,
                        Status: "pass",
                    });
                }
            }
        }
    });
    return results;
}
