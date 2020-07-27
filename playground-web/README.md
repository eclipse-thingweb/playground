# Thingweb-Playground Web
This package provides the web interface of the Web of Things Playground. 
It uses the functionality of the `playground-core` package to validate Thing Descriptions and `playground-assertions` to generate an assertion Test report.
You can find more information about the Thingweb-Playground [here](https://github.com/thingweb/thingweb-playground).

## License
Dual-licensed under both

* [Eclipse Public License v. 2.0](http://www.eclipse.org/legal/epl-2.0)
* [W3C Software Notice and Document License (2015-05-13)](https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document)

Pick one of these two licenses that fits your needs.
Please also see the additional [notices](NOTICE.md) and [how to contribute](CONTRIBUTING.md).

## Browser based Thing Description Validation
* Online: It is hosted [here](http://plugfest.thingweb.io/playground/)
  * Simply paste a TD in the text field and click validate
  * Safari browser has unexpected behavior with JSON-LD documents
  * I you loose your internet connection when validating JSON-LD validation will fail since it tries to access the documents under `@context` (can be turned off)

* Offline/OnPremise: by hosting the `playground-web` yourself. You can use the `playground-web` package to host/adapt your own browser version of the WoT playground. Remember you need to deliver its files by a web server (also locally possible via localhost), simply opening the `index.html` with a browser won't do the job.
