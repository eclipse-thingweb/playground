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

const genInteraction = require("../genInteraction")

const interactionName = "status"
const tags = ["properties"]
const interaction = {
        "type" : "string",
        "enum" : ["Standby", "Grinding", "Brewing", "Filling","Error"],
        "readOnly" : true,
        "forms" : [{
            "href" : "http://mycoffeemaker.example.com/status",
            "op" : "readproperty",
            "contentType" : "application/json"
}]}

const correctResult = {
    "interactionInfo": {
      "tags": [
        "properties"
      ],
      "description": "",
      "summary": "status"
    },
    "interactionSchemas": {
      "requestSchema": {
        "type": "string",
        "enum": ["Standby","Grinding","Brewing","Filling","Error"],
        "readOnly": true
      },
      "responseSchema": {
        "type": "string",
        "enum": ["Standby","Grinding","Brewing","Filling","Error"],
        "readOnly": true
      }
    }
  }

test("test the generateInteraction function", () => {
    const results = genInteraction(interactionName, interaction, tags)
    expect(results).toEqual(correctResult)
})