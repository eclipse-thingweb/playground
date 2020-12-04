/* check if the server starts without error message and then shut it down after 3s */

const {spawn} = require("child_process")
const { port, login, token } = require("./config")
const fetch = require("node-fetch")

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

// Make the gist submission request
fetch("http://localhost:" + port, {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        name: "CI gist_backend test 2",
        description: "An TD submitted to test if the backend works, should be removed soon...",
        content: "{\n  \"id\": \"test:test:test\"\n}"
    })
}).then( reply => {
    if (reply.status === 201) {
        reply.json()
        .then(json => {
            // res({htmlUrl: json.html_url, location: json.url})
            console.log("Gist submission successful! starting delete")
            console.log(json)
            startedServer.kill()
            deleteGist(json.location)
        }, err => {
            console.error("The gist reply could not be turned into JSON: " + err)
            process.exit(1)
        })
    } else {
        console.error("The gist could not be created by GitHub: " + reply.status + " " + reply.statusText)
        process.exit(1)
    }
}, err => {
    console.error("Gist request at GitHub failed: " + err)
    process.exit(1)
})

function deleteGist(gistLocation) {
    fetch(gistLocation, {
        method: "DELETE",
        headers: {
            Authorization: "Basic " + Buffer.from(login + ":" + token).toString("base64")
        }
    }).then( reply => {
        if (reply.status === 204) {
            console.log("gist deletion worked")
        }
        else {
            console.error("There has been a problem deleting the gist:" + reply.status + " " + reply.statusText)
            process.exit(1)
        }
    }, err => {
        console.error("The gist delete request at GitHub failed: " + err)
        process.exit(1)
    })
}
