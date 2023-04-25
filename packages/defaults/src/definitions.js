/*
 *  Copyright (c) 2023 Contributors to the Eclipse Foundation
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
 * the TD default value definitions according to
 * https://www.w3.org/TR/2020/REC-wot-thing-description-20200409/
 *
 * represented with:
 * class[-superClass] -> property -> value
 */
const defaultLookup = {
    Form: {
        contentType: "application/json",
    },
    "Form-PropertyAffordance": {
        op: ["readproperty", "writeproperty"],
    },
    "Form-ActionAffordance": {
        op: "invokeaction",
    },
    "Form-EventAffordance": {
        op: ["subscribeevent", "unsubscribeevent"],
    },
    AdditionalExpectedResponse: {
        success: false,
        contentType: "application/json",
    },
    DataSchema: {
        readOnly: false,
        writeOnly: false,
    },
    PropertyAffordance: {
        observable: false,
    },
    ActionAffordance: {
        safe: false,
        idempotent: false,
    },
    BasicSecuritySchema: {
        in: "header",
    },
    DigestSecurityScheme: {
        in: "header",
        qop: "auth",
    },
    BearerSecurityScheme: {
        in: "header",
        alg: "ES256",
        format: "jwt",
    },
    APIKeySecurityScheme: {
        in: "query",
    },
};

/**
 * The possible types of objects to extend
 */
const defaultClasses = {
    form: "Form",
    formPropertyAffordance: "Form-PropertyAffordance",
    formActionAffordance: "Form-ActionAffordance",
    formEventAffordance: "Form-EventAffordance",
    additionalExpectedResponse: "AdditionalExpectedResponse",
    dataSchema: "DataSchema",
    propertyAffordance: "PropertyAffordance",
    actionAffordance: "ActionAffordance",
    basicSecuritySchema: "BasicSecuritySchema",
    digestSecurityScheme: "DigestSecurityScheme",
    bearerSecurityScheme: "BearerSecurityScheme",
    apiKeySecurityScheme: "APIKeySecurityScheme",
};

module.exports = { defaultLookup, defaultClasses };
