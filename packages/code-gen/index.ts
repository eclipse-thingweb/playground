import { parseArgs } from "node:util";
import { input, select, Separator } from "@inquirer/prompts";
import {
    affordance_types,
    SupportedLanguage,
    supportedLibraries,
    TD,
    Affordance,
    AffordanceType,
    Op,
} from "./types.js";
import { readFile, readFileSync, writeFileSync } from "node:fs";

const cliOptions = {
    interactive: {
        type: "boolean",
        short: "i",
    },
} as const;
const { values: cliParams } = parseArgs({ options: cliOptions });

async function execute() {
    try {
        // Interactive input
        if (cliParams.interactive) {
            const tdAddress = await input({
                message: "Enter the TD address: ",
            });
            const td = readFileSync(tdAddress, "utf-8");
            const tdJson = JSON.parse(td);
            const affordances = getAffordances(tdJson);
            const affordance = await select({
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
            const operation = await select({
                message: "Select an operation: ",
                choices: [
                    ...affordance.op.map((op) => ({
                        name: op,
                        value: op,
                    })),
                ],
            });

            // Language selection
            const language = await select<SupportedLanguage | "other">({
                message: "Select a language:",
                choices: [
                    new Separator("Algorithmic approach:"),
                    { name: "JavaScript", value: "javascript" },
                    { name: "Python", value: "python" },
                    { name: "Java", value: "java" },
                    new Separator("Generate using AI:"),
                    { name: "Other", value: "other" },
                ],
            });

            if (language === "other") {
                // Generate a prompt for an LLM to generate the code snippet
                const otherLanguage = await input({
                    message: "Enter the language name: ",
                });
                const library = await input({
                    message: "Enter the library name: ",
                });
                generatePrompt({
                    td: JSON.stringify(tdJson, null, 2),
                    language: otherLanguage,
                    library,
                    affordanceType: affordance.affordanceType,
                    affordanceKey: affordance.affordanceKey,
                    operation,
                });
            } else {
                // Use the algorithmic approach for the selected language
                const library = await select({
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
                    const otherLibrary = await input({
                        message: "Enter the library name: ",
                    });
                    generatePrompt({
                        td: JSON.stringify(tdJson, null, 2),
                        language,
                        library: otherLibrary,
                        affordanceType: affordance.affordanceType,
                        affordanceKey: affordance.affordanceKey,
                        operation,
                    });
                }
            }
        }
        // One line input
        else {
            console.log("Standard execution. Run with -i for interactive mode.");
        }
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

function getAffordances(tdJson: TD): TD {
    try {
        const affordances: TD = {
            properties: {},
            actions: {},
            events: {},
        };
        for (const affordance_type of affordance_types) {
            if (tdJson[affordance_type]) {
                affordances[affordance_type] = tdJson[affordance_type];
            }
        }
        return affordances;
    } catch (error) {
        console.error("Invalid TD: ", error);
        process.exit(1);
    }
}

function generatePrompt({
    td,
    language,
    library,
    affordanceType,
    affordanceKey,
    operation,
}: {
    td: string;
    language: string;
    library: string;
    affordanceType: AffordanceType;
    affordanceKey: string;
    operation: Op;
}): string {
    console.log(
        "The current configuration is still in progress. Please upload the generated ./prompt.txt to your LLM to get the code snippet. \n"
    );
    const prompt = `You are a code generation assistant. Your task is to generate a code snippet that interacts with a Thing Description (TD) using the ${library} library in ${language}.
    
    The TD is as follows:
    ${td}    

    The affordance to interact with is: ${affordanceType}/${affordanceKey}
    The operation to perform is: ${operation}
    `;
    writeFileSync("./prompt.txt", prompt);
    return prompt;
}

execute();
