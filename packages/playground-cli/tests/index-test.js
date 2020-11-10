const {exec, execFile} = require("child_process")

const processStack = {
    add: 
    function (command, comment) {
        this.stack.push(new Promise( (res, rej) => {
            const details = {
                myErr: "",
                myOut: "",
            }
            const spawnedProcess = exec(command, (err, thisOut, thisErr) => {
                if (err) {details.lastErr = err}
                details.myErr += thisErr
                details.myOut += thisOut
            })
            spawnedProcess.on("exit", statusCode => {
                res({statusCode, command, comment, details})
            })
        }))
    },
    evaluate:
    function () {
        Promise.all(this.stack).then( results => {
            console.log(results.map(result => ({
                passed: result.statusCode === 0 ? true : false,
                command: result.command,
                comment: result.comment
            })))

            const failed = []
            failed.push(...results.filter(result => result.statusCode !== 0))
            if (failed.length > 0) {
                failed.forEach( fail => {
                    console.error(JSON.stringify(fail, undefined, 4))
                })
                process.exit(1)
            }
        })
    },
    stack: []
}

processStack.add("echo 'asdf'", "myChildProcess")
processStack.add("node ./asdf.js", "made to fail")
processStack.add("node -v", "show version")

processStack.evaluate()