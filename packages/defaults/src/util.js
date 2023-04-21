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

const { defaultLookup } = require("./definitions");

/**
 * Applies the specified callback to every element of an object
 * (like forEach does on an Array)
 * @param {object} obj the target object
 * @param {(element:any)=>void} callback function to apply for every element
 */
function forEvery(obj, callback) {
    if (typeof obj === "object" && !Array.isArray(obj)) {
        Object.keys(obj).forEach((key) => {
            const element = obj[key];
            callback(element);
        });
    }
}

/**
 * Compare two variables for equality
 * (deep equality on objects)
 * (order doesn't matter on arrays, duplicates are allowed)
 * @param {any} objA value A
 * @param {any} objB value B
 * @returns {boolean} are both variables equal
 */
function objEquality(objA, objB) {
    if (typeof objA !== "object" || typeof objB !== "object") {
        return objA === objB;
    } else {
        // order shouldn't matter for an array
        if (Array.isArray(objA) && Array.isArray(objB)) {
            return (
                objA.every((elA) => objB.some((elB) => objEquality(elA, elB))) &&
                objB.every((elB) => objA.some((elA) => objEquality(elA, elB)))
            );
        } else {
            return (
                Object.keys(objA).every((keyA) => objB[keyA] && objEquality(objA[keyA], objB[keyA])) &&
                Object.keys(objB).every((keyB) => objA[keyB] && objEquality(objA[keyB], objB[keyB]))
            );
        }
    }
}

module.exports = { forEvery, objEquality };
