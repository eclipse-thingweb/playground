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

/**
 * @file Calls the core validation with an hardcoded TD string as input
 * 		 to check whether the validation throws an error and allow manual
 * 		 checking of the result
 */

const { tdValidator, tmValidator, compress, decompress } = require("../index");

const simpleTD = `{
	"id": "urn:simple",
	"@context": "https://www.w3.org/2022/wot/td/v1.1",
	"title": "MyLampThing",
	"description": "Valid TD copied from the spec's first example",
	"securityDefinitions": {
		"basic_sc": {
			"scheme": "basic",
			"in": "header"
		},
		"basic_scd": {
			"scheme": "basic",
			"in": "header"
		}
	},
	"security": [
		"basic_sc"
	],
	"properties": {
		"status": {
			"type": "string",
			"forms": [
				{
					"href": "https://mylamp.example.com/status"
				}
			]
		}
	},
	"actions": {
		"toggle": {
			"forms": [
				{
					"href": "https://mylamp.example.com/toggle"
				}
			]
		},
		"toggled": {
			"forms": [
				{
					"href": "https://mylamp.example.com/toggle"
				}
			]
		}
	},
	"events": {
		"overheating": {
			"data": {
				"type": "string"
			},
			"forms": [
				{
					"href": "https://mylamp.example.com/oh",
					"subprotocol": "longpoll"
				}
			]
		}
	}
}`;

const simpleTM = `{
	"@context": [
		"https://www.w3.org/2022/wot/td/v1.1"
	],
	"@type": "tm:ThingModel",
	"title": "Thermostate No. {{THERMOSTATE_NUMBER}}",
	"version": "{{VERSION_INFO}}",
	"base": "mqtt://{{MQTT_BROKER_ADDRESS}}",
	"properties": {
		"temperature": {
			"description": "Shows the current temperature value",
			"type": "number",
			"minimum": -20,
			"maximum": "{{THERMOSTATE_TEMPERATURE_MAXIMUM}}",
			"observable": "{{THERMOSTATE_TEMPERATURE_OBSERVABLE}}"
		}
	}
}`;

test("normal td report generation", () => {
    expect.assertions(1);

    return tdValidator(simpleTD, () => {}, {}).then(
        (result) => {
            const refResult = {
                report: {
                    json: "passed",
                    schema: "passed",
                    defaults: "warning",
                    jsonld: "passed",
                    additional: "passed",
                },
                details: {
                    enumConst: "passed",
                    linkedAffordances: "not-impl",
                    linkedStructure: "not-impl",
                    propItems: "passed",
                    security: "passed",
                    propUniqueness: "passed",
                    multiLangConsistency: "passed",
                    linksRelTypeCount: "passed",
                    readWriteOnly: "passed",
                    uriVariableSecurity: "passed",
                },
                detailComments: {
                    enumConst: expect.any(String),
                    linkedAffordances: expect.any(String),
                    linkedStructure: expect.any(String),
                    propItems: expect.any(String),
                    security: expect.any(String),
                    propUniqueness: expect.any(String),
                    multiLangConsistency: expect.any(String),
                    linksRelTypeCount: expect.any(String),
                    readWriteOnly: expect.any(String),
                    uriVariableSecurity: expect.any(String),
                },
            };
            expect(result).toEqual(refResult);
        },
        (err) => {
            console.error(err);
        }
    );
});

test("normal tm report generation", () => {
    expect.assertions(1);

    return tmValidator(simpleTM, () => {}, {}).then(
        (result) => {
            const refResult = {
                report: {
                    json: "passed",
                    schema: "passed",
                    defaults: null,
                    jsonld: "passed",
                    additional: "passed",
                },
                details: {
                    enumConst: "passed",
                    propItems: "passed",
                    propUniqueness: "passed",
                    multiLangConsistency: "passed",
                    linksRelTypeCount: "passed",
                    readWriteOnly: "passed",
                    tmOptionalPointer: "passed",
                },
                detailComments: {
                    enumConst: expect.any(String),
                    propItems: expect.any(String),
                    propUniqueness: expect.any(String),
                    multiLangConsistency: expect.any(String),
                    linksRelTypeCount: expect.any(String),
                    readWriteOnly: expect.any(String),
                    tmOptionalPointer: expect.any(String),
                },
            };
            expect(result).toEqual(refResult);
        },
        (err) => {
            console.error(err);
        }
    );
});

