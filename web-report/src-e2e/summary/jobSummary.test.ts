import {describe, it, expect} from "vitest";
import {marked, Tokens} from "marked";
import {buildSummaryModel} from "../../src/summary/model";
import {renderJobSummary} from "../../src/summary/jobSummary";
import {OMITTED_ROWS_TEXT} from "../../src/summary/markdown";
import {buildLargeReport, findTable, loadSampleReport, loadSmallReport, rowByFirstCell, tablesOf, withoutFaults, withoutRest} from "./helpers";

const FULL = "&#x2588;";
const EMPTY = "&#x2591;";

const faultTables = (md: string) => tablesOf(md).filter(t => t.header[0]?.text === "Operation");

const mermaidBlocks = (md: string) =>
    marked.lexer(md).filter((t): t is Tokens.Code => t.type === "code" && t.lang === "mermaid");

describe("renderJobSummary on the small fixture", () => {
    const md = renderJobSummary(buildSummaryModel(loadSmallReport()), {artifactUrl: "https://example.org/a/1", runUrl: "https://example.org/run/1"});

    it("starts with the top anchor, the headline and the report metadata", () => {
        expect(md.startsWith('<a name="wfc-top"></a>\n\n## &#x274C; Found 3 potential faults\n')).toBe(true);
        expect(md).toContain("<sub>WFC report schema 0.7.0 &middot; created 2026-09-01T10:00:00Z</sub>");
    });

    it("shows the results at a glance in a caution alert", () => {
        expect(md).toContain("> [!CAUTION]\n> **3 potential faults** &middot; 2 fault types &middot; 2/3 endpoints affected &middot; 4 test cases &middot; &#x23F1; 1h 2m 5s\n");
    });

    it("links to the sections and the interactive report", () => {
        expect(md).toContain("[Faults](#user-content-wfc-faults) &middot; [Endpoints](#user-content-wfc-endpoints) &middot; [Interactive report](https://example.org/a/1)\n");
        expect(md).toContain('<a name="wfc-faults"></a>');
        expect(md).toContain('<a name="wfc-endpoints"></a>');
    });

    it("puts the artifact and run links in a tip alert", () => {
        expect(md).toContain("> [!TIP]\n> **Interactive report:** [download the artifact](https://example.org/a/1), unzip it and open `low-code-index.html` in a browser.\n>\n> **Workflow run:** [https://example.org/run/1](https://example.org/run/1)\n");
    });

    it("renders the overview table", () => {
        const t = findTable(md, "Metric");
        expect(rowByFirstCell(t, "Endpoints")).toEqual(["Endpoints", "3"]);
        expect(rowByFirstCell(t, "Test cases")).toEqual(["Test cases", "4"]);
        expect(rowByFirstCell(t, "HTTP calls in generated tests")).toEqual(["HTTP calls in generated tests", "5"]);
        expect(rowByFirstCell(t, "HTTP calls evaluated during fuzzing")).toEqual(["HTTP calls evaluated during fuzzing", "1000"]);
        expect(rowByFirstCell(t, "Potential faults")).toEqual(["Potential faults", "3"]);
        expect(rowByFirstCell(t, "Distinct fault types")).toEqual(["Distinct fault types", "2"]);
    });

    it("renders status coverage with text bars", () => {
        const t = findTable(md, "Status");
        expect(rowByFirstCell(t, "2XX")).toEqual(["2XX", "2/3", `<code>${FULL.repeat(7)}${EMPTY.repeat(3)}</code> 67%`]);
        expect(rowByFirstCell(t, "3XX")).toEqual(["3XX", "0/3", `<code>${EMPTY.repeat(10)}</code> 0%`]);
        expect(rowByFirstCell(t, "No response")).toEqual(["No response", "1/3", `<code>${FULL.repeat(3)}${EMPTY.repeat(7)}</code> 33%`]);
    });

    it("renders code coverage with text bars and unknown totals", () => {
        const t = findTable(md, "Criterion");
        expect(rowByFirstCell(t, "Line Coverage")).toEqual(["Line Coverage", "50", "100", `<code>${FULL.repeat(5)}${EMPTY.repeat(5)}</code> 50%`]);
        expect(rowByFirstCell(t, "Branch Coverage")).toEqual(["Branch Coverage", "7", "-", "-"]);
    });

    it("renders faults by category with undeclared operations", () => {
        const t = findTable(md, "Code");
        expect(rowByFirstCell(t, "F100")).toEqual(["F100", "HTTP Status 500", "1/3 (+1 not in schema)", "2"]);
        expect(rowByFirstCell(t, "F101")?.[3]).toBe("1");
    });

    it("charts the fault categories as a mermaid pie", () => {
        expect(mermaidBlocks(md).map(b => b.text)).toEqual(['pie showData title Faults by category\n    "F100" : 2\n    "F101" : 1']);
    });

    it("groups fault details by category and endpoint", () => {
        expect(md).toContain("<summary><b>F100</b> HTTP Status 500 &middot; 2 faults on 2 endpoints</summary>");
        expect(md).toContain("<summary><b>F101</b> HTTP Violation: no-non-standard-codes &middot; 1 fault on 1 endpoint</summary>");
        const tables = faultTables(md);
        expect(tables).toHaveLength(2);
        expect(tables[0].rows.map(r => r.map(c => c.text))).toEqual([
            ["<code>GET:/a</code>", "1", "ctxA", "<code>tests.java#t1</code>, <code>tests.java#t2</code>"],
            ["<code>OPTIONS:/hidden</code> _(not in schema)_", "1", "-", "<code>tests.java#t4</code>"],
        ]);
    });

    it("keeps pipes and newlines of fault contexts inside one cell", () => {
        const [row] = faultTables(md)[1].rows;
        expect(row).toHaveLength(4);
        expect(row[2].text).toContain("field");
        expect(row[2].text).toContain("second line");
    });

    it("renders endpoints with status icons, faulty endpoints first", () => {
        expect(findTable(md, "Endpoint")?.rows.map(r => r.map(c => c.text))).toEqual([
            ["<code>GET:/a</code>", "&#x1F7E2; 200, &#x1F534; 500", "&#x1F534; F100 &times;1", "2"],
            ["<code>POST:/a</code>", "&#x1F7E2; 201, &#x1F7E0; 400", "&#x1F534; F101 &times;1", "2"],
            ["<code>OPTIONS:/hidden</code> _(not in schema)_", "-", "&#x1F534; F100 &times;1", "1"],
            ["<code>GET:/b</code>", "&#x26AA; no response", "&#x2705; none", "1"],
        ]);
    });

    it("lists warnings by priority in a warning alert, escaping html", () => {
        expect(md).toContain("> [!WARNING]\n> - **FUZZER**: No auth &lt;configured&gt;\n> - **SCHEMA**: Schema has issues\n");
        expect(md).not.toContain("<configured>");
    });

    it("renders named examples", () => {
        const t = findTable(md, "Example");
        expect(rowByFirstCell(t, "alice")).toEqual(["alice", "2"]);
    });
});

