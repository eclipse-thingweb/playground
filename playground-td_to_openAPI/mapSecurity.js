/* security and security Definitions are mandatory in a TD but conversion
 * should also work for invalid TDs (e.g. to test future improvements), prototypes
 * thus they are just not converted if not given/other format
 */

module.exports = {mapSecurityString, mapSecurityDefinitions}

function mapSecurityString(tdSecurity, tdScopes) {
    const oapSecurity = {}
    const oapSecurityContainer = []
    if (typeof tdSecurity === "string") {tdSecurity = [tdSecurity]}

    if (typeof tdSecurity === "object") {
        tdSecurity.forEach( tdSecurityKey => {
            oapSecurity[tdSecurityKey] = [] // TODO: get scopes for oauth2 or openIdConnect ?
        })
    }

    if (Object.keys(oapSecurity).length > 0) {
        oapSecurityContainer.push(oapSecurity)
    }

    return oapSecurityContainer
}

function mapSecurityDefinitions(tdDefinitions) {
    const oapDefinitions = {}

    if (typeof tdDefinitions === "object") {
        Object.keys(tdDefinitions).forEach( key => {
            if (typeof tdDefinitions[key].scheme === "string") {
                const newDefinition = genOapDefinition(tdDefinitions[key])
                if(Object.keys(newDefinition).length > 0) {
                    oapDefinitions[key] = newDefinition
                }
            }
        })
    }

    return oapDefinitions
}

function genOapDefinition(tdDefinition) {
    const oapDefinition = {}
    const tdScheme = tdDefinition.scheme.toLowerCase()
    let addOptionals = true

    if (tdScheme === "nosec") {
        // do nothing?
    }
    else if (tdScheme === "basic") {
        oapDefinition.type = "http"
        oapDefinition.scheme = "Basic"
        if (tdDefinition.in && tdDefinition.in !== "header") {
            throw new Error("Cannot represent Basic authentication outside the header in openAPI")
        }
    }
    else if (tdScheme === "digest") {
        oapDefinition.type = "http"
        oapDefinition.scheme = "Digest"
        if (tdDefinition.qop) {
            oapDefinition["x-qop"] = tdDefinition.qop
        }
        if (tdDefinition.in && tdDefinition.in !== "header") {
            throw new Error("Cannot represent Basic authentication outside the header in openAPI")
        }
    }
    else if (tdScheme === "apikey") {
        oapDefinition.type = "apiKey"
        oapDefinition.in = (tdDefinition.in === undefined) ? "query" : tdDefinition.in
        oapDefinition.name = (tdDefinition.name === undefined) ? "UNKNOWN" : tdDefinition.name
        if (oapDefinition.in === "body") {throw new Error("Cannot represent ApiKey in `body` with openAPI")}
    }
    else {
        console.log("unknown security definition: " + tdScheme)
        addOptionals = false
    }

    // add optional fields
    if (addOptionals) {
        if (tdDefinition.description) {oapDefinition.description = tdDefinition.description}
        if (tdDefinition.descriptions) {oapDefinition["x-descriptions"] = tdDefinition.descriptions}
        if (tdDefinition.proxy) {oapDefinition["x-proxy"] = tdDefinition.proxy}
    }

    return oapDefinition
}