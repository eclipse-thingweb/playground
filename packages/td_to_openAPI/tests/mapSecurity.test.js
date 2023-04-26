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
 * @file Modules test for mapSecurity.js, test its functionality by hardcoded example -> expected output pairs
 */

const { mapSecurity, mapSecurityString, mapSecurityDefinitions, hasNoSec, mapFormSecurity } = require("../mapSecurity");

// reused definitions
const oauth2Definitions = {
    oauth2_sc: {
        scheme: "oauth2",
        flow: "code",
        scopes: ["limited", "special"],
        refresh: "https://refreshServer.com/",
        token: "https://tokenServer.com/",
        authorization: "https://authServer.com/",
    },
};

const oauth2Oap = {
    securitySchemes: {
        oauth2_sc: {
            type: "oauth2",
            flows: {
                authorizationCode: {
                    authorizationUrl: "https://authServer.com/",
                    tokenUrl: "https://tokenServer.com/",
                    refreshUrl: "https://refreshServer.com/",
                    scopes: {
                        limited: "",
                        special: "",
                    },
                },
            },
        },
    },
    scopes: {
        oauth2_sc: ["limited", "special"],
    },
};

const basicDefinitions = {
    basic_sc: {
        scheme: "basic",
        in: "header",
    },
};
const basicOap = {
    securitySchemes: {
        basic_sc: {
            type: "http",
            scheme: "basic",
        },
    },
    scopes: {},
};

const comboAllOfOap = {
    securitySchemes: {
        basic_sc: {
            type: "http",
            scheme: "basic",
        },
        basic_sc2: {
            type: "http",
            scheme: "basic",
        },
        combo_sc: {
            type: "allOf",
            secdef: ["basic_sc", "basic_sc2"],
        },
    },
};

const comboOneOfOap = {
    securitySchemes: {
        basic_sc: {
            type: "http",
            scheme: "basic",
        },
        basic_sc2: {
            type: "http",
            scheme: "basic",
        },
        combo_sc: {
            type: "oneOf",
            secdef: ["basic_sc", "basic_sc2"],
        },
    },
};

const noSecDefinitions = {
    nosec_sc: {
        scheme: "nosec",
    },
};

describe("mapSecurity unit tests", () => {
    describe("mapSecurityString", () => {
        test("oauth2", () => {
            const result = [{ oauth2_sc: ["limited"] }];
            const computed = mapSecurityString(["oauth2_sc"], oauth2Oap.securitySchemes, { oauth2_sc: ["limited"] });
            const computed2 = mapSecurityString("oauth2_sc", oauth2Oap.securitySchemes, { oauth2_sc: ["limited"] });
            expect(computed).toEqual(result);
            expect(computed2).toEqual(result);
        });

        test("comboAllOf", () => {
            const result = [{ basic_sc: [], basic_sc2: [] }];
            const computed = mapSecurityString("combo_sc", comboAllOfOap.securitySchemes, {});
            expect(computed).toEqual(result);
        });

        test("comboOneOf", () => {
            const result = [{ basic_sc: [] }, { basic_sc2: [] }];
            const computed = mapSecurityString("combo_sc", comboOneOfOap.securitySchemes, {});
            expect(computed).toEqual(result);
        });
    });

    describe("mapSecurityDefinitions", () => {
        test("basic", () => {
            expect(mapSecurityDefinitions(basicDefinitions)).toEqual(basicOap);
        });

        test("oauth2", () => {
            expect(mapSecurityDefinitions(oauth2Definitions)).toEqual(oauth2Oap);
        });
    });
});

describe("mapSecurity integration tests", () => {
    describe("mapFormSecurity", () => {
        const result = { security: [{ oauth2_sc: ["limited"] }] };

        test("oauth2 single scope no security", () => {
            expect(mapFormSecurity(oauth2Definitions, undefined, ["limited"])).toEqual(result);
            expect(mapFormSecurity(oauth2Definitions, undefined, "limited")).toEqual(result);
        });
        test("oauth2 single scope with security", () => {
            const security = ["oauth2_sc"];

            expect(mapFormSecurity(oauth2Definitions, security, ["limited"])).toEqual(result);
            expect(mapFormSecurity(oauth2Definitions, security, "limited")).toEqual(result);
        });
    });

    describe("mapSecurity", () => {
        test("oauth2", () => {
            const result = {
                securitySchemes: oauth2Oap.securitySchemes,
                security: [
                    {
                        oauth2_sc: ["limited", "special"],
                    },
                ],
            };
            expect(mapSecurity(oauth2Definitions, "oauth2_sc")).toEqual(result);
        });

        test("basic", () => {
            const result = {
                securitySchemes: basicOap.securitySchemes,
                security: [
                    {
                        basic_sc: [],
                    },
                ],
            };
            expect(mapSecurity(basicDefinitions, "basic_sc")).toEqual(result);
            expect(mapSecurity(basicDefinitions, ["basic_sc"])).toEqual(result);
        });

        test("nosec", () => {
            const result = {
                securitySchemes: {},
                security: [{}],
            };
            expect(mapSecurity(noSecDefinitions, "nosec_sc")).toEqual(result);
        });

        test("empty", () => {
            const result = {
                securitySchemes: {},
                security: [],
            };
            expect(mapSecurity(noSecDefinitions, undefined)).toEqual(result);
        });
    });
});
