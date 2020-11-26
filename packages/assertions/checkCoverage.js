 /**
  * Outputs statistics about a given assertion report
  * @param {object} jsonResults assertion reports
  * @param {Function} logFunc function to log the stats
  */
 function checkCoverage(jsonResults, logFunc) {

    if (logFunc === undefined) {logFunc = console.log}

    let passCount = 0
    let failCount = 0
    let nullCount = 0
    let notImplCount = 0
    let totalCount = 0

    jsonResults.forEach(curResult => {
        if (curResult.Status === "fail") {
            failCount++
        }
        if (curResult.Status === "pass") {
            passCount++
        }
        if (curResult.Status === "null") {
            nullCount++
        }
        if (curResult.Status === "not-impl") {
            notImplCount++
        }
        totalCount++
    })

    logFunc("Failed Assertions:", failCount)
    logFunc("Not-Implemented Assertions:", notImplCount)
    logFunc("Not Tested Assertions:",nullCount)
    logFunc("Passed Assertions:",passCount)
    logFunc("Total Assertions",totalCount)
 }

 module.exports = checkCoverage