const SwaggerParser = require("swagger-parser")

const td = {
        "@context": [
            "https://www.w3.org/2019/wot/td/v1",
            { "cov" : "http://www.example.org/coap-binding#" },
            { "@language" : "en" }
        ],
        "id":"urn:dev:home:coff:type123-SNR123456",
        "name": "MyCoffeeMaker",
        "@type": "Thing",
        "title": "MyCoffeeMaker-Home",
        "description": "Order your coffee remotely!",
        "securityDefinitions": {
            "basic_sc": {"scheme": "basic", "in":"header" },
            "psk_sc" : { "scheme":"psk" },
            "nosec_sc" : { "scheme":"nosec" }
        },
        "security": ["nosec_sc"],
        "properties": {
            "status" : {
                "type" : "string",
                "enum" : ["Standby", "Grinding", "Brewing", "Filling","Error"],
                "readOnly" : true,
                "forms" : [{
                    "href" : "http://mycoffeemaker.example.com/status",
                    "op" : "readproperty",
                    "contentType" : "application/json"
                    }]
            },
            "fillstates" : {
                "type" : "object",
                "properties" : {
                    "water" : {
                        "type":"number",
                        "minimum": 0,
                        "maximum": 100
                        },
                    "coffeebeans" : {
                        "type":"number",
                        "minimum": 0,
                        "maximum": 100
                        },
                    "bin" : {
                        "type":"number",
                        "minimum": 0,
                        "maximum": 100
                        }
                },
                "readOnly" : true,
                "forms" : [{
                    "href" : "http://mycoffeemaker.example.com/fillstates",
                    "op" : "readproperty",
                    "contentType" : "application/json"
                    }]
            }
        },
        "actions": {
            "brewCoffee" : {
                "input" : {
                    "type" : "string",
                    "enum" : ["Espresso", "EspressoDoppio", "Coffee","HotWater"]
                },
                "forms" : [{
                    "href" : "http://mycoffeemaker.example.com/brewcoffee",
                    "op" : "invokeaction",
                    "contentType" : "application/json"
                    }],
                "safe" : false,
                "idempotent" : false
            },
            "stopBrewing" : {
                "forms" : [{
                    "href" : "coap://mycoffeemaker.example.com/stopbrewing",
                    "cov:methodName" : "GET",
                    "op" : "invokeaction",
                    "contentType" : "application/json"
                    }],
                "safe" : false,
                "idempotent" : false
            },
            "switchOff" : {
                "forms" : [{
                    "href" : "http://mycoffeemaker.example.com/switchoff",
                    "op" : "invokeaction",
                    "contentType" : "application/json"
                    }],
                "safe" : false,
                "idempotent" : false
            }
        },
        "events": {
            "waterEmpty" : {
                "description" : "The water fillstate is below a certain level!",
                "data" : {
                    "type":"number",
                    "minimum": 0,
                    "maximum": 100
                    },
                "forms" : [{
                    "href" : "http://mycoffeemaker.example.com/waterempty",
                    "op" : "subscribeevent",
                    "contentType" : "application/json",
                    "subprotocol": "longpoll"
                }]
            },
            "coffeeEmpty" : {
                "description" : "The coffee bean fillstate is below a certain amount!",
                "data" : {
                    "type":"number",
                    "minimum": 0,
                    "maximum": 100
                    },
                "forms" : [{
                    "href" : "http://mycoffeemaker.example.com/coffeeempty",
                    "op" : "subscribeevent",
                    "contentType" : "application/json",
                    "subprotocol": "longpoll"
                }]
            },
            "binFull" : {
                "description" : "The bin  fillstate is above a certain level!",
                "data" : {
                    "type":"number",
                    "minimum": 0,
                    "maximum": 100
                    },
                "forms" : [{
                    "href" : "http://mycoffeemaker.example.com/binfull",
                    "op" : "subscribeevent",
                    "contentType" : "application/json",
                    "subprotocol": "longpoll"
                }]
            }
        }
    }


