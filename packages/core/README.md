# @thing-description-playground/**CORE**

This package provides the main functionality of the Web of Things Playground, i.e., validating given Thing Descriptions.
You can find more information about the Thingweb-Playground [here](https://github.com/thingweb/thingweb-playground).

Limitations:  

* There is limited nested validation. This is due to the JSON Schema specification which doesn't allow infinite references with $ref keywords. Because of this, an enum key in a e.g. #/actions/input/properties/enum will not be necessarily checked. More information can be found [here](http://json-schema.org/draft/2019-09/json-schema-core.html#rfc.section.8.2.4.3).

## License

Licensed under the MIT license, see [License](../../LICENSE.md).

## Script based Thing Description Validation

This is a Node.js based tool.

**WARNING**: If you see an error like `ajv.errors[0].params.allowedValue` this very probably means that your TD is not valid at a specific point. Scroll up to see the precise error message.

You can use the functionality of this package by:

* Install the package with npm `npm install @thing-description-playground/core` (or clone repo and install the package with `npm install`)
* Node.js or Browser
  * Node.js: Require the package and use the validation function

  ```javascript
  const tdValidator = require("@thing-description-playground/core").tdValidator
  ```

  * Browser: Import the `Validators.tdValidator` function as a global by adding a script tag to your HTML.

  ```html
  <script src="./node_modules/@thing-description-playground/core/dist/web-bundle.min.js"></script>
  ```

### Structure

The [index.js](./index.js) file contains the main validation functionality and exports the modules functionalities.  
The [shared.js](./shared.js) file contains additional check functions, which are shared between the core package and the assertions package.

## Examples

* Some example Thing Descriptions are provided in the [examples folder](./examples/tds/). There are :
  * valid: Minimum 4 lights are lit green, no warning message is displayed. They may or may not pass Full Schema Validation
  * warning: At least one light is orange
  * invalid: At least one of the lights is lit red.  

These examples cover all the features of the TD spec. If you think that there is a missing feature not represented, write an issue.

* Additionally there are also example scripts provided (in the [example-script folder](./examples/scripts/)) to demonstrate the usage of this package. Further examples for its usage can be found in the [web] and [cli] packages.

* Small example for using this package in a Node.js script, to validate an example TD:

```javascript
const tdValidator = require("@thing-description-playground/core").tdValidator
const fs = require("fs")

const simpleTD = fs.readFileSync("./node_modules/@thing-description-playground/core/examples/tds/valid/simple.json", "utf8")

/**
 * Use console for logging, no options
 */
tdValidator(simpleTD, console.log, {})
.then( result => {
  console.log("OKAY")
  console.log(result)
}, err => {
  console.log("ERROR")
  console.error(err)
})
```

## Validation Report

The core validation report is an object, which contains three objects (as you can see in the example report):

```javascript
{
    report: {
        json: "passed",
        schema: "passed",
        defaults: "warning",
        jsonld: null,
        additional: "failed"
    },
    details: {
        enumConst: "passed",
        propItems: "warning",
        security: "passed",
        propUniqueness: "passed",
        multiLangConsistency: "failed"
    },
    detailComments: {
        enumConst: "Checking whether a data schema has enum and const at the same time.",
        propItems: "Checking whether a data schema has an object but not properties or array but no items.",
        security: "Check if used Security definitions are properly defined previously.",
        propUniqueness: "Checking whether in one interaction pattern there are duplicate names, e.g. two properties called temp.",
        multiLangConsistency: "Checks whether all titles and descriptions have the same language fields."
    }
}
```

* The `report` object contains the results of the default validation. It is structure with a keyword and the value null, "passed", "warning" or "failed". Where null is used if the test was not executed, which can happen either because it was opted out or a previous check failed. The keywords are:
  * json: Checks if the TD is a valid JSON instance.
  * schema: Checks if the TD is valid according to the JSON Schema constructed from the TD specification.
  * defaults: As schema, but this JSON Schema additionally checks if default behavior is explicitly stated (recommended). The check can be opted out.
  * jsonld: Checks if the TD is a valid JSON-LD instance. This will only work with internet connection (because the @context tags have to be loaded) and can be opted out.
  * additional: Combined indicator of the results of the additional checks that are listed in details.
* The `details` object contains the results of the additional checks. The keywords can have the same values as in report.
* The `detailComments` explains the meaning of every additional check.

[web]: https://github.com/thingweb/thingweb-playground/tree/master/packages/web
[cli]: https://github.com/thingweb/thingweb-playground/tree/master/packages/cli

## Test Usage

Test Examples are located under examples directory. 
For protocol detection examples you need to fill 'protocolSchemes' field that corresponds to the protocols TD uses.