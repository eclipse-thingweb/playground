/*
 *  Copyright (c) 2020 Contributors to the Eclipse Foundation
 *
 *  See the NOTICE file(s) distributed with this work for additional
 *  information regarding copyright ownership.
 *
 *  This program and the accompanying materials are made available under the
 *  terms of the Eclipse Public License v. 2.0 which is available at
 *  http://www.eclipse.org/legal/epl-2.0, or the W3C Software Notice and
 *  Document License (2015-05-13) which is available at
 *  https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document.
 *
 *  SPDX-License-Identifier: EPL-2.0 OR W3C-20150513
 */

/**
 * functionality shared by `extend` and `reduce` functions
 */
const { defaultLookup, defaultClasses } = require("./definitions");
const { forEvery } = require("./util");

/**
 * Extends/Reduces a given TD with the default values of fields that aren't/are filled.
 * @param {object} td The TD to extend with default values
 * @param {function} cbOneObject extendOneObject or reduceOneObject
 * @param {function} cbDataSchema extendDataSchema or reduceDataSchema
 * @returns {void}
 */
function sharedDefaults(td, cbOneObject, cbDataSchema) {
    if (typeof td !== "object") {
        throw new Error("Typeof TD has to be object, not: " + typeof td);
    }

    // -- Property Affordances
    forEvery(td.properties, (property) => {
        cbOneObject(property, defaultClasses.propertyAffordance);
    });

    // -- Action Affordances
    forEvery(td.actions, (action) => {
        cbOneObject(action, defaultClasses.actionAffordance);
    });

    // -- Forms
    const interactionTypes = {
        properties: defaultClasses.formPropertyAffordance,
        actions: defaultClasses.formActionAffordance,
        events: defaultClasses.formEventAffordance,
    };
    Object.keys(interactionTypes).forEach((interactionType) => {
        forEvery(td[interactionType], (interaction) => {
            if (interaction.forms) {
                interaction.forms.forEach((form) => {
                    cbOneObject(form, interactionTypes[interactionType], interaction);

                    if (form.additionalResponses) {
                        form.additionalResponses.forEach((response) => {
                            cbOneObject(response, defaultClasses.additionalExpectedResponse, form);
                        });
                    }
                });
            }
        });
    });
    if (td.forms) {
        td.forms.forEach((form) => {
            cbOneObject(form, defaultClasses.form);

            if (form.additionalResponses) {
                form.additionalResponses.forEach((response) => {
                    cbOneObject(response, defaultClasses.additionalExpectedResponse, form);
                });
            }
        });
    }

    // -- DataSchema
    forEvery(td.properties, cbDataSchema);
    forEvery(td.actions, (action) => {
        if (action.input) {
            cbDataSchema(action.input);
        }
        if (action.output) {
            cbDataSchema(action.output);
        }
    });
    forEvery(td.events, (event) => {
        if (event.subscription) {
            cbDataSchema(event.subscription);
        }
        if (event.data) {
            cbDataSchema(event.data);
        }
        if (event.cancellation) {
            cbDataSchema(event.cancellation);
        }
    });
    Object.keys(interactionTypes).forEach((interactionType) => {
        forEvery(td[interactionType], (interaction) => {
            forEvery(interaction.uriVariables, cbDataSchema);
        });
    });

    // -- SecurityScheme's (Basic, Digest, Bearer, APIKey)
    const secSchemes = {
        basic: defaultClasses.basicSecuritySchema,
        digest: defaultClasses.digestSecurityScheme,
        bearer: defaultClasses.bearerSecurityScheme,
        apikey: defaultClasses.apiKeySecurityScheme,
    };
    if (td.securityDefinitions) {
        forEvery(td.securityDefinitions, (securityDefinition) => {
            const aSecScheme = Object.keys(secSchemes).find((secScheme) => secScheme === securityDefinition.scheme);
            if (aSecScheme !== undefined) {
                cbOneObject(securityDefinition, secSchemes[aSecScheme]);
            }
        });
    }
}

/**
 * Recursively extends/reduces nested data Schemas
 * @param {object} dataSchema An Td dataSchema object
 * @param {(target:object, type:string)=>void} callback extendOneObject or reduceOneObject
 */
function sharedDataSchema(dataSchema, callback) {
    callback(dataSchema, defaultClasses.dataSchema);

    if (dataSchema.oneOf) {
        dataSchema.oneOf.forEach((childScheme) => {
            sharedDataSchema(childScheme, callback);
        });
    }
    if (dataSchema.items) {
        if (Array.isArray(dataSchema.items)) {
            dataSchema.items.forEach((item) => {
                sharedDataSchema(item, callback);
            });
        } else {
            sharedDataSchema(dataSchema.items, callback);
        }
    }
    if (dataSchema.properties) {
        Object.keys(dataSchema.properties).forEach((key) => {
            sharedDataSchema(dataSchema.properties[key], callback);
        });
    }
}

/**
 * Add/Remove default values to one given object,
 * using the defaultLookup table
 * @param {{}} target the object to extend
 * @param {string} type The type according to the defaultLookup table
 */
function sharedOneObject(target, type, callback, parentInteraction) {
    if (typeof target !== "object") {
        throw new Error("target has to be of type 'object' not: " + typeof target);
    }
    if (typeof type !== "string") {
        throw new Error("type has to be of type 'string' not: " + typeof type);
    }
    if (Object.keys(defaultLookup).every((key) => key !== type)) {
        throw new Error("type has to be a defaultLookup entry, type: " + type);
    }

    callback(target, type, parentInteraction);

    // handle default values with superClasses (e.g. Form-EventAffordance)
    if (type.includes("-")) {
        const superType = type.split("-").slice(0, -1).join("-");
        sharedOneObject(target, superType, callback);
    }
}

module.exports = { sharedDefaults, sharedDataSchema, sharedOneObject };
