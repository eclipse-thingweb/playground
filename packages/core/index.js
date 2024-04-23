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

const jsonld = require("jsonld");
const Ajv = require("ajv");
const addFormats = require("ajv-formats");
const apply = require("ajv-formats-draft2019");
const lzs = require("lz-string");
const jsYaml = require("js-yaml");

const coreAssertions = require("./shared");
const tdSchema = require("./td-schema.json");
const fullTdSchema = require("./td-schema-full.json");
const tmSchema = require("./tm-schema.json");
const builder = require("junit-report-builder");

const jsonValidator = require("json-dup-key-validator");

module.exports.tdValidator = tdValidator;
module.exports.tmValidator = tmValidator;
module.exports.propUniqueness = coreAssertions.checkPropUniqueness;
module.exports.multiLangConsistency = coreAssertions.checkMultiLangConsistency;
module.exports.checkLinksRelTypeCount = coreAssertions.checkLinksRelTypeCount;
module.exports.security = coreAssertions.checkSecurity;
module.exports.checkUriSecurity = coreAssertions.checkUriSecurity;
module.exports.compress = compress;
module.exports.decompress = decompress;
module.exports.checkTmOptionalPointer = coreAssertions.checkTmOptionalPointer;
module.exports.checkLinkedAffordances = coreAssertions.checkLinkedAffordances;
module.exports.checkLinkedStructure = coreAssertions.checkLinkedStructure;
module.exports.detectProtocolSchemes = detectProtocolSchemes;
module.exports.convertTDJsonToYaml = convertTDJsonToYaml;
module.exports.convertTDYamlToJson = convertTDYamlToJson;

