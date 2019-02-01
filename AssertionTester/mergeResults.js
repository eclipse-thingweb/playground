/* Merge test results.
 * Read from all assertion test results CSV files given on the
 * command line, send a merged file to stdout.  Merged files
 * are also sorted by ID.
 *
 * For file format and usage, see testing/README.md and testing/results.
 *
 * Results mentioned in only one input will be output as-is. 
 * Results for the same assertion mentioned in more
 * than one file with different statuses will be combined 
 * as follows (order of inputs does not matter):
 *   {pass, fail} -> fail
 *   {not-impl, fail} -> fail
 *   {not-impl, pass} -> pass 
 * In other words, one failure in any test means the entire
 * result is considered a failure.  Passes also dominate
 * not-implemented statuses.
 *
 * The purpose of this script is to combine results
 * for a single implementation (eg from different test runs
 * or for different test cases) so each implementation is
 * counted only once in the implementation report.
 * Each file in testing/results is considered to be
 * for a separate implementation so results for such
 * multiple internal tests should be combined into a single
 * file before generating the implementation report.
 * 
 * Comments in the input will be concatenated in the output.
 */

// Dependencies
const csvtojson = require('csvtojson'); // V2
const fs = require('fs');
const Json2csvParser = require('json2csv').Parser;
const path = require('path')

// Parameters
const debug_v = false;
json_results = [];
// Configuration
const fields = ['ID', 'Status', 'additionalInfo'];
const json2csvParser = new Json2csvParser({
    fields
});

// Get all results from files, store in an array of JSON objects
// (Asynchronous)
function get_results(files, results, done_callback) {
    // handle boundary cases
    if (undefined === files || 0 == files.length) {
        done_callback(results);
    }
    // process one file, tail-recurse if more
    csvtojson().fromFile(files[0]).then((data) => {
        results.push(data);
        if (1 == files.length) {
            done_callback(results);
        } else {
            get_results(files.slice(1), results, done_callback);
        }
    });
}

function merge_results(results, done_callback) {
    let merged_results = new Map();
    for (let i = 0; i < results.length; i++) {
        let data = results[i];
        for (let j = 0; j < data.length; j++) {
            let id = data[j]["ID"];
            let st = data[j]["Status"];
            let cm = data[j]["Comment"];
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
            let current = merged_results.get(id);

            if (undefined === current) {
                merged_results.set(id, [st, cm]);
            } else {
                let current_st = current[0];
                let current_cm = current[1];
                if ("fail" === st || "fail" === current_st) {
                    // failure dominates anything else
                    merged_results.set(id, ["fail", get_comment(st, current_st, "fail", cm, current_cm)]);

                } else if ("pass" === st || "pass" === current_st) {
                    // pass dominates null, since someone could have tested it somewhere
                    merged_results.set(id, ["pass", get_comment(st, current_st, "pass", cm, current_cm)]);

                } else if (("null" === st && "null" === current_st)) {
                    // null dominates not impl
                    merged_results.set(id, ["null", get_comment(st, current_st, "null", cm, current_cm)]);
                } else {
                    // both must be not-impl, but may need to update comments
                    merged_results.set(id, ["not-impl", get_comment(st, current_st, "not-impl", cm, current_cm)]);
                }
            }
        }
    }
    //iterate through to find the parent results
    var iterator1 = merged_results[Symbol.iterator]();

    var parentsJson = {};

    for (let item of iterator1) {
        //find child, then
        //find parent
        // if child can overwrite parent, do that, otherwise keep going
        var curId = item[0];
        var underScoreLoc = curId.indexOf('_');
        if (underScoreLoc === -1) {
            //this is a parent or an assertion with no child so we dont care
        }
        else {
            // this is a child assertion
            var childResult = item[1][0];
            var parentID = curId.slice(0, underScoreLoc);
            if (parentsJson.hasOwnProperty(parentID)) {
                parentsJson[parentID].push(childResult);
            } else {
                parentsJson[parentID] = [];
                parentsJson[parentID].push(childResult);
            }
        }
        console.log
        parentsJsonArray = Object.getOwnPropertyNames(parentsJson);
        parentsJsonArray.forEach((curParentId, indexParent) => {

            var curParent = parentsJson[curParentId];
            
            for (let index = 0; index < curParent.length; index++) {
                const curChildStatus = curParent[index];
                if (curChildStatus == "fail") {
                    //push fail and break, i.e stop going through children, we are done here!
                    merged_results.set(curParentId, ["fail", "a child is failed"]);
                    break;
                } else if (curChildStatus == "not-impl") {
                    //push not-impl and break, i.e stop going through children, we are done here!
                    merged_results.set(curParentId, ["not-impl", "a child is not implemented"]);
                    break;
                } else if (curChildStatus == "null"){
                    merged_results.set(curParentId, ["null", "a child is not tested"]);
                    break;
                } else {
                    // if reached the end without break, push pass
                    if (index == curParent.length - 1) {
                        merged_results.set(curParentId, ["pass", "all children passed"]);
                    }
                }
            }
        });
        
    }
    done_callback(merged_results);
}

