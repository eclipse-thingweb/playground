/**
 * An openAPI Server object
 * @param {string} url e.g. "https://example.com"
 * @param {string} description information about the server, e.g. "production"
 * @param {object} variables url template variables as string:object map
 */
function Server(url, description, variables) {
    if (url === undefined) {
        throw new Error("url for server object missing");
    }
    this.url = url;
    if (description) {
        this.description = description;
    }
    if (variables) {
        this.variables = variables;
    }
}

/**
 * An openAPI ExternalDocs object
 * @param {string} url  e.g. "https://example.com/docs/iot"
 * @param {string} description e.g. "An explanation of the Internet of Things"
 */
function ExternalDocs(url, description) {
    if (url === undefined) {
        throw new Error("url for external docs object missing");
    }
    this.url = url;
    if (description) {
        this.description = description;
    }
}

module.exports = { Server, ExternalDocs };
