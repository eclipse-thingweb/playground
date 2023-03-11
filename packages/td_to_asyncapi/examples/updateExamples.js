const fs = require("fs");
const toAAP = require("../index.js");
const td = require("./td.json");

toAAP(td).then(
    (apiSpec) => {
        fs.writeFileSync("./examples/asyncapi.json", JSON.stringify(apiSpec.json, undefined, 2));
        fs.writeFileSync("./examples/asyncapi.yaml", apiSpec.yaml);

        console.log("updated examples");
    },
    (err) => {
        console.error(err);
    }
);
