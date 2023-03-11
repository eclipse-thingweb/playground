const tmAsserter = require("../index").tmAssertions;
const fs = require("fs");

const simpleTD = JSON.stringify({
    id: "urn:basic",
    "@context": ["https://www.w3.org/2022/wot/td/v1.1"],
    "@type": "tm:ThingModel",
    title: "Smart Lamp Control with Dimming",
    links: [
        {
            rel: "tm:extends",
            href: "http://example.com/BasicOnOffTM",
            type: "application/td+json",
        },
    ],
    properties: {
        dim: {
            title: "Dimming level",
            type: "integer",
            minimum: 0,
            maximum: 100,
        },
    },
});

function fileLoad(loc) {
    return new Promise((res, rej) => {
        fs.readFile(loc, "utf8", (err, data) => {
            if (err) {
                rej(err);
            } else {
                res(data);
            }
        });
    });
}

tmAsserter([simpleTD], fileLoad).then(
    (result) => {
        console.log("OKAY");
        console.log(result);
    },
    (err) => {
        console.log("ERROR");
        console.error(err);
    }
);
