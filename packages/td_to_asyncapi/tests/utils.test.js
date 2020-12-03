const { TestScheduler } = require( 'jest' )
const { dataToAsyncSchema, extractChannel, copySpecExtensions } = require("../src/utils")

test("dataToAsyncSchema", () => {

    expect(dataToAsyncSchema(undefined)).toBe(undefined)

    const tdSchema = {
        readOnly: false,
        writeOnly: true,
        "@type": "Thing",
        titles: {en: "Thing", de: "Ding"},
        title: "The Thing"
    }
    const asyncSchema = {
        readOnly: false,
        writeOnly: true,
        "x-AT-type": "Thing",
        "x-titles": {en: "Thing", de: "Ding"},
        title: "The Thing"
    }
    expect(dataToAsyncSchema(tdSchema)).toEqual(asyncSchema)

    const tdOneOf = {
        oneOf: [{
            "@type": "asdf"
        }, {
            "@type": "html"
        }, {
            "@type": "thing"
        }]
    }

    const asyncOneOf = {
        oneOf: [{
            "x-AT-type": "asdf"
        }, {
            "x-AT-type": "html"
        }, {
            "x-AT-type": "thing"
        }]
    }

    expect(dataToAsyncSchema(tdOneOf)).toEqual(asyncOneOf)
})

test("copySpecExtensions", () => {
    const keys = ["@asdf", "html", "@type", "thing"]
    const source = {
        "@asdf": "asdf",
        html: "HTML",
        do: "notCopy"
    }
    const target = {
        already: "here"
    }
    const tarGoal = {
        "x-AT-asdf": "asdf",
        "x-html": "HTML",
        already: "here"
    }
    copySpecExtensions(keys, source, target)
    expect(target).toEqual(tarGoal)
})

test("extractChannel", () => {
    const link1 = "http://example.com/asdf/1"
    const channel1 = "/asdf/1"
    const server1 = "http://example.com"
    expect(extractChannel(link1)).toEqual({channel: channel1, server: server1})

    const link2 = "/asdf/1"
    const channel2 = "/asdf/1"
    const server2 = undefined
    expect(extractChannel(link2)).toEqual({channel: channel2, server: server2})

    const link3 = "asdf/1"
    const channel3 = "/asdf/1"
    const server3 = undefined
    expect(extractChannel(link3)).toEqual({channel: channel3, server: server3})

    const link4 = "mqtt-secure://example.com/asdf/1"
    const channel4 = "/asdf/1"
    const server4 = "mqtt-secure://example.com"
    expect(extractChannel(link4)).toEqual({channel: channel4, server: server4})
})
