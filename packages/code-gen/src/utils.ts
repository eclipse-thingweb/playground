import { affordance_types, ExecuteParams, SupportedLanguage, supportedLibraries, TD } from "./types.js";

/**
 * Checks if the given language and library combination is supported for the algorithmic approach.
 * @returns True if the language and library combination is supported, false otherwise.
 */
export function isConfigSupported(language: string, library: string): boolean {
    if (language in supportedLibraries) {
        return supportedLibraries[language as keyof typeof supportedLibraries].includes(library);
    }
    return false;
}

/**
 * Extracts affordances from a Thing Description
 * @param td The Thing Description as a JSON object
 * @returns An object containing the affordances grouped by type
 */
export function extractAffordances(td: TD): TD {
    try {
        const affordances: TD = {
            properties: {},
            actions: {},
            events: {},
        };
        for (const affordance_type of affordance_types) {
            if (td[affordance_type]) {
                affordances[affordance_type] = td[affordance_type];
            }
        }
        return affordances;
    } catch (error) {
        console.error("Invalid TD: ", error);
        process.exit(1);
    }
}

/**
 * Generates a prompt for an LLM to generate a code snippet
 * @returns The generated prompt
 * @file ./prompt.txt - generated prompt for LLM
 */
export function generatePrompt({
    td,
    language,
    library,
    affordanceType,
    affordanceKey,
    operation,
}: ExecuteParams): string {
    return `You are a code generation assistant. Your task is to generate a code snippet that interacts with a Thing Description (TD) using the ${library} library in ${language}.
    
    The TD is as follows:
    ${JSON.stringify(td, null, 2)}    

    The affordance to interact with is: ${affordanceType}/${affordanceKey}
    The operation to perform is: ${operation}
    `;
}

/**
 * Maps supported languages to their file extensions
 */
export const extensionMap: Record<SupportedLanguage, string> = {
    javascript: "js",
    python: "py",
};
