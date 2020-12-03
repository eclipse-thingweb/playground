/**
 * @file Test all functions in "genRoot.js" with td fragments as input
 */

const { genInfo, genTags, genBaseServer } = require("../src/genRoot")

describe("genInfo", () => {
    test("empty TD", () => {
        const td = {}
        const aap = {
            title: expect.any(String),
            version: "unknown"
        }
        expect(genInfo(td)).toEqual(aap)
    })
    test("filled TD", () => {
        const td = {
            title: "Coffee Machine",
            version: {
                instance: "1.0.0"
            },
            description: "a coffee machine",
            "@context": [
                "https://www.w3.org/2019/wot/td/v1",
                {
                    cov: "http://www.example.org/coap-binding#",
                    mqv: "http://www.example.org/mqtt-binding#"
                },
                { "@language": "en" }
            ],
            links: ["http://example.com/1", "http://example.com/2"]
        }
        const aap = {
            title: "Coffee Machine",
            version: "1.0.0",
            description: "a coffee machine",
            "x-AT-context": [
                "https://www.w3.org/2019/wot/td/v1",
                {
                    cov: "http://www.example.org/coap-binding#",
                    mqv: "http://www.example.org/mqtt-binding#"
                },
                { "@language": "en" }
            ],
            "x-links": ["http://example.com/1", "http://example.com/2"]
        }
        expect(genInfo(td)).toEqual(aap)
    })
    test("contact form", () => {
        const tdMail = {
            support: "mailto:wot@example.com"
        }
        const aap = {
            title: expect.any(String),
            version: expect.any(String),
            contact: {
                email: "wot@example.com"
            }
        }
        expect(genInfo(tdMail)).toEqual(aap)

        const tdUrl = {
            support: "https://example.com/support"
        }
        aap.contact = {
            url: "https://example.com/support"
        }
        expect(genInfo(tdUrl)).toEqual(aap)

        const tdXUrl = {
            support: "ftp://public.ftp-servers.example.com/thing/documentation.txt"
        }
        aap.contact = {
            "x-uri": "ftp://public.ftp-servers.example.com/thing/documentation.txt"
        }
        expect(genInfo(tdXUrl)).toEqual(aap)

    })
})

test("genTags", () => {
    const emptyTd = {}
    const noTags = []
    expect(genTags(emptyTd)).toEqual(noTags)

    const td = {
        properties: {},
        actions: {},
        events: {}
    }
    const tags = [{
        name: "properties",
        description: expect.any(String),
        externalDocs: {
            url: expect.any(String),
            description: expect.any(String)
        }
    }, {
        name: "actions",
        description: expect.any(String),
        externalDocs: {
            url: expect.any(String),
            description: expect.any(String)
        }
    }, {
        name: "events",
        description: expect.any(String),
        externalDocs: {
            url: expect.any(String),
            description: expect.any(String)
        }
    }]
    expect(genTags(td)).toEqual(tags)
})

test("genBaseServer", () => {
    const emptyTd = {}
    const emptyServers = {}
    expect(genBaseServer(emptyTd)).toEqual(emptyServers)

    const notsupTd = {
        base: "ftp://example.com"
    }
    expect(genBaseServer(notsupTd)).toEqual(emptyServers)

    const td = {
        base: "mqtt://example.com/mybroker"
    }
    const servers = {
        base: {
            url: "mqtt://example.com/mybroker",
            protocol: "mqtt"
        }
    }
    expect(genBaseServer(td)).toEqual(servers)
})
