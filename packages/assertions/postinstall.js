const fs = require("fs");
const path = require("path");

validatorNewFormatsPath = path.join("node_modules", "ajv-formats-draft2019", "formats");
iriReferenceFormatPath = path.join(validatorNewFormatsPath, "iri-reference.js");

let code = "";
if(fs.existsSync(validatorNewFormatsPath) && fs.existsSync(iriReferenceFormatPath)) code = fs.readFileSync(iriReferenceFormatPath, {encoding: "utf-8"})



let lines = code.split("\n");
if(lines.includes("const { validate } = require('isemail')") || lines.includes("const { validate } = require('isemail');")) return;

lines.splice(1,0, "const { validate } = require('isemail');");

let newCode =  lines.join("\n");

fs.writeFileSync(iriReferenceFormatPath, newCode);