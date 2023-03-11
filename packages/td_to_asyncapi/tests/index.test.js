/**
 * @file Test the functionality of this package by snapshot comparison.
 */

const fs = require("fs");
const toAAP = require("../index.js");
const td = require("../examples/td.json");

if (!fs.existsSync("./out")) {
    fs.mkdirSync("./out");
}

const aapJson = fs.readFileSync("./examples/asyncapi.json", "utf-8");
const aapYaml = fs.readFileSync("./examples/asyncapi.yaml", "utf-8");

test("test the whole openAPI convertion", () => {
    expect.assertions(2);

    return toAAP(td).then(
        (apiSpec) => {
            // write output
            fs.writeFileSync("./out/1.json", JSON.stringify(apiSpec.json, undefined, 2));
            fs.writeFileSync("./out/1.yaml", apiSpec.yaml);

            // test equality
            const jsonString = JSON.stringify(apiSpec.json, undefined, 2);
            expect(jsonString).toBe(aapJson);
            expect(apiSpec.yaml).toBe(aapYaml);
        },
        (err) => {
            console.error(err);
        }
    );
});
