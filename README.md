# thingweb-playground
Validation tool for W3C WoT Thing Descriptions. Your Thing Descriptions should be written according to the W3C standard found [here](https://w3c.github.io/wot-thing-description/#).

Limitations:
* There is no nested validation. This is due to the JSON Schema specification which doesn't allow infinite references with $ref keywords. Because of this an enum key in a e.g. #/actions/input/properties/enum will not be checked. More information can be found [here](http://json-schema.org/latest/json-schema-core.html#rfc.section.7).

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

## For developers/contributors:

For complex schemas
    If valid then it is not implemented
    if error says not-impl then it is not implemented
    if error says impl then it is implemented
    If somehow error says fail then it is failed

    Output is structured as follows:
    [main assertion]:[sub assertion if exists]=[result]

For simple schemas


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

* Assertions:
  
td-string-type
td-integer-type
td-number-type
td-property-names ?
td-property-objects:properties
td-property-objects:items
??? td-event-response-arrays
CHANGED DONE td-forms-response
td-security-overrides
td-media-type  STILL VALID?
td-jsonld-preprocessing-context
td-jsonld-preprocessing-prefix
td-jsonld-preprocessing-defaults
CHANGED DONE td-vocab-security
td-vocab-description
td-vocab-name
td-vocab-properties
CHANGED DONE td-vocab-forms
td-vocab-title
CHANGED DONE td-vocab-response
CHANGED DONE td-vocab-contentType
CHANGED DONE td-vocab-type
td-vocab-readOnly
td-vocab-enum
td-vocab-const
td-vocab-writeOnly
td-vocab-oneOf
td-vocab-unit
td-vocab-maxItems
td-vocab-items
td-vocab-minItems
td-vocab-minimum
td-vocab-maximum
td-vocab-required
td-vocab-scheme
td-vocab-proxy
td-vocab-in
td-vocab-qop
td-vocab-authorization
td-vocab-alg
td-vocab-format
td-vocab-identity
td-vocab-refresh
td-vocab-token
td-vocab-flow
client-data-schema
client-uri-template


* test cases:
  * scopes in interaction level
* Scripting: 
    * invalid args, such as integers or non valid paths
* Needed Validation
