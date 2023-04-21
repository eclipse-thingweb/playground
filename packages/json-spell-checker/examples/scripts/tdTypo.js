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

const jsonSpellChecker = require("../../index");
const tdSchema = require("../schema/td-schema.json");
const td = require("../json/td-example.json");

jsonSpellChecker.configure(tdSchema, 0.85, 2);
const typos = jsonSpellChecker.checkTypos(JSON.stringify(td));
console.log(typos);
