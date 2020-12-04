const availablePorts = {
    production: 8082,
    test: 3000
}
const port = availablePorts.test
const keepLogMessages = 100
const allowHosts = ["http://127.0.0.1:5500", "http://localhost:5500", "http://plugfest.thingweb.io"]
const login = process.env.TD_PLAYGROUND_LOGIN
const token = process.env.TD_PLAYGROUND_TOKEN

module.exports = { port, keepLogMessages, allowHosts, login, token }
