# playground-defaults

The package adds/removes defaults according to the Thing Description (TD) specification for every property with a default that is not filled with a value.
Currently using [this](https://www.w3.org/TR/2020/REC-wot-thing-description-20200409/) version of the TD specification.
It is part of the Thingweb-Playground, you can find more information about the Thingweb-Playground [here](https://github.com/thingweb/thingweb-playground).

## License

Licensed under the MIT license, see [License](./LICENSE.md).

## Usage

You can use this package to integrate TD default value adding/removing in your application.

* Install this package via NPM (`npm install @thing-description-playground/defaults`) (or clone repo and install the package with `npm install`)
* Node.js or Browser import:
  * Node.js: Require the package and use the functions

  ```javascript
  const { addDefaults, removeDefaults } = require("@thing-description-playground/defaults")
  ```

  * Browser: Import the `tdDefaults` object as a global by adding a script tag to your html (and optionally declare the variables without namespace).

  ```html
  <script src="./node_modules/@thing-description-playground/add_defaults/dist/web-bundle.min.js"></script>
  ```

  ```javascript
  const addDefaults = tdDefaults.addDefaults
  const removeDefaults = tdDefaults.removeDefaults
  ```

* Now you can call the add/remove defaults function to extend/reduce a TD object.

```javascript
addDefaults(td)
removeDefaults(td)
```

## Documentation

* How it works:  
  The algorithm shipped with package basically tries to check all possible place (in terms of object hierachy e.g. `td.properties.temperature`) type combinations (lines 1 - 3). A type refers to one objects default values (e.g. `form -> op: application/json`). All existing combinations in the given TD, are then passed to a `handle` function (lines 4, 5). Since there can be `nested` places of type `DataSchema` (e.g. if one DataSchema includes another by using `oneOf`), these need to be handled recursively (lines 6 - 10).  
  The `handle` function (lines 13 - 20) checks the place & type combinations in the given TD, depending on whether it should **add** or **remove** default values:
  * add: If the default value(s) corresponding to the place type combination is/are not defined in the current TD, if this is true it adds the default value(s) (lines 14 - 16).  
  * remove: If the place type combination value(s) equal the default value(s), if this is true it removes the value(s) (lines 17 - 19).  

* pseudocode:

  ```js
  #1  | checkAllPossibleDefaultValuePlaces(td) {
  #2  |   for (every type of defaultTypes)
  #3  |     for (every place of possiblePlaces[type])
  #4  |       if (td[place] !== undefined)
  #5  |         handle(td[place], type)
  #6  |       if (type == "DataSchema")
  #7  |         currentPlace = td[place]
  #8  |         while (hasRecursiveElements(currentPlace))
  #9  |           handle(currentPlace, "DataSchema")
  #10 |           currentPlace = currentPlace[recursion]
  #11 | }
  #12 |
  #13 | handle(object, type) {
  #14 |   if (mode == "add")
  #15 |     if (object[type] == undefined)
  #16 |       object[type] = defaultTable[type]
  #17 |   if (mode == "remove")
  #18 |     if (object[type] == defaultTable[type])
  #19 |       delete object[type]
  #20 | }
  ```