// Context map to be used by the custom document loader
const contextsMap = {
	"https://www.w3.org/2022/wot/td/v1.1": {
		"@context": {
			"td": "https://www.w3.org/2019/wot/td#",
			"jsonschema": "https://www.w3.org/2019/wot/json-schema#",
			"wotsec": "https://www.w3.org/2019/wot/security#",
			"hctl": "https://www.w3.org/2019/wot/hypermedia#",
			"rdfs": "http://www.w3.org/2000/01/rdf-schema#",
			"xsd": "http://www.w3.org/2001/XMLSchema#",
			"dct": "http://purl.org/dc/terms/",
			"htv": "http://www.w3.org/2011/http#",
			"tm": "https://www.w3.org/2019/wot/tm#",
			"@vocab": "https://www.w3.org/2019/wot/td#",
			"license": {
				"@id": "http://purl.org/dc/terms/license"
			},
			"id": "@id",
			"properties": {
				"@id": "td:hasPropertyAffordance",
				"@type": "@id",
				"@container": "@index",
				"@index": "name",
				"@context": {
					"td": "https://www.w3.org/2019/wot/td#",
					"jsonschema": "https://www.w3.org/2019/wot/json-schema#",
					"wotsec": "https://www.w3.org/2019/wot/security#",
					"hctl": "https://www.w3.org/2019/wot/hypermedia#",
					"dct": "http://purl.org/dc/terms/",
					"schema": "http://schema.org/",
					"rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
					"@vocab": "https://www.w3.org/2019/wot/json-schema#",
					"DataSchema": {
						"@id": "jsonschema:DataSchema"
					},
					"readOnly": {
						"@id": "jsonschema:readOnly"
					},
					"writeOnly": {
						"@id": "jsonschema:writeOnly"
					},
					"exclusiveMaximum": {
						"@id": "jsonschema:exclusiveMaximum"
					},
					"exclusiveMinimum": {
						"@id": "jsonschema:exclusiveMinimum"
					},
					"maximum": {
						"@id": "jsonschema:maximum"
					},
					"minimum": {
						"@id": "jsonschema:minimum"
					},
					"maxItems": {
						"@id": "jsonschema:maxItems"
					},
					"minItems": {
						"@id": "jsonschema:minItems"
					},
					"contentEncoding": {
						"@id": "jsonschema:contentEncoding"
					},
					"minLength": {
						"@id": "jsonschema:minLength"
					},
					"maxLength": {
						"@id": "jsonschema:maxLength"
					},
					"pattern": {
						"@id": "jsonschema:pattern"
					},
					"contentMediaType": {
						"@id": "jsonschema:contentMediaType"
					},
					"items": {
						"@id": "jsonschema:items",
						"@type": "@id"
					},
					"required": {
						"@id": "jsonschema:required",
						"@container": "@set"
					},
					"enum": {
						"@id": "jsonschema:enum",
						"@container": "@set"
					},
					"const": {
						"@id": "jsonschema:const"
					},
					"default": {
						"@id": "jsonschema:default"
					},
					"multipleOf": {
						"@id": "jsonschema:multipleOf"
					},
					"format": {
						"@id": "jsonschema:format"
					},
					"oneOf": {
						"@id": "jsonschema:oneOf",
						"@container": "@set"
					},
					"allOf": {
						"@id": "jsonschema:allOf",
						"@container": "@set"
					},
					"anyOf": {
						"@id": "jsonschema:anyOf",
						"@container": "@set"
					},
					"type": {
						"@id": "@type"
					},
					"title": {
						"@id": "td:title",
						"@language": "en"
					},
					"titles": {
						"@id": "td:titleInLanguage",
						"@container": "@language"
					},
					"description": {
						"@id": "td:description",
						"@language": "en"
					},
					"descriptions": {
						"@id": "td:descriptionInLanguage",
						"@container": "@language"
					},
					"object": "jsonschema:ObjectSchema",
					"array": "jsonschema:ArraySchema",
					"boolean": "jsonschema:BooleanSchema",
					"string": "jsonschema:StringSchema",
					"number": "jsonschema:NumberSchema",
					"integer": "jsonschema:IntegerSchema",
					"null": "jsonschema:NullSchema",
					"properties": {
						"@id": "jsonschema:properties",
						"@container": "@index",
						"@index": "name",
						"@context": {
							"properties": {
								"@id": "jsonschema:properties",
								"@container": "@index",
								"@index": "propertyName"
							}
						}
					},
					"propertyName": {
						"@id": "jsonschema:propertyName"
					},
					"unit": {
						"@id": "schema:unitCode",
						"@type": "@vocab"
					}
				}
			},
			"actions": {
				"@id": "td:hasActionAffordance",
				"@type": "@id",
				"@container": "@index",
				"@index": "name"
			},
			"events": {
				"@id": "td:hasEventAffordance",
				"@type": "@id",
				"@container": "@index",
				"@index": "name"
			},
			"security": {
				"@id": "td:hasSecurityConfiguration",
				"@type": "xsd:string",
				"@context": {
					"td": "https://www.w3.org/2019/wot/td#",
					"jsonschema": "https://www.w3.org/2019/wot/json-schema#",
					"wotsec": "https://www.w3.org/2019/wot/security#",
					"hctl": "https://www.w3.org/2019/wot/hypermedia#",
					"dct": "http://purl.org/dc/terms/",
					"rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
					"@vocab": "https://www.w3.org/2019/wot/security#",
					"in": {
						"@id": "wotsec:in"
					},
					"name": {
						"@id": "wotsec:name"
					},
					"authorization": {
						"@id": "wotsec:authorization",
						"@type": "@id"
					},
					"token": {
						"@id": "wotsec:token",
						"@type": "@id"
					},
					"refresh": {
						"@id": "wotsec:refresh",
						"@type": "@id"
					},
					"proxy": {
						"@id": "wotsec:proxy",
						"@type": "@id"
					},
					"scopes": {
						"@id": "wotsec:scopes"
					},
					"flow": {
						"@id": "wotsec:flow"
					},
					"qop": {
						"@id": "wotsec:qop"
					},
					"alg": {
						"@id": "wotsec:alg"
					},
					"format": {
						"@id": "wotsec:format"
					},
					"identity": {
						"@id": "wotsec:identity"
					},
					"allOf": {
						"@id": "wotsec:allOf",
						"@container": "@set"
					},
					"oneOf": {
						"@id": "wotsec:oneOf",
						"@container": "@set"
					},
					"scheme": {
						"@id": "@type"
					},
					"description": {
						"@id": "td:description"
					},
					"descriptions": {
						"@id": "td:descriptionInLanguage",
						"@container": "@language"
					},
					"nosec": "wotsec:NoSecurityScheme",
					"auto": "wotsec:AutoSecurityScheme",
					"combo": "wotsec:ComboSecurityScheme",
					"basic": "wotsec:BasicSecurityScheme",
					"digest": "wotsec:DigestSecurityScheme",
					"apikey": "wotsec:APIKeySecurityScheme",
					"bearer": "wotsec:BearerSecurityScheme",
					"cert": "wotsec:CertSecurityScheme",
					"psk": "wotsec:PSKSecurityScheme",
					"public": "wotsec:PublicSecurityScheme",
					"pop": "wotsec:PoPSecurityScheme",
					"oauth2": "wotsec:OAuth2SecurityScheme",
					"uriVariables": "td:uriVariables"
				}
			},
			"schema": {
				"@id": "hctl:hasAdditionalOutputSchema",
				"@type": "@id"
			},
			"securityDefinitions": {
				"@id": "td:definesSecurityScheme",
				"@type": "@id",
				"@container": "@index",
				"@index": "hasInstanceConfiguration",
				"@context": {
					"td": "https://www.w3.org/2019/wot/td#",
					"jsonschema": "https://www.w3.org/2019/wot/json-schema#",
					"wotsec": "https://www.w3.org/2019/wot/security#",
					"hctl": "https://www.w3.org/2019/wot/hypermedia#",
					"dct": "http://purl.org/dc/terms/",
					"rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
					"@vocab": "https://www.w3.org/2019/wot/security#",
					"in": {
						"@id": "wotsec:in"
					},
					"name": {
						"@id": "wotsec:name"
					},
					"authorization": {
						"@id": "wotsec:authorization",
						"@type": "@id"
					},
					"token": {
						"@id": "wotsec:token",
						"@type": "@id"
					},
					"refresh": {
						"@id": "wotsec:refresh",
						"@type": "@id"
					},
					"proxy": {
						"@id": "wotsec:proxy",
						"@type": "@id"
					},
					"scopes": {
						"@id": "wotsec:scopes"
					},
					"flow": {
						"@id": "wotsec:flow"
					},
					"qop": {
						"@id": "wotsec:qop"
					},
					"alg": {
						"@id": "wotsec:alg"
					},
					"format": {
						"@id": "wotsec:format"
					},
					"identity": {
						"@id": "wotsec:identity"
					},
					"allOf": {
						"@id": "wotsec:allOf",
						"@container": "@set"
					},
					"oneOf": {
						"@id": "wotsec:oneOf",
						"@container": "@set"
					},
					"scheme": {
						"@id": "@type"
					},
					"description": {
						"@id": "td:description"
					},
					"descriptions": {
						"@id": "td:descriptionInLanguage",
						"@container": "@language"
					},
					"nosec": "wotsec:NoSecurityScheme",
					"auto": "wotsec:AutoSecurityScheme",
					"combo": "wotsec:ComboSecurityScheme",
					"basic": "wotsec:BasicSecurityScheme",
					"digest": "wotsec:DigestSecurityScheme",
					"apikey": "wotsec:APIKeySecurityScheme",
					"bearer": "wotsec:BearerSecurityScheme",
					"cert": "wotsec:CertSecurityScheme",
					"psk": "wotsec:PSKSecurityScheme",
					"public": "wotsec:PublicSecurityScheme",
					"pop": "wotsec:PoPSecurityScheme",
					"oauth2": "wotsec:OAuth2SecurityScheme",
					"uriVariables": "td:uriVariables"
				}
			},
			"hasInstanceConfiguration": {
				"@id": "td:hasInstanceConfiguration",
				"@type": "@id"
			},
			"schemaDefinitions": {
				"@id": "td:schemaDefinitions",
				"@type": "@id",
				"@container": "@index"
			},
			"Thing": {
				"@id": "td:Thing"
			},
			"EventAffordance": {
				"@id": "td:EventAffordance"
			},
			"name": {
				"@id": "td:name"
			},
			"profile": {
				"@id": "td:followsProfile"
			},
			"created": {
				"@id": "dct:created",
				"@type": "xsd:dateTime"
			},
			"modified": {
				"@id": "dct:modified",
				"@type": "xsd:dateTime"
			},
			"observable": {
				"@id": "td:isObservable"
			},
			"VersionInfo": {
				"@id": "td:VersionInfo"
			},
			"PropertyAffordance": {
				"@id": "td:PropertyAffordance"
			},
			"forms": {
				"@id": "td:hasForm",
				"@type": "@id",
				"@container": "@set",
				"@context": {
					"td": "https://www.w3.org/2019/wot/td#",
					"jsonschema": "https://www.w3.org/2019/wot/json-schema#",
					"wotsec": "https://www.w3.org/2019/wot/security#",
					"hctl": "https://www.w3.org/2019/wot/hypermedia#",
					"rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
					"rdfs": "http://www.w3.org/2000/01/rdf-schema#",
					"xsd": "http://www.w3.org/2001/XMLSchema#",
					"@vocab": "https://www.w3.org/2019/wot/hypermedia#",
					"Link": {
						"@id": "hctl:Link"
					},
					"Form": {
						"@id": "hctl:Form"
					},
					"scopes": {
						"@id": "wotsec:scopes"
					},
					"security": {
						"@id": "td:hasSecurityConfiguration",
						"@type": "@id"
					},
					"op": {
						"@id": "hctl:hasOperationType",
						"@type": "@vocab"
					},
					"readproperty": "td:readProperty",
					"writeproperty": "td:writeProperty",
					"observeproperty": "td:observeProperty",
					"observeallproperties": "td:observeAllProperties",
					"unobserveproperty": "td:unobserveProperty",
					"unobserveallproperties": "td:unobserveAllProperties",
					"invokeaction": "td:invokeAction",
					"queryaction": "td:queryAction",
					"queryallactions": "td:queryAllActions",
					"cancelaction": "td:cancelAction",
					"subscribeevent": "td:subscribeEvent",
					"subscribeallevents": "td:subscribeAllEvents",
					"unsubscribeevent": "td:unsubscribeEvent",
					"unsubscribeallevents": "td:unsubscribeAllEvents",
					"readallproperties": "td:readAllProperties",
					"writeallproperties": "td:writeAllProperties",
					"readmultipleproperties": "td:readMultipleProperties",
					"writemultipleproperties": "td:writeMultipleProperties",
					"subprotocol": {
						"@id": "hctl:forSubProtocol"
					},
					"contentType": {
						"@id": "hctl:forContentType"
					},
					"contentCoding": {
						"@id": "hctl:forContentCoding"
					},
					"anchor": {
						"@id": "hctl:hasAnchor",
						"@type": "@id"
					},
					"sizes": {
						"@id": "hctl:hasSizes"
					},
					"hreflang": {
						"@id": "hctl:hasHreflang"
					},
					"href": {
						"@id": "hctl:hasTarget",
						"@type": "xsd:anyURI"
					},
					"rel": {
						"@id": "hctl:hasRelationType"
					},
					"type": {
						"@id": "hctl:hintsAtMediaType"
					},
					"response": {
						"@id": "hctl:returns"
					},
					"additionalResponses": {
						"@id": "hctl:additionalReturns",
						"@container": "@set"
					},
					"schema": {
						"@id": "hctl:hasAdditionalOutputSchema",
						"@type": "@id"
					},
					"success": {
						"@id": "hctl:isSuccess"
					}
				}
			},
			"version": {
				"@id": "td:versionInfo",
				"@type": "@id"
			},
			"links": {
				"@id": "td:hasLink",
				"@type": "@id",
				"@container": "@set",
				"@context": {
					"td": "https://www.w3.org/2019/wot/td#",
					"jsonschema": "https://www.w3.org/2019/wot/json-schema#",
					"wotsec": "https://www.w3.org/2019/wot/security#",
					"hctl": "https://www.w3.org/2019/wot/hypermedia#",
					"rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
					"rdfs": "http://www.w3.org/2000/01/rdf-schema#",
					"xsd": "http://www.w3.org/2001/XMLSchema#",
					"@vocab": "https://www.w3.org/2019/wot/hypermedia#",
					"Link": {
						"@id": "hctl:Link"
					},
					"Form": {
						"@id": "hctl:Form"
					},
					"scopes": {
						"@id": "wotsec:scopes"
					},
					"security": {
						"@id": "td:hasSecurityConfiguration",
						"@type": "@id"
					},
					"op": {
						"@id": "hctl:hasOperationType",
						"@type": "@vocab"
					},
					"readproperty": "td:readProperty",
					"writeproperty": "td:writeProperty",
					"observeproperty": "td:observeProperty",
					"observeallproperties": "td:observeAllProperties",
					"unobserveproperty": "td:unobserveProperty",
					"unobserveallproperties": "td:unobserveAllProperties",
					"invokeaction": "td:invokeAction",
					"queryaction": "td:queryAction",
					"queryallactions": "td:queryAllActions",
					"cancelaction": "td:cancelAction",
					"subscribeevent": "td:subscribeEvent",
					"subscribeallevents": "td:subscribeAllEvents",
					"unsubscribeevent": "td:unsubscribeEvent",
					"unsubscribeallevents": "td:unsubscribeAllEvents",
					"readallproperties": "td:readAllProperties",
					"writeallproperties": "td:writeAllProperties",
					"readmultipleproperties": "td:readMultipleProperties",
					"writemultipleproperties": "td:writeMultipleProperties",
					"subprotocol": {
						"@id": "hctl:forSubProtocol"
					},
					"contentType": {
						"@id": "hctl:forContentType"
					},
					"contentCoding": {
						"@id": "hctl:forContentCoding"
					},
					"anchor": {
						"@id": "hctl:hasAnchor",
						"@type": "@id"
					},
					"sizes": {
						"@id": "hctl:hasSizes"
					},
					"hreflang": {
						"@id": "hctl:hasHreflang"
					},
					"href": {
						"@id": "hctl:hasTarget",
						"@type": "xsd:anyURI"
					},
					"rel": {
						"@id": "hctl:hasRelationType"
					},
					"type": {
						"@id": "hctl:hintsAtMediaType"
					},
					"response": {
						"@id": "hctl:returns"
					},
					"additionalResponses": {
						"@id": "hctl:additionalReturns",
						"@container": "@set"
					},
					"schema": {
						"@id": "hctl:hasAdditionalOutputSchema",
						"@type": "@id"
					},
					"success": {
						"@id": "hctl:isSuccess"
					}
				}
			},
			"uriVariables": {
				"@id": "td:hasUriTemplateSchema",
				"@type": "@id",
				"@container": "@index",
				"@index": "name"
			},
			"safe": {
				"@id": "td:isSafe"
			},
			"idempotent": {
				"@id": "td:isIdempotent"
			},
			"synchronous": {
				"@id": "td:isSynchronous"
			},
			"instance": {
				"@id": "td:instance",
				"@type": "xsd:string"
			},
			"model": {
				"@id": "td:model"
			},
			"InteractionAffordance": {
				"@id": "td:InteractionAffordance"
			},
			"ActionAffordance": {
				"@id": "td:ActionAffordance"
			},
			"input": {
				"@id": "td:hasInputSchema",
				"@type": "@id",
				"@context": {
					"td": "https://www.w3.org/2019/wot/td#",
					"jsonschema": "https://www.w3.org/2019/wot/json-schema#",
					"wotsec": "https://www.w3.org/2019/wot/security#",
					"hctl": "https://www.w3.org/2019/wot/hypermedia#",
					"dct": "http://purl.org/dc/terms/",
					"schema": "http://schema.org/",
					"rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
					"@vocab": "https://www.w3.org/2019/wot/json-schema#",
					"DataSchema": {
						"@id": "jsonschema:DataSchema"
					},
					"readOnly": {
						"@id": "jsonschema:readOnly"
					},
					"writeOnly": {
						"@id": "jsonschema:writeOnly"
					},
					"exclusiveMaximum": {
						"@id": "jsonschema:exclusiveMaximum"
					},
					"exclusiveMinimum": {
						"@id": "jsonschema:exclusiveMinimum"
					},
					"maximum": {
						"@id": "jsonschema:maximum"
					},
					"minimum": {
						"@id": "jsonschema:minimum"
					},
					"maxItems": {
						"@id": "jsonschema:maxItems"
					},
					"minItems": {
						"@id": "jsonschema:minItems"
					},
					"contentEncoding": {
						"@id": "jsonschema:contentEncoding"
					},
					"minLength": {
						"@id": "jsonschema:minLength"
					},
					"maxLength": {
						"@id": "jsonschema:maxLength"
					},
					"pattern": {
						"@id": "jsonschema:pattern"
					},
					"contentMediaType": {
						"@id": "jsonschema:contentMediaType"
					},
					"items": {
						"@id": "jsonschema:items",
						"@type": "@id"
					},
					"required": {
						"@id": "jsonschema:required",
						"@container": "@set"
					},
					"enum": {
						"@id": "jsonschema:enum",
						"@container": "@set"
					},
					"const": {
						"@id": "jsonschema:const"
					},
					"default": {
						"@id": "jsonschema:default"
					},
					"multipleOf": {
						"@id": "jsonschema:multipleOf"
					},
					"format": {
						"@id": "jsonschema:format"
					},
					"oneOf": {
						"@id": "jsonschema:oneOf",
						"@container": "@set"
					},
					"allOf": {
						"@id": "jsonschema:allOf",
						"@container": "@set"
					},
					"anyOf": {
						"@id": "jsonschema:anyOf",
						"@container": "@set"
					},
					"type": {
						"@id": "@type"
					},
					"title": {
						"@id": "td:title",
						"@language": "en"
					},
					"titles": {
						"@id": "td:titleInLanguage",
						"@container": "@language"
					},
					"description": {
						"@id": "td:description",
						"@language": "en"
					},
					"descriptions": {
						"@id": "td:descriptionInLanguage",
						"@container": "@language"
					},
					"object": "jsonschema:ObjectSchema",
					"array": "jsonschema:ArraySchema",
					"boolean": "jsonschema:BooleanSchema",
					"string": "jsonschema:StringSchema",
					"number": "jsonschema:NumberSchema",
					"integer": "jsonschema:IntegerSchema",
					"null": "jsonschema:NullSchema",
					"properties": {
						"@id": "jsonschema:properties",
						"@container": "@index",
						"@index": "propertyName"
					},
					"propertyName": {
						"@id": "jsonschema:propertyName"
					},
					"unit": {
						"@id": "schema:unitCode",
						"@type": "@vocab"
					}
				}
			},
			"output": {
				"@id": "td:hasOutputSchema",
				"@type": "@id",
				"@context": {
					"td": "https://www.w3.org/2019/wot/td#",
					"jsonschema": "https://www.w3.org/2019/wot/json-schema#",
					"wotsec": "https://www.w3.org/2019/wot/security#",
					"hctl": "https://www.w3.org/2019/wot/hypermedia#",
					"dct": "http://purl.org/dc/terms/",
					"schema": "http://schema.org/",
					"rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
					"@vocab": "https://www.w3.org/2019/wot/json-schema#",
					"DataSchema": {
						"@id": "jsonschema:DataSchema"
					},
					"readOnly": {
						"@id": "jsonschema:readOnly"
					},
					"writeOnly": {
						"@id": "jsonschema:writeOnly"
					},
					"exclusiveMaximum": {
						"@id": "jsonschema:exclusiveMaximum"
					},
					"exclusiveMinimum": {
						"@id": "jsonschema:exclusiveMinimum"
					},
					"maximum": {
						"@id": "jsonschema:maximum"
					},
					"minimum": {
						"@id": "jsonschema:minimum"
					},
					"maxItems": {
						"@id": "jsonschema:maxItems"
					},
					"minItems": {
						"@id": "jsonschema:minItems"
					},
					"contentEncoding": {
						"@id": "jsonschema:contentEncoding"
					},
					"minLength": {
						"@id": "jsonschema:minLength"
					},
					"maxLength": {
						"@id": "jsonschema:maxLength"
					},
					"pattern": {
						"@id": "jsonschema:pattern"
					},
					"contentMediaType": {
						"@id": "jsonschema:contentMediaType"
					},
					"items": {
						"@id": "jsonschema:items",
						"@type": "@id"
					},
					"required": {
						"@id": "jsonschema:required",
						"@container": "@set"
					},
					"enum": {
						"@id": "jsonschema:enum",
						"@container": "@set"
					},
					"const": {
						"@id": "jsonschema:const"
					},
					"default": {
						"@id": "jsonschema:default"
					},
					"multipleOf": {
						"@id": "jsonschema:multipleOf"
					},
					"format": {
						"@id": "jsonschema:format"
					},
					"oneOf": {
						"@id": "jsonschema:oneOf",
						"@container": "@set"
					},
					"allOf": {
						"@id": "jsonschema:allOf",
						"@container": "@set"
					},
					"anyOf": {
						"@id": "jsonschema:anyOf",
						"@container": "@set"
					},
					"type": {
						"@id": "@type"
					},
					"title": {
						"@id": "td:title",
						"@language": "en"
					},
					"titles": {
						"@id": "td:titleInLanguage",
						"@container": "@language"
					},
					"description": {
						"@id": "td:description",
						"@language": "en"
					},
					"descriptions": {
						"@id": "td:descriptionInLanguage",
						"@container": "@language"
					},
					"object": "jsonschema:ObjectSchema",
					"array": "jsonschema:ArraySchema",
					"boolean": "jsonschema:BooleanSchema",
					"string": "jsonschema:StringSchema",
					"number": "jsonschema:NumberSchema",
					"integer": "jsonschema:IntegerSchema",
					"null": "jsonschema:NullSchema",
					"properties": {
						"@id": "jsonschema:properties",
						"@container": "@index",
						"@index": "propertyName"
					},
					"propertyName": {
						"@id": "jsonschema:propertyName"
					},
					"unit": {
						"@id": "schema:unitCode",
						"@type": "@vocab"
					}
				}
			},
			"subscription": {
				"@id": "td:hasSubscriptionSchema",
				"@type": "@id",
				"@context": {
					"td": "https://www.w3.org/2019/wot/td#",
					"jsonschema": "https://www.w3.org/2019/wot/json-schema#",
					"wotsec": "https://www.w3.org/2019/wot/security#",
					"hctl": "https://www.w3.org/2019/wot/hypermedia#",
					"dct": "http://purl.org/dc/terms/",
					"schema": "http://schema.org/",
					"rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
					"@vocab": "https://www.w3.org/2019/wot/json-schema#",
					"DataSchema": {
						"@id": "jsonschema:DataSchema"
					},
					"readOnly": {
						"@id": "jsonschema:readOnly"
					},
					"writeOnly": {
						"@id": "jsonschema:writeOnly"
					},
					"exclusiveMaximum": {
						"@id": "jsonschema:exclusiveMaximum"
					},
					"exclusiveMinimum": {
						"@id": "jsonschema:exclusiveMinimum"
					},
					"maximum": {
						"@id": "jsonschema:maximum"
					},
					"minimum": {
						"@id": "jsonschema:minimum"
					},
					"maxItems": {
						"@id": "jsonschema:maxItems"
					},
					"minItems": {
						"@id": "jsonschema:minItems"
					},
					"contentEncoding": {
						"@id": "jsonschema:contentEncoding"
					},
					"minLength": {
						"@id": "jsonschema:minLength"
					},
					"maxLength": {
						"@id": "jsonschema:maxLength"
					},
					"pattern": {
						"@id": "jsonschema:pattern"
					},
					"contentMediaType": {
						"@id": "jsonschema:contentMediaType"
					},
					"items": {
						"@id": "jsonschema:items",
						"@type": "@id"
					},
					"required": {
						"@id": "jsonschema:required",
						"@container": "@set"
					},
					"enum": {
						"@id": "jsonschema:enum",
						"@container": "@set"
					},
					"const": {
						"@id": "jsonschema:const"
					},
					"default": {
						"@id": "jsonschema:default"
					},
					"multipleOf": {
						"@id": "jsonschema:multipleOf"
					},
					"format": {
						"@id": "jsonschema:format"
					},
					"oneOf": {
						"@id": "jsonschema:oneOf",
						"@container": "@set"
					},
					"allOf": {
						"@id": "jsonschema:allOf",
						"@container": "@set"
					},
					"anyOf": {
						"@id": "jsonschema:anyOf",
						"@container": "@set"
					},
					"type": {
						"@id": "@type"
					},
					"title": {
						"@id": "td:title",
						"@language": "en"
					},
					"titles": {
						"@id": "td:titleInLanguage",
						"@container": "@language"
					},
					"description": {
						"@id": "td:description",
						"@language": "en"
					},
					"descriptions": {
						"@id": "td:descriptionInLanguage",
						"@container": "@language"
					},
					"object": "jsonschema:ObjectSchema",
					"array": "jsonschema:ArraySchema",
					"boolean": "jsonschema:BooleanSchema",
					"string": "jsonschema:StringSchema",
					"number": "jsonschema:NumberSchema",
					"integer": "jsonschema:IntegerSchema",
					"null": "jsonschema:NullSchema",
					"properties": {
						"@id": "jsonschema:properties",
						"@container": "@index",
						"@index": "propertyName"
					},
					"propertyName": {
						"@id": "jsonschema:propertyName"
					},
					"unit": {
						"@id": "schema:unitCode",
						"@type": "@vocab"
					}
				}
			},
			"data": {
				"@id": "td:hasNotificationSchema",
				"@type": "@id",
				"@context": {
					"td": "https://www.w3.org/2019/wot/td#",
					"jsonschema": "https://www.w3.org/2019/wot/json-schema#",
					"wotsec": "https://www.w3.org/2019/wot/security#",
					"hctl": "https://www.w3.org/2019/wot/hypermedia#",
					"dct": "http://purl.org/dc/terms/",
					"schema": "http://schema.org/",
					"rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
					"@vocab": "https://www.w3.org/2019/wot/json-schema#",
					"DataSchema": {
						"@id": "jsonschema:DataSchema"
					},
					"readOnly": {
						"@id": "jsonschema:readOnly"
					},
					"writeOnly": {
						"@id": "jsonschema:writeOnly"
					},
					"exclusiveMaximum": {
						"@id": "jsonschema:exclusiveMaximum"
					},
					"exclusiveMinimum": {
						"@id": "jsonschema:exclusiveMinimum"
					},
					"maximum": {
						"@id": "jsonschema:maximum"
					},
					"minimum": {
						"@id": "jsonschema:minimum"
					},
					"maxItems": {
						"@id": "jsonschema:maxItems"
					},
					"minItems": {
						"@id": "jsonschema:minItems"
					},
					"contentEncoding": {
						"@id": "jsonschema:contentEncoding"
					},
					"minLength": {
						"@id": "jsonschema:minLength"
					},
					"maxLength": {
						"@id": "jsonschema:maxLength"
					},
					"pattern": {
						"@id": "jsonschema:pattern"
					},
					"contentMediaType": {
						"@id": "jsonschema:contentMediaType"
					},
					"items": {
						"@id": "jsonschema:items",
						"@type": "@id"
					},
					"required": {
						"@id": "jsonschema:required",
						"@container": "@set"
					},
					"enum": {
						"@id": "jsonschema:enum",
						"@container": "@set"
					},
					"const": {
						"@id": "jsonschema:const"
					},
					"default": {
						"@id": "jsonschema:default"
					},
					"multipleOf": {
						"@id": "jsonschema:multipleOf"
					},
					"format": {
						"@id": "jsonschema:format"
					},
					"oneOf": {
						"@id": "jsonschema:oneOf",
						"@container": "@set"
					},
					"allOf": {
						"@id": "jsonschema:allOf",
						"@container": "@set"
					},
					"anyOf": {
						"@id": "jsonschema:anyOf",
						"@container": "@set"
					},
					"type": {
						"@id": "@type"
					},
					"title": {
						"@id": "td:title",
						"@language": "en"
					},
					"titles": {
						"@id": "td:titleInLanguage",
						"@container": "@language"
					},
					"description": {
						"@id": "td:description",
						"@language": "en"
					},
					"descriptions": {
						"@id": "td:descriptionInLanguage",
						"@container": "@language"
					},
					"object": "jsonschema:ObjectSchema",
					"array": "jsonschema:ArraySchema",
					"boolean": "jsonschema:BooleanSchema",
					"string": "jsonschema:StringSchema",
					"number": "jsonschema:NumberSchema",
					"integer": "jsonschema:IntegerSchema",
					"null": "jsonschema:NullSchema",
					"properties": {
						"@id": "jsonschema:properties",
						"@container": "@index",
						"@index": "propertyName"
					},
					"propertyName": {
						"@id": "jsonschema:propertyName"
					},
					"unit": {
						"@id": "schema:unitCode",
						"@type": "@vocab"
					}
				}
			},
			"dataResponse": {
				"@id": "td:hasNotificationResponseSchema",
				"@type": "@id",
				"@context": {
					"td": "https://www.w3.org/2019/wot/td#",
					"jsonschema": "https://www.w3.org/2019/wot/json-schema#",
					"wotsec": "https://www.w3.org/2019/wot/security#",
					"hctl": "https://www.w3.org/2019/wot/hypermedia#",
					"dct": "http://purl.org/dc/terms/",
					"schema": "http://schema.org/",
					"rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
					"@vocab": "https://www.w3.org/2019/wot/json-schema#",
					"DataSchema": {
						"@id": "jsonschema:DataSchema"
					},
					"readOnly": {
						"@id": "jsonschema:readOnly"
					},
					"writeOnly": {
						"@id": "jsonschema:writeOnly"
					},
					"exclusiveMaximum": {
						"@id": "jsonschema:exclusiveMaximum"
					},
					"exclusiveMinimum": {
						"@id": "jsonschema:exclusiveMinimum"
					},
					"maximum": {
						"@id": "jsonschema:maximum"
					},
					"minimum": {
						"@id": "jsonschema:minimum"
					},
					"maxItems": {
						"@id": "jsonschema:maxItems"
					},
					"minItems": {
						"@id": "jsonschema:minItems"
					},
					"contentEncoding": {
						"@id": "jsonschema:contentEncoding"
					},
					"minLength": {
						"@id": "jsonschema:minLength"
					},
					"maxLength": {
						"@id": "jsonschema:maxLength"
					},
					"pattern": {
						"@id": "jsonschema:pattern"
					},
					"contentMediaType": {
						"@id": "jsonschema:contentMediaType"
					},
					"items": {
						"@id": "jsonschema:items",
						"@type": "@id"
					},
					"required": {
						"@id": "jsonschema:required",
						"@container": "@set"
					},
					"enum": {
						"@id": "jsonschema:enum",
						"@container": "@set"
					},
					"const": {
						"@id": "jsonschema:const"
					},
					"default": {
						"@id": "jsonschema:default"
					},
					"multipleOf": {
						"@id": "jsonschema:multipleOf"
					},
					"format": {
						"@id": "jsonschema:format"
					},
					"oneOf": {
						"@id": "jsonschema:oneOf",
						"@container": "@set"
					},
					"allOf": {
						"@id": "jsonschema:allOf",
						"@container": "@set"
					},
					"anyOf": {
						"@id": "jsonschema:anyOf",
						"@container": "@set"
					},
					"type": {
						"@id": "@type"
					},
					"title": {
						"@id": "td:title",
						"@language": "en"
					},
					"titles": {
						"@id": "td:titleInLanguage",
						"@container": "@language"
					},
					"description": {
						"@id": "td:description",
						"@language": "en"
					},
					"descriptions": {
						"@id": "td:descriptionInLanguage",
						"@container": "@language"
					},
					"object": "jsonschema:ObjectSchema",
					"array": "jsonschema:ArraySchema",
					"boolean": "jsonschema:BooleanSchema",
					"string": "jsonschema:StringSchema",
					"number": "jsonschema:NumberSchema",
					"integer": "jsonschema:IntegerSchema",
					"null": "jsonschema:NullSchema",
					"properties": {
						"@id": "jsonschema:properties",
						"@container": "@index",
						"@index": "propertyName"
					},
					"propertyName": {
						"@id": "jsonschema:propertyName"
					},
					"unit": {
						"@id": "schema:unitCode",
						"@type": "@vocab"
					}
				}
			},
			"cancellation": {
				"@id": "td:hasCancellationSchema",
				"@type": "@id",
				"@context": {
					"td": "https://www.w3.org/2019/wot/td#",
					"jsonschema": "https://www.w3.org/2019/wot/json-schema#",
					"wotsec": "https://www.w3.org/2019/wot/security#",
					"hctl": "https://www.w3.org/2019/wot/hypermedia#",
					"dct": "http://purl.org/dc/terms/",
					"schema": "http://schema.org/",
					"rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
					"@vocab": "https://www.w3.org/2019/wot/json-schema#",
					"DataSchema": {
						"@id": "jsonschema:DataSchema"
					},
					"readOnly": {
						"@id": "jsonschema:readOnly"
					},
					"writeOnly": {
						"@id": "jsonschema:writeOnly"
					},
					"exclusiveMaximum": {
						"@id": "jsonschema:exclusiveMaximum"
					},
					"exclusiveMinimum": {
						"@id": "jsonschema:exclusiveMinimum"
					},
					"maximum": {
						"@id": "jsonschema:maximum"
					},
					"minimum": {
						"@id": "jsonschema:minimum"
					},
					"maxItems": {
						"@id": "jsonschema:maxItems"
					},
					"minItems": {
						"@id": "jsonschema:minItems"
					},
					"contentEncoding": {
						"@id": "jsonschema:contentEncoding"
					},
					"minLength": {
						"@id": "jsonschema:minLength"
					},
					"maxLength": {
						"@id": "jsonschema:maxLength"
					},
					"pattern": {
						"@id": "jsonschema:pattern"
					},
					"contentMediaType": {
						"@id": "jsonschema:contentMediaType"
					},
					"items": {
						"@id": "jsonschema:items",
						"@type": "@id"
					},
					"required": {
						"@id": "jsonschema:required",
						"@container": "@set"
					},
					"enum": {
						"@id": "jsonschema:enum",
						"@container": "@set"
					},
					"const": {
						"@id": "jsonschema:const"
					},
					"default": {
						"@id": "jsonschema:default"
					},
					"multipleOf": {
						"@id": "jsonschema:multipleOf"
					},
					"format": {
						"@id": "jsonschema:format"
					},
					"oneOf": {
						"@id": "jsonschema:oneOf",
						"@container": "@set"
					},
					"allOf": {
						"@id": "jsonschema:allOf",
						"@container": "@set"
					},
					"anyOf": {
						"@id": "jsonschema:anyOf",
						"@container": "@set"
					},
					"type": {
						"@id": "@type"
					},
					"title": {
						"@id": "td:title",
						"@language": "en"
					},
					"titles": {
						"@id": "td:titleInLanguage",
						"@container": "@language"
					},
					"description": {
						"@id": "td:description",
						"@language": "en"
					},
					"descriptions": {
						"@id": "td:descriptionInLanguage",
						"@container": "@language"
					},
					"object": "jsonschema:ObjectSchema",
					"array": "jsonschema:ArraySchema",
					"boolean": "jsonschema:BooleanSchema",
					"string": "jsonschema:StringSchema",
					"number": "jsonschema:NumberSchema",
					"integer": "jsonschema:IntegerSchema",
					"null": "jsonschema:NullSchema",
					"properties": {
						"@id": "jsonschema:properties",
						"@container": "@index",
						"@index": "propertyName"
					},
					"propertyName": {
						"@id": "jsonschema:propertyName"
					},
					"unit": {
						"@id": "schema:unitCode",
						"@type": "@vocab"
					}
				}
			},
			"description": {
				"@id": "td:description",
				"@language": "en"
			},
			"descriptions": {
				"@id": "td:descriptionInLanguage",
				"@container": "@language"
			},
			"title": {
				"@id": "td:title",
				"@language": "en"
			},
			"titles": {
				"@id": "td:titleInLanguage",
				"@container": "@language"
			},
			"support": {
				"@id": "td:supportContact",
				"@type": "xsd:anyURI"
			},
			"base": {
				"@id": "td:baseURI"
			},
			"@version": 1.1
		}
	}
  };

