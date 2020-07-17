# Thingweb-Playground

This package provides the main functionality of the Web of Things Playground, i.e., validating given Thing Descriptions.

Validation tool for W3C WoT Thing Descriptions. Your Thing Descriptions should be written according to the W3C standard found [here](https://w3c.github.io/wot-thing-description/#).

Limitations:

* There is limited nested validation. This is due to the JSON Schema specification which doesn't allow infinite references with $ref keywords. Because of this, an enum key in a e.g. #/actions/input/properties/enum will not be necessarily checked. More information can be found [here](http://json-schema.org/latest/json-schema-core.html#rfc.section.7).


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
  * I you loose your internet connection when validating JSON-LD validation will fail since it tries to access the documents under `@context` (can be turned off)

* Offline/OnPremise: by hosting the `playground-web` yourself.


## Script based Thing Description Validation

This is a node.js based tool

* You can use this package as an API to validate TDs in your own packages.

* You can use the `playground-cli` package to test one/multiple TDs via the command line.

* You can use the `playground-assertion` package to test assertions.


* Go to Scripts folder and run `npm install`
* Run `node Scripts/playground.js "./WebContent/Examples/Valid/actionReponse.json"` to validate a Thing Description found at `./WebContent/Examples/Valid/actionReponse.json'. You can replace this with a TD you want to validate.

## Script based Assertion Tester

297 out of 349 assertions of the TD specification can be tested with this tool.

This tool checks which assertions are satisfied by a given Thing Description(s). The assertions are modeled as JSON Schema or as scripts. 'AssertionTester/Assertions' has the JSON Schema assertions. To use this tool from the root directory of the repository:

* Change to AssertionTester directory
* Run npm install
* For single TD: Run 'npm run-script testTD an_example_TD_location'. E.g. 'npm run-script testTD ../WebContent/Examples/Valid/JsonLdThing.json' 
  * You can specify the output location and filename in an argument that comes after the input, e.g. npm run-script testTD inputTD.json outputResult.csv
* For a directory with **only** TDs: Run 'npm run-script testImplementation a_directory_location'. E.g. 'npm run-script testImplementation ../WebContent/Examples/Valid/' 
* The result(s) are found in the 'AssertionTester/Results' with a file per id of the tested TD(s)
  * There will be a .csv and a .json file. The .csv version has the format required by the implementation report and the .json version is provided for using the results in other tools, such as merging the results 
  * The result can be pass, fail or not-impl 
  * Some assertions have an underscore, i.e. `_` before the last word. This means that this assertion is a sub assertion of a parent assertion. For example, td-actions assertion required the existence of action interaction in the TD and also the uniqueness of the names of actions. Because of this, there will be two assertions generated in the results with following names: td-actions_existence and td-actions_uniqueness. 
  * If there is a sub assertion, there is always a parent assertion. Look above to find the parent assertion. If one child assertion is not implemented, the parent will be also marked as not implemented.
* Merge the results if you have an implementation that produced multiple TDs. To do so, you can use one of the following ways:
  1. Give multiple result files as arguments: `npm run-script merge ./Results/result-urn:another.csv ./Results/result-urn:dev:wot:com:example:servient:lamp.csv`
     * You can put as many TDs as you want after `npm run-script merge`
  2. Give a directory containing multiple result files `npm run-script merge ./Results/*`
* You can clean the Results directory with `npm run-script clean` in Linux
* You can check the coverage of tge results.csv file with `npm run-script coverage results.csv` which will output a list to the std output indicating how many assertions passed, failed or not implemented
  
**WARNING**: If you see an error like `ajv.errors[0].params.allowedValue` this very probably means that your TD is not valid at a specific point. Scroll up to see the precise error message

### Contributing

You can contribute by providing new JSON Schemas for assertions or by correcting them. There are two types of assertions:

* Not-complex: This is generally used to check assertions that are in the Thing instance or mandatory assertions. You simply put the JSON key to be checked in the `required` validation keyword.
* Complex: This type uses the `if-then-else` structure of JSON Schema Draft 7. You should put an `if` for the keyword you want to check and the following object in the `then`:
  ```
    "then": {
        "const": "td-data-schema_description=pass"
    }
  ```
  This way, the validation will surely fail at the const keyword and display that the JSON data has to be `"td-data-schema_description=pass"` string. This will be then detected by the assertion testing tool which will look for the `=` sign to find the result. If the schema doesn't fail, it implies that this if was false, which in turn implies that the assertion you wanted to test was not implemented in the given TD.

## Examples

* Some example Thing Descriptions are provided in the Examples folder at directory ./Examples. There are :
  * valid: Minimum 4 lights are lit green, no warning message is displayed. They may or may not pass Full Schema Validation
  * warning: At least one light is orange
  * invalid: At least one of the lights is lit red.

These examples cover all the features of the TD spec. If you think that there is a missing feature not represented, write an issue.

## Batch Testing
TODO: update
For Linux:
* Open a bash console in terminal
* From the root directory of the playground, run `./batchTest.sh`
    * This tests all the TDs in `WebContent/Examples/`
        * A TD in `valid` directory should be valid
        * A TD in `invalid` directory should be invalid, giving an error in at least one check
        * A TD in `warning` directory should give at least one warning in a check but should be valid at the same time
* In order to test batch TDs, put them in the `WebContent/Examples/Valid` directory.
* You can change the folder where the valid, invalid and warning TDs should be located.