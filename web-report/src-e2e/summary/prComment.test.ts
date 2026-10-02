import {describe, it, expect} from "vitest";
import {buildSummaryModel} from "../../src/summary/model";
import {PR_COMMENT_MARKER, renderPrComment} from "../../src/summary/prComment";
import {OMITTED_ROWS_TEXT} from "../../src/summary/markdown";
import {buildManyCategoriesReport, findTable, loadSmallReport, rowByFirstCell, withoutFaults, withoutRest} from "./helpers";

describe("renderPrComment", () => {
    const model = buildSummaryModel(loadSmallReport());

    it("starts with the sticky marker and headline", () => {
        const md = renderPrComment(model);
        expect(md.startsWith(PR_COMMENT_MARKER + "\n")).toBe(true);
        expect(md).toContain("### &#x274C; Found 3 potential faults");
    });

    it("shows totals and the fault category table", () => {
        const md = renderPrComment(model);
        expect(md).toContain("**Endpoints:** 3");
        expect(md).toContain("**Test cases:** 4");
        expect(md).toContain("**Warnings:** 2");
        expect(rowByFirstCell(findTable(md, "Code"), "F100")).toEqual(["F100", "HTTP Status 500", "1/3 (+1 not in schema)", "2"]);
    });

    it("links to the run and the artifact", () => {
        const md = renderPrComment(model, {runUrl: "https://example.org/run/1", artifactUrl: "https://example.org/a/1"});
        expect(md).toContain("[workflow run](https://example.org/run/1)");
        expect(md).toContain("[artifact](https://example.org/a/1)");
    });

    it("has no fault table when there are no faults", () => {
        const md = renderPrComment(buildSummaryModel(withoutFaults(loadSmallReport())));
        expect(md).toContain("No potential faults found");
        expect(findTable(md, "Code")).toBeUndefined();
    });

    it("does not print the tool name", () => {
        expect(renderPrComment(model)).not.toContain("EvoMaster");
    });

    it("omits the endpoint count when there are no REST details", () => {
        const md = renderPrComment(buildSummaryModel(withoutRest(loadSmallReport())));
        expect(md).not.toContain("**Endpoints:**");
    });

    it("stays within the byte budget", () => {
        const md = renderPrComment(buildSummaryModel(buildManyCategoriesReport(100)), {maxBytes: 2000});
        expect(Buffer.byteLength(md, "utf8")).toBeLessThanOrEqual(2000);
        expect(md).toContain(OMITTED_ROWS_TEXT);
    });
});
