import {describe, it, expect} from "vitest";
import {buildSummaryModel, NO_RESPONSE_CODE, toStats} from "../../src/summary/model";
import {getFaultCategoryInfo} from "../../src/summary/faultCategories";
import {loadSampleReport, loadSmallReport, withoutRest} from "./helpers";
import {WebFuzzingCommonsReport} from "../../src/types/GeneratedTypes";

describe("buildSummaryModel on the small fixture", () => {
    const model = buildSummaryModel(loadSmallReport());

    it("computes totals", () => {
        expect(model.totals).toEqual({
            endpoints: 3, testFiles: 1, testCases: 4,
            outputHttpCalls: 5, evaluatedHttpCalls: 1000,
            faults: 3, distinctFaultTypes: 2,
        });
        expect(model.toolName).toBe("EvoMaster");
        expect(model.executionTimeInSeconds).toBe(3725);
    });

    it("computes status coverage including calls without a response", () => {
        expect(model.statusCoverage).toEqual({
            total: 3,
            counts: {"NO_RESPONSE": 1, "2XX": 2, "3XX": 0, "4XX": 1, "5XX": 1},
        });
    });

    it("computes fault categories with names from fault_categories.json", () => {
        expect(model.faultCategories).toEqual([
            {code: 100, name: "HTTP Status 500", label: "F100:HTTP Status 500", count: 2, operationCount: 1, undeclaredOperationCount: 1},
            {code: 101, name: "HTTP Violation: no-non-standard-codes", label: "F101:HTTP Violation: no-non-standard-codes", count: 1, operationCount: 1, undeclaredOperationCount: 0},
        ]);
    });

    it("computes per-endpoint rows, including undeclared operations", () => {
        expect(model.endpoints).toEqual([
            {endpoint: "GET:/a", declared: true, statusCodes: [200, 500], faultCodes: [100], testCaseIds: ["tests.java#t1", "tests.java#t2"]},
            {endpoint: "POST:/a", declared: true, statusCodes: [201, 400], faultCodes: [101], testCaseIds: ["tests.java#t3", "tests.java#t4"]},
            {endpoint: "GET:/b", declared: true, statusCodes: [NO_RESPONSE_CODE], faultCodes: [], testCaseIds: ["tests.java#t4"]},
            {endpoint: "OPTIONS:/hidden", declared: false, statusCodes: [], faultCodes: [100], testCaseIds: ["tests.java#t4"]},
        ]);
    });

    it("computes unique fault details sorted by code and operation", () => {
        expect(model.faultDetails).toEqual([
            {operationId: "GET:/a", code: 100, name: "HTTP Status 500", context: "ctxA", testCaseIds: ["tests.java#t1", "tests.java#t2"]},
            {operationId: "OPTIONS:/hidden", code: 100, name: "HTTP Status 500", context: null, testCaseIds: ["tests.java#t4"]},
            {operationId: "POST:/a", code: 101, name: "HTTP Violation: no-non-standard-codes", context: "body | field `x`\nsecond line", testCaseIds: ["tests.java#t3"]},
        ]);
    });

    it("groups fault details by category and operation", () => {
        expect(model.faultGroups).toEqual([
            {code: 100, name: "HTTP Status 500", faults: 2, operations: 2, rows: [
                {operationId: "GET:/a", declared: true, faults: 1, example: "ctxA", testCaseIds: ["tests.java#t1", "tests.java#t2"]},
                {operationId: "OPTIONS:/hidden", declared: false, faults: 1, example: null, testCaseIds: ["tests.java#t4"]},
            ]},
            {code: 101, name: "HTTP Violation: no-non-standard-codes", faults: 1, operations: 1, rows: [
                {operationId: "POST:/a", declared: true, faults: 1, example: "body | field `x`\nsecond line", testCaseIds: ["tests.java#t3"]},
            ]},
        ]);
    });

    it("sorts warnings by display priority", () => {
        expect(model.warnings.map(w => w.category)).toEqual(["FUZZER", "SCHEMA"]);
    });

    it("collects named examples, coverage and test files", () => {
        expect(model.namedExamples).toEqual([
            {name: "alice", testCaseIds: ["tests.java#t3", "tests.java#t4"]},
            {name: "bob", testCaseIds: ["tests.java#t4"]},
        ]);
        expect(model.coverage).toEqual([{toolName: "EvoMaster", criteria: [
            {name: "Line Coverage", covered: 50, total: 100},
            {name: "Branch Coverage", covered: 7, total: null},
        ]}]);
        expect(model.testFiles).toEqual([{path: "tests.java", testCases: 4}]);
    });

    it("lists test cases with their location and fault flag", () => {
        expect(model.testCases).toHaveLength(4);
        expect(model.testCases[0]).toEqual({id: "tests.java#t1", name: "t1", filePath: "tests.java", startLine: 1, endLine: 5, hasFaults: true});
    });

    it("builds stats", () => {
        expect(toStats(model)).toEqual({faults: 3, distinctFaultTypes: 2, testCases: 4, endpoints: 3, warnings: 2});
    });
});

