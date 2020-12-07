const {exec} = require("child_process")

/**
 * The testing processes stack object
 */
const processStack = {
    /**
     * Add a new test process
     * @param {string} command The command passed to `exec`
     * @param {string} comment Describe the test
     * @param {(sOut, sErr, lastErr?)=>boolean} cbTest Opt: Test executed after process execution
     */
    add (command, comment, cbTest) {
        this.stack.push(new Promise( (res, rej) => {
            const details = {
                sOut: "",
                sErr: ""
            }
            const spawnedProcess = exec(command, (err, thisOut, thisErr) => {
                if (err) {details.lastErr = err}
                details.sErr += thisErr
                details.sOut += thisOut
            })
            spawnedProcess.on("exit", statusCode => {
                res({statusCode, command, comment, details, cbTest})
            })
        }))
    },
    /**
     * Wait for all process executions currently in the stack to be finished,
     * then evaluate their results
     */
    evaluate () {
        Promise.all(this.stack).then( results => {
            results.forEach(result => {
                result.passed = result.cbTest !== undefined ?
                                result.cbTest(result.details.sOut, result.details.sErr, result.details.lastErr) :
                                "no-test"
                if (result.details.sErr !== "" || result.details.lastErr !== undefined) {
                    result.passed = false
                }
            })
            console.log(results.map(result => ({
                statusCodeOK: result.statusCode === 0 ? true : false,
                passed: result.passed,
                command: result.command,
                comment: result.comment
            })))

            // console.log(JSON.stringify(results, undefined, 4))

            const failed = []
            failed.push(...results.filter(result => (result.statusCode !== 0 || result.passed === false )))
            if (failed.length > 0) {
                failed.forEach( fail => {
                    console.error(JSON.stringify(fail, undefined, 4))
                })
                process.exit(1)
            }
        })
    },
    /**
     * Contains the stacked processes
     * @private Should not be accessed directly
     */
    stack: []
}

// TESTFLOW
processStack.add("node ./index.js", "normal validation", sOut => (
    sOut.search("Warning test succesful") !== -1 &&
    sOut.search("Invalidity test succesful") !== -1 &&
    sOut.search("Validity test succesful") !== -1
))
// processStack.add("node ./index.js -a", "normal assertions")
// processStack.add("node ./index.js -p", "normal openAPI generation")

processStack.evaluate()