// Utilize the built-in Node.js document loader
const nodeDocumentLoader = jsonld.documentLoaders.node();

// change the default document loader
const customLoader = async (url, options) => {
	if(url in contextsMap) {
		return {
		  contextUrl: null, // this is for a context via a link header
		  document: contextsMap[url], // this is the actual document that was loaded
		  documentUrl: url // this is the actual context URL after redirects
		};
	  } 
	return nodeDocumentLoader(url);
};

/**
 * A function that provides the core functionality of the TD Playground.
 * @param {string} tdString The Thing Description to check as a string.
 * @param {function} logFunc (string) => void; Callback used to log the validation progress.
 * @param {object} options additional options, which checks should be executed
 * @returns {Promise<object>} Results of the validation as {report, details, detailComments} object
 */

function tdValidator(
    tdString,
    logFunc,
    { checkDefaults = true, checkJsonLd = true, checkTmConformance = true },
    suite
) {
    return new Promise(async (res, rej) => {
        // check input
        if (typeof tdString !== "string") {
            rej("Thing Description input should be a String");
        }

        if (checkDefaults === undefined) {
            checkDefaults = true;
        }
        if (checkJsonLd === undefined) {
            checkJsonLd = true;
        }
        if (typeof logFunc !== "function") {
            rej("Expected logFunc to be a function");
        }
        if (suite === undefined) {
            suite = builder.testSuite().name("tests");
        }

        // report that is returned by the function, possible values for every property:
        // null -> not tested, "passed", "failed", "warning"
        const report = {
            json: null,
            schema: null,
            defaults: null,
            jsonld: null,
            additional: null,
        };
        // changing the two following objects implies adjusting the tests accordingly
        const details = {
            enumConst: null,
            propItems: null,
            security: null,
            propUniqueness: null,
            multiLangConsistency: null,
            linksRelTypeCount: null,
            readWriteOnly: null,
            uriVariableSecurity: null,
            linkedAffordances: null,
            linkedStructure: null,
        };

        const detailComments = {
            enumConst: "Checking whether a data schema has enum and const at the same time.",
            propItems: "Checking whether a data schema has an object but not properties or array but no items.",
            security: "Check if used Security definitions are properly defined previously.",
            propUniqueness:
                "Checking whether in one interaction pattern there are duplicate names, e.g. two properties called temp.",
            multiLangConsistency: "Checks whether all titles and descriptions have the same language fields.",
            linksRelTypeCount: "Checks whether rel:type is used more than once in the links array",
            readWriteOnly:
                "Warns if a property has readOnly or writeOnly set to true conflicting with another property.",
            uriVariableSecurity:
                "Checks if the name of an APIKey security scheme with in:uri show up in href and does not \
            conflict with normal uriVariables",
            linkedAffordances: "Check if TD has all affordances required by linked TM",
            linkedStructure: "Check if TD structure corresponds to the one imposed by linked TM",
        };

        let tdJson;
        let start = Date.now();
        try {
            tdJson = JSON.parse(tdString);
            report.json = "passed";
            const end = Date.now();
            suite
                .testCase()
                .className("tdValidator")
                .name("JSON Validation")
                .time(end - start);
        } catch (err) {
            report.json = "failed";
            logFunc("X JSON validation failed:");
            logFunc(err);
            const end = Date.now();
            suite
                .testCase()
                .className("tdValidator")
                .name("JSON Validation")
                .time(end - start)
                .failure("Not a valid JSON file");
            res({ report, details, detailComments });
        }

        start = Date.now();
        let ajv = new Ajv({ strict: false }); // options can be passed, e.g. {allErrors: true}
        ajv = addFormats(ajv); // ajv does not support formats by default anymore
        ajv = apply(ajv); // new formats that include iri

        ajv.addSchema(tdSchema, "td");
        const valid = ajv.validate("td", tdJson);
        // used to be var valid = ajv.validate('td', e.detail);
        if (valid) {
            report.schema = "passed";
            let end = Date.now();
            suite
                .testCase()
                .className("tdValidator")
                .name("Schema Validation")
                .time(end - start);

            // check with full schema
            if (checkDefaults) {
                start = Date.now();
                ajv.addSchema(fullTdSchema, "fulltd");
                const fullValid = ajv.validate("fulltd", tdJson);
                if (fullValid) {
                    report.defaults = "passed";
                    end = Date.now();
                    suite
                        .testCase()
                        .className("tdValidator")
                        .name("Defaults Validation")
                        .time(end - start);
                } else {
                    report.defaults = "warning";
                    end = Date.now();
                    suite
                        .testCase()
                        .className("tdValidator")
                        .name("Defaults Validation")
                        .time(end - start)
                        .error(ajv.errorsText(filterErrorMessages(ajv.errors)));
                    logFunc("Optional validation failed:");
                    logFunc("> " + ajv.errorsText(filterErrorMessages(ajv.errors)));
                }
            }

            // do additional checks
            start = Date.now();
            checkEnumConst(tdJson);
            checkPropItems(tdJson);
            checkReadWriteOnly(tdJson);
            details.security = evalAssertion(coreAssertions.checkSecurity(tdJson));
            details.propUniqueness = evalAssertion(coreAssertions.checkPropUniqueness(tdString));
            if (details.propUniqueness === "passed") {
                details.propUniqueness = checkSecPropUniqueness(tdString, tdJson);
            } else {
                checkSecPropUniqueness(tdString, tdJson);
            }
            details.multiLangConsistency = evalAssertion(coreAssertions.checkMultiLangConsistency(tdJson));
            details.linksRelTypeCount = evalAssertion(coreAssertions.checkLinksRelTypeCount(tdJson));
            details.uriVariableSecurity = evalAssertion(coreAssertions.checkUriSecurity(tdJson));
            if (checkTmConformance) {
                details.linkedAffordances = evalAssertion(await coreAssertions.checkLinkedAffordances(tdJson), false);
                details.linkedStructure = evalAssertion(await coreAssertions.checkLinkedStructure(tdJson), false);
            }

            // determine additional check state
            // passed + warning -> warning
            // passed AND OR warning + error -> error
            report.additional = "passed";
            Object.keys(details).forEach((prop) => {
                if (details[prop] === "warning" && report.additional === "passed") {
                    report.additional = "warning";
                } else if (details[prop] === "failed" && report.additional !== "failed") {
                    report.additional = "failed";
                }
            });
            end = Date.now();
            if (report.additional === "passed") {
                suite
                    .testCase()
                    .className("tdValidator")
                    .name("Additional Validation")
                    .time(end - start);
            } else if (report.additional === "warning") {
                suite
                    .testCase()
                    .className("tdValidator")
                    .name("Additional Validation")
                    .time(end - start)
                    .error("Warning!");
            } else {
                suite
                    .testCase()
                    .className("tdValidator")
                    .name("Additional Validation")
                    .time(end - start)
                    .failure();
            }
        } else {
            report.schema = "failed";
            const end = Date.now();
            suite
                .testCase()
                .className("tdValidator")
                .name("Schema Validation")
                .time(end - start)
                .failure(ajv.errorsText(filterErrorMessages(ajv.errors)));
            logFunc("X JSON Schema validation failed:");

            logFunc("> " + ajv.errorsText(filterErrorMessages(ajv.errors)));

            res({ report, details, detailComments });
        }

        // json ld validation
        if (checkJsonLd) {
            start = Date.now();
            jsonld
                .toRDF(tdJson, {
                    format: "application/n-quads",
                    documentLoader: customLoader,
                })
                .then(
                    (nquads) => {
                        report.jsonld = "passed";
                        const end = Date.now();
                        suite
                            .testCase()
                            .className("tdValidator")
                            .name("JSON LD Validation")
                            .time(end - start);
                        res({ report, details, detailComments });
                    },
                    (err) => {
                        report.jsonld = "failed";
                        const end = Date.now();
                        suite
                            .testCase()
                            .className("tdValidator")
                            .name("JSON LD Validation")
                            .time(end - start)
                            .failure(err);
                        logFunc("X JSON-LD validation failed:");
                        logFunc("Hint: Make sure you have internet connection available.");
                        logFunc("> " + err);
                        res({ report, details, detailComments });
                    }
                );
        } else {
            res({ report, details, detailComments });
        }

        // ************ functions ***************

        /** checking whether a data schema has enum and const at the same and displaying a warning in case there are */
        function checkEnumConst(td) {
            details.enumConst = "passed";
            if (td.hasOwnProperty("properties")) {
                // checking properties
                tdProperties = Object.keys(td.properties);
                for (let i = 0; i < tdProperties.length; i++) {
                    const curPropertyName = tdProperties[i];
                    const curProperty = td.properties[curPropertyName];
                    if (curProperty.hasOwnProperty("enum") && curProperty.hasOwnProperty("const")) {
                        details.enumConst = "warning";
                        logFunc(
                            "! Warning: In property " +
                                curPropertyName +
                                " enum and const are used at the same time, the values in enum" +
                                " can never be valid in the received JSON value"
                        );
                    }
                }
            }
            // checking actions
            if (td.hasOwnProperty("actions")) {
                tdActions = Object.keys(td.actions);
                for (let i = 0; i < tdActions.length; i++) {
                    const curActionName = tdActions[i];
                    const curAction = td.actions[curActionName];
                    if (curAction.hasOwnProperty("input")) {
                        const curInput = curAction.input;
                        if (curInput.hasOwnProperty("enum") && curInput.hasOwnProperty("const")) {
                            details.enumConst = "warning";
                            logFunc(
                                "! Warning: In the input of action " +
                                    curActionName +
                                    " enum and const are used at the same time, the values in enum can" +
                                    " never be valid in the received JSON value"
                            );
                        }
                    }
                    if (curAction.hasOwnProperty("output")) {
                        const curOutput = curAction.output;
                        if (curOutput.hasOwnProperty("enum") && curOutput.hasOwnProperty("const")) {
                            details.enumConst = "warning";
                            logFunc(
                                "! Warning: In the output of action " +
                                    curActionName +
                                    " enum and const are used at the same time, the values in enum can" +
                                    " never be valid in the received JSON value"
                            );
                        }
                    }
                }
            }
            // checking events
            if (td.hasOwnProperty("events")) {
                tdEvents = Object.keys(td.events);
                for (let i = 0; i < tdEvents.length; i++) {
                    const curEventName = tdEvents[i];
                    const curEvent = td.events[curEventName];
                    if (curEvent.hasOwnProperty("enum") && curEvent.hasOwnProperty("const")) {
                        details.enumConst = "warning";
                        logFunc(
                            "! Warning: In event " +
                                curEventName +
                                " enum and const are used at the same time, the" +
                                " values in enum can never be valid in the received JSON value"
                        );
                    }
                }
            }
            return;
        }

        /**
         * checking whether a data schema has object but not properties, array but no items
         * @param {object} td The TD under test
         */
        function checkPropItems(td) {
            details.propItems = "passed";

            if (td.hasOwnProperty("properties")) {
                // checking properties
                tdProperties = Object.keys(td.properties);
                for (let i = 0; i < tdProperties.length; i++) {
                    const curPropertyName = tdProperties[i];
                    const curProperty = td.properties[curPropertyName];

                    if (curProperty.hasOwnProperty("type")) {
                        if (curProperty.type === "object" && !curProperty.hasOwnProperty("properties")) {
                            details.propItems = "warning";
                            logFunc(
                                "! Warning: In property " +
                                    curPropertyName +
                                    ", the type is object but its properties are not specified"
                            );
                        }
                        if (curProperty.type === "array" && !curProperty.hasOwnProperty("items")) {
                            details.propItems = "warning";
                            logFunc(
                                "! Warning: In property " +
                                    curPropertyName +
                                    ", the type is array but its items are not specified"
                            );
                        }
                    }
                }
            }
            // checking actions
            if (td.hasOwnProperty("actions")) {
                tdActions = Object.keys(td.actions);
                for (let i = 0; i < tdActions.length; i++) {
                    const curActionName = tdActions[i];
                    const curAction = td.actions[curActionName];

                    if (curAction.hasOwnProperty("input")) {
                        const curInput = curAction.input;
                        if (curInput.hasOwnProperty("type")) {
                            if (curInput.type === "object" && !curInput.hasOwnProperty("properties")) {
                                details.propItems = "warning";
                                logFunc(
                                    "! Warning: In the input of action " +
                                        curActionName +
                                        ", the type is object but its properties are not specified"
                                );
                            }
                            if (curInput.type === "array" && !curInput.hasOwnProperty("items")) {
                                details.propItems = "warning";
                                logFunc(
                                    "! Warning: In the output of action " +
                                        curActionName +
                                        ", the type is array but its items are not specified"
                                );
                            }
                        }
                    }
                    if (curAction.hasOwnProperty("output")) {
                        const curOutput = curAction.output;
                        if (curOutput.hasOwnProperty("type")) {
                            if (curOutput.type === "object" && !curOutput.hasOwnProperty("properties")) {
                                details.propItems = "warning";
                                logFunc(
                                    "! Warning: In the output of action " +
                                        curActionName +
                                        ", the type is object but its properties are not specified"
                                );
                            }
                            if (curOutput.type === "array" && !curOutput.hasOwnProperty("items")) {
                                details.propItems = "warning";
                                logFunc(
                                    "! Warning: In the output of action " +
                                        curActionName +
                                        ", the type is array but its items are not specified"
                                );
                            }
                        }
                    }
                }
            }
            // checking events
            if (td.hasOwnProperty("events")) {
                tdEvents = Object.keys(td.events);
                for (let i = 0; i < tdEvents.length; i++) {
                    const curEventName = tdEvents[i];
                    const curEvent = td.events[curEventName];

                    if (curEvent.hasOwnProperty("type")) {
                        if (curEvent.type === "object" && !curEvent.hasOwnProperty("properties")) {
                            details.propItems = "warning";
                            logFunc(
                                "! Warning: In event " +
                                    curEventName +
                                    ", the type is object but its properties are not specified"
                            );
                        }
                        if (curEvent.type === "array" && !curEvent.hasOwnProperty("items")) {
                            details.propItems = "warning";
                            logFunc(
                                "! Warning: In event " +
                                    curEventName +
                                    ", the type is array but its items are not specified"
                            );
                        }
                    }
                }
            }
            return;
        }

        /**
         * Warns if a property has readOnly or writeOnly set to true conflicting with another property.
         * @param {object} td The TD under test
         */
        function checkReadWriteOnly(td) {
            details.readWriteOnly = "passed";

            if (td.hasOwnProperty("properties")) {
                // checking properties
                tdProperties = Object.keys(td.properties);
                for (let i = 0; i < tdProperties.length; i++) {
                    const curPropertyName = tdProperties[i];
                    const curProperty = td.properties[curPropertyName];

                    // if readOnly is set
                    if (curProperty.hasOwnProperty("readOnly") && curProperty.readOnly === true) {
                        // check if both readOnly and writeOnly are true
                        if (curProperty.hasOwnProperty("writeOnly") && curProperty.writeOnly === true) {
                            details.readWriteOnly = "warning";
                            logFunc(
                                "! Warning: In property " +
                                    curPropertyName +
                                    ", both readOnly and writeOnly are set to true!"
                            );
                        }

                        // check forms if op writeProperty is set
                        if (curProperty.hasOwnProperty("forms")) {
                            for (const formElIndex in curProperty.forms) {
                                if (curProperty.forms.hasOwnProperty(formElIndex)) {
                                    const formEl = curProperty.forms[formElIndex];
                                    if (formEl.hasOwnProperty("op")) {
                                        if (
                                            (typeof formEl.op === "string" && formEl.op === "writeproperty") ||
                                            (typeof formEl.op === "object" &&
                                                formEl.op.some((el) => el === "writeproperty"))
                                        ) {
                                            details.readWriteOnly = "warning";
                                            logFunc(
                                                "! Warning: In property " +
                                                    curPropertyName +
                                                    " in forms[" +
                                                    formElIndex +
                                                    '], readOnly is set but the op property contains "writeproperty"'
                                            );
                                        }
                                    } else {
                                        details.readWriteOnly = "warning";
                                        logFunc(
                                            "! Warning: In property " +
                                                curPropertyName +
                                                " in forms[" +
                                                formElIndex +
                                                '], readOnly is set but a form op property defaults to ["writeproperty", "readproperty"]'
                                        );
                                    }
                                }
                            }
                        }
                    }

                    // if writeOnly is set
                    if (curProperty.hasOwnProperty("writeOnly") && curProperty.writeOnly === true) {
                        // check forms if op readProperty is set
                        if (curProperty.hasOwnProperty("forms")) {
                            for (const formElIndex in curProperty.forms) {
                                if (curProperty.forms.hasOwnProperty(formElIndex)) {
                                    const formEl = curProperty.forms[formElIndex];
                                    if (formEl.hasOwnProperty("op")) {
                                        if (
                                            (typeof formEl.op === "string" && formEl.op === "readproperty") ||
                                            (typeof formEl.op === "object" &&
                                                formEl.op.some((el) => el === "readproperty"))
                                        ) {
                                            details.readWriteOnly = "warning";
                                            logFunc(
                                                "! Warning: In property " +
                                                    curPropertyName +
                                                    " in forms[" +
                                                    formElIndex +
                                                    '], writeOnly is set but the op property contains "readproperty"'
                                            );
                                        } else if (
                                            (typeof formEl.op === "string" && formEl.op === "observeproperty") ||
                                            (typeof formEl.op === "object" &&
                                                formEl.op.some((el) => el === "observeproperty"))
                                        ) {
                                            details.readWriteOnly = "warning";
                                            logFunc(
                                                "! Warning: In property " +
                                                    curPropertyName +
                                                    " in forms[" +
                                                    formElIndex +
                                                    '], writeOnly is set but the op property contains "observeproperty"'
                                            );
                                        }
                                    } else {
                                        details.readWriteOnly = "warning";
                                        logFunc(
                                            "! Warning: In property " +
                                                curPropertyName +
                                                " in forms[" +
                                                formElIndex +
                                                '], writeOnly is set but a form op property defaults to ["writeproperty", "readproperty"]'
                                        );
                                    }
                                }
                            }
                        }

                        // check if observable is also set
                        if (curProperty.hasOwnProperty("observable") && curProperty.observable === true) {
                            details.readWriteOnly = "warning";
                            logFunc(
                                "! Warning: In property " +
                                    curPropertyName +
                                    ", both writeOnly and observable are set to true!"
                            );
                        }
                    }
                }
            }
        }

        /**
         * Warns if security Definitions has no unique keys
         * @param {object} tdStr The TD under test as string
         */
        function checkSecPropUniqueness(tdStr, td) {
            let result = "passed";
            try {
                // checking whether there are securityDefinitions at all
                jsonValidator.parse(tdStr, false);
            } catch (error) {
                // there is a duplicate somewhere

                // convert it into string to be able to process it
                // error is of form = Error: Syntax error: duplicated keys "overheating" near ting": {
                const errorString = error.toString();
                // to get the name, we need to remove the quotes around it
                const startQuote = errorString.indexOf('"');
                // slice to remove the part before the quote
                const restString = errorString.slice(startQuote + 1);
                // find where the interaction name ends
                const endQuote = restString.indexOf('"');
                // finally get the interaction name
                const securitySchemeName = restString.slice(0, endQuote);

                if (td.securityDefinitions.hasOwnProperty(securitySchemeName)) {
                    result = "failed";
                    logFunc("KO Error: The securityDefinitions contain a duplicate");
                }
            }

            return result;
        }

        /**
         * Evaluates whether an assertion function contains a failed check
         * Whether assertions are not-implemented/passed or return warning
         * matters depending on the failOnly flag
         * Logs the comment
         * @param {Array} results Array of objects with props "ID", "Status" and optionally "Comment"
         * @returns string status like passed/fail/warning/not-impl
         */
        function evalAssertion(results, failOnly = true) {
            let out = "passed";
            results.forEach((resultobj) => {
                if (resultobj.Status === "fail") {
                    out = "failed";
                    logFunc("KO Error: Assertion: " + resultobj.ID);
                    logFunc(resultobj.Comment);
                } else if (!failOnly && resultobj.Status !== "pass") {
                    out = resultobj.Status;
                    logFunc(
                        `Assertion: ${resultobj.ID}: ${resultobj.Status}${
                            resultobj.Comment ? " => " + resultobj.Comment : ""
                        }`
                    );
                }
            });
            return out;
        }

        /**
         * Removes duplicate error messages, as these are produced
         * otherwise, especially for "oneOf" schemes
         * @param {ajv.ErrorObject[]} errors
         */
        function filterErrorMessages(errors) {
            const output = [];
            errors.forEach((el) => {
                if (!output.some((ce) => ce.dataPath === el.dataPath && ce.message === el.message)) {
                    output.push(el);
                }
            });
            return output;
        }
    });
}

