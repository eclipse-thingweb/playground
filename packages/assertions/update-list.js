// Update list.json
const fs = require("fs");

fs.readdir("./assertions-td", (err, assertionNames) => {
    if (err) {
        throw new Error("could not read assertion file names");
    }

    const nameAr = [];

    assertionNames.forEach((el) => {
        if (el.endsWith(".json") && el !== "tdAssertionList.json") nameAr.push(el);
    });

    fs.writeFile("./assertions-td/tdAssertionList.json", JSON.stringify(nameAr), "utf8", () => {
        console.log("Updated tdAssertionList.json");
    });
});

fs.readdir("./assertions-tm", (err, assertionNames) => {
    if (err) {
        throw new Error("could not read assertion file names");
    }

    const nameAr = [];

    assertionNames.forEach((el) => {
        if (el.endsWith(".json") && el !== "tmAssertionList.json") nameAr.push(el);
    });

    fs.writeFile("./assertions-tm/tmAssertionList.json", JSON.stringify(nameAr), "utf8", () => {
        console.log("Updated tmAssertionList.json");
    });
});
