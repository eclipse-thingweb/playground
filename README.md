# thingweb-playground
Validation tool for W3C WoT Thing Descriptions. Your Thing Descriptions should be written according to the W3C standard found [here](https://w3c.github.io/wot-thing-description/#).

Limitations:
* There is limited nested validation. This is due to the JSON Schema specification which doesn't allow infinite references with $ref keywords. Because of this an enum key in a e.g. #/actions/input/properties/enum will not be necessarily checked. More information can be found [here](http://json-schema.org/latest/json-schema-core.html#rfc.section.7).

There are different tools that can be found in this repo. They will be split later on.

## Browser based Thing Description Validation

* Online: It is hosted [here](http://plugfest.thingweb.io/playground/)
    * Simply paste a TD in the text field and click validate
    * Safari browser has unexpected behavior with JSON-LD documents

* Offline: by opening `thingweb-playground/WebContent/index.html` in a Web Browser.
    * Simply paste a TD in the text field and click validate
    * Safari browser has unexpected behavior with JSON-LD documents

You can also use the [this](http://jeremydorn.com/json-editor/?schema=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&value=N4IglgJiBcIgNCAdgQwLYFMZ0QBwE4D2uG+ALmBgM4zAC+iKAxhYUjdPYhNU/mLlbtaDEADdSVMG1rh2ZFEiZZYIUTyp8BQ7AhAAbMEgDWHANoBdRADNC+NOdAALfBmu7ETNmQxIyAFQBPEg8QKgwmAFd+MkCYS0RNYmp4qzDIgCMABSIyQi99bH02AHNcQn1CxFcqcvYVUC8/XwDglTg6OjSMlHDQ8KiYwIARNyMwIQ4udNxy8lC+DBQfKFVEfV6yAFlCCDBrSlWcEAwJPynRAeiJuOgzODSAAViQtZBHpp8ADzJUuiAA==&theme=bootstrap2&iconlib=fontawesome4&object_layout=normal&show_errors=interaction&ajax) JSON editor to create a TD in a validated fashion.


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
td-security-overrides
td-media-type  STILL VALID?
td-jsonld-preprocessing-context
td-jsonld-preprocessing-prefix
td-jsonld-preprocessing-defaults
td-vocab-description
td-vocab-name
td-vocab-properties
td-vocab-title
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
