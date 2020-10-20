# playground-td_to_openAPI

The package providing support for openAPI instance generation (output as `json` or `yaml`), using a Thing Description as input.

## Abbreviations

* OAP: openAPI
* TD: Thing Description

## Limitations

* Semantics
  * Some semantic annotations of the TD are converted to custom fields (prefixed by `x-`) in the openAPI output (e.g. `@context` -> `x-@context`) to provide a user who inspects the instance additional information.
  * Most semantic information is lost by converting a TD to an openAPI instance, since converting it is not possible or does not make any sense because no consumer of an openAPI isntance uses it.
* Security
  * The openAPI specification does not support http authentification outside the header (query, body, cookie)
  * The TD specification does not support openIdConnect authentification
  * Information that is not required to describe an oauth flow in a TD is required for an openAPI instance (e.g. token url)
  * OAP supports alternative (only one has to be fullfilled) security objects, which can contain more than one security scheme (per object all security schemes have to be fullfilled). A TD also supports one security object with multiple schemes, but not alternative objects.
  * The `psk` (pre shared key) security scheme of a TD can not be represented by an openAPI instance.
* Async Operations
  * Events of a TD, which are by nature asynchronous, can only be represented in OAP using the http-longpoll subprotocol.
  * For the future the support of [asyncAPI](https://asyncapi.com) instance generation is planned.

## Comments

* A TD hasn't necessarily to be valid in order to be converted to an openAPI instance. This converter will only throw an Error if the invalid part has a strong effect on the conversion result, but tries to ignore the most cases. This is by purpose, since there is the possibility to validate a TD using, e.g., the playground core package and the conversion of experimental TDs for example to create new TD features, should be supported.

## License

Licensed under the MIT license, see [License](./LICENSE.md).
