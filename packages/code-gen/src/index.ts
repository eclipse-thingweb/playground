import { writeFileSync } from "fs";
import { ExecuteParams } from "./types.js";
import { generatePrompt, isConfigSupported } from "./utils.js";
import { generateFetchCode } from "./generators/javascript/fetch.js";
import { generateNodeWotCode } from "./generators/javascript/node-wot.js";
import { generateModbusSerialCode } from "./generators/javascript/modbus-serial.js";
import { generateRequestsCode } from "./generators/python/requests.js";
import { generateJavaHttpClientCode } from "./generators/java/httpclient.js";
import { generateCSharpHttpClientCode } from "./generators/csharp/httpclient.js";
import { generateRustReqwestCode } from "./generators/rust/reqwest.js";
import { generateGoNetHttpCode } from "./generators/go/net-http.js";
import { generatePhpCurlCode } from "./generators/php/curl.js";
import { generateRubyNetHttpCode } from "./generators/ruby/net-http.js";

type ExecutionResult =
    | {
          code: string;
      }
    | {
          prompt: string;
      };

export function execute(params: ExecuteParams): ExecutionResult {
    validateAffordanceOperation(params);
    const { td, language, library, affordanceType, affordanceKey, operation, output } = params;

    if (isConfigSupported(language, library)) {
        const { code, extension } = generateCode(params);
        const fileName = output || `./output.${extension}`;
        writeFileSync(fileName, code);
        console.log(`Code generated successfully: ${fileName}`);
        return { code };
    } else {
        const prompt = generatePrompt({
            td,
            language,
            library,
            affordanceType,
            affordanceKey,
            operation,
        });
        const promptFile = output || "./prompt.txt";
        writeFileSync(promptFile, prompt);
        console.log(
            `The current configuration is still in progress. Please upload the generated ${promptFile} to your LLM to get the code snippet. \n`
        );
        return { prompt };
    }
}

/**
 * Dispatches code generation to the appropriate library-specific generator
 * @returns The generated code and file extension
 */
function generateCode({ td, language, library, affordanceType, affordanceKey, operation }: ExecuteParams): {
    code: string;
    extension: string;
} {
    const key = `${language}:${library}`;
    switch (key) {
        case "javascript:fetch":
            return generateFetchCode(td, affordanceType, affordanceKey, operation);
        case "javascript:node-wot":
            return generateNodeWotCode(td, affordanceType, affordanceKey, operation);
        case "javascript:modbus-serial":
            return generateModbusSerialCode(td, affordanceType, affordanceKey, operation);
        case "python:requests":
            return generateRequestsCode(td, affordanceType, affordanceKey, operation);
        case "java:httpclient":
            return generateJavaHttpClientCode(td, affordanceType, affordanceKey, operation);
        case "csharp:httpclient":
            return generateCSharpHttpClientCode(td, affordanceType, affordanceKey, operation);
        case "rust:reqwest":
            return generateRustReqwestCode(td, affordanceType, affordanceKey, operation);
        case "go:net-http":
            return generateGoNetHttpCode(td, affordanceType, affordanceKey, operation);
        case "php:curl":
            return generatePhpCurlCode(td, affordanceType, affordanceKey, operation);
        case "ruby:net-http":
            return generateRubyNetHttpCode(td, affordanceType, affordanceKey, operation);
        default:
            throw new Error(`No generator available for ${language} with library "${library}"`);
    }
}

/**
 * Validates the correctness of the affordance type, affordance key, and operation
 * @throws Error if the affordance type, affordance key, or operation is not correct
 */
function validateAffordanceOperation({ td, affordanceType, affordanceKey, operation }: ExecuteParams) {
    if (!td[affordanceType][affordanceKey]?.forms.some((form) => form.op === operation)) {
        throw new Error(`Operation ${operation} is not supported for affordance ${affordanceKey}`);
    }
}
