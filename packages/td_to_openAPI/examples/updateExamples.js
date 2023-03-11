const fs = require("fs");
const toOAP = require("../index.js");
const td = require("./td.json");

toOAP(td).then(
    (apiSpec) => {
        fs.writeFileSync("./examples/openapi.json", JSON.stringify(apiSpec.json, undefined, 2));
        fs.writeFileSync("./examples/openapi.yaml", apiSpec.yaml);

        console.log("updated examples");
    },
    (err) => {
        console.error(err);
    }
);
