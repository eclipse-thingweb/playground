# thingweb-playground
Validation tool for W3C WoT Thing Descriptions. Your Thing Descriptions should be written according to the W3C standard found [here](https://w3c.github.io/wot-thing-description/#).

## Using the Playground

* Online: It is hosted [here](http://plugfest.thingweb.io/playground/)
    * Simply paste a TD in the text field and click validate
* Offline: by opening `thingweb-playground/WebContent/index.html` in a Web Browser.
    * Simply paste a TD in the text field and click validate
* Script:
    * Go to Scripts folder and run `npm install`
    * Run `node Scripts/playground.js "./WebContent/Examples/Bundang/Valid/MyLampThing.jsonld"` to validate a Thing Description found at `./WebContent/Examples/Bundang/Valid/MyLampThing.jsonld'. You can replace this with a TD you want to validate.

## Examples

- Some example Thing Descriptions are provided in the Examples folder at directory WebContent/Examples. There are :
    + Valid: 4 lights are lit green, no warning message is displayed
    + Warning: 4 lights are lit green, at least one warning message is displayed, starting with ! in the console
    + Invalid: At least one of the 4 lights are lit red.


## Batch Testing

For Linux:
* Open a bash console in terminal
* From the root directory of the playground, run `./batchTest.sh`
    * This tests all the TDs in `WebContent/Examples/Lyon`
        * A TD in `Valid` directory should be valid
        * A TD in `Invalid` directory should be invalid, giving an error in at least one check
        * A TD in `Warning` directory should give at least one warning in a check but should be valid at the same time
* In order to test batch TDs, put them in the `WebContent/Examples/Lyon/Valid` directory.

## To-Do

* test cases: 
    * valid TDs
    * invalid TDs
    * warning TDs
    * Scripting: 
        * invalid args, such as integers or non valid paths
        * manual
