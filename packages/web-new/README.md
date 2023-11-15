# @thing-description-playground/**WEB-NEW**

This package provides the new web interface of the Web of Things Playground. It uses the functionality of the `core` package to validate Thing Descriptions and Models. You can find more information about the Thingweb-Playground [here](https://github.com/eclipse-thingweb/playground).

## Main Features

- Validation of TDs and TMs
- Multiple editors
- JSON and YAML conversion
- An examples menu to use as templates
- A save menu, where your currently opened TD/TM can be:
  - Exported as an URL either on a new tab/browser or on the [ediTDor] (https://eclipse.github.io/editdor/) website
  - Downloaded directly
  - Saved in a specific folder within your file system (This function is only available on `Chrome`, `Edge` and `Opera`)
- A preferences menu within the settings, where the color theme, and font size can be change
- OpenAPI conversion
- AsyncAPI conversion
- A defaults view where all defaults can be added or removed from your current TD
- Visualize view, where your current TD/TM can be represented visually as a Graph or Tree, as well as downloaded as either SVG or PNG

## License

Licensed under the MIT license, see [License](../../LICENSE.md).

## How to use

- Online: It is hosted [here](http://plugfest.thingweb.io/playground-new/)
  - Simply paste a TD or utilize an example from the examples menu and click on validate
  - The validation process will then start on the bottom console, where more information will be provided in case of errors or warnings

## Testing with Playwright

## Webpack functionality and bundling

This package is built by utilizing webpack, allowing to bundle and compile the projects JavaScript and CSS files. It also handles asset management and optimization. Below are the steps to understand the current configuration:

### 1. Introduction

The `webpack.config.js` file is used to set up Webpack for the project. It manages various aspects of the build process, including bundling JavaScript and CSS file, handling assets like images and fonts, and optimizing code for production.

### 2. Required Dependencies

- `path`: This is a built-in Node.js module for handling file paths
- `HtmlWebpackPlugin`: A Webpack plugin for generating HTML files
- `CopyWebpackPlugin`: A Webpack plugin for copying files and directories during the build process
- `MonacoWebpackPlugin`: A Webpack plugin for integrating the Monaco code editor
- `MiniCssExtractPlugin`: A Webpack plugin for extracting CSS into separate files
- `CssMinimizerPlugin`: A Webpack plugin for minimizing CSS files

### 3. Webpack Configuration Obejct

**3.1 Entry Points**
- `entry`: Specifies the entry points for your application. In this case, there are two entry points: 'bundle' for JavaScript and 'styles' for CSS

**3.2 Output**
- `output`: Specifies where Webpack should output the bundled files. The path property defines the output directory as 'dist', and the filename property determines the naming pattern for generated files. [name] is a placeholder for the entry point name, and [contenthash] is a unique hash based on file content
- `clean`: Tells Webpack to clean the 'dist' directory before each build
- `assetModuleFilename`: Specifies the filename for asset files

**3.3 Development Server**
- `devServer`: Configures the development server with settings such as the port, compressing assets, and enabling history API fallback

**3.4 Module Rules**
- `module`: Defines rules for how Webpack should process different file types. There are rules for JavaScript, images, CSS, and more. For example, it uses Babel to transpile JavaScript, handles image assets, and processes CSS with style loaders and sass loaders

**3.5 Plugins**
- `plugins`: Lists the plugins used in the build process. Key plugins include 
    - `HtmlWebpackPlugin` for generating HTML files, 
    - `CopyWebpackPlugin` for copying assets, 
    - `MonacoWebpackPlugin` for the Monaco code editor integration, and 
    - `MiniCssExtractPlugin` for extracting CSS into separate files

**3.6 Optimization**
- `optimization`: Contains settings for optimizing the build, including minimizing CSS using `CssMinimizerPlugin`


### 4. Deployment

Requires [Lerna](https://www.npmjs.com/package/lerna) to be installed globally (`npm install -g lerna`).

1. Clone the repo
2. Install the monorepo (allows linking unpublished versions)
3. Install the web package locally to ensure that e.g. `core` dependency is not just a symlink

```sh
git clone git@github.com:eclipse-thingweb/playground.git
cd playground
lerna bootstrap
cd ./packages/web-new
npm install
```

Finally the web application can be deployed in production or in development mode:

### Development mode

1. Utilize the command `npm  run dev` which will start the webpack-dev-server in development mode, generate source maps for easier debugging, open your default browser and serve the application.

```sh
npm run dev
```

### Production mode

1. Build the project with the command `npm run build` which will automatically set the mode to production
2. Finally utilize the command `npm run serve` to serve the application utilizing express as the server

```sh
npm run build
npm run serve
```

### 5. Testing with Playwright

To utilize the Playwright package for testing the application, you need to install it using `npm install` since it's not intended for production use. Additionally, to set up the supported browsers required for Playwright to run tests, you should execute the command `npx playwright install`.

You can assess the visual appearance and functionality of the package in all browsers by running the command `npm run test`. This will execute all the tests in the supported browsers, and once the tests have finished, Playwright will host the reports at `http://localhost:9323`.

If the reports aren't displayed automatically, you can also use the command `npx playwright show-report` to view the test results.

For a more visual approach to writing and visualizing tests, you can use the command `npx playwright test --ui`. This command provides a visual interface that allows you to step through each part of the test and observe what occurs before, during, and after each step.

Debugging can also be accomplished by running the Playwright test command with the `--debug` flag, like this: `npx playwright test --debug`.

For additional information on how to run and debug tests, please refer to the [official Playwright website](https://playwright.dev/docs/running-tests).