/* required */
const openapi = "3.0.0"
const info = createInfo()
const paths = crawlPaths()

/* optional */
const servers = crawlServers()
const components = {}
const security = {}
const tags = [] // TODO: add tags for properties, actions, events
const externalDocs = {}

const API = {
    openapi,
    info,
    paths
}
if (servers.length > 0) {API.servers = servers}

console.log(JSON.stringify(API, undefined, 4))

SwaggerParser.validate(API).then( () => {
    console.log("VALID")
}, err => {
    console.error(err)
})


/* ####### FUNCTIONS #############*/

function createInfo() {
    const cInfo = {}
    // add title
    /* is required for valid TDs but not to constrain testing
       TDs are not necessarily validated before OpenAPI generation
       e.g. test upcoming TD spec features */
    if (td.title !== undefined) {
        cInfo.title = td.title
    }
    else {
        cInfo.title = "Thing Description Playground autogenerated OpenAPI object"
    }

    // add version
    if (td.version && td.version.instance) {
        cInfo.version = td.version.instance
    }
    else {
        cInfo.version = "unknown"
    }

    // add description
    if (td.description !== undefined) {
        cInfo.description = td.description
    }
    // add optional custom fields
    // TODO: parse descriptions and titles -> description title ???
    const tdOpts = ["@context", "@type", "created", "descriptions", "id", "links", "modified", "name", "titles"]
    tdOpts.forEach( prop => {
        if (td[prop] !== undefined) {
            cInfo["x-" + prop] = td[prop]
        }
    })

    return cInfo
}

function crawlPaths() {
    const cPaths = {}
    const interactions = ["properties", "actions"]
    const httpBase = td.base && td.base.startsWith("http://") ? true : false 

    interactions.forEach( interaction => {
        if (td.interaction) {
            Object.keys(td[interaction]).forEach( interactionName => {
                td[interaction][interactionName].forms.forEach( form => {
                    if (form.href.startsWith("http://") || httpBase) {
                        // add the operation
                        let path, server
                        if(form.href.startsWith("http://")) {
                            [server, path] = form.href.slice(7).split("/", 2)
                            server = "http" + server
                        }
                        else {
                            path = form.href
                        }
                        if (!cPaths[path]) {cPaths[path] = {}}
    
                        // define type
                        const mapDefaults = {
                            properties: ["readproperty", "writeproperty"],
                            actions: "invokeaction"
                        }
                        const myOp = form.op ? form.op : mapDefaults[interaction]                        
                        recognizeMethod(myOp, path, server)
                    }
                })
            })
        }
    })

    function recognizeMethod(ops, path, server) {
        const mapping = {
            readproperty: "get",
            writeproperty: "put",
            invokeaction: "post"
        }
        const methods = []
        if (typeof ops === "string") {ops = [ops]}
        ops.forEach( op => {
            methods.push(mapping[op])
        })

        methods.forEach( method => {
            cPaths[path][method] = {
                responses: {
                    default: {
                        description: "the normal Thing response",
                        content: {
                            "application/json": {}
                        }
                    }
                }
            }
            if (server) {
                cPaths[path][method].servers = new Server(server)
            }
        })
        return methods
    }

    return cPaths
}

const allMappings = {
    readallproperties: "GET",
    writeallproperties: "PUT",
    readmultipleproperties: "GET",
    writemultipleproperties: "PUT"
}

function crawlServers() {
    let cServers = []

    if (td.base !== undefined) {
        cServers.push(new Server(td.base, "TD base url"))
    }
    return cServers
}


/* ##### CONSTRUCTORS ############ */
function Server(url, description, variables) {
    if (url === undefined) {throw new Error("url for server object missing")}
    this.url = url
    if (description) {this.description = description}
    if (variables) {this.variables = variables}
}