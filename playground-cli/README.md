# Thingweb-Playground

This package provides a Command Line Interface (CLI) for the Web of Things Playground.

The core package can be found here: TODO:
The web interface can be found here: TODO: or running hosted [here](http://plugfest.thingweb.io/playground/)   

Validation tool for W3C WoT Thing Descriptions. Your Thing Descriptions should be written according to the W3C standard found [here](https://w3c.github.io/wot-thing-description/#).

## License
Dual-licensed under both

* [Eclipse Public License v. 2.0](http://www.eclipse.org/legal/epl-2.0)
* [W3C Software Notice and Document License (2015-05-13)](https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document)

Pick one of these two licenses that fits your needs.
Please also see the additional [notices](NOTICE.md) and [how to contribute](CONTRIBUTING.md).


## Script based Thing Description Validation

This is a node.js based tool

* You can use the `playground-cli` package to test one/multiple TDs via the command line.



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

## Examples
Examples are included in the `playground-core` package and can be accessed via the CLI.

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
