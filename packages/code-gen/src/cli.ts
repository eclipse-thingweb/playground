import { parseArgs } from "node:util";
import { input, select, Separator } from "@inquirer/prompts";
import {
    AFFORDANCE_TYPES,
    Affordances,
    Op,
    GenerateCodeParams,
    AffordanceType,
    Affordance,
    Form,
    LANGUAGES_SUPPORT,
} from "./types.js";
import { readFileSync, writeFileSync } from "node:fs";
import { generateCode } from "./index.js";

(async () => {
    const cliOptions = {
        interactive: {
            type: "boolean",
            short: "i",
        },
        td: {
            type: "string",
            short: "t",
        },
        "affordance-type": {
            type: "string",
            short: "a",
        },
        "affordance-key": {
            type: "string",
            short: "k",
        },
        operation: {
            type: "string",
            short: "o",
        },
        language: {
            type: "string",
            short: "l",
        },
        library: {
            type: "string",
            short: "b",
        },
        output: {
            type: "string",
            short: "O",
        },
    } as const;
    const { values: userInputParams } = parseArgs({ options: cliOptions });

    const generateCodeParams: Partial<GenerateCodeParams> = {
        output: "./",
    };

    let generatesUknownLibraryPrompt = false;
    let generatesUknownProtocolPrompt = false;

    try {
        // Interactive input
        if (userInputParams.interactive) {
            // Get TD from user
            const tdPath = await input({
                message: "Enter the path to the JSON file containing the TD: ",
            });
            const td = readFileSync(tdPath, "utf-8");
            const tdJson = JSON.parse(td);
            generateCodeParams.td = tdJson;

            // Get affordance from user
            const affordances = extractAvailableAffordances(tdJson);
            const affordance = await getAffordanceFromUser(affordances);
            generateCodeParams.affordanceType = affordance.affordanceType;
            generateCodeParams.affordanceKey = affordance.affordanceKey;

            // Get operation from user
            const availableOperations = Array.from(
                new Set(affordance.forms.flatMap((form) => (Array.isArray(form.op) ? form.op : [form.op])))
            );
            const operation = await select<Op>({
                message: "Select an operation: ",
                choices: availableOperations.map((op: Op) => ({
                    name: op,
                    value: op,
                })),
            });
            generateCodeParams.operation = operation;

            // Get language from user
            const language = await select({
                message: "Select a language:",
                choices: [
                    new Separator("Algorithmic approach:"),
                    ...Object.keys(LANGUAGES_SUPPORT).map((language) => ({
                        name: capitalizeFirstLetter(language),
                        value: language,
                    })),
                    new Separator("Generate using AI:"),
                    { name: "Other", value: "other" },
                ],
            });
            generateCodeParams.language = language;

            // Get the library from user
            const availableProtocols = affordance.forms
                .filter((form) => form.op === operation || form.op.includes(operation))
                .map((form) => getProtocolFromHref(form.href));

            // Both the language and library are not supported yet
            // Genereate a prompt for an LLM to generate the code snippet
            if (language === "other") {
                generatesUknownLibraryPrompt = true;
                const otherLanguage = await input({
                    message: "Enter the language name: ",
                });
                generateCodeParams.language = otherLanguage;

                const library = await input({
                    message: "Enter the library name: ",
                });
                generateCodeParams.library = library;
            } else {
                const librariesForLanguage = LANGUAGES_SUPPORT[language].libraries;
                const { supportedLibraries, unsupportedLibraries } = Object.entries(librariesForLanguage).reduce(
                    (acc, [name, protocols]) =>
                        protocols.some((protocol) => availableProtocols.includes(protocol))
                            ? { ...acc, supportedLibraries: [...acc.supportedLibraries, name] }
                            : { ...acc, unsupportedLibraries: [...acc.unsupportedLibraries, name] },
                    {
                        supportedLibraries: [] as string[],
                        unsupportedLibraries: [] as string[],
                    }
                );
                // Protocols not supported for any library
                if (supportedLibraries.length === 0) {
                    generatesUknownProtocolPrompt = true;
                    console.warn(
                        `No libraries found for ${language} that support the protocol(s) used in the TD. A prompt will be generated for an LLM to generate the code snippet.`
                    );
                } else {
                    let library = await select<string>({
                        message: "Select a library:",
                        choices: [
                            ...supportedLibraries.map((library) => ({
                                name: library,
                                value: library,
                            })),
                            new Separator("Generate using AI:"),
                            { name: "Other", value: "other" },
                            new Separator("Protocol not supported:"),
                            ...unsupportedLibraries.map((library) => ({
                                name: library,
                                value: library,
                                disabled: true,
                            })),
                        ],
                    });

                    // The library is not supported yet
                    // Genereate a prompt for an LLM to generate the code snippet
                    if (library === "other") {
                        // Generate a prompt for an LLM to generate the code snippet
                        generatesUknownLibraryPrompt = true;
                        library = await input({
                            message: "Enter the library name: ",
                        });
                    }
                    generateCodeParams.library = library;
                }

                const outputFolderPath = await input({
                    message: `Output folder path (default: ./): `,
                });
                generateCodeParams.output = outputFolderPath || "./";
            }
        }
        // One line input
        else {
            const tdAddress = userInputParams.td;
            if (!tdAddress) {
                throw new Error(
                    "Missing required flag: --td. To run the CLI in interactive mode, use the --interactive or -i flag."
                );
            }
            const td = readFileSync(tdAddress, "utf-8");
            const tdJson = JSON.parse(td);

            generateCodeParams.td = tdJson;
            generateCodeParams.affordanceType = userInputParams["affordance-type"] as AffordanceType;
            generateCodeParams.affordanceKey = userInputParams["affordance-key"];
            generateCodeParams.operation = userInputParams.operation as Op;
            generateCodeParams.language = userInputParams.language;
            generateCodeParams.library = userInputParams.library;
            generateCodeParams.output = userInputParams.output;
        }

        // Output file details
        const outputFileName = generatesUknownLibraryPrompt ? "prompt" : "output";
        const outputFileExtension = generatesUknownLibraryPrompt
            ? "txt"
            : LANGUAGES_SUPPORT[generateCodeParams.language!].fileExtension;
        const fullFileName = `${outputFileName}.${outputFileExtension}`;
        const fullPath = `${generateCodeParams.output}/${fullFileName}`;

        let generationText: string;
        if (generatesUknownProtocolPrompt) {
            generationText = generateProtocolNotSupportedPrompt(generateCodeParams as GenerateCodeParams);
        } else {
            const generationResult = generateCode(generateCodeParams as GenerateCodeParams);

            if ("code" in generationResult) {
                console.log(`Code generated successfully: ${fullFileName}`);
                generationText = generationResult.code;
            } else {
                console.log(
                    `The current configuration is still in progress. Please upload the generated ${fullFileName} to your LLM to get the code snippet. \n`
                );
                generationText = generationResult.prompt;
            }
        }

        writeFileSync(fullPath, generationText);
    } catch (error) {
        // Manual exit by the user
        if (error instanceof Error && error.name === "ExitPromptError") {
            process.exit(0);
        }
        console.error(error instanceof Error ? error.message : error);
        process.exit(1);
    }
})();

function capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Extracts affordances from a Thing Description
 * @param td The Thing Description as a JSON object
 * @returns An object containing the affordances grouped by type
 */
function extractAvailableAffordances(td: Affordances): Affordances {
    try {
        const affordances: Affordances = {
            properties: {},
            actions: {},
            events: {},
        };
        for (const affordance_type of AFFORDANCE_TYPES) {
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
 * Lets the user select an affordance from the available affordances in the TD
 * @param affordances The affordances to choose from
 * @returns The selected affordance
 */
async function getAffordanceFromUser(affordances: Affordances) {
    return await select<{ affordanceType: AffordanceType; affordanceKey: string; forms: Form[] }>({
        message: "Select an affordance: ",
        choices: [
            ...AFFORDANCE_TYPES.flatMap((affordanceType) => {
                const separatorTitle = capitalizeFirstLetter(affordanceType) + ":";

                const affordanceKeys = Object.keys(affordances[affordanceType as keyof Affordances]);

                return affordanceKeys.length > 0
                    ? [
                          new Separator(separatorTitle),
                          ...affordanceKeys.map((affordanceKey) => ({
                              name: affordanceKey,
                              value: {
                                  affordanceType,
                                  affordanceKey,
                                  forms: affordances[affordanceType][affordanceKey].forms,
                              },
                          })),
                      ]
                    : [];
            }),
        ],
    });
}

export function getProtocolFromHref(href: string): string {
    return href.split(":")[0].split(".")[0].split("+")[0];
}

function generateProtocolNotSupportedPrompt(generateParams: GenerateCodeParams): string {
    return `Find a library in ${generateParams.language} that supports the protocol(s) used in the TD for the ${
        generateParams.affordanceType
    } ${generateParams.affordanceKey} and the ${
        generateParams.operation
    } operation and generate a code snippet for the operation.

    TD: ${JSON.stringify(generateParams.td, null, 2)}`;
}
