# WoT (W3C) Thingweb-Playground

Try it online at [http://plugfest.thingweb.io/playground/](http://plugfest.thingweb.io/playground/)

## Structure

The structure of all Web of Things (WoT) Playground packages is shown here: ![packageStructure](https://i.imgur.com/RTG02d8.png)  
The core package provides a function to check whether a Thing Description (TD) is valid according to the W3C WoT [standard](https://w3c.github.io/wot-thing-description/#).
Its functionality can be imported, as well as the assertion checks of the assertion package.
They create a report stating how much standard assertions a fullfilled by a single TD or WoT Implementation.
Both packages are used by the Web and CLI packages to provide their functionalities, plus IO functionalities through an UI.

## Packages

The packages in this repository ([here](./packages)), which you find on NPM under [@thing-description-playground/packageName](https://www.npmjs.com/search?q=%40thing-description-playground).

* You can use the `assertion` package to integrate assertion testing via an API in your own packages. The assertions package can be found [here](./packages/assertions/) or [on NPM](https://www.npmjs.com/package/@thing-description-playground/assertions).
* You can use the `cli` package to test one/multiple TDs via the command line or execute assertion testing with it. The cli for the playground can be found [here](./packages/cli/) or [on NPM](https://www.npmjs.com/package/@thing-description-playground/cli).
* You can use the `core` package as an API to validate TDs in your own packages. The core package can be found [here](./packages/core/) or [on NPM](https://www.npmjs.com/package/@thing-description-playground/core).
* You can use the `defaults` package to add/remove explicitly stated default values in a TD. The default package can be found [here](./packages/defaults/) or [on NPM](https://www.npmjs.com/package/@thing-description-playground/defaults).
* You can use the `gist_backend` package to host a backend for the gist-submission functionality of the browser version of the playground. The package can be found [here](./packages/gist_backend) or [on NPM](https://www.npmjs.com/package/@thing-description-playground/gist_backend).
* You can use the `td_to_openAPI` package to create an openAPI instance from a Thing Description. The package can be found [here](./packages/td_to_openAPI) or [on NPM](https://www.npmjs.com/package/@thing-description-playground/td_to_openapi).
* You can use the `web` package to host/adapt your own browser version of the WoT playground. The web package can be found [here](./packages/web/) or [on NPM](https://www.npmjs.com/package/@thing-description-playground/web).

## Examples

Examples are included in the `core` and can be used in the web interface by a dropdown menu.

## Browser based Thing Description Validation

* Online: It is hosted [here](http://plugfest.thingweb.io/playground/)
  * Simply paste a TD in the text field and click validate
  * Safari browser has unexpected behavior with JSON-LD documents
  * If you loose your internet connection when validating JSON-LD validation will fail since it tries to access the documents under `@context` (can be turned off)

* Offline/OnPremise: by hosting the `web` yourself. Therefore, please deliver the "index.html" file with a web-server.

## Batch Testing

Please have a look at the `cli` [package](https://github.com/thingweb/thingweb-playground/tree/master/packages/cli#batch-testing) for batch testing of Thing Descriptions.

## Script based Assertion Tester

Please have a look at the `cli` [package](https://github.com/thingweb/thingweb-playground/tree/master/packages/cli#script-based-assertion-tester--a-parameter) for script based assertion testing, or at the `assertions` package, if you're planning to integrate the assertion testing as a dependency in your own NPM modules.

## Script based Thing Description Validation

Please have look at the `cli` [package](https://github.com/thingweb/thingweb-playground/tree/master/packages/cli#script-based-thing-description-validation) for script based TD validation, or at the `core` package, if you're planning to integrate the TD validation as a dependency in your own NPM modules.

## License

All packages are licensed under the MIT license. You find a copy of the License [here](./LICENSE.md).

## Publish a new version

1. Run `lerna bootstrap` to install dependencies among the packages, even if a package has never been published before. Make sure you have not increased the dependency versions yet, e.g., you have a new package *newExample* and the *oldExample* depends on it. The *newExample* is on version `0.0.0` (since you wan't to publish it as `1.0.0`) then in the *oldExample* package.json the dependency has to be on the same version (or lower) so `"dependencies" { newExample: "^0.0.0"}}`. **Otherwise lerna will not accept linking the local *newExample*.**
2. If `lerna bootstrap` was successful you can now bump dependency versions (if required), e.g., you could now do `"dependencies" { newExample: "^1.0.0"}}` in the *oldExample* package.json.
3. Run `lerna publish` to publish all new package versions. Lerna will then ask for every changed package whether it received a patch, minor or major update. In our example you should now select major for the *newExample* so that it will be published as `1.0.0` version.
