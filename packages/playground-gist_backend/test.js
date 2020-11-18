/* check if the server starts without error message and then shut it down after 3s */

const {spawn} = require("child_process")

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

setTimeout( () => {
    startedServer.kill()
}, 3000)
