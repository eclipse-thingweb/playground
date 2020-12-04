const express = require("express")
const fetch = require("node-fetch")
const fs = require("fs")
const { port, keepLogMessages, allowHosts, login, token } = require("./config")

const app = express()
const logs = fs.existsSync("./logs.json") ? JSON.parse(fs.readFileSync("./logs.json", "utf-8")) : []

if (login === undefined || token === undefined) {
    console.error("Environment variable TD_PLAYGROUND_LOGIN or TD_PLAYGROUND_TOKEN undefined!")
    process.exit(1)
}

app.use(express.json())
app.use((req, res, next) => {
    console.log(req.headers.origin)
    if (allowHosts.some( allowName => (allowName === req.headers.origin))) {
        res.header("Access-Control-Allow-Origin", req.headers.origin)
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
    }

    next()
})

/**
 * Reaction on POST requests to the API.
 */
app.post("/", (req, res) => {

    console.log("answering request...")

    if (checkInput(req.body) === true) {
        postGist(req.body).then( reply => {
            res.statusCode = 201 /* Created */
            console.log("... with Status: " + res.statusCode)
            res.setHeader("location", reply.location)
            res.json(reply)
        }, errors => {
            logProb(req.body, errors + ", return Status 502")
            res.statusCode = 502 /* Bad Gateway */
            console.log("... with Status: " + res.statusCode)
            res.json({errors})
        })
    }
    else {
        logProb(req.body, checkInput(req.body) + ", return Status 400")
        res.statusCode = 400 /* Bad Request */
        console.log("... with Status: " + res.statusCode)
        res.json({errors: checkInput(req.body)})
    }
})

const myServer = app.listen(port, "127.0.0.1", () => {
    console.log("Server started on Port ", port)
    // console.log(app)
    // console.log(myServer)
})

/**
 * Logs problems to a json file
 * @param {object} request The received json body
 * @param {string} errors The thrown error message
 */
function logProb(request, errors) {
    const date = new Date()
    const length = logs.unshift({
        time: "" + date.toISOString(),
        errors,
        request
    })
    if(length > keepLogMessages) { logs.pop()}
    fs.writeFileSync("logs.json", JSON.stringify(logs, undefined, 4), "utf8")
}

/**
 * Checks if all received JSON values are of type string, as expected
 * @param {string} name The received gist name
 * @param {string} description The received gist description
 * @param {string} content The received gist content
 */
function checkInput({name, description, content}) {
    let retVal = ""

    if (typeof name !== "string") {retVal += "submitted 'name' is not type string but " + (typeof name) + "\n"}
    if (typeof description !== "string") {retVal += "submitted 'description' is not type string but " + (typeof content) + "\n"}
    if (typeof content !== "string") {retVal += "submitted 'name' is not type string but " + (typeof content) + "\n"}

    if (retVal === "") {
        return true
    }
    else {
        return retVal
    }
}

/**
 * Makes the POST request to submit the gist at GitHubs API
 * Returns a promise, which is resolved if the gist was created
 * and rejected in case of any error
 * @param {string} name The name of the gist to submit
 * @param {string} description The description of the gist to submit
 * @param {string} content The TD of the gist to submit
 * @returns {Promise<{htmlUrl: string, location: string}>} The properties of the generated gist
 */
function postGist({name, description, content}){
    return new Promise( (res, rej) => {

        const data= {
            description,
            public: true,
            files: {
                [name + ".json"]: {
                    content
                }
            }
        }

        const submitUrl = "https://api.github.com/gists"

        const headers = {
            Authorization: "Basic " + Buffer.from(login + ":" + token).toString("base64"),
            "Content-Type": "application/json",
            Accept: "application/vnd.github.v3+json"
        }
        fetch(submitUrl, {
            method: "POST",
            headers,
            body: JSON.stringify(data)
        }).then( reply => {
            if (reply.status === 201) {
                reply.json()
                .then(json => {
                    res({htmlUrl: json.html_url, location: json.url})
                }, err => {
                    rej("The gist reply could not be turned into JSON: " + err)
                })
            } else {
                rej("The gist could not be created by GitHub: " + reply.status + " " + reply.statusText)
            }
        }, err => {rej(new Error("Gist request at GitHub failed: " + err))})
    })
}