test("test td (de)compression", () => {
    const compressed = compress(simpleTD);
    expect(simpleTD).toEqual(decompress(compressed));
    // eslint-disable-next-line max-len
    expect(compressed).toEqual(
        "N4KAkARAlgJhBcACCBXATgO3gZygWwAcAbAUwgBpwIABAYwHsMAXEgDyYWQAsmmDt4AekEB3MQDoRAZnH00Ac0EAmAAxKlo+k0FMYggG4BGcYYpUmUJqU4QAsgE8AMgENCAFS5QM8s5BglsWjQoAgtGGwA1ZyJYRDcAEUQGAigSGEQAMzR6PEQmLhJEbAISWgBybEyoNGwmRDZXYjJKSGxS9Et7eJIMr0soRmxOUDBIACNnXFoAfUDh8FGIQIK8MiQICanfRa8bAud-NAgFgF8W8cmoGcC4JBHF5ZJVm02r7chd9f3D49GT8DOVDatA6THsnAA2gsNpdrrRfgBdFoQAjZEpoCwBeYPJjOJgoIZ3BaQMElGy1YLed4QDJyPCExBQ0aje7MiBcNA9Pa8fhCQR4exERriBqEUjiBh4QS1PEE37M-7MhGnAHI5y0MIYBn3CBMejyeTWIls2loemQ4lgVmLDlcr48gTCAVCwgi1iNcWSnT6w1kS2K0bKv7nXU+0i3RCsml0hlM5nWyC2jLcviO-mC4WipoSnLeg3Wf3EoNgRWAyAkfQkZja6H0StofYWKnGxYwPHObFs0lrZAUrw+Yllxam81IOMsy2JznJ+2pvnOzPusUkHNS+hcd4PFBjVFaegMIg2IiMeQEehEQ+FpUqksgE5AA"
    );
    // eslint-disable-next-line max-len
    expect(simpleTD).toEqual(
        decompress(
            "N4KAkARAlgJhBcACCBXATgO3gZygWwAcAbAUwgBpwIABAYwHsMAXEgDyYWQAsmmDt4AekEB3MQDoRAZnH00Ac0EAmAAxKlo+k0FMYggG4BGcYYpUmUJqU4QAsgE8AMgENCAFS5QM8s5BglsWjQoAgtGGwA1ZyJYRDcAEUQGAigSGEQAMzR6PEQmLhJEbAISWgBybEyoNGwmRDZXYjJKSGxS9Et7eJIMr0soRmxOUDBIACNnXFoAfUDh8FGIQIK8MiQICanfRa8bAud-NAgFgF8W8cmoGcC4JBHF5ZJVm02r7chd9f3D49GT8DOVDatA6THsnAA2gsNpdrrRfgBdFoQAjZEpoCwBeYPJjOJgoIZ3BaQMElGy1YLed4QDJyPCExBQ0aje7MiBcNA9Pa8fhCQR4exERriBqEUjiBh4QS1PEE37M-7MhGnAHI5y0MIYBn3CBMejyeTWIls2loemQ4lgVmLDlcr48gTCAVCwgi1iNcWSnT6w1kS2K0bKv7nXU+0i3RCsml0hlM5nWyC2jLcviO-mC4WipoSnLeg3Wf3EoNgRWAyAkfQkZja6H0StofYWKnGxYwPHObFs0lrZAUrw+Yllxam81IOMsy2JznJ+2pvnOzPusUkHNS+hcd4PFBjVFaegMIg2IiMeQEehEQ+FpUqksgE5AA"
        )
    );
});

test("test tm (de)compression", () => {
    const compressed = compress(simpleTM);
    expect(simpleTM).toEqual(decompress(compressed));
    // eslint-disable-next-line max-len
    expect(compressed).toEqual(
        "N4KAkARAAgxg9gOwC4FMAeSIC4AEBtcSACySQAcBnLAemoHcGA6OgZkbgCcBzagJgAZevenCTUkAE2oA3AIyNZEcAF0ANOGhIAnmRTYcEJAFssAFSIBLBFwCycCSgA2EdZCQWkjvbgjmUHIzgKJABDVBwAOThGHGBgUwAJAFEAJRsAeQBlUwBBUySAfQiAVRsAIVSAX0qXDWl-CgtEfQg4gDVUzIBJdIiCroiAMXTq2sgAIxCKbwMjAEdSGmo4mwBFU1MCspT0gGlUgpyAESOUpMzM0dcIMg44XQ53FAp9UDA3FCMHsIBXDhm3u8IA4KDAOBYyO5mj5MkQ4HQKDgkEQUDgYH9-sgkZ9vkg-qjpCFHD89K4gdpdC0ED8jON-GMgUYrBYjDT9ABaARkyBGEJoFlsnxxRKpDLZPKFfI2AAKqTyxTOBRsOQAGl0bKUroRIHBxtMOITxl4WsLkmksrl8gUpbKUvLFekyplUm0cmUADJJUaESrgX2VIA"
    );
    // eslint-disable-next-line max-len
    expect(simpleTM).toEqual(
        decompress(
            "N4KAkARAAgxg9gOwC4FMAeSIC4AEBtcSACySQAcBnLAemoHcGA6OgZkbgCcBzagJgAZevenCTUkAE2oA3AIyNZEcAF0ANOGhIAnmRTYcEJAFssAFSIBLBFwCycCSgA2EdZCQWkjvbgjmUHIzgKJABDVBwAOThGHGBgUwAJAFEAJRsAeQBlUwBBUySAfQiAVRsAIVSAX0qXDWl-CgtEfQg4gDVUzIBJdIiCroiAMXTq2sgAIxCKbwMjAEdSGmo4mwBFU1MCspT0gGlUgpyAESOUpMzM0dcIMg44XQ53FAp9UDA3FCMHsIBXDhm3u8IA4KDAOBYyO5mj5MkQ4HQKDgkEQUDgYH9-sgkZ9vkg-qjpCFHD89K4gdpdC0ED8jON-GMgUYrBYjDT9ABaARkyBGEJoFlsnxxRKpDLZPKFfI2AAKqTyxTOBRsOQAGl0bKUroRIHBxtMOITxl4WsLkmksrl8gUpbKUvLFekyplUm0cmUADJJUaESrgX2VIA"
        )
    );
});
