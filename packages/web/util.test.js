import { findJSONLocationOfMonacoText, findMonacoLocationOfJSONText } from "./util";

const monacoPointerTestCases = [
    {
        textModel: {
            findMatches: jest.fn(
                (searchString, searchScope, isRegex, matchCase, wordSeparators, captureMatches, limitResultCount) => {
                    return [{ range: { endColumn: 29, endLineNumber: 1, startColumn: 23, startLineNumber: 1 } }];
                }
            ),
            getLineContent: jest.fn((i) => {
                return '{ "x": { "y": { "z": "target" } } }';
            }),
        },
        keyword: "target",
        keywordPath: "/x/y/z/",
    },
    {
        textModel: {
            findMatches: jest.fn(
                (searchString, searchScope, isRegex, matchCase, wordSeparators, captureMatches, limitResultCount) => {
                    return [{ range: { endColumn: 26, endLineNumber: 1, startColumn: 20, startLineNumber: 1 } }];
                }
            ),
            getLineContent: jest.fn((i) => {
                return '{"x": { "y": "t", "target": {}}}';
            }),
        },
        keyword: "target",
        keywordPath: "/x/",
    },
    {
        textModel: {
            findMatches: jest.fn(
                (searchString, searchScope, isRegex, matchCase, wordSeparators, captureMatches, limitResultCount) => {
                    return [{ range: { endColumn: 9, endLineNumber: 1, startColumn: 3, startLineNumber: 1 } }];
                }
            ),
            getLineContent: jest.fn((i) => {
                return '{"target": "x"}';
            }),
        },
        keyword: "target",
        keywordPath: "/",
    },
    {
        textModel: {
            findMatches: jest.fn(
                (searchString, searchScope, isRegex, matchCase, wordSeparators, captureMatches, limitResultCount) => {
                    return [{ range: { endColumn: 77, endLineNumber: 1, startColumn: 71, startLineNumber: 1 } }];
                }
            ),
            getLineContent: jest.fn((i) => {
                return '{"x": [{"y": "y", "z": ["a", "b", "c"]}, {"y": "y", "z": ["a", "b", {"target": "a"}]}]}';
            }),
        },
        keyword: "target",
        keywordPath: "/x/1/z/2/",
    },
    {
        textModel: {
            findMatches: jest.fn(
                (searchString, searchScope, isRegex, matchCase, wordSeparators, captureMatches, limitResultCount) => {
                    return [{ range: { endColumn: 82, endLineNumber: 1, startColumn: 76, startLineNumber: 1 } }];
                }
            ),
            getLineContent: jest.fn((i) => {
                return '{"x": [{"y": "y", "z": ["a", "b", "c"]}, {"y": "y", "z": ["a", "b", {"a": "target"}]}]}';
            }),
        },
        keyword: "target",
        keywordPath: "/x/1/z/2/a/",
    },
];

describe("Testing util.js", () => {
    describe("Testing findJSONLocationOfMonacoText", () => {
        test.concurrent.each(monacoPointerTestCases)("should find JSON location of Monaco text", (t) => {
            const results = findJSONLocationOfMonacoText(t.keyword, t.textModel);

            let pathFound = false;

            if (results) {
                results.forEach((r) => {
                    if (r.path === t.keywordPath) {
                        console.log(r.path);
                        pathFound = true;
                        return;
                    }
                });
            }

            expect(pathFound).toBeTruthy();
        });
    });
    describe("Testing findMonacoLocationOfJSONText", () => {
        test.concurrent.each(monacoPointerTestCases)("should find Monaco location of JSON text", (t) => {
            const result = findMonacoLocationOfJSONText(t.keywordPath, t.keyword, t.textModel);

            expect(result).not.toBe({});
        });
    });
});
