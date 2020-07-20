# Thingweb-Playground
This package provides the main functionality of the Web of Things Playground, i.e., validating given Thing Descriptions.
Validation tool for W3C WoT Thing Descriptions. Your Thing Descriptions should be written according to the W3C standard found [here](https://w3c.github.io/wot-thing-description/#).

Limitations:

* There is limited nested validation. This is due to the JSON Schema specification which doesn't allow infinite references with $ref keywords. Because of this, an enum key in a e.g. #/actions/input/properties/enum will not be necessarily checked. More information can be found [here](http://json-schema.org/latest/json-schema-core.html#rfc.section.7).

The structure of all WoT Playground packages is shown here: ![packageStructure](https://i.imgur.com/cbleWss.png)

The other packages, which depend on the `playground-core` package can be found here:
* The cli package can be found here: TODO:
* The web interface can be found here: TODO: or running hosted [here](http://plugfest.thingweb.io/playground/)   
* The assertions package can be found here: TODO:


## License
Dual-licensed under both

* [Eclipse Public License v. 2.0](http://www.eclipse.org/legal/epl-2.0)
* [W3C Software Notice and Document License (2015-05-13)](https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document)

Pick one of these two licenses that fits your needs.
Please also see the additional [notices](NOTICE.md) and [how to contribute](CONTRIBUTING.md).

## Browser based Thing Description Validation

* Online: It is hosted [here](http://plugfest.thingweb.io/playground/)
  * Simply paste a TD in the text field and click validate
  * Safari browser has unexpected behavior with JSON-LD documents
  * If you loose your internet connection when validating JSON-LD validation will fail since it tries to access the documents under `@context` (can be turned off)

* Offline/OnPremise: by hosting the `playground-web` yourself. Therefore please deliver the "index.html" file with a web-server.


## Script based Thing Description Validation

This is a node.js based tool

* You can use this package as an API to validate TDs in your own packages.
* You can use the `playground-cli` package to test one/multiple TDs via the command line or execute assertion testing with it.
* You can use the `playground-assertion` package to integrate assertion testing via an API in your own packages.
* You can use the `playground-web` package to host/adapt your own browser version of the WoT playground.

## Script based Assertion Tester
Please have a look at the `playground-cli` package for script based assertion testing, or at the `playground-assertions` package, if you're planning to integrate the assertion testing as an dependency in own NPM modules. 
  
**WARNING**: If you see an error like `ajv.errors[0].params.allowedValue` this very probably means that your TD is not valid at a specific point. Scroll up to see the precise error message.

## Examples

* Some example Thing Descriptions are provided in the [examples folder](./examples/). There are :
  * valid: Minimum 4 lights are lit green, no warning message is displayed. They may or may not pass Full Schema Validation
  * warning: At least one light is orange
  * invalid: At least one of the lights is lit red.

These examples cover all the features of the TD spec. If you think that there is a missing feature not represented, write an issue.

## Batch Testing
Please have a look at the `playground-cli` package for batch testing of Thing Descriptions.