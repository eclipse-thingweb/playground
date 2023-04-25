/*
 *  Copyright (c) 2023 Contributors to the Eclipse Foundation
 *
 *  See the NOTICE file(s) distributed with this work for additional
 *  information regarding copyright ownership.
 *
 *  This program and the accompanying materials are made available under the
 *  terms of the Eclipse Public License v. 2.0 which is available at
 *  http://www.eclipse.org/legal/epl-2.0, or the W3C Software Notice and
 *  Document License (2015-05-13) which is available at
 *  https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document.
 *
 *  SPDX-License-Identifier: EPL-2.0 OR W3C-20150513
 */

// Dependencies
// const csvtojson = require('csvtojson') // V2
// const fs = require('fs')
// const Json2csvParser = require('json2csv').Parser
// const path = require('path')

// Parameters
// const debugV = false
// jsonResults = []
// Configuration
// const fields = ['ID', 'Status', 'Comment']
// const json2csvParser = new Json2csvParser({
//     fields
// })

// Get all results from files, store in an array of JSON objects
// (Asynchronous)
// function getResults(files, results, doneCallback) {
//     // handle boundary cases
//     if (undefined === files || 0 === files.length) {
//         doneCallback(results)
//     }
//     // process one file, tail-recurse if more
//     csvtojson().fromFile(files[0]).then(data => {
//         results.push(data)
//         if (1 === files.length) {
//             doneCallback(results)
//         } else {
//             getResults(files.slice(1), results, doneCallback)
//         }
//     })
// }

function mergeResults(results, doneCallback) {
    const mergedResults = new Map();
    for (let i = 0; i < results.length; i++) {
        const data = results[i];
        for (let j = 0; j < data.length; j++) {
            const id = data[j].ID;
            const st = data[j].Status;
            let cm = data[j].Comment;
            if (undefined === id) {
                console.error(new Error("Missing ID CSV header"));
                // Failure
                process.exit(1);
            }
            if (undefined === st) {
                console.error(new Error("Missing Status CSV header"));
                // Failure
                process.exit(1);
            }
            if (undefined === cm) {
                cm = "";
            }
            const current = mergedResults.get(id);

            if (undefined === current) {
                mergedResults.set(id, [st, cm]);
            } else {
                const currentSt = current[0];
                const currentCm = current[1];
                if ("fail" === st || "fail" === currentSt) {
                    // failure dominates anything else
                    mergedResults.set(id, ["fail", getComment(st, currentSt, "fail", cm, currentCm)]);
                } else if ("pass" === st || "pass" === currentSt) {
                    // pass dominates null, since someone could have tested it somewhere
                    mergedResults.set(id, ["pass", getComment(st, currentSt, "pass", cm, currentCm)]);
                } else if ("null" === st && "null" === currentSt) {
                    // null dominates not impl
                    mergedResults.set(id, ["null", getComment(st, currentSt, "null", cm, currentCm)]);
                } else {
                    // both must be not-impl, but may need to update comments
                    mergedResults.set(id, ["not-impl", getComment(st, currentSt, "not-impl", cm, currentCm)]);
                }
            }
        }
    }
    // iterate through to find the parent results
    const iterator1 = mergedResults[Symbol.iterator]();

    const parentsJson = {};

    for (const item of iterator1) {
        // find child, then
        // find parent
        // if child can overwrite parent, do that, otherwise keep going
        const curId = item[0];
        const underScoreLoc = curId.indexOf("_");
        if (underScoreLoc === -1) {
            // this is a parent or an assertion with no child so we dont care
        } else {
            // this is a child assertion
            const childResult = item[1][0];
            const parentID = curId.slice(0, underScoreLoc);
            if (parentsJson.hasOwnProperty(parentID)) {
                parentsJson[parentID].push(childResult);
            } else {
                parentsJson[parentID] = [];
                parentsJson[parentID].push(childResult);
            }
        }
        // console.log
        parentsJsonArray = Object.getOwnPropertyNames(parentsJson);
        parentsJsonArray.forEach((curParentId, indexParent) => {
            const curParent = parentsJson[curParentId];

            for (let index = 0; index < curParent.length; index++) {
                const curChildStatus = curParent[index];
                if (curChildStatus === "fail") {
                    // push fail and break, i.e stop going through children, we are done here!
                    mergedResults.set(curParentId, ["fail", "a child is failed"]);
                    break;
                } else if (curChildStatus === "not-impl") {
                    // push not-impl and break, i.e stop going through children, we are done here!
                    mergedResults.set(curParentId, ["not-impl", "a child is not implemented"]);
                    break;
                } else if (curChildStatus === "null") {
                    mergedResults.set(curParentId, ["null", "a child is not tested"]);
                    break;
                } else {
                    // if reached the end without break, push pass
                    if (index === curParent.length - 1) {
                        mergedResults.set(curParentId, ["pass", "all children passed"]);
                    }
                }
            }
        });
    }
    doneCallback(mergedResults);
}

function getComment(
    st, // status of just read input
    currentSt, // current status
    valueSt, // new status
    cm, // comment of just read input
    currentCm // current comment
) {
    let comment = "";
    if (currentCm && valueSt === currentSt) {
        comment = currentCm;
    }
    if (cm && valueSt === st) {
        if (comment && comment.indexOf(cm) < 0) {
            comment = comment + " + " + cm;
        } else {
            comment = cm;
        }
    }
    return comment;
}

// function outputResults(mergedResults) {
//     process.stdout.write('"ID","Status","Comment"\n')
//     // console.log(mergedResults);
//     // process.exit();
//     mergedResults.forEach((data, id) => {

//         process.stdout.write('"' + id + '","' + data[0] + '",\n')

//         jsonResults.push({
//             "ID": id,
//             "Status": data[0],
//             "Comment": data[1]
//         })
//     })

//     // sort
//     jsonResults.sort((a, b) => {
//         return (a.id < b.id) ? -1 : ((a.id > b.id) ? 1 : 0)
//     })

//     const csvResults = json2csvParser.parse(jsonResults)
//     fs.writeFile("./Results/mergedResults.csv", csvResults, function (err) {
//         if (err) {
//             return console.log(err)
//         }

//         console.warn("The merged result csv was saved!")
//         process.exit(0)
//     })
// }

function resultMerger(results) {
    return new Promise((res, rej) => {
        mergeResults(results, (mergedResults) => {
            const jsonMerged = [];
            mergedResults.forEach((data, id) => {
                // process.stdout.write('"' + id + '","' + data[0] + '",\n')
                jsonMerged.push({
                    ID: id,
                    Status: data[0],
                    Comment: data[1],
                });
            });

            // sort
            jsonMerged.sort((a, b) => {
                return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
            });

            res(jsonMerged);
        });
    });
}

module.exports = resultMerger;

// if (process.argv.length > 2) {
//     const files = process.argv.slice(2)
//     getResults(files, [], function (inputResults) {
//         if (debugV) console.warn("input results:\n", inputResults)
//         mergeResults(inputResults, function (mergedResults) {
//             if (debugV) console.warn("merged results:\n", mergedResults)
//             outputResults(mergedResults)
//             // Success
//         })
//     })
// } else {
//     // Usage
//     console.warn("Usage:", process.argv[0], process.argv[1], "file1.csv file2.csv ...")
//     console.warn("See testing/README.md and testing/results")
//     process.exit(1)
// }
