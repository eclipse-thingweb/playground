/********************************************************************************
 * Copyright (c) 2023 Contributors to the Eclipse Foundation
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
/**
 * @file Modules test for mapSecurity.js, test its functionality by hardcoded example -> expected output pairs
 */

const { mapSecurity, mapSecurityString, mapSecurityDefinitions, mapFormSecurity } = require("../src/mapSecurity");

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

const oauth2Aap = {
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
const basicAap = {
    securitySchemes: {
        basic_sc: {
            type: "http",
            scheme: "basic",
            "x-in": "header",
        },
    },
    scopes: {},
};
const digestDefinitions = {
    digest_sc: {
        scheme: "digest",
        in: "header",
        qop: "auth",
    },
};
const digestAap = {
    scopes: {},
    securitySchemes: {
        digest_sc: {
            type: "http",
            scheme: "digest",
            "x-in": "header",
            "x-qop": "auth",
        },
    },
};
const apikeyDefinitions = {
    apikey_sc: {
        scheme: "apikey",
        in: "header",
    },
};
const apikeyAap = {
    scopes: {},
    securitySchemes: {
        apikey_sc: {
            type: "httpApiKey",
            in: "header",
            name: "UNKNOWN",
        },
    },
};
const comboAllOfAap = {
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

const comboOneOfAap = {
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
            const computed = mapSecurityString(["oauth2_sc"], oauth2Aap.securitySchemes, { oauth2_sc: ["limited"] });
            const computed2 = mapSecurityString("oauth2_sc", oauth2Aap.securitySchemes, { oauth2_sc: ["limited"] });
            expect(computed).toEqual(result);
            expect(computed2).toEqual(result);
        });

        test("comboAllOf", () => {
            const result = [{ basic_sc: [], basic_sc2: [] }];
            const computed = mapSecurityString("combo_sc", comboAllOfAap.securitySchemes, {});
            expect(computed).toEqual(result);
        });

        test("comboOneOf", () => {
            const result = [{ basic_sc: [] }, { basic_sc2: [] }];
            const computed = mapSecurityString("combo_sc", comboOneOfAap.securitySchemes, {});
            expect(computed).toEqual(result);
        });
    });

    describe("mapSecurityDefinitions", () => {
        test("basic", () => {
            console.log(mapSecurityDefinitions(basicDefinitions));
            expect(mapSecurityDefinitions(basicDefinitions)).toEqual(basicAap);
        });

        test("digest", () => {
            expect(mapSecurityDefinitions(digestDefinitions)).toEqual(digestAap);
        });

        test("apikey", () => {
            expect(mapSecurityDefinitions(apikeyDefinitions)).toEqual(apikeyAap);
        });

        test("oauth2", () => {
            expect(mapSecurityDefinitions(oauth2Definitions)).toEqual(oauth2Aap);
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
                securitySchemes: oauth2Aap.securitySchemes,
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
                securitySchemes: basicAap.securitySchemes,
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
