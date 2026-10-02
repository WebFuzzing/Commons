import {readFileSync} from "fs";
import {resolve} from "path";
import {marked, Tokens} from "marked";
import {WebFuzzingCommonsReport} from "../../src/types/GeneratedTypes";

export const SMALL_REPORT_PATH = resolve(__dirname, "../fixtures/summary-small-report.json");

const readJson = (path: string) => JSON.parse(readFileSync(path, "utf-8"));

export const loadSmallReport = (): WebFuzzingCommonsReport => readJson(SMALL_REPORT_PATH);

export const loadSampleReport = (): WebFuzzingCommonsReport =>
    readJson(resolve(__dirname, "../static/report.json"));

export const withoutFaults = (r: WebFuzzingCommonsReport): WebFuzzingCommonsReport =>
    ({...r, faults: {totalNumber: 0, foundFaults: []}});

export const withoutRest = (r: WebFuzzingCommonsReport): WebFuzzingCommonsReport =>
    ({...r, problemDetails: {}});

export const buildLargeReport = (n: number): WebFuzzingCommonsReport => {
    const base = loadSmallReport();
    const ops = Array.from({length: n}, (_, i) => `GET:/items/${i}`);
    return {
        ...base,
        faults: {
            totalNumber: n,
            foundFaults: ops.map((op, i) => ({
                operationId: op,
                testCaseId: `tests.java#t${i}`,
                faultCategories: [{code: 100, context: `context ${i}`}],
            })),
        },
        problemDetails: {
            rest: {
                outputHttpCalls: n,
                evaluatedHttpCalls: n,
                endpointIds: ops,
                coveredHttpStatus: ops.map((op, i) => ({endpointId: op, testCaseId: `tests.java#t${i}`, httpStatus: [500]})),
            },
        },
    } as WebFuzzingCommonsReport;
};

export const buildManyCategoriesReport = (n: number): WebFuzzingCommonsReport => {
    const base = loadSmallReport();
    return {
        ...base,
        faults: {
            totalNumber: n,
            foundFaults: Array.from({length: n}, (_, i) => ({
                operationId: "GET:/a",
                testCaseId: "tests.java#t1",
                faultCategories: [{code: 900 + i, context: null}],
            })),
        },
    } as WebFuzzingCommonsReport;
};

export const tablesOf = (md: string): Tokens.Table[] =>
    marked.lexer(md).filter((t): t is Tokens.Table => t.type === "table");

export const findTable = (md: string, firstHeader: string): Tokens.Table | undefined =>
    tablesOf(md).find(t => t.header[0]?.text === firstHeader);

export const rowByFirstCell = (table: Tokens.Table | undefined, firstCell: string): string[] | undefined =>
    table?.rows.find(r => r[0]?.text === firstCell)?.map(c => c.text);