/**
 * A function that provides the core functionality of the TD Playground.
 * @param {string} tmString The Thing Model to check as a string.
 * @param {function} logFunc (string) => void; Callback used to log the validation progress.
 * @param {object} options additional options, which checks should be executed
 * @returns {Promise<object>} Results of the validation as {report, details, detailComments} object
 */
function tmValidator(tmString, logFunc, { checkDefaults = true, checkJsonLd = true }, suite) {
    return new Promise((res, rej) => {
        // check input
        if (typeof tmString !== "string") {
            rej("Thing Model input should be a String");
        }

        if (checkDefaults === undefined) {
            checkDefaults = true;
        }
        if (checkJsonLd === undefined) {
            checkJsonLd = true;
        }
        if (typeof logFunc !== "function") {
            rej("Expected logFunc to be a function");
        }
        if (suite === undefined) {
            suite = builder.testSuite().name("tests");
        }

        // report that is returned by the function, possible values for every property:
        // null -> not tested, "passed", "failed", "warning"
        const report = {
            json: null,
            schema: null,
            defaults: null,
            jsonld: null,
            additional: null,
        };
        // changing the two following objects implies adjusting the tests accordingly
        const details = {
            enumConst: null,
            propItems: null,
            propUniqueness: null,
            multiLangConsistency: null,
            linksRelTypeCount: null,
            readWriteOnly: null,
            tmOptionalPointer: null,
        };

        const detailComments = {
            enumConst: "Checking whether a data schema has enum and const at the same time.",
            propItems: "Checking whether a data schema has an object but not properties or array but no items.",
            propUniqueness:
                "Checking whether in one interaction pattern there are duplicate names, e.g. two properties called temp.",
            multiLangConsistency: "Checks whether all titles and descriptions have the same language fields.",
            linksRelTypeCount: "Checks whether rel:type is used more than once in the links array",
            readWriteOnly:
                "Warns if a property has readOnly or writeOnly set to true conflicting with another property.",
            tmOptionalPointer: "Checking whether tm:optional points to an actual affordance",
        };

        let start = Date.now();
        let tmJson;
        try {
            tmJson = JSON.parse(tmString);
            report.json = "passed";
            const end = Date.now();
            suite
                .testCase()
                .className("tdValidator")
                .name("JSON Validation")
                .time(end - start);
        } catch (err) {
            report.json = "failed";
            logFunc("X JSON validation failed:");
            logFunc(err);
            const end = Date.now();
            suite
                .testCase()
                .className("tdValidator")
                .name("JSON Validation")
                .time(end - start)
                .failure("Not a valid JSON file");
            res({ report, details, detailComments });
        }

        start = Date.now();
        let ajv = new Ajv({ strict: false }); // options can be passed, e.g. {allErrors: true}
        ajv = addFormats(ajv); // ajv does not support formats by default anymore
        ajv = apply(ajv); // new formats that include iri

        ajv.addSchema(tmSchema, "tm");
        const valid = ajv.validate("tm", tmJson);
        // used to be var valid = ajv.validate('td', e.detail);
        if (valid) {
            report.schema = "passed";
            let end = Date.now();
            suite
                .testCase()
                .className("tdValidator")
                .name("Schema Validation")
                .time(end - start);

            // do additional checks
            checkEnumConst(tmJson);
            checkPropItems(tmJson);
            checkReadWriteOnly(tmJson);
            // ! no need to do security checking
            // details.security = evalAssertion(coreAssertions.checkSecurity(tmJson))
            details.propUniqueness = evalAssertion(coreAssertions.checkPropUniqueness(tmString));
            if (details.propUniqueness === "passed") {
                details.propUniqueness = checkSecPropUniqueness(tmString, tmJson);
            } else {
                checkSecPropUniqueness(tmString, tmJson);
            }
            details.multiLangConsistency = evalAssertion(coreAssertions.checkMultiLangConsistency(tmJson));
            details.linksRelTypeCount = evalAssertion(coreAssertions.checkLinksRelTypeCount(tmJson));
            details.tmOptionalPointer = evalAssertion(coreAssertions.checkTmOptionalPointer(tmJson));

            // determine additional check state
            // passed + warning -> warning
            // passed AND OR warning + error -> error
            report.additional = "passed";
            Object.keys(details).forEach((prop) => {
                if (details[prop] === "warning" && report.additional === "passed") {
                    report.additional = "warning";
                } else if (details[prop] === "failed" && report.additional !== "failed") {
                    report.additional = "failed";
                }
            });
            end = Date.now();
            if (report.additional === "passed") {
                suite
                    .testCase()
                    .className("tmValidator")
                    .name("Additional Validation")
                    .time(end - start);
            } else if (report.additional === "warning") {
                suite
                    .testCase()
                    .className("tmValidator")
                    .name("Additional Validation")
                    .time(end - start)
                    .error("Warning!");
            } else {
                suite
                    .testCase()
                    .className("tmValidator")
                    .name("Additional Validation")
                    .time(end - start)
                    .failure();
            }
        } else {
            report.schema = "failed";
            const end = Date.now();
            suite
                .testCase()
                .className("tdValidator")
                .name("Schema Validation")
                .time(end - start)
                .failure(ajv.errorsText(filterErrorMessages(ajv.errors)));
            logFunc("X JSON Schema validation failed:");

            logFunc("> " + ajv.errorsText(filterErrorMessages(ajv.errors)));

            res({ report, details, detailComments });
        }

        // json ld validation
        if (checkJsonLd) {
            start = Date.now();
            jsonld
                .toRDF(tmJson, {
                    format: "application/n-quads",
                    documentLoader: customLoader,
                })
                .then(
                    (nquads) => {
                        report.jsonld = "passed";
                        const end = Date.now();
                        suite
                            .testCase()
                            .className("tdValidator")
                            .name("JSON LD Validation")
                            .time(end - start);
                        res({ report, details, detailComments });
                    },
                    (err) => {
                        report.jsonld = "failed";
                        const end = Date.now();
                        suite
                            .testCase()
                            .className("tdValidator")
                            .name("JSON LD Validation")
                            .time(end - start)
                            .failure(err);
                        logFunc("X JSON-LD validation failed:");
                        logFunc("Hint: Make sure you have internet connection available.");
                        logFunc("> " + err);
                        res({ report, details, detailComments });
                    }
                );
        } else {
            res({ report, details, detailComments });
        }

        // ************ functions ***************

        /** checking whether a data schema has enum and const at the same and displaying a warning in case there are */
        function checkEnumConst(tm) {
            details.enumConst = "passed";
            if (tm.hasOwnProperty("properties")) {
                // checking properties
                tmProperties = Object.keys(tm.properties);
                for (let i = 0; i < tmProperties.length; i++) {
                    const curPropertyName = tmProperties[i];
                    const curProperty = tm.properties[curPropertyName];
                    if (curProperty.hasOwnProperty("enum") && curProperty.hasOwnProperty("const")) {
                        details.enumConst = "warning";
                        logFunc(
                            "! Warning: In property " +
                                curPropertyName +
                                " enum and const are used at the same time, the values in enum" +
                                " can never be valid in the received JSON value"
                        );
                    }
                }
            }
            // checking actions
            if (tm.hasOwnProperty("actions")) {
                tmActions = Object.keys(tm.actions);
                for (let i = 0; i < tmActions.length; i++) {
                    const curActionName = tmActions[i];
                    const curAction = tm.actions[curActionName];
                    if (curAction.hasOwnProperty("input")) {
                        const curInput = curAction.input;
                        if (curInput.hasOwnProperty("enum") && curInput.hasOwnProperty("const")) {
                            details.enumConst = "warning";
                            logFunc(
                                "! Warning: In the input of action " +
                                    curActionName +
                                    " enum and const are used at the same time, the values in enum can" +
                                    " never be valid in the received JSON value"
                            );
                        }
                    }
                    if (curAction.hasOwnProperty("output")) {
                        const curOutput = curAction.output;
                        if (curOutput.hasOwnProperty("enum") && curOutput.hasOwnProperty("const")) {
                            details.enumConst = "warning";
                            logFunc(
                                "! Warning: In the output of action " +
                                    curActionName +
                                    " enum and const are used at the same time, the values in enum can" +
                                    " never be valid in the received JSON value"
                            );
                        }
                    }
                }
            }
            // checking events
            if (tm.hasOwnProperty("events")) {
                tmEvents = Object.keys(tm.events);
                for (let i = 0; i < tmEvents.length; i++) {
                    const curEventName = tmEvents[i];
                    const curEvent = tm.events[curEventName];
                    if (curEvent.hasOwnProperty("enum") && curEvent.hasOwnProperty("const")) {
                        details.enumConst = "warning";
                        logFunc(
                            "! Warning: In event " +
                                curEventName +
                                " enum and const are used at the same time, the" +
                                " values in enum can never be valid in the received JSON value"
                        );
                    }
                }
            }
            return;
        }

        /**
         * checking whether a data schema has object but not properties, array but no items
         * @param {object} tm The TD under test
         */
        function checkPropItems(tm) {
            details.propItems = "passed";

            if (tm.hasOwnProperty("properties")) {
                // checking properties
                tmProperties = Object.keys(tm.properties);
                for (let i = 0; i < tmProperties.length; i++) {
                    const curPropertyName = tmProperties[i];
                    const curProperty = tm.properties[curPropertyName];

                    if (curProperty.hasOwnProperty("type")) {
                        if (curProperty.type === "object" && !curProperty.hasOwnProperty("properties")) {
                            details.propItems = "warning";
                            logFunc(
                                "! Warning: In property " +
                                    curPropertyName +
                                    ", the type is object but its properties are not specified"
                            );
                        }
                        if (curProperty.type === "array" && !curProperty.hasOwnProperty("items")) {
                            details.propItems = "warning";
                            logFunc(
                                "! Warning: In property " +
                                    curPropertyName +
                                    ", the type is array but its items are not specified"
                            );
                        }
                    }
                }
            }
            // checking actions
            if (tm.hasOwnProperty("actions")) {
                tmActions = Object.keys(tm.actions);
                for (let i = 0; i < tmActions.length; i++) {
                    const curActionName = tmActions[i];
                    const curAction = tm.actions[curActionName];

                    if (curAction.hasOwnProperty("input")) {
                        const curInput = curAction.input;
                        if (curInput.hasOwnProperty("type")) {
                            if (curInput.type === "object" && !curInput.hasOwnProperty("properties")) {
                                details.propItems = "warning";
                                logFunc(
                                    "! Warning: In the input of action " +
                                        curActionName +
                                        ", the type is object but its properties are not specified"
                                );
                            }
                            if (curInput.type === "array" && !curInput.hasOwnProperty("items")) {
                                details.propItems = "warning";
                                logFunc(
                                    "! Warning: In the output of action " +
                                        curActionName +
                                        ", the type is array but its items are not specified"
                                );
                            }
                        }
                    }
                    if (curAction.hasOwnProperty("output")) {
                        const curOutput = curAction.output;
                        if (curOutput.hasOwnProperty("type")) {
                            if (curOutput.type === "object" && !curOutput.hasOwnProperty("properties")) {
                                details.propItems = "warning";
                                logFunc(
                                    "! Warning: In the output of action " +
                                        curActionName +
                                        ", the type is object but its properties are not specified"
                                );
                            }
                            if (curOutput.type === "array" && !curOutput.hasOwnProperty("items")) {
                                details.propItems = "warning";
                                logFunc(
                                    "! Warning: In the output of action " +
                                        curActionName +
                                        ", the type is array but its items are not specified"
                                );
                            }
                        }
                    }
                }
            }
            // checking events
            if (tm.hasOwnProperty("events")) {
                tmEvents = Object.keys(tm.events);
                for (let i = 0; i < tmEvents.length; i++) {
                    const curEventName = tmEvents[i];
                    const curEvent = tm.events[curEventName];

                    if (curEvent.hasOwnProperty("type")) {
                        if (curEvent.type === "object" && !curEvent.hasOwnProperty("properties")) {
                            details.propItems = "warning";
                            logFunc(
                                "! Warning: In event " +
                                    curEventName +
                                    ", the type is object but its properties are not specified"
                            );
                        }
                        if (curEvent.type === "array" && !curEvent.hasOwnProperty("items")) {
                            details.propItems = "warning";
                            logFunc(
                                "! Warning: In event " +
                                    curEventName +
                                    ", the type is array but its items are not specified"
                            );
                        }
                    }
                }
            }
            return;
        }

        /**
         * Warns if a property has readOnly or writeOnly set to true conflicting with another property.
         * @param {object} tm The TD under test
         */
        function checkReadWriteOnly(tm) {
            details.readWriteOnly = "passed";

            if (tm.hasOwnProperty("properties")) {
                // checking properties
                tmProperties = Object.keys(tm.properties);
                for (let i = 0; i < tmProperties.length; i++) {
                    const curPropertyName = tmProperties[i];
                    const curProperty = tm.properties[curPropertyName];

                    // if readOnly is set
                    if (curProperty.hasOwnProperty("readOnly") && curProperty.readOnly === true) {
                        // check if both readOnly and writeOnly are true
                        if (curProperty.hasOwnProperty("writeOnly") && curProperty.writeOnly === true) {
                            details.readWriteOnly = "warning";
                            logFunc(
                                "! Warning: In property " +
                                    curPropertyName +
                                    ", both readOnly and writeOnly are set to true!"
                            );
                        }

                        // check forms if op writeProperty is set
                        if (curProperty.hasOwnProperty("forms")) {
                            for (const formElIndex in curProperty.forms) {
                                if (curProperty.forms.hasOwnProperty(formElIndex)) {
                                    const formEl = curProperty.forms[formElIndex];
                                    if (formEl.hasOwnProperty("op")) {
                                        if (
                                            (typeof formEl.op === "string" && formEl.op === "writeproperty") ||
                                            (typeof formEl.op === "object" &&
                                                formEl.op.some((el) => el === "writeproperty"))
                                        ) {
                                            details.readWriteOnly = "warning";
                                            logFunc(
                                                "! Warning: In property " +
                                                    curPropertyName +
                                                    " in forms[" +
                                                    formElIndex +
                                                    '], readOnly is set but the op property contains "writeproperty"'
                                            );
                                        }
                                    } else {
                                        details.readWriteOnly = "warning";
                                        logFunc(
                                            "! Warning: In property " +
                                                curPropertyName +
                                                " in forms[" +
                                                formElIndex +
                                                '], readOnly is set but a form op property defaults to ["writeproperty", "readproperty"]'
                                        );
                                    }
                                }
                            }
                        }
                    }

                    // if writeOnly is set
                    if (curProperty.hasOwnProperty("writeOnly") && curProperty.writeOnly === true) {
                        // check forms if op readProperty is set
                        if (curProperty.hasOwnProperty("forms")) {
                            for (const formElIndex in curProperty.forms) {
                                if (curProperty.forms.hasOwnProperty(formElIndex)) {
                                    const formEl = curProperty.forms[formElIndex];
                                    if (formEl.hasOwnProperty("op")) {
                                        if (
                                            (typeof formEl.op === "string" && formEl.op === "readproperty") ||
                                            (typeof formEl.op === "object" &&
                                                formEl.op.some((el) => el === "readproperty"))
                                        ) {
                                            details.readWriteOnly = "warning";
                                            logFunc(
                                                "! Warning: In property " +
                                                    curPropertyName +
                                                    " in forms[" +
                                                    formElIndex +
                                                    '], writeOnly is set but the op property contains "readproperty"'
                                            );
                                        } else if (
                                            (typeof formEl.op === "string" && formEl.op === "observeproperty") ||
                                            (typeof formEl.op === "object" &&
                                                formEl.op.some((el) => el === "observeproperty"))
                                        ) {
                                            details.readWriteOnly = "warning";
                                            logFunc(
                                                "! Warning: In property " +
                                                    curPropertyName +
                                                    " in forms[" +
                                                    formElIndex +
                                                    '], writeOnly is set but the op property contains "observeproperty"'
                                            );
                                        }
                                    } else {
                                        details.readWriteOnly = "warning";
                                        logFunc(
                                            "! Warning: In property " +
                                                curPropertyName +
                                                " in forms[" +
                                                formElIndex +
                                                '], writeOnly is set but a form op property defaults to ["writeproperty", "readproperty"]'
                                        );
                                    }
                                }
                            }
                        }

                        // check if observable is also set
                        if (curProperty.hasOwnProperty("observable") && curProperty.observable === true) {
                            details.readWriteOnly = "warning";
                            logFunc(
                                "! Warning: In property " +
                                    curPropertyName +
                                    ", both writeOnly and observable are set to true!"
                            );
                        }
                    }
                }
            }
        }

        /**
         * Warns if security Definitions has no unique keys
         * @param {object} tmStr The TD under test as string
         */
        function checkSecPropUniqueness(tmStr, tm) {
            let result = "passed";
            try {
                // checking whether there are securityDefinitions at all
                jsonValidator.parse(tmStr, false);
            } catch (error) {
                // there is a duplicate somewhere

                // convert it into string to be able to process it
                // error is of form = Error: Syntax error: duplicated keys "overheating" near ting": {
                const errorString = error.toString();
                // to get the name, we need to remove the quotes around it
                const startQuote = errorString.indexOf('"');
                // slice to remove the part before the quote
                const restString = errorString.slice(startQuote + 1);
                // find where the interaction name ends
                const endQuote = restString.indexOf('"');
                // finally get the interaction name
                const securitySchemeName = restString.slice(0, endQuote);

                if (td.securityDefinitions.hasOwnProperty(securitySchemeName)) {
                    result = "failed";
                    logFunc("KO Error: The securityDefinitions contain a duplicate");
                }
            }

            return result;
        }

        /**
         * Evaluates whether an assertion function contains a failed check
         * Whether assertions are not-implemented or passed does not matter
         * Logs the comment
         * @param {Array} results Array of objects with props "ID", "Status" and optionally "Comment"
         * @returns "passed" if no check failed, "failed" if one or more checks failed
         */
        function evalAssertion(results) {
            let out = "passed";
            results.forEach((resultobj) => {
                if (resultobj.Status === "fail") {
                    out = "failed";
                    logFunc("KO Error: Assertion: " + resultobj.ID);
                    logFunc(resultobj.Comment);
                }
            });
            return out;
        }

        /**
         * Removes duplicate error messages, as these are produced
         * otherwise, especially for "oneOf" schemes
         * @param {ajv.ErrorObject[]} errors
         */
        function filterErrorMessages(errors) {
            const output = [];
            errors.forEach((el) => {
                if (!output.some((ce) => ce.dataPath === el.dataPath && ce.message === el.message)) {
                    output.push(el);
                }
            });
            return output;
        }
    });
}

