import { parseArgs } from "node:util";
import { input, search, select, Separator } from "@inquirer/prompts";
import {
    AFFORDANCE_TYPES,
    Affordances,
    Op,
    GenerateCodeParams,
    AffordanceType,
    Form,
    LANGUAGES_SUPPORT,
} from "./types.js";
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, isAbsolute, join, resolve } from "node:path";
import { homedir } from "node:os";
import { generateCode } from "./index.js";
import {
    extractAvailableAffordances,
    getAvailableOperations,
    getAvailableProtocols,
    splitLibrariesByProtocolSupport,
} from "./generators/helpers.js";

(async () => {
    const cliOptions = {
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
        if (userInputParams === undefined || Object.keys(userInputParams).length === 0) {
            // Get TD from user
            const tdPath = await inputPathWithAutocomplete(
                "Type or select the path to the JSON file containing the TD: ",
                { mode: "file" }
            );
            const td = readFileSync(tdPath, "utf-8");
            const tdJson = JSON.parse(td);
            generateCodeParams.td = tdJson;

            // Get affordance from user
            const affordances = extractAvailableAffordances(tdJson);
            const affordance = await getAffordanceFromUser(affordances);
            generateCodeParams.affordanceType = affordance.affordanceType;
            generateCodeParams.affordanceKey = affordance.affordanceKey;

            // Get operation from user
            const tdAffordance = tdJson[affordance.affordanceType][affordance.affordanceKey];
            const availableOperations = getAvailableOperations(tdAffordance, affordance.affordanceType);
            const operation = await select<Op>({
                message: "Select an operation: ",
                choices: availableOperations.map((op: Op) => ({
                    name: op,
                    value: op,
                })),
            });
            generateCodeParams.operation = operation;

            // Get language from user
            const language = await select<string>({
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
            const availableProtocols = getAvailableProtocols(tdAffordance, affordance.affordanceType, operation);

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
                const { supportedLibraries, unsupportedLibraries } = splitLibrariesByProtocolSupport(
                    language,
                    availableProtocols
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

                const outputFolderPath = await inputPathWithAutocomplete(
                    "Type or select the output folder path (default: ./): ",
                    {
                        mode: "directory",
                    }
                );
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
            generateCodeParams.output = userInputParams.output || "./";
        }

        // Output file details
        const outputFileName = generatesUknownLibraryPrompt || generatesUknownProtocolPrompt ? "prompt" : "output";
        const outputFileExtension =
            generatesUknownLibraryPrompt || generatesUknownProtocolPrompt
                ? "txt"
                : LANGUAGES_SUPPORT[generateCodeParams.language!].fileExtension;
        const fullFileName = `${outputFileName}.${outputFileExtension}`;
        const outputDirectory = isAbsolute(generateCodeParams.output!)
            ? generateCodeParams.output!
            : resolve(generateCodeParams.output!);
        const fullPath = join(outputDirectory, fullFileName);

        mkdirSync(outputDirectory, { recursive: true });

        let generationText: string;
        if (generatesUknownProtocolPrompt) {
            generationText = generateProtocolNotSupportedPrompt(generateCodeParams as GenerateCodeParams);
        } else {
            const generationResult = generateCode(generateCodeParams as GenerateCodeParams);

            if ("code" in generationResult) {
                console.log(`Code generated successfully: ${fullPath}`);
                generationText = generationResult.code;
            } else {
                console.log(
                    `The current configuration is still in progress. Please upload the generated ${fullPath} to your LLM to get the code snippet. \n`
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

type PathMode = "file" | "directory";

async function inputPathWithAutocomplete(message: string, options: { mode: PathMode }): Promise<string> {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
        return expandHome(await input({ message }));
    }

    let currentBase = "";
    while (true) {
        const selected = await search<string>({
            message: currentBase ? `${message}[${currentBase}] ` : message,
            source: async (value) => getPathChoices(value ?? "", options.mode, currentBase),
        });

        const expanded = expandHome(selected);
        const absolute = isAbsolute(expanded) ? expanded : resolve(expanded);
        const endsWithSep = /[\\/]$/.test(selected);

        let isDir = endsWithSep;
        if (!isDir) {
            try {
                isDir = statSync(absolute).isDirectory();
            } catch {
                isDir = false;
            }
        }

        // In file mode, selecting a directory drills into it instead of submitting.
        if (options.mode === "file" && isDir) {
            currentBase =
                selected.endsWith("/") || selected.endsWith("\\")
                    ? selected
                    : selected + (selected.includes("/") ? "/" : "\\");
            continue;
        }

        return expanded;
    }
}

function expandHome(p: string): string {
    if (p === "~") return homedir();
    if (p.startsWith("~/") || p.startsWith("~\\")) return join(homedir(), p.slice(2));
    return p;
}

function getPathChoices(line: string, mode: PathMode, base: string): { name: string; value: string }[] {
    const effective = line.length > 0 ? line : base;
    const sep = effective.includes("/") || effective.startsWith("~") ? "/" : "\\";
    const hasTrailingSep = /[\\/]$/.test(effective);
    const lineBaseName = hasTrailingSep ? "" : basename(effective);
    const lineDirectory = hasTrailingSep ? effective : effective.slice(0, effective.length - lineBaseName.length);
    const searchDirectory = resolve(expandHome(lineDirectory || "."));

    const typedChoice = {
        name:
            line.length > 0 ? `Use typed path: ${line}` : base ? `Use directory: ${base}` : "Use current directory: ./",
        value: line.length > 0 ? line : base || "./",
    };

    try {
        const entries = readdirSync(searchDirectory, { withFileTypes: true })
            .filter((entry) => {
                if (!entry.name.toLowerCase().startsWith(lineBaseName.toLowerCase())) return false;
                return mode === "file" ? true : entry.isDirectory();
            })
            .sort((a, b) => {
                if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
                return a.name.localeCompare(b.name);
            })
            .map((entry) => {
                const suggestedPath = `${lineDirectory}${entry.name}${entry.isDirectory() ? sep : ""}`;
                return { name: suggestedPath, value: suggestedPath };
            });

        return [typedChoice, ...entries];
    } catch {
        return [typedChoice];
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

function generateProtocolNotSupportedPrompt(generateParams: GenerateCodeParams): string {
    return `Find a library in ${generateParams.language} that supports the protocol(s) used in the TD for the ${
        generateParams.affordanceType
    } ${generateParams.affordanceKey} and the ${
        generateParams.operation
    } operation and generate a code snippet for the operation. Don't forget to include all the required imports for the library including the protocol binding.

    TD: ${JSON.stringify(generateParams.td, null, 2)}`;
}