function get_comment(
    st, // status of just read input
    current_st, // current status
    value_st, // new status
    cm, // comment of just read input
    current_cm // current comment
) {
    let comment = "";
    if ((current_cm) && (value_st === current_st)) {
        comment = current_cm;
    }
    if ((cm) && (value_st === st)) {
        if ((comment) && (comment.indexOf(cm) < 0)) {
            comment = comment + " + " + cm;
        } else {
            comment = cm;
        }
    }
    return comment;
}

function output_results(merged_results) {
    process.stdout.write('"ID","Status","Comment"\n');
    // console.log(merged_results);
    // process.exit();
    merged_results.forEach((data, id) => {

        process.stdout.write('"' + id + '","' + data[0] + '",\n');

        json_results.push({
            "ID": id,
            "Status": data[0],
            "additionalInfo":data[1]
        });
    });

    // sort
    json_results.sort((a,b) => {
      return (a.id < b.id) ? -1 : ((a.id > b.id) ? 1 : 0);
    });

    var csvResults = json2csvParser.parse(json_results);
    fs.writeFile("./Results/mergedResults.csv", csvResults, function (err) {
        if (err) {
            return console.log(err);
        }

        console.warn("The merged result csv was saved!");
        process.exit(0);
    });
}

if (process.argv.length > 2) {
    let files = process.argv.slice(2);
    get_results(files, [], function (input_results) {
        if (debug_v) console.warn("input results:\n", input_results);
        merge_results(input_results, function (merged_results) {
            if (debug_v) console.warn("merged results:\n", merged_results);
            output_results(merged_results);
            // Success
        });
    });
} 
/*
else if (process.argv.length == 3) {
    var loc = process.argv[2];

    //filtering function, will return only csv files
    const isCsv = fileName => {
        if (fileName.indexOf(".csv") > 1) {
            return true;
        } else {
            return false;
        }
    }

    // checking whether it is a directory
    try {
        var files = fs.readdirSync(loc).map(fileName => {
            return path.join(loc, fileName)
        }).filter(isCsv);
    } catch (error) {
        console.log(loc, " is not a directory, either put a directory or multiple result files as arguments");
        process.exit();
    }

    get_results(files, [], function (results) {
        if (debug_v) console.warn("input results:\n", input_results);
        merge_results(results, function (merged_results) {
            if (debug_v) console.warn("merged results:\n", merged_results);
            output_results(merged_results);
            // Success
        });

    });
} 
*/
else {
    // Usage
    console.warn("Usage:", process.argv[0], process.argv[1], "file1.csv file2.csv ...");
    console.warn("See testing/README.md and testing/results");
    process.exit(1);
}
