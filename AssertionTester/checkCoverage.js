// Dependencies
const csvtojson = require('csvtojson'); // V2
const fs = require('fs');
const Json2csvParser = require('json2csv').Parser;

// Parameters
json_results = [];
// Configuration
const fields = ['ID', 'Status', 'Comment'];
const json2csvParser = new Json2csvParser({
    fields
});

// Variables
var passCount =0;
var failCount =0;
var nullCount =0;
var notImplCount =0;
var totalCount =0;

if (process.argv[2]) {
    //console.log("there is second arg");
    if (typeof process.argv[2] === "string") {
        console.log("Taking results", process.argv[2]);
        var secondArgument = process.argv[2];
    } else {
        console.error("Second argument should be string");
        throw "Argument error";
    }
} else {
    console.error("There is NO second argument, put the location of the csv results file");
    process.exit();
}

var mergedResults = fs.readFileSync(secondArgument);
// console.log(mergedResults)
    // process one file, tail-recurse if more
    csvtojson().fromFile(secondArgument).then((data) => {
        json_results=data;
    }).then(()=>{
        json_results.forEach(curResult => {
            if (curResult.Status == "fail") {
                failCount++;
            }
            if (curResult.Status == "pass") {
                passCount++;
            }
            if (curResult.Status == "null") {
                nullCount++;
            }
            if (curResult.Status == "not-impl") {
                notImplCount++;
            }
            totalCount++;
        });

        
        
        console.log("Failed Assertions:", failCount);
        console.log("Not-Implemented Assertions:", notImplCount);
        console.log("Not Tested Assertions:",nullCount);
        console.log("Passed Assertions:",passCount);
        console.log("Total Assertions",totalCount);


    })