/**
 * Transform an arbitrary string to another compressed URL-encoded string.
 * @param {string} data String to compress.
 * @returns {string} Compressed URL-encoded string.
 */
function compress(data) {
    return lzs.compressToEncodedURIComponent(data);
}

/**
 * Decompress a string compressed with the {@link compress} method.
 * @param {string} data Compressed URL-encoded string.
 * @returns {string} Original string.
 */
function decompress(data) {
    return lzs.decompressFromEncodedURIComponent(data);
}

/**
 * Detect protocl schemes of a TD
 * @param {string} td TD string to detect protocols of
 * return List of available protocol schemes
 */
function detectProtocolSchemes(td) {
    let tdJson;

    try {
        tdJson = JSON.parse(td);
    } catch (err) {
        return [];
    }

    const baseUriProtocol = getHrefProtocol(tdJson.base);
    const thingProtocols = detectProtocolInForms(tdJson.forms);
    const actionsProtocols = detectProtocolInAffordance(tdJson.actions);
    const eventsProtocols = detectProtocolInAffordance(tdJson.events);
    const propertiesProtcols = detectProtocolInAffordance(tdJson.properties);
    const protocolSchemes = [
        ...new Set([
            baseUriProtocol,
            ...thingProtocols,
            ...actionsProtocols,
            ...eventsProtocols,
            ...propertiesProtcols,
        ]),
    ].filter((p) => p !== undefined);

    return protocolSchemes;
}

