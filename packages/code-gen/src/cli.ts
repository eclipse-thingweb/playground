import { parseArgs } from "node:util";
import { input, select, Separator } from "@inquirer/prompts";
import {
    affordance_types,
    SupportedLanguage,
    supportedLibraries,
    TD,
    Op,
    ExecuteParams,
    AffordanceType,
} from "./types.js";
import { readFileSync } from "node:fs";
import { extensionMap, extractAffordances, isConfigSupported } from "./utils.js";
import { execute } from "./index.js";

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
const { values: cliParams } = parseArgs({ options: cliOptions });

async function runCLI() {
    const executeParams: Partial<ExecuteParams> = {};
    try {
        // Interactive input
        if (cliParams.interactive) {
            // Get TD from user
            const tdPath = await input({
                message: "Enter the path to the JSON file containing the TD: ",
            });
            const td = readFileSync(tdPath, "utf-8");
            const tdJson = JSON.parse(td);
            executeParams.td = tdJson;

            // Get affordance from user
            const affordances = extractAffordances(tdJson);
            const affordance = await getAffordanceFromUser(affordances);
            executeParams.affordanceType = affordance.affordanceType;
            executeParams.affordanceKey = affordance.affordanceKey;

            // Get operation from user
            const operation = await select<Op>({
                message: "Select an operation: ",
                choices: [
                    ...affordance.op.map((op: Op) => ({
                        name: op,
                        value: op,
                    })),
                ],
            });
            executeParams.operation = operation;

            // Get language from user
            const language = await select<SupportedLanguage | "other">({
                message: "Select a language:",
                choices: [
                    new Separator("Algorithmic approach:"),
                    ...Object.keys(supportedLibraries).map((language) => ({
                        name: language.slice(0, 1).toUpperCase() + language.slice(1),
                        value: language as SupportedLanguage,
                    })),
                    new Separator("Generate using AI:"),
                    { name: "Other", value: "other" },
                ],
            });
            executeParams.language = language;

            if (language === "other") {
                // Get the custom language and library from user
                const otherLanguage = await input({
                    message: "Enter the language name: ",
                });
                executeParams.language = otherLanguage;

                const library = await input({
                    message: "Enter the library name: ",
                });
                executeParams.library = library;
            } else {
                // Get the library from user
                let library = await select<string>({
                    message: "Select a library:",
                    choices: [
                        ...supportedLibraries[language].map((library) => ({
                            name: library,
                            value: library,
                        })),
                        new Separator("Generate using AI:"),
                        { name: "Other", value: "other" },
                    ],
                });

                if (library === "other") {
                    // Generate a prompt for an LLM to generate the code snippet
                    library = await input({
                        message: "Enter the library name: ",
                    });
                }
                executeParams.library = library;
            }

            const defaultFileName = isConfigSupported(executeParams.language!, executeParams.library!)
                ? "output"
                : "prompt";
            const extension = isConfigSupported(executeParams.language!, executeParams.library!)
                ? extensionMap[executeParams.language as SupportedLanguage]
                : "txt";

            // Get output file path from user
            const outputPath = await input({
                message: `Output file path (default: ./${defaultFileName}.${extension}): `,
            });
            executeParams.output = outputPath;
        }
        // One line input
        else {
            const tdAddress = cliParams.td;
            if (!tdAddress) {
                throw new Error("Missing required flag: --td");
            }
            const td = readFileSync(tdAddress, "utf-8");
            const tdJson = JSON.parse(td);

            executeParams.td = tdJson;
            executeParams.affordanceType = cliParams["affordance-type"] as AffordanceType;
            executeParams.affordanceKey = cliParams["affordance-key"];
            executeParams.operation = cliParams.operation as Op;
            executeParams.language = cliParams.language;
            executeParams.library = cliParams.library;
            executeParams.output = cliParams.output;
        }

        const parsedExecuteParams = parseExecuteParams(executeParams);
        execute(parsedExecuteParams);
    } catch (error) {
        if (error instanceof Error && error.name === "ExitPromptError") {
            process.exit(0);
        }
        console.error(error);
        process.exit(1);
    }
}

runCLI();

/**
 * Gets an affordance from the user
 * @param affordances The affordances to choose from
 * @returns The selected affordance
 */
async function getAffordanceFromUser(affordances: TD) {
    return await select<{ affordanceType: AffordanceType; affordanceKey: string; op: Op[] }>({
        message: "Select an affordance: ",
        choices: [
            ...affordance_types.flatMap((affordanceType) => {
                return [
                    new Separator(affordanceType.charAt(0).toUpperCase() + affordanceType.slice(1) + ":"),
                    ...Object.keys(affordances[affordanceType]).map((affordanceKey) => ({
                        name: affordanceKey,
                        value: {
                            affordanceType,
                            affordanceKey,
                            op: affordances[affordanceType][affordanceKey].forms.reduce((acc, form) => {
                                if (Array.isArray(form.op)) {
                                    acc.push(...form.op);
                                } else {
                                    acc.push(form.op);
                                }
                                return acc;
                            }, [] as Op[]),
                        },
                    })),
                ];
            }),
        ],
    });
}

/**
 * Parses the execute parameters and throws an error if any of the parameters are missing
 * @returns The parsed execute parameters
 */
function parseExecuteParams(executeParams: Partial<ExecuteParams>): ExecuteParams {
    const optionalParams: (keyof ExecuteParams)[] = ["output"];
    Object.entries(executeParams).forEach(([key, value]) => {
        if (!value && !optionalParams.includes(key as keyof ExecuteParams)) {
            throw new Error(`Missing parameter: ${key}`);
        }
    });
    return executeParams as ExecuteParams;
}
