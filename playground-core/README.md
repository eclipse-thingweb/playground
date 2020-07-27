# Thingweb-Playground Core
This package provides the main functionality of the Web of Things Playground, i.e., validating given Thing Descriptions.
You can find more information about the Thingweb-Playground [here](https://github.com/thingweb/thingweb-playground).

Limitations:  
* There is limited nested validation. This is due to the JSON Schema specification which doesn't allow infinite references with $ref keywords. Because of this, an enum key in a e.g. #/actions/input/properties/enum will not be necessarily checked. More information can be found [here](http://json-schema.org/latest/json-schema-core.html#rfc.section.7).

## License
Dual-licensed under both

* [Eclipse Public License v. 2.0](http://www.eclipse.org/legal/epl-2.0)
* [W3C Software Notice and Document License (2015-05-13)](https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document)

Pick one of these two licenses that fits your needs.
Please also see the additional [notices](NOTICE.md) and [how to contribute](CONTRIBUTING.md).


## Script based Thing Description Validation
This is a node.js based tool.
  
**WARNING**: If you see an error like `ajv.errors[0].params.allowedValue` this very probably means that your TD is not valid at a specific point. Scroll up to see the precise error message.

## Examples
* Some example Thing Descriptions are provided in the [examples folder](./examples/). There are :
  * valid: Minimum 4 lights are lit green, no warning message is displayed. They may or may not pass Full Schema Validation
  * warning: At least one light is orange
  * invalid: At least one of the lights is lit red.

These examples cover all the features of the TD spec. If you think that there is a missing feature not represented, write an issue.