describe("buildSummaryModel edge cases", () => {
    it("handles reports without REST details", () => {
        const model = buildSummaryModel(withoutRest(loadSmallReport()));
        expect(model.statusCoverage).toBeNull();
        expect(model.totals.endpoints).toBeNull();
        expect(toStats(model).endpoints).toBeNull();
        expect(model.totals.outputHttpCalls).toBeNull();
        expect(model.totals.evaluatedHttpCalls).toBeNull();
    });

    it("counts calls with an empty status list as no response", () => {
        const base = loadSmallReport();
        const rest = base.problemDetails.rest!;
        const report = {...base, problemDetails: {rest: {...rest, coveredHttpStatus: rest.coveredHttpStatus.map(ce =>
            ce.endpointId === "GET:/b" ? {...ce, httpStatus: []} : ce)}}} as WebFuzzingCommonsReport;
        expect(buildSummaryModel(report).statusCoverage?.counts.NO_RESPONSE).toBe(1);
    });

    it("counts fault categories correctly when an operation id contains a pipe", () => {
        const base = loadSmallReport();
        const rest = base.problemDetails.rest!;
        const report = {
            ...base,
            problemDetails: {rest: {...rest, endpointIds: [...rest.endpointIds, "GET:/x|y"]}},
            faults: {totalNumber: 1, foundFaults: [
                {operationId: "GET:/x|y", testCaseId: "tests.java#t1", faultCategories: [{code: 100, context: "a|b"}]},
            ]},
        } as WebFuzzingCommonsReport;
        expect(buildSummaryModel(report).faultCategories).toEqual([
            {code: 100, name: "HTTP Status 500", label: "F100:HTTP Status 500", count: 1, operationCount: 1, undeclaredOperationCount: 0},
        ]);
    });

    it("falls back to generic names for unknown fault codes", () => {
        const base = loadSmallReport();
        const report = {
            ...base,
            faults: {totalNumber: 2, foundFaults: [
                {operationId: "GET:/a", testCaseId: "tests.java#t1", faultCategories: [{code: 950, context: null}]},
                {operationId: "GET:/a", testCaseId: "tests.java#t1", faultCategories: [{code: 150, context: null}]},
            ]},
        } as WebFuzzingCommonsReport;
        const names = buildSummaryModel(report).faultCategories.map(f => [f.code, f.name]);
        expect(names).toEqual([[150, "Unrecognized Code"], [950, "Custom Code"]]);
        expect(getFaultCategoryInfo(950).label).toBe("F950:Custom Code");
    });

    it("processes the full sample report without errors", () => {
        const model = buildSummaryModel(loadSampleReport());
        expect(model.totals.faults).toBe(529);
        expect(model.totals.endpoints).toBe(67);
        expect(model.faultCategories.map(f => f.code)).toEqual([200]);
    });
});
