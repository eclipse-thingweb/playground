
export const examples = {
    // td examples
    "SimpleTDWithDefaults": require("@thing-description-playground/core/examples/tds/valid/simpleWithDefaults.json"),
    "MultipleOpWithDefaults": require("@thing-description-playground/core/examples/tds/valid/formOpArrayWithDefaults.json"),
    "SimpleTD": require("@thing-description-playground/core/examples/tds/valid/simple.json"),
    "MultipleOp": require("@thing-description-playground/core/examples/tds/valid/formOpArray.json"),
    "EnumConstContradiction": require("@thing-description-playground/core/examples/tds/warning/enumConst.json"),
    "ArrayWithNoItems": require("@thing-description-playground/core/examples/tds/warning/arrayNoItems.json"),
    "InvalidOperation": require("@thing-description-playground/core/examples/tds/invalid/invalidOp.json"),
    "EmptySecurityDefs": require("@thing-description-playground/core/examples/tds/invalid/emptySecDef.json"),

    // tm examples
    "Placeholder": require("@thing-description-playground/core/examples/tms/valid/placeholder.json"),
    "Reference": require("@thing-description-playground/core/examples/tms/valid/ref.json"),
    "Extend": require("@thing-description-playground/core/examples/tms/valid/extend.json"),
    "Affordances": require("@thing-description-playground/core/examples/tms/valid/affordances.json"),
    "AbsentContext": require("@thing-description-playground/core/examples/tms/invalid/absent_context.json"),
    "AbsentTM": require("@thing-description-playground/core/examples/tms/invalid/absent_tm.json"),
    "NoCurlyBracket": require("@thing-description-playground/core/examples/tms/invalid/no_curly_bracket.json"),
    "SingleCurlyBracket": require("@thing-description-playground/core/examples/tms/invalid/single_curly_bracket.json")
}