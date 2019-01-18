# thingweb-playground
Validation tool for W3C WoT Thing Descriptions. Your Thing Descriptions should be written according to the W3C standard found [here](https://w3c.github.io/wot-thing-description/#).

There are different tools that can be found in this repo. They will be split later on.

## Browser based Thing Description Validation

* Online: It is hosted [here](http://plugfest.thingweb.io/playground/)
    * Simply paste a TD in the text field and click validate
    * Safari browser has unexpected behavior with JSON-LD documents

* Offline: by opening `thingweb-playground/WebContent/index.html` in a Web Browser.
    * Simply paste a TD in the text field and click validate
    * Safari browser has unexpected behavior with JSON-LD documents

## Script based Thing Description Validation

This is a node.js based tool

    * Go to Scripts folder and run `npm install`
    * Run `node Scripts/playground.js "./WebContent/Examples/Bundang/Valid/MyLampThing.jsonld"` to validate a Thing Description found at `./WebContent/Examples/Bundang/Valid/MyLampThing.jsonld'. You can replace this with a TD you want to validate.

## Script based Assertion Tester

This tool checks which assertions are satisfied by a given Thing Description. The assertions are modeled as JSON Schema. This means that there are only JSON Schema testable assertions are checked. 'AssertionTester/Assertions' has these assertions. To use it from the root directory of the repository:
* Run 'node ./AssertionTester/assertionTester.js an_example_TD_location'. E.g. 'node ./AssertionTester/assertionTester.js WebContent/Examples/Lyon/Valid/JsonLdThing.jsonld' 
* The results are found in the 'AssertionTester/Results'
  * There will be a .csv and a .json file. .csv has the format required by the test results display format and the .json has the same data and also the error message.
  * The result can be pass, fail or not-impl 

## Examples

- Some example Thing Descriptions are provided in the Examples folder at directory WebContent/Examples. There are :
    + Valid: 4 lights are lit green, no warning message is displayed
    + Warning: 4 lights are lit green, at least one warning message is displayed, starting with ! in the console
    + Invalid: At least one of the 4 lights are lit red.


## Batch Testing

For Linux:
* Open a bash console in terminal
* From the root directory of the playground, run `./batchTest.sh`
    * This tests all the TDs in `WebContent/Examples/`
        * A TD in `Valid` directory should be valid
        * A TD in `Invalid` directory should be invalid, giving an error in at least one check
        * A TD in `Warning` directory should give at least one warning in a check but should be valid at the same time
* In order to test batch TDs, put them in the `WebContent/Examples/Valid` directory.
* You can change the folder where the valid, invalid and warning TDs should be located.

## To-Do

* test cases: 
  * forms in the root with op from non root forms
  * putting strings in security that are not defined in securityDefinitions
  * op in event that has action or property op and vice versa
  * empty form getting rejected
  * using camel case when it shouldnt be and vice versa
  * TD containing mediaType gets a warning
  * forms in the root
  * multiLanguage TD
* Scripting: 
    * invalid args, such as integers or non valid paths
    * manual
* Needed Validation