describe("renderJobSummary variants", () => {
    it("reports no faults", () => {
        const md = renderJobSummary(buildSummaryModel(withoutFaults(loadSmallReport())));
        expect(md).toContain("## &#x2705; No potential faults found\n");
        expect(md).toContain("> [!TIP]\n> **No potential faults found** &middot; 4 test cases &middot; &#x23F1; 1h 2m 5s\n");
        expect(md).not.toContain("Faults by category");
        expect(md).not.toContain("Fault details");
        expect(md).not.toContain("[Faults]");
    });

    it("omits REST sections when there are no REST details", () => {
        const md = renderJobSummary(buildSummaryModel(withoutRest(loadSmallReport())));
        expect(md).not.toContain("Endpoint status coverage");
        expect(md).not.toContain("<summary>Endpoints (");
        expect(md).not.toContain("[Endpoints]");
        expect(md).not.toContain("endpoints affected");
        expect(rowByFirstCell(findTable(md, "Metric"), "HTTP calls in generated tests")).toBeUndefined();
        expect(rowByFirstCell(findTable(md, "Metric"), "Endpoints")).toBeUndefined();
        expect(rowByFirstCell(findTable(md, "Code"), "F100")).toEqual(["F100", "HTTP Status 500", "2", "2"]);
    });

    it("does not print the tool name", () => {
        const md = renderJobSummary(buildSummaryModel(loadSmallReport()));
        expect(md).not.toContain("EvoMaster");
        expect(md).toContain("### Code coverage\n");
    });

    it("omits links when none are given", () => {
        const md = renderJobSummary(buildSummaryModel(loadSmallReport()));
        expect(md).not.toContain("download the artifact");
        expect(md).not.toContain("[Interactive report]");
    });

    it("has no pie chart for a single fault category", () => {
        expect(mermaidBlocks(renderJobSummary(buildSummaryModel(buildLargeReport(10))))).toEqual([]);
    });

    it("stays within the byte budget when there are many warnings", () => {
        const base = loadSmallReport();
        const warnings = Array.from({length: 10_000}, (_, i) => ({message: `warning ${i} ` + "x".repeat(200), category: "FUZZER", displayPriority: 1}));
        const md = renderJobSummary(buildSummaryModel({...base, warnings}), {maxBytes: 100_000});
        expect(Buffer.byteLength(md, "utf8")).toBeLessThanOrEqual(100_000);
        expect(md).toContain(OMITTED_ROWS_TEXT);
        expect(findTable(md, "Metric")).toBeDefined();
    });

    it("never exceeds the byte budget, even when the fixed sections do not fit", () => {
        const md = renderJobSummary(buildSummaryModel(loadSmallReport()), {maxBytes: 300});
        expect(Buffer.byteLength(md, "utf8")).toBeLessThanOrEqual(300);
    });

    it("mentions sections that do not fit instead of dropping them silently", () => {
        const md = renderJobSummary(buildSummaryModel(buildLargeReport(5000)), {maxBytes: 30_000});
        expect(md).toContain("Fault details (5000)");
        expect(md).toContain("Endpoints (5000)");
        expect(md).toContain("Named examples (2)");
        expect(md).toContain('<a name="wfc-endpoints"></a>');
        expect(md.indexOf("Fault details (5000)")).toBeLessThan(md.indexOf("Endpoints (5000)"));
    });

    it("stays within the byte budget for large reports", () => {
        const md = renderJobSummary(buildSummaryModel(buildLargeReport(5000)), {maxBytes: 30_000});
        expect(Buffer.byteLength(md, "utf8")).toBeLessThanOrEqual(30_000);
        expect(md).toContain(OMITTED_ROWS_TEXT);
        expect(findTable(md, "Metric")).toBeDefined();
        expect(findTable(md, "Code")).toBeDefined();
    });

    it("renders the full sample report within the default limit", () => {
        const md = renderJobSummary(buildSummaryModel(loadSampleReport()));
        expect(Buffer.byteLength(md, "utf8")).toBeLessThanOrEqual(1_000_000);
        expect(rowByFirstCell(findTable(md, "Metric"), "Potential faults")).toEqual(["Potential faults", "529"]);
    });
});
