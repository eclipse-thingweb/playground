module.exports = addDefaults

/**
 * Extends a given Td with the default values of fields that aren't filled
 * @param {object|string} td The Td to extend with default values
 */
function addDefaults(td) {
    if (typeof td === "string") {td = JSON.parse(td)}

    

    return td
}