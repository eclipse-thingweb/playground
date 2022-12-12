# Automated manual.csv Generation

This folder contains all files related to automated generation of the assertions manual.csv

## Structure

* [manual-generation-inputs](manual-generation-inputs): This folder contains all the inputs needed for both [generate-manual-csv.sh](../generate-manual-csv.sh) and [generate-manual-csv.js](../generate-manual-csv.js)
  * [MinimalThing.json](manual-generation-inputs/MinimalThing.json): a sample TD
  * [MinimalThingModel.json](manual-generation-inputs/MinimalThingModel.json): a sample TM
  * [pre-implemented.csv](manual-generation-inputs/pre-implemented.csv): The csv generated from running the assertion tester on both [MinimalThing.json](manual-generation-inputs/MinimalThing.json) and [MinimalThingModel.json](manual-generation-inputs/MinimalThingModel.json). May contain older assertions that are not in the spec currently and as such is filtered in during the generation process.

* [assertions.csv](assertions.csv): A csv that is generated at the wot-thing-description repository. This file is fetched daily from the wot-thing-description repository.

* [implemented.csv](implemented.csv): A csv that contains all the assertions that can be automatically verified by the assertion tester and does not contain any assertions not found in [assertions.csv](assertions.csv). One of the outputs of the [generate-manual-csv.js](../generate-manual-csv.js) script.

* [manual.csv](manual.csv): A csv that contains all the assertions that cannot be automatically verified by the assertion tester and any new assertions that were found [assertions.csv](assertions.csv) but not in the [implemented.csv](implemented.csv). One of the outputs of the [generate-manual-csv.js](../generate-manual-csv.js) script.

* [old.csv](manual.csv): A csv that contains all the assertions that were found in the [pre-implemented.csv](manual-generation-inputs/pre-implemented.csv) but were not found [assertions.csv](assertions.csv). These are therefore considered old assertions and need to be handled. Ideally this file should not contain anything. One of the outputs of the [generate-manual-csv.js](../generate-manual-csv.js) script.

* [needsReview.csv](needsReview.csv): A csv that contains all assertions found in [assertions.csv](assertions.csv) but not found in [implemented.csv](implemented.csv). These are, therefore, all new assertions that were added. This folder needs to be manually reviewed to determine if an assertion can be implemented in the assertions tester or if it has to be verified manually. Assertions that need to be verified manually must be copied to the TD [manual.csv](../assertions-td/manual.csv) and the TM [manual.csv](../assertions-tm/manual.csv) respectively.

* [report.json](report.json): A JSON document that contains metrics about the latest run including the last time it was run and the number of assertions in each of the aforementioned files.

## Procedure

* Run [generate-manual-csv.sh](../generate-manual-csv.sh) bash script (for Windows you can use git bash).
  
    This will first generate a temporary folder that will contain the output for running the assertion tester on [MinimalThing.json](manual-generation-inputs/MinimalThing.json) and [MinimalThingModel.json](manual-generation-inputs/MinimalThingModel.json). The output csv of the TM is appended to the output csv of the TD and is renamed to [pre-implemented.csv](manual-generation-inputs/pre-implemented.csv). Then [generate-manual-csv.sh](../generate-manual-csv.sh) calls [generate-manual-csv.js](../generate-manual-csv.js) which takes both [pre-implemented.csv](manual-generation-inputs/pre-implemented.csv) and [assertions.csv](assertions.csv) and generates [implemented.csv](implemented.csv), [manual.csv](manual.csv), [old.csv](manual.csv), [needsReview.csv](needsReview.csv) and [report.json](report.json).

* Review [old.csv](manual.csv) and make sure to fix the names of these assertions or remove them if applicable.
  
* Review [needsReview.csv](needsReview.csv) and decide which assertions can be implemented and which will be verified manually. Make sure that all assertions that need to be verified manually are copied to the TD [manual.csv](../assertions-td/manual.csv) and the TM [manual.csv](../assertions-tm/manual.csv) respectively.
