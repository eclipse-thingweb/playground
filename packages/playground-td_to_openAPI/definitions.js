function Server(url, description, variables) {
    if (url === undefined) {throw new Error("url for server object missing")}
    this.url = url
    if (description) {this.description = description}
    if (variables) {this.variables = variables}
}

function ExternalDocs(url, description) {
    if (url === undefined) {throw new Error("url for external docs object missing")}
    this.url = url
    if (description) {this.description = description}
}

module.exports = {Server, ExternalDocs}