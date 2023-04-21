/* 
 *   Copyright (c) 2023 Contributors to the Eclipse Foundation
 *   
 *   See the NOTICE file(s) distributed with this work for additional
 *   information regarding copyright ownership.
 *   
 *   This program and the accompanying materials are made available under the
 *   terms of the Eclipse Public License v. 2.0 which is available at
 *   http://www.eclipse.org/legal/epl-2.0, or the W3C Software Notice and
 *   Document License (2015-05-13) which is available at
 *   https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document.
 *   
 *   SPDX-License-Identifier: EPL-2.0 OR W3C-20150513
 */

module.exports = { mapSecurity, mapSecurityString, mapSecurityDefinitions, hasNoSec, mapFormSecurity };

/**
 * Convert the TD security Definitions and Security to
 * openAPI components->securitySchemes and security objects
 * @param {object} tdDefinitions the definitions for all security schemes of the TD
 * @param {string|string[]} tdSecurity security scheme names that apply per default
 */
function mapSecurity(tdDefinitions, tdSecurity) {
    const { securitySchemes, scopes } = mapSecurityDefinitions(tdDefinitions);
    const security = mapSecurityString(tdSecurity, securitySchemes, scopes);

    if (security.length === 0 && hasNoSec(tdDefinitions, tdSecurity)) {
        security.push({});
    }

    for (const key in securitySchemes) {
        if (key.includes("combo_sc")) {
            delete securitySchemes[key];
        }
    }

    return { securitySchemes, security };
}

/**
 * Convert the TD security and scopes information of a single form
 * to an openAPI security object
 * @param {object} tdDefinitions the definitions for all security schemes of the TD
 * @param {string|string[]|undefined} tdSecurity security scheme names that apply to this form
 * @param {string|string[]|undefined} tdFormScopes oauth2 scopes that apply to this form
 */
function mapFormSecurity(tdDefinitions, tdSecurity, tdFormScopes) {
    const { securitySchemes, scopes } = mapSecurityDefinitions(tdDefinitions);
    let oapScopes = scopes;
    if (typeof tdFormScopes === "string") {
        tdFormScopes = [tdFormScopes];
    }

    if (typeof tdFormScopes === "object") {
        const scopeSecurities = [];
        // filter TD scopes that are not supported by the conversion
        oapScopes = {};

        Object.keys(scopes).forEach((supportedSecurity) => {
            scopeSecurities.push(supportedSecurity);
            const addScope = tdFormScopes.find((tdFormScope) =>
                scopes[supportedSecurity].some((supportedScope) => supportedScope === tdFormScope)
            );
            if (addScope !== undefined) {
                if (oapScopes[supportedSecurity] === undefined) {
                    oapScopes[supportedSecurity] = [addScope];
                } else {
                    oapScopes[supportedSecurity].push(addScope);
                }
            }
        });

        // add security scheme names if only a scope was given in the TD
        scopeSecurities.forEach((scopeSecurity) => {
            if (typeof tdSecurity === "string") {
                tdSecurity = [tdSecurity];
            }
            if (typeof tdSecurity === "object") {
                if (!tdSecurity.some((tdSecString) => tdSecString === scopeSecurity)) {
                    tdSecurity.push(scopeSecurity);
                }
            } else if (tdSecurity === undefined) {
                tdSecurity = scopeSecurities;
            }
        });
    }
    const security = mapSecurityString(tdSecurity, securitySchemes, oapScopes);

    if (security.length === 0 && hasNoSec(tdDefinitions, tdSecurity)) {
        security.push({});
    }

    return { security };
}

/**
 * Mapping the TD security object to openAPI
 * @param {object} tdSecurity the TD security options to apply
 * @param {object} oapSecuritySchemes the already mapped security schemes
 * @param {object} tdScopes the found scopes as map {string: string[]}
 */
