# Thingweb-Playground Core

This package provides the main functionality of the Web of Things Playground, i.e., validating given Thing Descriptions.
You can find more information about the Thingweb-Playground [here](https://github.com/thingweb/thingweb-playground).

Limitations:  

* There is limited nested validation. This is due to the JSON Schema specification which doesn't allow infinite references with $ref keywords. Because of this, an enum key in a e.g. #/actions/input/properties/enum will not be necessarily checked. More information can be found [here](http://json-schema.org/draft/2019-09/json-schema-core.html#rfc.section.8.2.4.3).

## License

Dual-licensed under both

* [Eclipse Public License v. 2.0](http://www.eclipse.org/legal/epl-2.0)
* [W3C Software Notice and Document License (2015-05-13)](https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document)

Pick one of these two licenses that fits your needs.
Please also see the additional [notices](NOTICE.md) and [how to contribute](CONTRIBUTING.md).

## Script based Thing Description Validation

This is a Node.js based tool.

**WARNING**: If you see an error like `ajv.errors[0].params.allowedValue` this very probably means that your TD is not valid at a specific point. Scroll up to see the precise error message.

You can use the functionality of this package by:

* Install the package with npm `npm install playground-core` (or clone repo and install the package with `npm install`)
* Node.js or Browser
  * Node.js: Require the package and use the validation function

  ```javascript
  const tdValidator = require("playground-core")
  ```

  * Browser: Import the `tdValidator` function as a global by adding a script tag to your html.

  ```html
  <script src="./node_modules/playground-core/dist/web-bundle.min.js"></script>
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

* Additionally there are also example scripts provided (in the [example-script folder](./examples/scripts/)) to demonstrate the usage of this package.

* Small example for using this package in a Node.js script, to validate an example TD:

```javascript
const tdValidator = require("playground-core")
const fs = require("fs")

const simpleTD = fs.readFileSync("./node_modules/playground-core/examples/tds/valid/simple.json", "utf8")

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
