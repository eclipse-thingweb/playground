const fs = require("fs")
const addDefaults = require("../index.js")
const staticTd = require("../examples/td.json")

if (!fs.existsSync("./out")) {fs.mkdirSync("./out")}

const referenceOutput = JSON.parse(fs.readFileSync("./examples/td-with-defaults.json", "utf-8"))

test("integration test", () => {

    const extendedTd = addDefaults(staticTd)
    // write output to be able to compare it to reference
    fs.writeFileSync("./out/1_example.json", JSON.stringify(extendedTd, undefined, 2))

    expect(extendedTd).toEqual(referenceOutput)
})

describe("module tests", () => {

    test("ActionAffordance", ()=> {
        const td = {
            actions: {
                throwBall: {}
            }
        }
        const refTd = {
            actions: {
                throwBall: {
                    safe: false,
                    idempotent: false
                }
            }
        }
        expect(addDefaults(td)).toEqual(refTd)
    })

    describe("forms", () => {
        test("PropertyAffordance", () => {
            const td = {
                properties: {
                    throwBall: {
                        forms: [
                            {}
                        ]
                    }
                }
            }
            const refTd = {
                properties: {
                    throwBall: {
                        forms: [
                            {
                                op: ["readproperty", "writeproperty"],
                                contentType: "application/json"
                            }
                        ]
                    }
                }
            }
            expect(addDefaults(td).properties.throwBall.forms).toEqual(refTd.properties.throwBall.forms)
        })
        test("ActionAffordance", () => {
            const td = {
                actions: {
                    throwBall: {
                        forms: [
                            {}
                        ]
                    }
                }
            }
            const refTd = {
                actions: {
                    throwBall: {
                        forms: [
                            {
                                op: "invokeaction",
                                contentType: "application/json"
                            }
                        ]
                    }
                }
            }
            expect(addDefaults(td).actions.throwBall.forms).toEqual(refTd.actions.throwBall.forms)
        })
        test("EventAffordance", () => {
            const td = {
                events: {
                    throwBall: {
                        forms: [
                            {}
                        ]
                    }
                }
            }
            const refTd = {
                events: {
                    throwBall: {
                        forms: [
                            {
                                op: "subscribeevent",
                                contentType: "application/json"
                            }
                        ]
                    }
                }
            }
            expect(addDefaults(td).events.throwBall.forms).toEqual(refTd.events.throwBall.forms)
        })
    })

    describe("DataSchema", () => {
        const tdSchema = {
            description: "just a data schema"
        },
        const refTdSchema = {
            description: "just a data schema",
            writeOnly: "false",
            readOnly: "false"
        }

        test("PropertyAffordance", () => {
            const td = {
                properties: {
                    temperature: tdSchema
                }
            }
            expect(addDefaults(td).properties.temperature).toEqual(refTdSchema)
        })
        test("ActionAffordance", () => {
            const td = {
                actions: {
                    throwBall: {
                        input: tdSchema,
                        output: tdSchema
                    }
                }
            }
            expect(addDefaults(td).actions.throwBall.input).toEqual(refTdSchema)
            expect(addDefaults(td).actions.throwBall.output).toEqual(refTdSchema)
        })
        test("EventAffordance", () => {
            const td = {
                events: {
                    overheating: {
                        subscription: tdSchema,
                        data: tdSchema,
                        cancellation: tdSchema
                    }
                }
            }
            expect(addDefaults(td).events.overheating.subscription).toEqual(refTdSchema)
            expect(addDefaults(td).events.overheating.data).toEqual(refTdSchema)
            expect(addDefaults(td).events.overheating.cancellation).toEqual(refTdSchema)
        })
        test("uriVariables", () => {
            const td = {
                properties: {
                    temperature: {
                        uriVariables: {
                            p: tdSchema
                        }
                    }
                },
                actions: {
                    throwBall: {
                        uriVariables: {
                            p: tdSchema
                        }
                    }
                }
                events: {
                    overheating: {
                        uriVariables: {
                            p: tdSchema
                        }
                    }
                }
            }
            expect(addDefaults(td).properties.temperature.uriVariables.p).toEqual(refTdSchema)
            expect(addDefaults(td).actions.throwBall.uriVariables.p).toEqual(refTdSchema)
            expect(addDefaults(td).events.overheating.uriVariables.p).toEqual(refTdSchema)
        })

        describe("nested", () => {
            test("oneOf", () => {
                const td = {
                    properties: {
                        temperature: {
                            oneOf: [tdSchema, {
                                oneOf: [tdSchema, tdSchema]
                            }]
                        }
                    }
                }
                expect(addDefaults(td).properties.temperature.oneOf[0]).toEqual(refTdSchema)
                expect(addDefaults(td).properties.temperature.oneOf[1].oneOf[0]).toEqual(refTdSchema)
                expect(addDefaults(td).properties.temperature.oneOf[1].oneOf[1]).toEqual(refTdSchema)
            })
            test("items", () => {
                const td = {
                    actions: {
                        throwBall: {
                            input: {
                                items: tdSchema
                            },
                            output: {
                                items: [tdSchema, tdSchema]
                            }
                        }
                    }
                }
                expect(addDefaults(td).actions.throwBall.input.items).toEqual(refTdSchema)
                expect(addDefaults(td).actions.throwBall.output.items[0]).toEqual(refTdSchema)
                expect(addDefaults(td).actions.throwBall.output.items[1]).toEqual(refTdSchema)
            })
            test("properties", () => {
                const td = {
                    events: {
                        overheating: {
                            subscription: {
                                properties: {
                                    a: tdSchema,
                                    b: tdSchema
                                }
                            }
                        }
                    }
                }
                expect(addDefaults(td).events.overheating.subscription.a).toEqual(refTdSchema)
                expect(addDefaults(td).events.overheating.subscription.b).toEqual(refTdSchema)
            })
        })
    })

    test("BasicSecurityScheme", () => {
        const td = {
            securityDefinitions: {
                "basic_sc": {
                    scheme: "basic"
                }
            }
        }
        const refTd = {
            securityDefinitions: {
                "basic_sc": {
                    scheme: "basic",
                    in: "header"
                }
            }
        }
        expect(addDefaults(td)).toEqual(refTd)
    })

    test("DigestSecurityScheme", () => {
        const td = {
            securityDefinitions: {
                "digest_sc": {
                    scheme: "digest"
                }
            }
        }
        const refTd = {
            securityDefinitions: {
                "digest_sc": {
                    scheme: "digest",
                    in: "header",
                    qop: "auth"
                }
            }
        }
        expect(addDefaults(td)).toEqual(refTd)
    })

    test("BearerSecurityScheme", () => {
        const td = {
            securityDefinitions: {
                "bearer_sc": {
                    scheme: "bearer"
                }
            }
        }
        const refTd = {
            securityDefinitions: {
                "bearer_sc": {
                    scheme: "bearer",
                    in: "header",
                    alg: "ES256",
                    format: "jwt"
                }
            }
        }
        expect(addDefaults(td)).toEqual(refTd)
    })

    test("APIKeySecurityScheme", () => {
        const td = {
            securityDefinitions: {
                "api_sc": {
                    scheme: "apikey"
                }
            }
        }
        const refTd = {
            securityDefinitions: {
                "api_sc": {
                    scheme: "apikey",
                    in: "query"
                }
            }
        }
        expect(addDefaults(td)).toEqual(refTd)
    })
})