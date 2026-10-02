import {describe, it, expect} from "vitest";
import {buildSummaryModel} from "../../src/summary/model";
import {buildAnnotations, DEFAULT_MAX_ANNOTATIONS} from "../../src/summary/annotations";
import {buildManyCategoriesReport, loadSmallReport} from "./helpers";

describe("buildAnnotations", () => {
    const model = buildSummaryModel(loadSmallReport());

    it("lists fault categories first, then fuzzer warnings", () => {
        expect(buildAnnotations(model)).toEqual([
            {level: "warning", title: "F100:HTTP Status 500 (2 potential faults)", message: "HTTP Status 500. Affected operations: GET:/a, OPTIONS:/hidden."},
            {level: "warning", title: "F101:HTTP Violation: no-non-standard-codes (1 potential fault)", message: "HTTP Violation: no-non-standard-codes. Affected operations: POST:/a."},
            {level: "notice", title: "Fuzzer warning: FUZZER", message: "No auth <configured>"},
            {level: "notice", title: "Fuzzer warning: SCHEMA", message: "Schema has issues"},
        ]);
    });

    it("respects the maximum", () => {
        expect(buildAnnotations(model, 1).map(a => a.title)).toEqual(["F100:HTTP Status 500 (2 potential faults)"]);
        expect(buildAnnotations(model, 0)).toEqual([]);
        expect(buildAnnotations(buildSummaryModel(buildManyCategoriesReport(100)))).toHaveLength(DEFAULT_MAX_ANNOTATIONS);
    });

    it("truncates long operation lists", () => {
        const base = loadSmallReport();
        const ops = ["GET:/1", "GET:/2", "GET:/3", "GET:/4", "GET:/5", "GET:/6", "GET:/7"];
        const report = {...base, faults: {totalNumber: 7, foundFaults: ops.map(op => ({
            operationId: op, testCaseId: "tests.java#t1", faultCategories: [{code: 100, context: null}],
        }))}} as typeof base;
        const [first] = buildAnnotations(buildSummaryModel(report));
        expect(first.message).toBe("HTTP Status 500. Affected operations: GET:/1, GET:/2, GET:/3, GET:/4, GET:/5 and 2 more.");
    });
});
