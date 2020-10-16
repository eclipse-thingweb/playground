/* security and security Definitions are mandatory in a TD but conversion
 * should also work for invalid TDs (e.g. to test future improvements), prototypes
 * thus they are just not converted if not given/other format
 */

module.exports = {mapSecurity, mapSecurityString, mapSecurityDefinitions}

function mapSecurity(tdDefinitions, tdSecurity) {

    const {securitySchemes, scopes} = mapSecurityDefinitions(tdDefinitions)
    const security = mapSecurityString(tdSecurity, scopes)

    return {securitySchemes, security}
}

/**
 * Mapping the TD security object to openAPI
 * @param {object} tdSecurity the TD security options to apply
 * @param {object} tdScopes the found scopes as map {string: string[]}
 */
function mapSecurityString(tdSecurity, tdScopes) {
    const oapSecurity = {}
    const oapSecurityContainer = []
    if (typeof tdSecurity === "string") {tdSecurity = [tdSecurity]}

    if (typeof tdSecurity === "object") {
        tdSecurity.forEach( tdSecurityKey => {
            let thisScopes = []
            if (tdScopes[tdSecurityKey] !== undefined) {thisScopes = tdScopes[tdSecurityKey]}
            oapSecurity[tdSecurityKey] = thisScopes
        })
    }

    if (Object.keys(oapSecurity).length > 0) {
        oapSecurityContainer.push(oapSecurity)
    }

    return oapSecurityContainer
}

function mapSecurityDefinitions(tdDefinitions) {
    const securitySchemes = {}
    const scopes = {}

    if (typeof tdDefinitions === "object") {
        Object.keys(tdDefinitions).forEach( key => {
            if (typeof tdDefinitions[key].scheme === "string") {
                const {oapDefinition, scope} = genOapDefinition(tdDefinitions[key])
                if(Object.keys(oapDefinition).length > 0) {
                    securitySchemes[key] = oapDefinition
                    if (typeof scope === "object") {
                        scopes[key] = scope
                    }
                }
            }
        })
    }

    return {securitySchemes, scopes}
}

/**
 * Generate an openAPI securityScheme part from a given TD security definiton part
 * @param {object} tdDefinition one security definition object
 */
function genOapDefinition(tdDefinition) {
    const oapDefinition = {}
    const tdScheme = tdDefinition.scheme.toLowerCase()
    let addOptionals = true
    const httpSchemes = ["basic", "digest", "bearer"]
    let scope

    if (httpSchemes.some( httpScheme => (httpScheme === tdScheme))) {
        oapDefinition.type = "http"
        oapDefinition.scheme = tdScheme
        if (tdDefinition.in && tdDefinition.in !== "header") {
            throw new Error("Cannot represent " + tdScheme + " authentication outside the header in openAPI")
        }
    }

    switch (tdScheme) {

        case "nosec":
        case "basic":
            // do nothing?
        break

        case "digest":
            oapDefinition["x-qop"] = (tdDefinition.qop === undefined) ? "auth" : tdDefinition.qop
        break

        case "bearer":
            oapDefinition.bearerFormat = (tdDefinition.format === undefined) ? "jwt" : tdDefinition.format
            oapDefinition["x-alg"] = (tdDefinition.alg === undefined) ? "ES256" : tdDefinition.alg
        break

        case "apikey":
            oapDefinition.type = "apiKey"
            oapDefinition.in = (tdDefinition.in === undefined) ? "query" : tdDefinition.in
            oapDefinition.name = (tdDefinition.name === undefined) ? "UNKNOWN" : tdDefinition.name
            if (oapDefinition.in === "body") {
                throw new Error("Cannot represent ApiKey in `body` with openAPI")
            }
        break

        case "psk":
            console.warn("PSK security is not supported")
        break

        case "oauth2":
            if (typeof tdDefinition.scopes === "string") {
                scope = [tdDefinition.scopes]
            }
            else if (typeof tdDefinition.scopes === "object") {
                scope = tdDefinition.scopes
            }

            oapDefinition.type = "oauth2"
            oapDefinition.flows = genOAuthFlows(tdDefinition)
        break


        default:
            console.log("unknown security definition: " + tdScheme)
            addOptionals = false

    }

    // add optional fields
    if (addOptionals) {
        if (tdDefinition.description) {oapDefinition.description = tdDefinition.description}
        if (tdDefinition.descriptions) {oapDefinition["x-descriptions"] = tdDefinition.descriptions}
        if (tdDefinition.proxy) {oapDefinition["x-proxy"] = tdDefinition.proxy}
    }

    return {oapDefinition, scope}
}

/**
 * Map the oauth2 fields of a TD to an openAPI instance
 * @param {object} tdDefinition The security definition object of a TD
 */
function genOAuthFlows(tdDefinition) {
    const oapFlow = {}
    if (typeof tdDefinition.flow !== "string") {throw new Error("the oauth2 object has no flow of type string")}

    const tdFlow = tdDefinition.flow.toLowerCase()
    const mapTdToOap = {
        implicit: ["implicit"],
        password: ["password", "ropc"],
        clientCredentials: ["application", "clientcredentials", "clientcredential"],
        authorizationCode: ["accesscode", "code", "authorizationcode"]
    }

    Object.keys(mapTdToOap).forEach( key => {
        if (mapTdToOap[key].some( arrayElement => (arrayElement === tdFlow))) {
            const protoFlow = {}
            if (key === "implicit" || key === "authorizationCode") {
                if (tdDefinition.authorization === undefined) {
                    throw new Error("the authorization URI is required for oauth2 flow: " + key)
                }
                else {
                    protoFlow.authorizationUrl = tdDefinition.authorization
                }
            }
            if (key === "password" || key === "clientCredentials" || key === "authorizationCode") {
                if (tdDefinition.token === undefined) {
                    throw new Error("the token URI is required for oauth2 flow: " + key)
                }
                else {
                    protoFlow.tokenUrl = tdDefinition.token
                }
            }
            if (typeof tdDefinition.refresh === "string") {protoFlow.refreshUrl = tdDefinition.refresh}
            if (tdDefinition.scopes === undefined) {
                protoFlow.scopes = {"default": "autogenerated default scope"}
            }
            else {
                protoFlow.scopes = {}
                if (typeof tdDefinition.scopes === "string") {tdDefinition.scopes = [tdDefinition.scopes]}
                tdDefinition.scopes.forEach( scope => {
                    protoFlow.scopes[scope] = ""
                })
            }
            oapFlow[key] = protoFlow
        }
    })
    return oapFlow
}
