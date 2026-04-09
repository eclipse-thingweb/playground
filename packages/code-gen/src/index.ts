import { writeFileSync } from "fs";
import { ExecuteParams } from "./types.js";
import { generatePrompt, isConfigSupported } from "./utils.js";
import { generateFetchCode } from "./generators/fetch.js";
import { generateNodeWotCode } from "./generators/node-wot.js";
import { generateModbusSerialCode } from "./generators/modbus-serial.js";
import { generateRequestsCode } from "./generators/requests.js";

export function execute(params: ExecuteParams) {
    validateAffordanceOperation(params);
    const { td, language, library, affordanceType, affordanceKey, operation } = params;

    if (isConfigSupported(language, library)) {
        const { code, extension } = generateCode(params);
        const fileName = `output.${extension}`;
        writeFileSync(fileName, code);
        console.log(`Code generated successfully: ./${fileName}`);
    } else {
        generatePrompt({
            td,
            language,
            library,
            affordanceType,
            affordanceKey,
            operation,
        });
    }
}

/**
 * Dispatches code generation to the appropriate library-specific generator
 * @returns The generated code and file extension
 */
function generateCode({ td, library, affordanceType, affordanceKey, operation }: ExecuteParams): {
    code: string;
    extension: string;
} {
    switch (library) {
        case "fetch":
            return generateFetchCode(td, affordanceType, affordanceKey, operation);
        case "node-wot":
            return generateNodeWotCode(td, affordanceType, affordanceKey, operation);
        case "modbus-serial":
            return generateModbusSerialCode(td, affordanceType, affordanceKey, operation);
        case "requests":
            return generateRequestsCode(td, affordanceType, affordanceKey, operation);
        default:
            throw new Error(`No generator available for library "${library}"`);
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
