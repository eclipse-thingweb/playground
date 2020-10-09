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
const jsf = require("json-schema-faker")

module.exports = genInteraction

/**
 * Generates the general information and extracts the JSON-Schemas from one interaction
 * @param {string} interactionName The name of the interaction (e.g. status)
 * @param {object} tdInteraction The actual interaction object of the Thing Description
 * @param {string[]} tags The tags list
 */
function genInteraction(interactionName, tdInteraction, tags) {
    let interactionSchemas = genInteractionSchemas(tdInteraction)
    interactionSchemas = addInteractionExamples(interactionSchemas)

    if (interactionName !== undefined && tags !== undefined) {
        const interactionInfo = genInteractionInfo(interactionName, tdInteraction, tags)
        return {interactionInfo, interactionSchemas}
    }
    else {
        return {interactionSchemas}
    }
}

/**
 * Generates the general information from the TD interaction,
 * to add it to each method call
 * @param {string} interactionName
 * @param {object} tdInteraction
 * @param {string[]} tags The tags list
 */
function genInteractionInfo(interactionName, tdInteraction, tags) {
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
 * Map TD schemas to openAPI schemas
 * @param {object} tdInteraction The InteractionAffordance object
 */
function genInteractionSchemas(tdInteraction) {
    let requestSchema = extractDataSchema(tdInteraction)
    let responseSchema = extractDataSchema(tdInteraction)

    // more specific for actions
    if (tdInteraction.input !== undefined) {
        requestSchema = extractDataSchema(tdInteraction.input)
    }
    if (tdInteraction.output !== undefined) {
        responseSchema = extractDataSchema(tdInteraction.output)
    }

    // more specific for events
    if (tdInteraction.subscription !== undefined) {
        requestSchema = extractDataSchema(tdInteraction.subscription)
    }
    // TODO: add interaction.data (callback?) and interaction.cancellation

    return {requestSchema, responseSchema}
}

/**
 * Extract the relevant keywords from one single object
 * @param {object} schemaParent The object that has the schema keywords as properties
 */
function extractDataSchema(schemaParent, noWrap) {
    const schema = {}
    const dataSchemaKeywords = ["enum", "readOnly", "writeOnly", "format"]
    const extendedSchemaKeywords = ["items", "minItems", "maxItems", "minimum", "maximum", "properties", "required"]
    const keywords = dataSchemaKeywords.concat(extendedSchemaKeywords)

    keywords.forEach( keyword => {
        if (schemaParent[keyword] !== undefined) {
            schema[keyword] = schemaParent[keyword]
        }
    })

    // type null does not exist in openAPI spec, instead nullable:true is used
    if (schemaParent.type !== undefined) {
        if (schemaParent.type !== "null") {
            schema.type = schemaParent.type
        }
        else {
            schema.nullable = true
        }
    }

    // const is not allowed in openAPI schema
    if (schemaParent.const !== undefined) {
        schema.enum = [schemaParent.const]
    }

    // get oneOf child schemas
    if (schemaParent.oneOf !== undefined) {
        schema.oneOf = []
        schemaParent.oneOf.forEach(element => {
            schema.oneOf.push(extractDataSchema(element, true))
        })
    }

    // TODO: unit ??

    // empty schema should not contain the "schema" keyword
    let out
    if (Object.keys(schema).length > 0 && noWrap !== true) {
        out = {schema}
    }
    else {
        out = schema
    }

    return out
}

function addInteractionExamples(interactionSchemas) {

    if (interactionSchemas.requestSchema.schema) {
        interactionSchemas.requestSchema.example = jsf.generate(interactionSchemas.requestSchema.schema)
    }
    if (interactionSchemas.responseSchema.schema) {
        interactionSchemas.responseSchema.example = jsf.generate(interactionSchemas.responseSchema.schema)
    }

    return interactionSchemas
}