function mapSecurityString(tdSecurity, oapSecuritySchemes, tdScopes) {
    const oapSecurityContainer = [];

    if (typeof tdSecurity === "string") {
        tdSecurity = [tdSecurity];
    }

    if (typeof tdSecurity === "object") {
        tdSecurity.forEach((tdSecurityKey) => {
            let oapSecurity = {};
            const securityObject = oapSecuritySchemes[tdSecurityKey];

            if (securityObject && securityObject.type === "allOf") {
                securityObject.secdef.forEach((def) => {
                    // get scopes
                    let thisScopes = [];
                    if (tdScopes[def] !== undefined) {
                        thisScopes = tdScopes[def];
                    }

                    const supportedSchemes = Object.keys(oapSecuritySchemes);

                    if (supportedSchemes.some((supportedScheme) => supportedScheme === def)) {
                        oapSecurity[def] = thisScopes;
                    }
                });

                if (Object.keys(oapSecurity).length > 0) {
                    oapSecurityContainer.push(oapSecurity);
                }
            } else if (securityObject && securityObject.type === "oneOf") {
                securityObject.secdef.forEach((def) => {
                    oapSecurity = {};
                    // get scopes
                    let thisScopes = [];
                    if (tdScopes[def] !== undefined) {
                        thisScopes = tdScopes[def];
                    }

                    const supportedSchemes = Object.keys(oapSecuritySchemes);

                    if (supportedSchemes.some((supportedScheme) => supportedScheme === def)) {
                        oapSecurity[def] = thisScopes;
                    }

                    if (Object.keys(oapSecurity).length > 0) {
                        oapSecurityContainer.push(oapSecurity);
                    }
                });
            } else {
                // get scopes
                let thisScopes = [];
                if (tdScopes[tdSecurityKey] !== undefined) {
                    thisScopes = tdScopes[tdSecurityKey];
                }

                const supportedSchemes = Object.keys(oapSecuritySchemes);

                if (supportedSchemes.some((supportedScheme) => supportedScheme === tdSecurityKey)) {
                    oapSecurity[tdSecurityKey] = thisScopes;
                }

                if (Object.keys(oapSecurity).length > 0) {
                    oapSecurityContainer.push(oapSecurity);
                }
            }
        });
    }

    return oapSecurityContainer;
}

/**
 * Map the TD security definitions to
 * openAPI security Schemes in components
 * and return all used scopes in addition
 * @param {object|undefined} tdDefinitions if no object is given, empty securitySchemes and scopes are returned
 */
function mapSecurityDefinitions(tdDefinitions) {
    const securitySchemes = {};
    const scopes = {};

    if (typeof tdDefinitions === "object") {
        Object.keys(tdDefinitions).forEach((key) => {
            if (typeof tdDefinitions[key].scheme === "string") {
                const { oapDefinition, scope } = genOapDefinition(tdDefinitions[key]);
                if (Object.keys(oapDefinition).length > 0) {
                    securitySchemes[key] = oapDefinition;
                    if (typeof scope === "object") {
                        scopes[key] = scope;
                    }
                }
            }
        });
    }

    return { securitySchemes, scopes };
}

/**
 * Generate an openAPI securityScheme part from a given TD security definiton part
 * @param {object} tdDefinition one security definition object
 */
function genOapDefinition(tdDefinition) {
    const oapDefinition = {};
    const tdScheme = tdDefinition.scheme.toLowerCase();
    let addOptionals = true;
    const httpSchemes = ["basic", "digest", "bearer"];
    let scope;

    if (httpSchemes.some((httpScheme) => httpScheme === tdScheme)) {
        oapDefinition.type = "http";
        oapDefinition.scheme = tdScheme;
        if (tdDefinition.in && tdDefinition.in !== "header") {
            throw new Error("Cannot represent " + tdScheme + " authentication outside the header in openAPI");
        }
    }

    switch (tdScheme) {
        case "nosec":
        case "basic":
        case "psk":
            // do nothing?
            break;

        case "digest":
            oapDefinition["x-qop"] = tdDefinition.qop === undefined ? "auth" : tdDefinition.qop;
            break;

        case "bearer":
            oapDefinition.bearerFormat = tdDefinition.format === undefined ? "jwt" : tdDefinition.format;
            oapDefinition["x-alg"] = tdDefinition.alg === undefined ? "ES256" : tdDefinition.alg;
            break;

        case "apikey":
            oapDefinition.type = "apiKey";
            oapDefinition.in = tdDefinition.in === undefined ? "query" : tdDefinition.in;
            oapDefinition.name = tdDefinition.name === undefined ? "UNKNOWN" : tdDefinition.name;
            if (oapDefinition.in === "body") {
                throw new Error("Cannot represent ApiKey in `body` with openAPI");
            }
            break;

        case "oauth2":
            if (typeof tdDefinition.scopes === "string") {
                scope = [tdDefinition.scopes];
            } else if (typeof tdDefinition.scopes === "object") {
                scope = tdDefinition.scopes;
            }

            oapDefinition.type = "oauth2";
            oapDefinition.flows = genOAuthFlows(tdDefinition);
            break;

        case "combo":
            // todo  Implement combo security scheme
            if (tdDefinition.allOf) {
                oapDefinition.type = "allOf";
                oapDefinition.secdef = tdDefinition.allOf;
            } else {
                oapDefinition.type = "oneOf";
                oapDefinition.secdef = tdDefinition.oneOf;
            }
            break;

        default:
            console.log("unknown security definition: " + tdScheme);
            addOptionals = false;
    }

    // add optional fields
    if (addOptionals) {
        if (tdDefinition.description) {
            oapDefinition.description = tdDefinition.description;
        }
        if (tdDefinition.descriptions) {
            oapDefinition["x-descriptions"] = tdDefinition.descriptions;
        }
        if (tdDefinition.proxy) {
            oapDefinition["x-proxy"] = tdDefinition.proxy;
        }
    }

    return { oapDefinition, scope };
}

