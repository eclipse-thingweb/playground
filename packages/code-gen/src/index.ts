import { affordance_types, ExecuteParams, Op } from "./types.js";
import { generatePrompt, isConfigSupported } from "./utils.js";

export function execute(params: ExecuteParams) {
    validateAffordanceOperation(params);
    const { td, language, library, affordanceType, affordanceKey, operation } = params;

    if (isConfigSupported(language, library)) {
        // TODO: Implement algorithmic approach
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
 * Validates the correctness of the affordance type, affordance key, and operation
 * @throws Error if the affordance type, affordance key, or operation is not correct
 */
function validateAffordanceOperation({ td, affordanceType, affordanceKey, operation }: ExecuteParams) {
    if (!td[affordanceType][affordanceKey]?.forms.some((form) => form.op === operation)) {
        throw new Error(`Operation ${operation} is not supported for affordance ${affordanceKey}`);
    }
}
