# WoT (W3C) Thingweb-Playground

Try it online at http://plugfest.thingweb.io/playground/

## Structure

The structure of all Web of Things (WoT) Playground packages is shown here: ![packageStructure](https://i.imgur.com/RTG02d8.png)  
The core package provides a function to check whether a Thing Description (TD) is valid according to the W3C WoT [standard](https://w3c.github.io/wot-thing-description/#).
Its functionality can be imported, as well as the assertion checks of the assertion package.
They create a report stating how much standard assertions a fullfilled by a single TD or WoT Implementation.
Both packages are used by the Web and CLI packages to provide their functionalities, plus IO functionalities through an UI.

## Packages

* You can use the `playground-assertion` package to integrate assertion testing via an API in your own packages. The assertions package can be found [here](./packages/playground-assertions/).
* You can use the `playground-cli` package to test one/multiple TDs via the command line or execute assertion testing with it. The cli for the playground can be found [here](./packages/playground-cli/).
* You can use the `playground-core` package as an API to validate TDs in your own packages. The core package can be found [here](./packages/playground-core/).
* You can use the `playground-defaults` package to add/remove explicitly stated default values in a TD. The default package can be found [here](./packages/playground-defaults/).
* You can use the `playground-gist_backend` package to host a backend for the gist-submission functionality of the browser version of the playground. The package can be found [here](./packages/playground-gist_backend).
* You can use the `playground-td_to_openAPI` package to create an openAPI instance from a Thing Description. The package can be found [here](./packages/playground-td_to_openAPI).
* You can use the `playground-web` package to host/adapt your own browser version of the WoT playground. The web package can be found [here](./packages/playground-web/).

## Examples

Examples are included in the `playground-core` and can be used in the web interface by a dropdown menu.

## Browser based Thing Description Validation

* Online: It is hosted [here](http://plugfest.thingweb.io/playground/)
  * Simply paste a TD in the text field and click validate
  * Safari browser has unexpected behavior with JSON-LD documents
  * If you loose your internet connection when validating JSON-LD validation will fail since it tries to access the documents under `@context` (can be turned off)

* Offline/OnPremise: by hosting the `playground-web` yourself. Therefore, please deliver the "index.html" file with a web-server.

## Batch Testing

Please have a look at the `playground-cli` [package](https://github.com/thingweb/thingweb-playground/tree/master/packages/playground-cli#batch-testing) for batch testing of Thing Descriptions.

## Script based Assertion Tester

Please have a look at the `playground-cli` [package](https://github.com/thingweb/thingweb-playground/tree/master/packages/playground-cli#script-based-assertion-tester--a-parameter) for script based assertion testing, or at the `playground-assertions` package, if you're planning to integrate the assertion testing as a dependency in your own NPM modules.

## Script based Thing Description Validation

Please have look at the `playground-cli` [package](https://github.com/thingweb/thingweb-playground/tree/master/packages/playground-cli#script-based-thing-description-validation) for script based TD validation, or at the `playground-core` package, if you're planning to integrate the TD validation as a dependency in your own NPM modules.

## License

All packages are licensed under the MIT license.

## Publish a new version

Run `lerna publish` to publish new package versions. Lerna will then ask for every changed package whether it received a patch, minor or major update.
