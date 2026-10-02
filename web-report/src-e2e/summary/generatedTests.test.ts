import {describe, it, expect} from "vitest";
import {readFileSync} from "fs";
import {resolve} from "path";
import {marked, Tokens} from "marked";
import {buildSummaryModel, TestCaseSummary} from "../../src/summary/model";
import {buildGeneratedTests, renderGeneratedTest} from "../../src/summary/generatedTests";
import {renderJobSummary} from "../../src/summary/jobSummary";
import {OMITTED_ROWS_TEXT} from "../../src/summary/markdown";
import {loadSmallReport, tablesOf} from "./helpers";
import {WebFuzzingCommonsReport} from "../../src/types/GeneratedTypes";
import {extractCodeLines} from "../../src/lib/utils";

const source = readFileSync(resolve(__dirname, "../fixtures/tests.java"), "utf-8");
const sources = new Map([["tests.java", source]]);

const lines = (from: number, to: number) =>
    Array.from({length: to - from + 1}, (_, i) => `// line ${from + i}`).join("\n");

const testCase = (id: string, hasFaults: boolean, filePath = "tests.java", startLine = 1, endLine = 5): TestCaseSummary =>
    ({id, name: id, filePath, startLine, endLine, hasFaults});

describe("buildGeneratedTests", () => {
    const model = buildSummaryModel(loadSmallReport());

    it("extracts the code of each test case", () => {
        const tests = buildGeneratedTests(model.testCases, sources);
        expect(tests.map(t => t.id)).toEqual(["tests.java#t1", "tests.java#t2", "tests.java#t3", "tests.java#t4"]);
        expect(tests[0]).toEqual({id: "tests.java#t1", name: "t1", filePath: "tests.java", anchor: "test-tests-java-t1", language: "java", code: lines(1, 5)});
        expect(tests[3].code).toBe(lines(16, 20));
    });

    it("extracts the same lines as the web report", () => {
        const ranges: [number, number][] = [[1, 5], [2, 2], [0, 4], [3, 25], [15, 20], [20, 20], [7, 3]];
        for (const [start, end] of ranges) {
            let expected: string | null;
            try {
                expected = extractCodeLines(source, start, end);
            } catch {
                expected = null;
            }
            const [test] = buildGeneratedTests([testCase("a", true, "tests.java", start, end)], sources);
            const actual = test ? test.code : null;
            expect(actual, `${start}-${end}`).toBe(expected === null || expected.trim() === "" ? null : expected);
        }
    });

    it("lists test cases that found faults first", () => {
        const tests = buildGeneratedTests([testCase("a", false), testCase("b", true)], sources);
        expect(tests.map(t => t.id)).toEqual(["b", "a"]);
    });

    it("skips test cases whose source is missing or out of range", () => {
        const tests = buildGeneratedTests([testCase("a", true, "other.java"), testCase("b", true, "tests.java", 100, 200)], sources);
        expect(tests).toEqual([]);
    });

    it("gives colliding ids distinct anchors", () => {
        const tests = buildGeneratedTests([testCase("a#b", true), testCase("a-b", true)], sources);
        expect(tests.map(t => t.anchor)).toEqual(["test-a-b", "test-a-b-2"]);
    });
});

const generatedTest = (name: string, code: string) =>
    ({id: name, name, filePath: "tests.java", anchor: "test-x", language: "java", code});

const NO_FAULTS = {codes: [], operations: []};

describe("renderGeneratedTest", () => {
    it("puts a named anchor before an open block and escapes the summary", () => {
        const md = renderGeneratedTest(generatedTest("x<y", "int a;"), NO_FAULTS, null);
        expect(md.startsWith('<a name="test-x"></a>\n<details open>\n<summary><b>x&lt;y</b></summary>')).toBe(true);
        expect(md).not.toContain("back to faults");
    });

    it("shows the found faults in the summary and links back to them", () => {
        const md = renderGeneratedTest(generatedTest("x", "int a;"), {codes: [100, 101], operations: ["GET:/a", "POST:/b"]}, "#user-content-wfc-faults");
        expect(md).toContain("<summary><b>x</b> &middot; F100, F101 &middot; <code>GET:/a</code> (+1 more)</summary>");
        expect(md).toContain("[&#x2191; back to faults](#user-content-wfc-faults)");
    });

    it("uses a longer fence when the code contains backticks", () => {
        const md = renderGeneratedTest(generatedTest("x", "a ``` b"), NO_FAULTS, null);
        const [code] = marked.lexer(md).filter((t): t is Tokens.Code => t.type === "code");
        expect(code.lang).toBe("java");
        expect(code.text).toBe("a ``` b");
    });
});

describe("renderJobSummary with test sources", () => {
    const model = buildSummaryModel(loadSmallReport());
    const md = renderJobSummary(model, {testSources: sources});

    it("adds a section with the code of every test case, grouped by file", () => {
        expect(md).toContain('<a name="wfc-tests"></a>');
        expect(md).toContain("### Generated tests (4)");
        expect(md).toContain("#### tests.java (4)");
        expect(md).toContain('<a name="test-tests-java-t1"></a>');
        expect(md).toContain("<summary><b>t1</b> &middot; F100 &middot; <code>GET:/a</code></summary>");
        expect(md).toContain("[Tests](#user-content-wfc-tests)");
        const codes = marked.lexer(md).filter((t): t is Tokens.Code => t.type === "code" && t.lang !== "mermaid");
        expect(codes.map(c => c.lang)).toEqual(["java", "java", "java", "java"]);
        expect(codes[0].text).toBe(lines(1, 5));
    });

    it("links test case ids in the fault details to their code", () => {
        const f101 = tablesOf(md).filter(t => t.header[0]?.text === "Operation")[1];
        expect(f101.rows[0][3].text).toContain("(#user-content-test-tests-java-t3)");
    });

    it("adds no tests and no links without sources", () => {
        const plain = renderJobSummary(model);
        expect(plain).not.toContain("Generated tests");
        expect(plain).not.toContain("#user-content-test-");
        expect(plain).not.toContain("[Tests]");
    });

    it("stays within the byte budget when the tests do not fit", () => {
        const base = loadSmallReport();
        const testCases = Array.from({length: 200}, (_, i) => ({
            id: `big.java#t${i}`, filePath: "big.java", name: `t${i}`, startLine: i * 50 + 1, endLine: i * 50 + 50,
        }));
        const big = Array.from({length: 10_001}, (_, i) => `// ${i} ` + "x".repeat(100)).join("\n");
        const report = {...base, testFilePaths: ["big.java"], testCases} as WebFuzzingCommonsReport;
        const out = renderJobSummary(buildSummaryModel(report), {testSources: new Map([["big.java", big]]), maxBytes: 100_000});
        expect(Buffer.byteLength(out, "utf8")).toBeLessThanOrEqual(100_000);
        expect(out).toContain("### Generated tests (200)");
        expect(out).toContain(OMITTED_ROWS_TEXT);
    });
});
