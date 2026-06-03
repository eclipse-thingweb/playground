# @thingweb/code-gen

Generates code snippets for interacting with [Thing Descriptions (TD)](https://www.w3.org/TR/wot-thing-description11/). Supports multiple programming languages and libraries. For unsupported language/library combinations, it generates a prompt for an LLM to complete the task.

## Usage

### As a Library

```js
import { generateCode, isProtocolSupported } from "@thingweb/code-gen";

const result = generateCode({
    td,
    affordanceType: "properties",
    affordanceKey: "temperature",
    operation: "readproperty",
    language: "javascript",
    library: "fetch",
});

if ("code" in result) {
    console.log(result.code);
} else {
    console.log(result.prompt); // LLM prompt for unsupported combinations
}
```

### CLI

The package provides both interactive and non-interactive CLI modes.

**Interactive mode** — run without arguments to be guided through prompts:

```bash
npm run cli
```

**Non-interactive mode** — pass all options as flags. When running the CLI through the npm script, parameters are added after `--`:

```bash
npm run cli -- --td ./my-thing.td.jsonld --affordance-type properties --affordance-key temperature --operation readproperty --language javascript --library fetch --output ./output
```

#### CLI Options

| Flag                    | Description                                                |
| ----------------------- | ---------------------------------------------------------- |
| `-t, --td`              | Path to the TD JSON file (relative or absolute)            |
| `-a, --affordance-type` | Affordance type: `properties`, `actions`, or `events`      |
| `-k, --affordance-key`  | Key name of the affordance                                 |
| `-o, --operation`       | Operation to perform (e.g. `readproperty`, `invokeaction`) |
| `-l, --language`        | Programming language                                       |
| `-b, --library`         | Library to use                                             |
| `-O, --output`          | Output folder path (relative or absolute, default: `./`)   |

## Supported Languages and Libraries

| Language   | Libraries                                     |
| ---------- | --------------------------------------------- |
| JavaScript | fetch, node-wot, webthing, modbus-serial      |
| Python     | requests, wotpy, PyModbus                     |
| Java       | httpclient, wot-servient, digitalpetri/modbus |
| Rust       | reqwest                                       |
| Go         | net-http                                      |
| C#         | httpclient, WoT.Net                           |
| PHP        | curl                                          |
| Ruby       | net-http                                      |
| Dart       | dart-wot, http                                |

## Scripts

-   `npm run build` — Compile TypeScript to `dist/`
-   `npm run cli` — Run the CLI
-   `npm test` — Run tests

## License

Licensed under the MIT license, see [License](../../LICENSE.md).
