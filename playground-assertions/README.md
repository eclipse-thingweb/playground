# Thingweb-Playground Assertions

This package provides the assertion testing functionality for the Web of Things Playground.
You can find more information about the Thingweb-Playground [here](https://github.com/thingweb/thingweb-playground).

Validation tool for W3C WoT Thing Descriptions. Your Thing Descriptions should be written according to the W3C standard found [here](https://w3c.github.io/wot-thing-description/#).


## License

Dual-licensed under both

* [Eclipse Public License v. 2.0](http://www.eclipse.org/legal/epl-2.0)
* [W3C Software Notice and Document License (2015-05-13)](https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document)

Pick one of these two licenses that fits your needs.
Please also see the additional [notices](NOTICE.md) and [how to contribute](CONTRIBUTING.md).

## Script based Thing Description Validation

This is a Node.js based tool.

* You can use `playground-core` package as an API to validate TDs in your own packages.
* You can use the `playground-cli` package to test one/multiple TDs via the command line.
* You can use this package to integrate assertion testing via an API in your own packages.
* You can use the `playground-web` package to host/adapt your own browser version of the WoT playground. Remember you need to deliver its files by a web server (also locally possible via localhost), simply opening the `index.html` with a browser won't do the job.

## Script based Assertion Tester

297 out of 349 assertions of the TD specification can be tested with this tool.

This tool checks which assertions are satisfied by a given Thing Description(s). The assertions are modeled as JSON Schema or as scripts. 'AssertionTester/Assertions' has the JSON Schema assertions.

To use the assertion testing via the command line please use the `playground-cli` package.

**WARNING**: If you see an error like `ajv.errors[0].params.allowedValue` this very probably means that your TD is not valid at a specific point. Scroll up to see the precise error message

### Contributing

You can contribute by providing new JSON Schemas for assertions or by correcting them. There are two types of assertions:

* Not-complex: This is generally used to check assertions that are in the Thing instance or mandatory assertions. You simply put the JSON key to be checked in the `required` validation keyword.
* Complex: This type uses the `if-then-else` structure of JSON Schema Draft 7. You should put an `if` for the keyword you want to check and the following object in the `then`:

  ```json
    "then": {
        "const": "td-data-schema_description=pass"
    }
  ```

  This way, the validation will surely fail at the const keyword and display that the JSON data has to be `"td-data-schema_description=pass"` string. This will be then detected by the assertion testing tool which will look for the `=` sign to find the result. If the schema doesn't fail, it implies that this if was false, which in turn implies that the assertion you wanted to test was not implemented in the given TD.

## Known Bugs

* td-json-open assertion exists multiple times, [see issue 124](https://github.com/thingweb/thingweb-playground/issues/124)
