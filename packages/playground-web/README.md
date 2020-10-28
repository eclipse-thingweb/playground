# Thingweb-Playground Web

This package provides the web interface of the Web of Things Playground.
It uses the functionality of the `playground-core` package to validate Thing Descriptions and `playground-assertions` to generate an assertion Test report.
You can find more information about the Thingweb-Playground [here](https://github.com/thingweb/thingweb-playground).

The gist submission backend (required to keep authentication private) is provided by the `playground-gist_backend` package.

## License

Licensed under the MIT license, see [License](./LICENSE.md).

## Browser based Thing Description Validation

* Online: It is hosted [here](http://plugfest.thingweb.io/playground/)
  * Simply paste a TD in the text field and click validate
  * Safari browser has unexpected behavior with JSON-LD documents
  * I you loose your internet connection when validating JSON-LD validation will fail since it tries to access the documents under `@context` (can be turned off)

* Offline/OnPremise: by hosting the `playground-web` yourself. You can use the `playground-web` package to host/adapt your own browser version of the WoT playground.  
  To host it yourself:
  * Install the package with npm `npm install playground-web` (or clone repo and install the package with `npm install`)
  * Deliver its files by a web server (also locally possible via localhost), simply opening the `index.html` with a browser won't do the job.  

## (Playwright) Testing

You can check if the website created by this package is visually okay and functionally working correctly by running `npm test` and inspecting the results in the [test-results](./test_results) folder.

To debug the playwright test (and see what actions it triggers) use `npm start debug`.

To host the website for test purposes use `npm run serve`.