/**
 * Map the oauth2 fields of a TD to an openAPI instance
 * @param {object} tdDefinition The security definition object of a TD
 */
function genOAuthFlows(tdDefinition) {
    const oapFlow = {};
    if (typeof tdDefinition.flow !== "string") {
        throw new Error("the oauth2 object has no flow of type string");
    }

    const tdFlow = tdDefinition.flow.toLowerCase();
    const mapTdToOap = {
        implicit: ["implicit"],
        password: ["password", "ropc"],
        clientCredentials: ["application", "client", "clientcredentials", "clientcredential"],
        authorizationCode: ["accesscode", "code", "authorizationcode"],
        "x-device": ["device"],
    };

    Object.keys(mapTdToOap).forEach((key) => {
        if (mapTdToOap[key].some((arrayElement) => arrayElement === tdFlow)) {
            const protoFlow = {};
            if (key === "implicit" || key === "authorizationCode" || key === "x-device") {
                if (tdDefinition.authorization === undefined) {
                    throw new Error("the authorization URI is required for oauth2 flow: " + key);
                } else {
                    protoFlow.authorizationUrl = tdDefinition.authorization;
                }
            }
            if (
                key === "password" ||
                key === "clientCredentials" ||
                key === "authorizationCode" ||
                key === "x-device"
            ) {
                if (tdDefinition.token === undefined) {
                    throw new Error("the token URI is required for oauth2 flow: " + key);
                } else {
                    protoFlow.tokenUrl = tdDefinition.token;
                }
            }
            if (typeof tdDefinition.refresh === "string") {
                protoFlow.refreshUrl = tdDefinition.refresh;
            }
            if (tdDefinition.scopes === undefined) {
                protoFlow.scopes = {
                    /* "default": "autogenerated default scope" */
                }; // TODO: is one scope required? (I don't think so)
            } else {
                protoFlow.scopes = {};
                if (typeof tdDefinition.scopes === "string") {
                    tdDefinition.scopes = [tdDefinition.scopes];
                }
                tdDefinition.scopes.forEach((scope) => {
                    protoFlow.scopes[scope] = "";
                });
            }
            oapFlow[key] = protoFlow;
        }
    });
    return oapFlow;
}

/**
 * Check if all applying security schemes are of type nosec
 * @param {object} tdDefinitions the definitions for all security schemes of the TD
 * @param {string|string[]} tdSecurity security scheme names that apply to this TD part
 */
function hasNoSec(tdDefinitions, tdSecurity) {
    let foundNoSec = false;

    // find all noSec names
    const noSecNames = [];
    if (typeof tdDefinitions === "object") {
        Object.keys(tdDefinitions).forEach((key) => {
            const tdScheme = tdDefinitions[key].scheme;
            if (typeof tdScheme === "string" && tdScheme.toLowerCase() === "nosec") {
                noSecNames.push(key);
            }
        });
    }

    if (typeof tdSecurity === "string") {
        tdSecurity = [tdSecurity];
    }
    if (typeof tdSecurity === "undefined") {
        tdSecurity = [];
    }

    // check if all security Schemes are of type noSec
    if (tdSecurity.length > 0) {
        foundNoSec = tdSecurity.every((securityString) => noSecNames.some((noSecName) => noSecName === securityString));
    }

    return foundNoSec;
}
