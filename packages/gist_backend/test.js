/**
 * @file launches the gist submission backend
 *       waits until the server is ready and
 *       throws an error if there is a problem
 *       starting the backend
 *       (this test does not require credentials
 *        just empty env-Vars, for the server not
 *        to fail)
 */

const {spawn} = require("child_process")

// start server and handle process events
const startedServer = spawn("node", ["server.js"])
startedServer.stdout.on("data", sOut => {
    console.log("stdout: " + sOut)
})
startedServer.stderr.on("data", sErr => {
    if (sErr !== "") {
        console.error("stderr: " + sErr)
        process.exit(1)
    }
})
startedServer.on("error", err => {
    console.error("failed to start server: ", err)
    process.exit(1)
})
startedServer.on("close", code => {
    if (code !== null) {
        console.error("Server exited with code: " + code)
        process.exit(1)
    }
    else {
        console.log("Server shutdown was fine")
    }
})

// wait until server is up and running, then shut it back down
setTimeout(()=>{startedServer.kill()}, 3000)
