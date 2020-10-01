/* *******************************************************************************
 * Copyright (c) 2020 Contributors to the Eclipse Foundation
 *
 * See the NOTICE file(s) distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0, or the W3C Software Notice and
 * Document License (2015-05-13) which is available at
 * https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document.
 *
 * SPDX-License-Identifier: EPL-2.0 OR W3C-20150513
 ********************************************************************************/

const {Server} = require("./definitions")

module.exports = crawlPaths

function crawlPaths(td) {
    let cPaths = {}
    const interactions = ["properties", "actions", "events"]
    const httpBase = td.base && (td.base.startsWith("http://") || td.base.startsWith("https://")) ? true : false


    // crawl Interaction Affordances forms
    interactions.forEach( interaction => {
        if (td[interaction] !== undefined) {

            // generate interactions tag
            const tags = [interaction]

            Object.keys(td[interaction]).forEach( interactionName => {

                const interactionInfo = genInteractionInfo(interaction, interactionName, td[interaction][interactionName], tags)

                td[interaction][interactionName].forms.forEach( form => {

                    // define type
                    const mapDefaults = {
                        properties: ["readproperty", "writeproperty"],
                        actions: "invokeaction",
                        events: []
                    }
                    const op = form.op ? form.op : mapDefaults[interaction]

                    interactionInfo.description += "op:" + ((typeof op === "string") ? op : op.join(", "))

                    cPaths = addForm(form, interactionInfo, op, httpBase, cPaths)
                })
            })
        }
    })

    // crawl multiple Interaction forms at the root-level of the TD
    if (td.forms) {
        td.forms.forEach( form => {

            // generate interactions tag
            const tags = ["rootInteractions"]
            // require op
            if (form.op) {
                const summary = ((typeof form.op === "string") ? form.op : form.op.join(", "))
                const interactionInfo = {tags, summary}
                cPaths = addForm(form, interactionInfo, form.op, httpBase, cPaths)
            }
        })
    }

    return cPaths
}

/**
 * Check if form has a relevant path/ the base Url is http(s)
 * Generate some basic information common for all methods
 * Find out which methods should be generated
 * Call next function for further processing
 * @param {object} form The element of the interactions forms array
 * @param {object} interactionInfo The common interaction info
 * @param {string|string[]} myOp The op property (or default value) of the form
 * @param {boolean} httpBase Is there a httpBase
 */
function addForm(form, interactionInfo, myOp, httpBase, cPaths) {
    if (form.href.startsWith("http://") ||
        form.href.startsWith("https://") ||
        (httpBase && form.href.indexOf("://") === -1) ) {
        // add the operation
        const {path, server} = extractPath(form.href)

        // define the content type of the response
        let contentType
        if (form.response && form.response.contentType) {
            contentType = form.response.contentType
        }
        else { // if response is not defined explicitly use general interaction content Type
            if (form.contentType) {
                contentType = form.contentType
            }
            else {
                contentType = "application/json"
            }
        }

        // define content type of request
        let requestType
        if (form.contentType) {
            requestType = form.contentType
        }
        else {
            requestType = "application/json"
        }

        // define methods by htv-property or op-property
        let methods
        const htvMethods = ["GET", "PUT", "POST", "DELETE", "PATCH"]
        if (form["htv:methodName"] && htvMethods.some(htv => (htv === form["htv:methodName"]))) {
            methods = [form["htv:methodName"].toLowerCase()]
        }
        else {
            methods = recognizeMethod(myOp)
        }

        cPaths = addPaths(methods, path, server, contentType, requestType, interactionInfo, cPaths)
    }
    return cPaths
}

/**
 * Generates the general information from the TD interaction,
 * to add it to each method call
 * @param {string} interaction
 * @param {string} interactionName
 * @param {object} tdInteraction
 * @param {string[]} tags The tags list
 */
function genInteractionInfo(interaction, interactionName, tdInteraction, tags) {
    const interactionInfo = {tags, description: ""}

    // add title/headline
    if (tdInteraction.title) {
        interactionInfo.summary = tdInteraction.title
        interactionInfo.description += interactionName + "\n"
    }
    else {
        interactionInfo.summary = interactionName
    }

    // add description
    if (tdInteraction.description) {interactionInfo.description += tdInteraction.description + "\n"}

    // add custom fields
    const tdOpts = ["descriptions", "titles"]
    tdOpts.forEach( prop => {
        if (tdInteraction[prop] !== undefined) {
            interactionInfo["x-" + prop] = tdInteraction[prop]
        }
    })

    return interactionInfo
}

/**
 * Detect type of link and separate into server and path, e.g.:
 * * Link `http://example.com/asdf/1`
 * * Server `http://example.com`
 * * Path `/asdf/1`
 * @param {string} link The whole or partial URL
 */
function extractPath(link) {
    let server; let path
    if (link.startsWith("http://")) {
        server = "http://" + link.slice(7).split("/").shift()
        path = "/" + link.slice(7).split("/").slice(1).join("/")
    }
    else if (link.startsWith("https://")) {
        server = "https://" + link.slice(8).split("/").shift()
        path = "/" + link.slice(8).split("/").slice(1).join("/")
    }
    else {
        path = link
        if (!path.startsWith("/")) {path = "/" + path}
    }
    return {path, server}
}

/**
 * Returns an array of http methods to describe e.g.: ["get", "put"]
 * @param {array} ops the op values e.g.: ["readproperty", "writeproperty"]
 */
function recognizeMethod(ops) {
    const mapping = {
        readproperty: "get",
        writeproperty: "put",
        invokeaction: "post",
        readallproperties: "get",
        writeallproperties: "put",
        readmultipleproperties: "get",
        writemultipleproperties: "put"
    }

    const methods = []
    if (typeof ops === "string") {ops = [ops]}
    ops.forEach( op => {
        if(Object.keys(mapping).some( prop => prop === op)) {
            methods.push(mapping[op])
        }
    })

    return methods
}

/**
 * Create/Adapt the OAP Paths with the found path+server+methods combinations
 * @param {array} methods The methods found for this server&path combination
 * @param {string} path The path (e.g. /asdf/1)
 * @param {string} server The server (e.g. http://example.com)
 * @param {string} contentType The content type of the response (e.g. application/json)
 * @param {string} requestType The content type of the request (e.g. application/json)
 * @param {array} interactionInfo The interactionInfo associated to the form (one/some of Property, Action, Event)
 */
function addPaths(methods, path, server, contentType, requestType, interactionInfo, cPaths) {

    if (!cPaths[path] && methods.length > 0) {cPaths[path] = {}}

    methods.forEach( method => {
        // check if same method is already there (e.g. as http instead of https version)
        if (cPaths[path][method]) {
            if (server) {
                if (cPaths[path][method].servers) {
                    if (!cPaths[path][method].servers.some(someServer => (someServer.url === server))) {
                        cPaths[path][method].servers.push(new Server(server))
                    }
                }
                else {
                    cPaths[path][method].servers = [new Server(server)]
                }
            }
        }
        else {
            cPaths[path][method] = {
                responses: {
                    default: {
                        description: "the default Thing response",
                        content: {
                            [contentType]: {}
                        }
                    }
                },
                requestBody: {
                    content: {
                        [requestType]: {}
                    }
                }
            }
            Object.assign(cPaths[path][method], interactionInfo)

            // check if server is given (ain't the case for "base" url fragments) and add
            if (server) {
                cPaths[path][method].servers = [new Server(server)]
            }
        }
    })

    return cPaths
}
