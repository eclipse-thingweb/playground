# @thing-description-playground/**WEB**

This package provides the web interface of the Web of Things Thing Desciption Playground.
It uses the functionality of the `core` package to validate Thing Descriptions and `assertions` to generate an assertion Test report.
You can find more information about the Thingweb-Playground [here](https://github.com/thingweb/thingweb-playground).

The TDs can be exported as URLs which can be copied anywhere and reopened here.

## License

Licensed under the MIT license, see [License](../../LICENSE.md).

## Browser based Thing Description Validation

* Online: It is hosted [here](http://plugfest.thingweb.io/playground/)
  * Simply paste a TD in the text field and click validate
  * Safari browser has unexpected behavior with JSON-LD documents
  * I you loose your internet connection when validating JSON-LD validation will fail since it tries to access the documents under `@context` (can be turned off)

* Offline/OnPremise: by hosting the `web` yourself. You can use the `web` package to host/adapt your own browser version of the WoT playground.  
  To host it yourself please read the section Deployment.

## (Playwright) Testing

For testing the package has to be installed with `npm install` (no production only option set).

You can check if the website created by this package is visually okay and functionally working correctly by running `npm test` and inspecting the results in the [test-results](./test_results) folder.

To debug the playwright test (and see what actions it triggers) use `npm start debug`.

To host the website for test purposes use `npm run serve`.

## Deployment

There are two ways to deploy the thing-description-playground as a web application. The example below explains the deployment (which can be easily automized) for both versions assuming `nginx` as a web-server. Using `--only=production` option speeds up the process and is not necessary, also it does not allow running tests (because the testing dependencies are `devDependencies`). Please remember that in any case the files need to be delivered by a webserver (also for localhost), simply opening `index.html` with a browser won't be enough.

### As a Package

#### Setup

1. Create an empty NPM package
2. Install `@thing-description-playground/web` as a dependency
3. Install the production dependencies of `@thing-description-playground/web`
4. Copy the folder content to your web-directory

```sh
mkdir empty-package
cd empty-package
npm init
npm install @thing-description-playground/web
cd ./node_modules/@thing-description-playground/web
npm install --only=production
cp -r ./ ./var/www/html/subdir/
```

#### Update

1. Open the created package
2. Update its dependencies (which is only `@thing-description-playground/web`)
3. Install the production dependencies of `@thing-description-playground/web` again
4. Copy the folder content to your web-directory

```sh
cd empty-package
npm update
cd ./node_modules/@thing-description-playground/web
npm install --only=production
cp -r ./ ./var/www/html/subdir/
```

### As repository

Requires [Lerna](https://www.npmjs.com/package/lerna) to be installed globally (`npm install -g lerna`).

1. Clone the repo
2. Install the monorepo (allows linking unpublished versions).
3. Install the web package locally to ensure that e.g. `core` dependency is not just a symlink (loading e.g. examples wouldn't work otherwise)
4. Clean the target dir (nginx web-directory)
5. Copy the folder content to your web-directory
6. Clean the checked out files

```sh
git clone git@github.com:thingweb/thingweb-playground.git
cd thingweb-playground
lerna bootstrap
cd ./packages/playground-web
npm install
rm -r -f /var/www/html/subdir/*
cp -r ./* /var/www/html
cd ../../../
rm -r -f thingweb-playground
```
