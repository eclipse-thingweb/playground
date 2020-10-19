const {mapSecurity, mapSecurityString, mapSecurityDefinitions, hasNoSec, mapFormSecurity} = require("../mapSecurity")

// reused definitions
const oauth2Definitions = {
    "oauth2_sc": {
        scheme: "oauth2",
        flow: "code",
        scopes: ["limited", "special"],
        refresh: "https://refreshServer.com/",
        token: "https://tokenServer.com/",
        authorization: "https://authServer.com/"
    }
}

const oauth2OapSchemes = {
    securitySchemes: {
        "oauth2_sc": {
            type: "oauth2",
            flows: {
                authorizationCode: {
                authorizationUrl: "https://authServer.com/",
                tokenUrl: "https://tokenServer.com/",
                refreshUrl: "https://refreshServer.com/",
                scopes: {
                    limited: "",
                    special: ""
                }
                }
            }
        }
    },
    scopes: {
        "oauth2_sc": ["limited", "special"]
    }
}

describe("mapSecurity unit tests", () => {

    describe("mapSecurityString", () => {
        test("oauth2", () => {
            const result = [{"oauth2_sc": ["limited"]}]
            const computed = mapSecurityString(["oauth2_sc"], oauth2OapSchemes.securitySchemes, {"oauth2_sc":["limited"]})
            const computed2 = mapSecurityString("oauth2_sc", oauth2OapSchemes.securitySchemes, {"oauth2_sc":["limited"]})
            expect(computed).toEqual(result)
            expect(computed2).toEqual(result)
        })
    })

    describe("mapSecurityDefinitions", () => {

        test("basic", () => {
            const basicDefinitions = {
                securitySchemes: {
                    "basic_sc": {
                        type: "http",
                        scheme: "basic"
                    }
                }
            }
            const basicResult = {
                securitySchemes: {
                    "basic_sc": {
                        type: "http",
                        scheme: "basic"
                    }
                },
                scopes: []
            }
        })

        test("oauth2", () => {

            expect(mapSecurityDefinitions(oauth2Definitions)).toEqual(oauth2OapSchemes)
        })

    })
})

describe("mapSecurity integration tests", () => {
    describe("mapFormSecurity", () => {
        const result = {security: [{"oauth2_sc": ["limited"]}]}

        test("oauth2 single scope no security", () => {
            expect(mapFormSecurity(oauth2Definitions, undefined, ["limited"])).toEqual(result)
            expect(mapFormSecurity(oauth2Definitions, undefined, "limited")).toEqual(result)
        })
        test("oauth2 single scope with security", () => {
            const security = ["oauth2_sc"]

            expect(mapFormSecurity(oauth2Definitions, security, ["limited"])).toEqual(result)
            expect(mapFormSecurity(oauth2Definitions, security, "limited")).toEqual(result)
        })
    })
})