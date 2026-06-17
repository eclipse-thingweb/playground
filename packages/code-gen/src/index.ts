import { GenerateCodeParams, GenerateCodeResult, LANGUAGES_SUPPORT } from "./types.js";
import { getProtocolFromForm } from "./generators/helpers.js";
import { GENERATOR_REGISTRY } from "./generators/index.js";
import { selectForm, getEffectiveOps } from "./generators/helpers.js";

export { LANGUAGES_SUPPORT, AFFORDANCE_TYPES, OPERATIONS, PROTOCOL } from "./types.js";
export type { GenerateCodeParams, GenerateCodeResult } from "./types.js";
export {
    extractAvailableAffordances,
    getAvailableOperations,
    getAvailableProtocols,
    getAvailableLanguages,
    getAvailableLibraries,
    splitLibrariesByProtocolSupport,
    getProtocolFromForm,
    getEffectiveOps,
} from "./generators/helpers.js";

export function generateCode(params: GenerateCodeParams): GenerateCodeResult {
    try {
        // Required for the CLI
        validateParams(params);
        const { td, language, library, affordanceType, affordanceKey, operation } = params;

        // Get the forms for the affordance
        const forms = td[affordanceType][affordanceKey].forms;
        if (!forms) {
            throw new Error(`The ${affordanceType} ${affordanceKey} does not exist in the TD`);
        }

        // Filter forms for the given operation
        const affordance = td[affordanceType][affordanceKey];
        const availableFormsForOperation = forms.filter((form) => {
            const ops = getEffectiveOps(form, affordanceType, affordance);
            return ops.includes(operation);
        });
        if (availableFormsForOperation.length === 0) {
            throw new Error(`${operation} is not supported for the ${affordanceType} ${affordanceKey}`);
        }

        // The library does not support the algorithmic approach
        if (LANGUAGES_SUPPORT[language]?.libraries[library] === undefined) {
            const prompt = generatePrompt({
                td,
                language,
                library,
                affordanceType,
                affordanceKey,
                operation,
            });
            return { prompt };
        }

        // Filter forms for the given protocol support
        const availableFormsForProtocol = availableFormsForOperation.filter((form) =>
            isProtocolSupported(language, library, getProtocolFromForm(form))
        );

        if (availableFormsForProtocol.length > 0) {
            const key = `${language}:${library}`;
            const generator = GENERATOR_REGISTRY[key];
            if (!generator) {
                throw new Error(`No generator available for ${language} with library "${library}"`);
            }

            const forms = td[affordanceType][affordanceKey].forms;
            const supportedProtocols = LANGUAGES_SUPPORT[language].libraries[library];
            const form = selectForm(forms, operation, supportedProtocols, affordanceType, affordance);

            const code = generator({ td, affordanceType, affordanceKey, operation, form, affordance });
            return { code };
        } else {
            throw new Error(
                `The ${library} library does not support the protocol(s) used by the ${affordanceType} ${affordanceKey} for the ${operation} operation. Supported protocols for this library are: ${LANGUAGES_SUPPORT[
                    language
                ].libraries[library].join(
                    ", "
                )}. Available protocols for this affordance are: ${availableFormsForOperation
                    .map((form) => getProtocolFromForm(form))
                    .join(", ")}.`
            );
        }
    } catch (error) {
        throw error instanceof Error ? error : new Error(JSON.stringify(error, null, 2));
    }
}

/**
 * Checks if the given language and library combination is supported for the algorithmic approach.
 * @returns True if the language and library combination is supported, false otherwise.
 */
export function isProtocolSupported(language: string, library: string, protocol: string): boolean {
    return !!LANGUAGES_SUPPORT[language]?.libraries[library]?.some(
        (supportedProtocol) => supportedProtocol === protocol
    );
}

/**
 * Parses the execute parameters and throws an error if any of the parameters are missing
 */
function validateParams(executeParams: GenerateCodeParams): void {
    const optionalParams: (keyof GenerateCodeParams)[] = ["output", "library"];
    Object.entries(executeParams).forEach(([key, value]) => {
        if (!value && !optionalParams.includes(key as keyof GenerateCodeParams)) {
            throw new Error(
                `Missing parameter: ${key}. To run the CLI in interactive mode, use the --interactive or -i flag.`
            );
        }
    });
}

/**
 * Generates a prompt for an LLM to generate a code snippet
 * @returns The generated prompt
 * @file ./prompt.txt - generated prompt for LLM
 */
export function generatePrompt({
    td: td,
    language,
    library,
    affordanceType,
    affordanceKey,
    operation,
}: GenerateCodeParams): string {
    return `You are a code generation assistant. Your task is to generate a code snippet that interacts with a Thing Description (TD) using the ${library} library in ${language}.
    
    The TD is as follows:
    ${JSON.stringify(td, null, 2)}    

    The affordance to interact with is: ${affordanceType}/${affordanceKey}
    The operation to perform is: ${operation}

    Make sure to import any required modules from the ${library} library or other necessary dependencies.
    `;
}
