# Thingweb-Playground CLI

This package provides a Command Line Interface (CLI) for the Web of Things Playground.
You can find more information about the Thingweb-Playground [here](https://github.com/thingweb/thingweb-playground).

You can validate whether one, or several given TDs are valid.
Furthermore you can generate an assertion test report (`-a`) to see which assertions are implemented in your TD.
For more information on the usage of the CLI, please use `--help` parameter or look at the last section of this readme. Most parameters can be mixed (e.g.
`-a -c -n`) will output an **Assertion report**, in json and **not csv** and seperately for every given TD **not merged**.
But keep in mind, that assertion parameters won't have any effect on the normal validation.

## License

Licensed under the MIT license, see [License](./LICENSE.md).

## Script based Thing Description Validation

This is a Node.js based tool.

* You can use the `playground-core` package as an API to validate TDs in your own packages.
* You can use the `playground-assertion` package to integrate assertion testing via an API in your own packages.
* You can use the `playground-web` package to host/adapt your own browser version of the WoT playground.
* You can use this package to test one/multiple TDs via the command line.
* Run `node index.js "./node_modules/playground-core/examples/tds/valid/actionReponse.json"` to validate a Thing Description found at './node_modules/playground-core/examples/tds/valid/actionReponse.json'. You can replace this with a TD you want to validate.

## Script based Assertion Tester (-a parameter)

297 out of 349 assertions of the TD specification can be tested with this tool.

This tool checks which assertions are satisfied by a given Thing Description(s). The assertions are modeled as JSON Schema or as scripts. 'playground-assertions/assertions' has the JSON Schema assertions. To use this tool (`node index.js` can be replaced by `npm start`):

* Install the package with npm `npm install playground-cli` (or clone repo and install the package with `npm install`)
* Change to `playground-cli` directory
* For single TD: Run 'node index.js an_example_TD_location -a'. E.g. `node index.js ./node_modules/playground-core/examples/tds/valid/JsonLdThing.json -a`
  * You can specify the output location and filename with the -o argument, e.g. `node index.js inputTD.json -o outputResult -a`
* For a directory with **only** TDs: Run 'node index.js a_directory_location'. E.g. `node index.js ./node_modules/playground-core/examples/tds/valid/`
* The result(s) are found in the './out' merged into one report (unless the --assertion-nomerge parameter -n is set, then a report for every Td is created)
  * By default there will be a .csv file, with the --assertions-nocsv parameter -c there will be a .json file. The .csv version has the format required by the implementation report and the .json version is provided for using the results in other tools, such as merging the results.
  * The result can be pass, fail or not-impl
  * Some assertions have an underscore, i.e. `_` before the last word. This means that this assertion is a sub assertion of a parent assertion. For example, td-actions assertion required the existence of action interaction in the TD and also the uniqueness of the names of actions. Because of this, there will be two assertions generated in the results with following names: td-actions_existence and td-actions_uniqueness.
  * If there is a sub assertion, there is always a parent assertion. Look above to find the parent assertion. If one child assertion is not implemented, the parent will be also marked as not implemented.
* Merge the results if you have an implementation that produced multiple TDs and you created multiple single reports for them. To merge them they have to be .csv reports, otherwise the program won't recognize them as reports. To do so, you can use one of the following ways:
  1. Give multiple result files as arguments: `node index.js ./out/result-urn:another.csv ./out/result-urn:dev:wot:com:example:servient:lamp.csv -a`
     * You can put as many reports as you want after `node index.js` and before `-a`
  2. Give a directory containing multiple result files `node index.js ./out/ -a`
* You can check the coverage of tge results.csv file with `node index.js results.csv -a` which will output a list to the std output indicating how many assertions passed, failed or not implemented

**WARNING**: If you see an error like `ajv.errors[0].params.allowedValue` this very probably means that your TD is not valid at a specific point. Scroll up to see the precise error message

## Batch Testing

* Call the CLI e.g. with `node index.js` and give a folder as input, e.g., `./myDir`
* This tests all the TDs in the following subfolders:
  * A TD in `valid` directory should be valid
  * A TD in `invalid` directory should be invalid, giving an error in at least one check
  * A TD in `warning` directory should give at least one warning in a check but should be valid at the same time
* And all TDs located directly in the `./myDir` folder
Even though it is not recommended, mixing TDs locate directly in the directory and subdirectories of the above structure, is possible.

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

## Known Bugs

* td-json-open assertion exists multiple times, [see issue 124](https://github.com/thingweb/thingweb-playground/issues/124)

## Parameters

```javascript
'--help -h': { /* Display the output specified by this object */
    type: 'string',
    description: 'For TD playground-core validation you can call the playground validation with no input (example folder will be taken), \n'+
                'a Thing Description (.json file), a folder with multiple Thing Descriptions, \n' +
                'or a Folder with "valid", "invalid" and "warning" subfolder, where all included TDs \n' +
                'will be checked whether they produce the expected validation result.' +
                'Use the -a parameter for playground-assertions testing.'
},
'--input -i *': {
    type: 'string',
    description: 'The file or the folder containing the files, which will be validated.'
},
'--nojsonld -j': {
    type: 'boolean',
    description: 'Turn off the JSON-LD validation (for example because internet connection is not available).'
},
'--nodefaults -d': {
    type: 'boolean',
    description: 'Turn off the Full JSON Schema validation, which checks e.g. for default values being explicitly set.'
},
'--assertions -a': {
    type: 'boolean',
    description: 'Call the assertion report instead of the core validation, \n' +
                'if files with .csv ending are given as input merging assertion reports is done.'
},
'--assertion-out -o': {
    type: 'string',
    description: 'Path and filename of the generated assertions report (defaults to ./out/[.]assertionsTest[_$input]). \n' +
                 'Please notice that the folders you specify as target already have to exist.'
},
'--assertion-nomerge -n': {
    type: 'boolean',
    description: 'if multiple files where given as input, don\'t create a merged report, but one for each'
},
'--assertion-tostd -s': {
    type: 'boolean',
    description: 'output the report(s) as stdout and don\'t write them to a file'
},
'--assertion-nocsv -c': {
    type: 'boolean',
    description: 'return assertion report(s) in json format instead of csv'
},
'--assertion-manual -m': {
    type: 'string',
    description: 'path and filename to manual.csv file'
},
'--open-api -p': {
    type: 'boolean',
    description: 'Call the openAPI instance generation instead of validation/assertions.'
},
'--oap-yaml -y': {
    type: 'string',
    description: 'Whether openAPI should be written as YAML instead of json.'
},
'--default-add': {
    type: 'boolean',
    description: 'Whether the input TD should be extended by default values.'
},
'--default-rem': {
    type: 'boolean',
    description: 'Whether the input TD should be reduced by default values.'
}
```
