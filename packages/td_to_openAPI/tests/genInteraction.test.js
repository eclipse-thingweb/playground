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
 * @file Modules test for genInteraction.js, test its functionality by hardcoded example -> expected output pairs
 */

const genInteraction = require("../genInteraction");
const { genParameters } = require("../genInteraction").test;

const interactionName = "status";
const tags = ["properties"];
const interaction = {
    type: "string",
    enum: ["Standby", "Grinding", "Brewing", "Filling", "Error"],
    readOnly: true,
    forms: [
        {
            href: "http://mycoffeemaker.example.com/status",
            op: "readproperty",
            contentType: "application/json",
        },
    ],
    uriVariables: {
        p: {
            type: "integer",
            minimum: 0,
            maximum: 16,
            "@type": "iot:SomeKindOfAngle",
        },
    },
};

const correctResult = {
    interactionInfo: {
        tags: ["properties"],
        description: "",
        summary: "status",
        parameters: [
            {
                name: "p",
                in: "query",
                schema: {
                    type: "integer",
                    minimum: 0,
                    maximum: 16,
                },
                example: expect.any(Number),
            },
        ],
    },
    interactionSchemas: {
        requestSchema: {
            schema: {
                type: "string",
                enum: ["Standby", "Grinding", "Brewing", "Filling", "Error"],
                readOnly: true,
            },
            example: expect.stringMatching(/Standby|Grinding|Brewing|Filling|Error/),
        },
        responseSchema: {
            schema: {
                type: "string",
                enum: ["Standby", "Grinding", "Brewing", "Filling", "Error"],
                readOnly: true,
            },
            example: expect.stringMatching(/Standby|Grinding|Brewing|Filling|Error/),
        },
    },
};

test("genInteraction()", () => {
    const results = genInteraction(interactionName, interaction, tags);
    expect(results).toEqual(correctResult);
});

describe("genParameters()", () => {
    test("valid input", () => {
        const tdParameters = {
            id: {
                type: "string",
                description: "an element id",
            },
            angle: {
                type: "integer",
                minimum: 0,
                maximum: 16,
                "@type": "iot:SomeKindOfAngle",
            },
        };
        const oapParameters = {
            parameters: [
                {
                    name: "id",
                    in: "query",
                    description: "an element id",
                    schema: {
                        type: "string",
                    },
                    example: expect.any(String),
                },
                {
                    name: "angle",
                    in: "query",
                    schema: {
                        type: "integer",
                        minimum: 0,
                        maximum: 16,
                    },
                    example: expect.any(Number),
                },
            ],
        };
        const result = genParameters(tdParameters);
        expect(result).toEqual(oapParameters);
        expect(result.parameters[1].example).toBeGreaterThanOrEqual(0);
        expect(result.parameters[1].example).toBeLessThanOrEqual(16);
    });

    test("undefined/empty uriVariables", () => {
        expect(genParameters(undefined)).toEqual({});
        expect(genParameters({})).toEqual({});
    });
});
