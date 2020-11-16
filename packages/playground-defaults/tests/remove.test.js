const fs = require("fs")
const { TestScheduler } = require( 'jest' )
const {removeDefaults} = require("../index.js")

if (!fs.existsSync("./out")) {fs.mkdirSync("./out")}

const staticTd = JSON.parse(fs.readFileSync("./examples/td-with-defaults.json", "utf-8"))
const referenceOutput = JSON.parse(fs.readFileSync("./examples/td-without-defaults.json", "utf-8"))

test("integration test", () => {

    removeDefaults(staticTd)
    // write output to be able to compare it to reference
    fs.writeFileSync("./out/2_example.json", JSON.stringify(staticTd, undefined, 2))

    expect(staticTd).toEqual(referenceOutput)
})

describe("module tests", () => {

    test("ActionAffordance", ()=> {
        const refTd = {
            actions: {
                throwBall: {}
            }
        }
        const td = {
            actions: {
                throwBall: {
                    safe: false,
                    idempotent: false
                }
            }
        }
        removeDefaults(td)
        expect(td).toEqual(refTd)
    })

    describe("forms", () => {
        test("PropertyAffordance", () => {
            const refTd = {
                properties: {
                    throwBall: {
                        forms: [
                            {}
                        ]
                    }
                }
            }
            const td = {
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
            removeDefaults(td)
            expect(td.properties.throwBall.forms).toEqual(refTd.properties.throwBall.forms)
        })
        test("ActionAffordance", () => {
            const refTd = {
                actions: {
                    throwBall: {
                        forms: [
                            {}
                        ]
                    }
                }
            }
            const td = {
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
            removeDefaults(td)
            expect(td.actions.throwBall.forms).toEqual(refTd.actions.throwBall.forms)
        })
        test("EventAffordance", () => {
            const refTd = {
                events: {
                    throwBall: {
                        forms: [
                            {}
                        ]
                    }
                }
            }
            const td = {
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
            removeDefaults(td)
            expect(td.events.throwBall.forms).toEqual(refTd.events.throwBall.forms)
        })
    })

    describe("DataSchema", () => {
        const refTdSchema = {
            description: "just a data schema"
        }

        test("PropertyAffordance", () => {
            const td = {
                properties: {
                    temperature: {
                        description: "just a data schema",
                        writeOnly: false,
                        readOnly: false
                    }
                }
            }
            removeDefaults(td)
            expect(td.properties.temperature).toEqual(refTdSchema)
        })
        test("ActionAffordance", () => {
            const td = {
                actions: {
                    throwBall: {
                        input: {
                            description: "just a data schema",
                            writeOnly: false,
                            readOnly: false
                        },
                        output: {
                            description: "just a data schema",
                            writeOnly: false,
                            readOnly: false
                        }
                    }
                }
            }
            removeDefaults(td)
            expect(td.actions.throwBall.input).toEqual(refTdSchema)
            expect(td.actions.throwBall.output).toEqual(refTdSchema)
        })
        test("EventAffordance", () => {
            const td = {
                events: {
                    overheating: {
                        subscription: {
                            description: "just a data schema",
                            writeOnly: false,
                            readOnly: false
                        },
                                        data: {
                            description: "just a data schema",
                            writeOnly: false,
                            readOnly: false
                        },
                                        cancellation: {
                            description: "just a data schema",
                            writeOnly: false,
                            readOnly: false
                        }
                    }
                }
            }
            removeDefaults(td)
            expect(td.events.overheating.subscription).toEqual(refTdSchema)
            expect(td.events.overheating.data).toEqual(refTdSchema)
            expect(td.events.overheating.cancellation).toEqual(refTdSchema)
        })
        test("uriVariables", () => {
            const td = {
                properties: {
                    temperature: {
                        uriVariables: {
                            p: {
                                description: "just a data schema",
                                writeOnly: false,
                                readOnly: false
                            }
                                            }
                                        }
                                    },
                                    actions: {
                                        throwBall: {
                                            uriVariables: {
                                                p: {
                                description: "just a data schema",
                                writeOnly: false,
                                readOnly: false
                            }
                                            }
                                        }
                                    },
                                    events: {
                                        overheating: {
                                            uriVariables: {
                                                p: {
                                description: "just a data schema",
                                writeOnly: false,
                                readOnly: false
                            }
                        }
                    }
                }
            }
            removeDefaults(td)
            expect(td.properties.temperature.uriVariables.p).toEqual(refTdSchema)
            expect(td.actions.throwBall.uriVariables.p).toEqual(refTdSchema)
            expect(td.events.overheating.uriVariables.p).toEqual(refTdSchema)
        })

        describe("nested", () => {
            test("oneOf", () => {
                const td = {
                    properties: {
                        temperature: {
                            oneOf: [{
                                description: "just a data schema",
                                writeOnly: false,
                                readOnly: false
                            }, {
                                oneOf: [{
                                    description: "just a data schema",
                                    writeOnly: false,
                                    readOnly: false
                                }, {
                                    description: "just a data schema",
                                    writeOnly: false,
                                    readOnly: false
                                }]
                            }]
                        }
                    }
                }
                removeDefaults(td)
                expect(td.properties.temperature.oneOf[0]).toEqual(refTdSchema)
                expect(td.properties.temperature.oneOf[1].oneOf[0]).toEqual(refTdSchema)
                expect(td.properties.temperature.oneOf[1].oneOf[1]).toEqual(refTdSchema)
            })
            test("items", () => {
                const td = {
                    actions: {
                        throwBall: {
                            input: {
                                items: {
                                    description: "just a data schema",
                                    writeOnly: false,
                                    readOnly: false
                                }
                            },
                            output: {
                                items: [{
                                    description: "just a data schema",
                                    writeOnly: false,
                                    readOnly: false
                                }, {
                                    description: "just a data schema",
                                    writeOnly: false,
                                    readOnly: false
                                }]
                            }
                        }
                    }
                }
                removeDefaults(td)
                expect(td.actions.throwBall.input.items).toEqual(refTdSchema)
                expect(td.actions.throwBall.output.items[0]).toEqual(refTdSchema)
                expect(td.actions.throwBall.output.items[1]).toEqual(refTdSchema)
            })
            test("properties", () => {
                const td = {
                    events: {
                        overheating: {
                            subscription: {
                                properties: {
                                    a: {
                                        description: "just a data schema",
                                        writeOnly: false,
                                        readOnly: false
                                    },
                                    b: {
                                        description: "just a data schema",
                                        writeOnly: false,
                                        readOnly: false
                                    }
                                }
                            }
                        }
                    }
                }
                removeDefaults(td)
                expect(td.events.overheating.subscription.properties.a).toEqual(refTdSchema)
                expect(td.events.overheating.subscription.properties.b).toEqual(refTdSchema)
            })
        })
    })

    test("BasicSecurityScheme", () => {
        const refTd = {
            securityDefinitions: {
                "basic_sc": {
                    scheme: "basic"
                }
            }
        }
        const td = {
            securityDefinitions: {
                "basic_sc": {
                    scheme: "basic",
                    in: "header"
                }
            }
        }
        removeDefaults(td)
        expect(td).toEqual(refTd)
    })

    test("DigestSecurityScheme", () => {
        const refTd = {
            securityDefinitions: {
                "digest_sc": {
                    scheme: "digest"
                }
            }
        }
        const td = {
            securityDefinitions: {
                "digest_sc": {
                    scheme: "digest",
                    in: "header",
                    qop: "auth"
                }
            }
        }
        removeDefaults(td)
        expect(td).toEqual(refTd)
    })

    test("BearerSecurityScheme", () => {
        const refTd = {
            securityDefinitions: {
                "bearer_sc": {
                    scheme: "bearer"
                }
            }
        }
        const td = {
            securityDefinitions: {
                "bearer_sc": {
                    scheme: "bearer",
                    in: "header",
                    alg: "ES256",
                    format: "jwt"
                }
            }
        }
        removeDefaults(td)
        expect(td).toEqual(refTd)
    })

    test("APIKeySecurityScheme", () => {
        const refTd = {
            securityDefinitions: {
                "api_sc": {
                    scheme: "apikey"
                }
            }
        }
        const td = {
            securityDefinitions: {
                "api_sc": {
                    scheme: "apikey",
                    in: "query"
                }
            }
        }
        removeDefaults(td)
        expect(td).toEqual(refTd)
    })

    test("Remove specific", () => {
        const td = {
            properties: {
                temperature: {
                    forms: [
                        {
                            op: ["readproperty", "writeproperty"],
                            contentType: "application/json"
                        },
                        {
                            op: ["writeproperty", "readproperty"],
                            contentType: "image/jpeg"
                        }
                    ]
                }
            }
        }
        const refTd = {
            properties: {
                temperature: {
                    forms: [
                        {},
                        {
                            contentType: "image/jpeg"
                        }
                    ]
                }
            }
        }
        removeDefaults(td)
        expect(td).toEqual(refTd)
    })
})