/**
 * Detect protocols in a TD affordance
 * @param {object} affordance That belongs to a TD
 * @returns List of protocol schemes
 */
function detectProtocolInAffordance(affordance) {
    if (!affordance) {
        return [];
    }

    let protocolSchemes = [];

    for (const key in affordance) {
        if (key) {
            protocolSchemes = protocolSchemes.concat(detectProtocolInForms(affordance[key].forms));
        }
    }

    return protocolSchemes;
}

/**
 * Detect protocols in a TD forms or a TD affordance forms
 * @param {object} forms Forms field of a TD or a TD affordance
 * @returns List of protocol schemes
 */
function detectProtocolInForms(forms) {
    if (!forms) {
        return [];
    }

    const protocolSchemes = [];

    forms.forEach((form) => {
        protocolSchemes.push(getHrefProtocol(form.href));
    });

    return protocolSchemes;
}

/**
 * Get protocol used in href
 * @param {string} href URI string
 * @returns Protocol name
 */
function getHrefProtocol(href) {
    if (!href) {
        return;
    }

    return href.split(":")[0];
}

/**
 * Convert TD from json to yaml
 * @param {string} td TD in json string form
 * @returns TD in yaml string form
 */
function convertTDJsonToYaml(td) {
    if (td === "") {
        return;
    }

    try {
        return jsYaml.dump(JSON.parse(td));
    } catch (err) {
        console.log("TD generation problem: " + err);
    }
}

/**
 * Convert TD from json to yaml
 * @param {string} td TD in yaml string from
 * @returns TD in json string form
 */
function convertTDYamlToJson(td) {
    if (td === "") {
        return;
    }

    try {
        return JSON.stringify(jsYaml.load(td));
    } catch (err) {
        console.log("TD generation problem: " + err);
    }
}
