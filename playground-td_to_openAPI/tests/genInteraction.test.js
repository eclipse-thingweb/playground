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
    interactionInfo: {
      tags: [
        "properties"
      ],
      description: "",
      summary: "status"
    },
    interactionSchemas: {
        requestSchema: {
          schema: {
            type: "string",
            enum: ["Standby","Grinding","Brewing","Filling","Error"],
            readOnly: true
          },
          example: expect.stringMatching(/Standby|Grinding|Brewing|Filling|Error/)
        },
      responseSchema: {
        schema: {
          type: "string",
          enum: ["Standby","Grinding","Brewing","Filling","Error"],
          readOnly: true
        },
        example: expect.stringMatching(/Standby|Grinding|Brewing|Filling|Error/)
      }
    }
  }

test("test the generateInteraction function", () => {
    const results = genInteraction(interactionName, interaction, tags)
    expect(results).toMatchObject(correctResult)
})