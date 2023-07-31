# @thing-description-playground/**ASSERTIONS**

This package provides the assertion testing functionality for the Web of Things Playground.
You can find more information about the Thingweb-Playground [here](https://github.com/eclipse-thingweb/playground).

Validation tool for W3C WoT Thing Descriptions. Your Thing Descriptions should be written according to the W3C standard found [here](https://w3c.github.io/wot-thing-description/#).

Limitations:

-   There is limited nested validation. This is due to the JSON Schema specification which doesn't allow infinite references with $ref keywords. Because of this, an enum key in a e.g. #/actions/input/properties/enum will not be necessarily checked. More information can be found [here](http://json-schema.org/draft/2019-09/json-schema-core.html#rfc.section.8.2.4.3).

## Usage

You can use this package to integrate TD assertion testing in your own Browser/NPM application.

-   Install this package via NPM (`npm install @thing-description-playground/assertions`) (or clone repo and install the package with `npm install`)
-   Node.js or Browser import:

    -   Node.js: Require the package and use the assertion Testing function

    ```javascript
    const tdAssertions = require("@thing-description-playground/assertions");
    ```

    -   Browser: Import the `tdAssertions` function as a global by adding a script tag to your html.

    ```html
    <script src="./node_modules/@thing-description-playground/assertions/dist/web-bundle.min.js"></script>
    ```

-   Now you can call the assertion testing function and handle the result.

    ```javascript
    tdAssertions([simpleTD], fileLoad, /*OPT: log Function*/, /*OPT: manual report*/)
    .then( result => {
      console.log("OKAY")
      console.log(result)
    }, err => {
      console.log("ERROR")
      console.error(err)
    })
    ```

    You can also find examples on how to use this package in the [example-scripts folder](./example-scripts) or the [web] and [cli] packages.

## Structure

-   [index.js](./index.js) contains the package import/export structure, application flow (assertion testing, merging, print stats), and handles loading of the assertion schemas.
-   [assertionTests-td.js](./assertionTests-td.js) contains the actual assertion testing functionalities for TDs.
-   [assertionTests-tm.js](./assertionTests-tm.js) contains the actual assertion testing functionalities for TMs.
-   [util.js](./util.js) contains functionality that is used by both [assertionTests-td.js](./assertionTests.js) and [assertionTests-tm.js](./assertionTests.js).
-   [checkCoverage.js](./checkCoverage.js) can output stats about a given assertion testing report.
-   [assertion-td](./assertions-td) a folder that contains all TD assertion schemas. Includes the TD [manual.csv](assertions-td/manual.csv) and [tdAssertionList.json](assertions-td/tdAssertionList.json), a list of all filenames in the folder. It is required for browser usage of the package (since no access to directory content exits there).
-   [assertion-tm](./assertions-tm) a folder that contains all TM assertion schemas. Includes the TM [manual.csv](assertions-tm/manual.csv) and [tmAssertionList.json](assertions-tm/tmAssertionList.json), a list of all filenames in the folder. It is required for browser usage of the package (since no access to directory content exits there).
-   [mergeResults.js](./mergeResults.js) can merge several assertion testing reports to one single report, representing the assertions results of an whole implementation instead of single TDs.
-   [update-list.js](./update-list.js) Has to be executed after applying changes of files in the [assertion-td](./assertions-td) and [assertion-tm](./assertions-tm) directories. Updates the [tdAssertionList.json](assertions-td/tdAssertionList.json) and [tmAssertionList.json](assertions-tm/tmAssertionList.json) with the current filenames.

### manual.csv Generation

-   [generate-manual-csv.sh](./generate-manual-csv.sh) a bash script that is the entry point for generating the manual.csv
-   [generate-manual-csv.js](./generate-manual-csv.js) a JavaScript script that does the actual generation of the manual.csv
-   [assertions-csv](assertions-csv) a folder that contains the inputs needed for the generation of the manual.csv as well as the outputs generated.

For more details, please read the [README.md](assertions-csv/README.md) under `assertions-csv` folder

### CSV change-log generation

-   [generate-changelog.js](./generate-changelog.js) a JavaScript script that takes an old assertions CSV and a new assertions CSV as and generates a change-log in Markdown as an output.  
    For usage run:

```bash
node generate-changelog.js <old CSV path> <new CSV path> [output path]
```

Output path is optional. If not specified, the Markdown will be printed to the terminal instead. So it is possible to also pipe the result:

```bash
node generate-changelog.js <old CSV path> <new CSV path> > [output path]
```

## License

Licensed under the MIT license, see [License](../../LICENSE.md).

## Script based Thing Description Validation

This is a Node.js based tool.

-   You can use `core` package as an API to validate TDs in your own packages.
-   You can use the `cli` package to test one/multiple TDs via the command line.
-   You can use this package to integrate assertion testing via an API in your own packages.
-   You can use the `web` package to host/adapt your own browser version of the WoT playground. Remember you need to deliver its files by a web server (also locally possible via localhost), simply opening the `index.html` with a browser won't do the job.

## Script based Assertion Tester

365 out of 454 assertions of the TD specification can be tested with this tool.

This tool checks which assertions are satisfied by a given Thing Description(s).
The assertions are modeled as JSON Schema or as scripts.
'assertions-td' and `assertions-tm` has the JSON Schema assertions.

To use the assertion testing via the command line, please use the `cli` package.

**WARNING**: If you see an error like `ajv.errors[0].params.allowedValue` this very probably means that your TD is not valid at a specific point. Scroll up to see the precise error message

### Contributing

1. Schema based assertions

You can contribute by providing new JSON Schemas for assertions or by correcting them. There are two types of assertions:

-   Not-complex: This is generally used to check assertions that are in the Thing instance or mandatory assertions. You simply put the JSON key to be checked in the `required` validation keyword.
-   Complex: This type uses the `if-then-else` structure of JSON Schema Draft 7. You should put an `if` for the keyword you want to check and the following object in the `then`:

    ```json
      "then": {
          "const": "td-data-schema_description=pass"
      }
    ```

    This way, the validation will surely fail at the const keyword and display that the JSON data has to be `"td-data-schema_description=pass"` string. This will be then detected by the assertion testing tool which will look for the `=` sign to find the result. If the schema doesn't fail, it implies that this if was false, which in turn implies that the assertion you wanted to test was not implemented in the given TD.

2. Script based assertions

Some assertions cannot be verified just by a schema, even when the complex schemas are used.
Examples are checking that all multi language definitions like titles and descriptions contain the same language tags.

When a new one is added, it is advised to add it to the [shared.js](https://github.com/eclipse-thingweb/playground/blob/master/packages/core/shared.js) since such checks can be used by the core package as well.

After adding the function, you should do the following:

1. Add it to the exports of `shared.js`
2. Add it to the exports of `index.js` of the core package
3. Add its name to the details object in `index.js` and its description to the detailComments of the `index.js`
4. In the assertions package, adding it to the imports at the [assertionTests.js](https://github.com/eclipse-thingweb/playground/blob/master/packages/assertions/assertionTests.js)
5. In the same file, calling it whenever needed. The other ones are done at around line 80.
6. Adding it to the expected results of the tests (refResults) at the core package.

## Known Bugs

-   td-json-open assertion exists multiple times, [see issue 124](https://github.com/eclipse-thingweb/playground/issues/124)

[web]: https://github.com/eclipse-thingweb/playground/tree/master/packages/web
[cli]: https://github.com/eclipse-thingweb/playground/tree/master/packages/cli
