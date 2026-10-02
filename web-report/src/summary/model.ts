import {CoveredEndpoint, WebFuzzingCommonsReport} from "@/types/GeneratedTypes.tsx";
import {getFaultCategoryInfo} from "@/summary/faultCategories.ts";

export const NO_RESPONSE_CODE = -1;

export type StatusGroup = "2XX" | "3XX" | "4XX" | "5XX" | "NO_RESPONSE";

export interface StatusCoverage {
    total: number;
    counts: Record<StatusGroup, number>;
}

export interface FaultCategorySummary {
    code: number;
    name: string;
    label: string;
    count: number;
    operationCount: number;
    undeclaredOperationCount: number;
}

export interface EndpointSummary {
    endpoint: string;
    declared: boolean;
    statusCodes: number[];
    faultCodes: number[];
    testCaseIds: string[];
}

export interface FaultDetail {
    operationId: string;
    code: number;
    name: string;
    context: string | null;
    testCaseIds: string[];
}

export interface WarningSummary {
    message: string;
    category: string | null;
    displayPriority: number | null;
}

export interface NamedExampleSummary {
    name: string;
    testCaseIds: string[];
}

export interface TestFileSummary {
    path: string;
    testCases: number;
}

export interface FaultEndpointRow {
    operationId: string;
    declared: boolean;
    faults: number;
    example: string | null;
    testCaseIds: string[];
}

export interface FaultGroup {
    code: number;
    name: string;
    faults: number;
    operations: number;
    rows: FaultEndpointRow[];
}

export interface TestCaseSummary {
    id: string;
    name: string;
    filePath: string | null;
    startLine: number | null;
    endLine: number | null;
    hasFaults: boolean;
}

export interface CoverageSummary {
    toolName: string;
    criteria: {name: string; covered: number; total: number | null}[];
}

export interface SummaryTotals {
    endpoints: number | null;
    testFiles: number;
    testCases: number;
    outputHttpCalls: number | null;
    evaluatedHttpCalls: number | null;
    faults: number;
    distinctFaultTypes: number;
}

export interface SummaryModel {
    toolName: string;
    toolVersion: string;
    schemaVersion: string;
    creationTime: string;
    executionTimeInSeconds: number;
    totals: SummaryTotals;
    statusCoverage: StatusCoverage | null;
    coverage: CoverageSummary[];
    faultCategories: FaultCategorySummary[];
    endpoints: EndpointSummary[];
    faultDetails: FaultDetail[];
    faultGroups: FaultGroup[];
    warnings: WarningSummary[];
    namedExamples: NamedExampleSummary[];
    testFiles: TestFileSummary[];
    testCases: TestCaseSummary[];
}

export interface SummaryStats {
    faults: number;
    distinctFaultTypes: number;
    testCases: number;
    endpoints: number | null;
    warnings: number;
}

const byNumber = (a: number, b: number) => a - b;

const statusGroupOf = (code: number | null): StatusGroup | null => {
    if (code === null) return "NO_RESPONSE";
    if (code >= 200 && code < 300) return "2XX";
    if (code >= 300 && code < 400) return "3XX";
    if (code >= 400 && code < 500) return "4XX";
    if (code >= 500 && code < 600) return "5XX";
    return null;
};

// Single pass over the covered statuses; per the schema, a null or empty status list means "no response"
const buildStatusCoverage = (endpointIds: string[], covered: CoveredEndpoint[]): StatusCoverage => {
    const declared = new Set(endpointIds);
    const groups = new Map<string, Set<StatusGroup>>();
    for (const ce of covered) {
        if (!declared.has(ce.endpointId)) continue;
        const endpointGroups = groups.get(ce.endpointId) ?? new Set<StatusGroup>();
        const codes = ce.httpStatus && ce.httpStatus.length > 0 ? ce.httpStatus : [null];
        for (const c of codes) {
            const group = statusGroupOf(c);
            if (group) endpointGroups.add(group);
        }
        groups.set(ce.endpointId, endpointGroups);
    }
    const counts: Record<StatusGroup, number> = {"NO_RESPONSE": 0, "2XX": 0, "3XX": 0, "4XX": 0, "5XX": 0};
    for (const endpointGroups of groups.values()) {
        endpointGroups.forEach(g => counts[g]++);
    }
    return {total: endpointIds.length, counts};
};

const buildEndpoints = (report: WebFuzzingCommonsReport): EndpointSummary[] => {
    const rest = report.problemDetails?.rest;
    if (!rest) return [];

    const rows = new Map<string, {declared: boolean; statusCodes: Set<number>; faultCodes: Set<number>; tests: Set<string>}>();
    const rowOf = (endpoint: string, declared: boolean) => {
        let row = rows.get(endpoint);
        if (!row) {
            row = {declared, statusCodes: new Set(), faultCodes: new Set(), tests: new Set()};
            rows.set(endpoint, row);
        }
        return row;
    };

    rest.endpointIds.forEach(id => rowOf(id, true));
    for (const ff of report.faults.foundFaults) {
        if (!ff.operationId) continue;
        const row = rowOf(ff.operationId, false);
        ff.faultCategories.forEach(fc => row.faultCodes.add(fc.code));
        row.tests.add(ff.testCaseId);
    }
    // As in the web report, statuses of operations that are neither declared nor faulty are ignored
    for (const ce of rest.coveredHttpStatus) {
        const row = rows.get(ce.endpointId);
        if (!row) continue;
        const codes = ce.httpStatus && ce.httpStatus.length > 0 ? ce.httpStatus : [null];
        codes.forEach(c => row.statusCodes.add(c ?? NO_RESPONSE_CODE));
        row.tests.add(ce.testCaseId);
    }

    return [...rows.entries()].map(([endpoint, row]) => ({
        endpoint,
        declared: row.declared,
        statusCodes: [...row.statusCodes].sort(byNumber),
        faultCodes: [...row.faultCodes].sort(byNumber),
        testCaseIds: [...row.tests].sort(),
    }));
};

const buildFaultDetails = (report: WebFuzzingCommonsReport): FaultDetail[] => {
    const details = new Map<string, {detail: FaultDetail; tests: Set<string>}>();
    for (const ff of report.faults.foundFaults) {
        const operationId = ff.operationId ?? "(unknown operation)";
        for (const fc of ff.faultCategories) {
            const context = fc.context ?? null;
            const key = JSON.stringify([operationId, fc.code, context]);
            let entry = details.get(key);
            if (!entry) {
                entry = {
                    detail: {operationId, code: fc.code, name: getFaultCategoryInfo(fc.code).name, context, testCaseIds: []},
                    tests: new Set(),
                };
                details.set(key, entry);
            }
            entry.tests.add(ff.testCaseId);
        }
    }
    return [...details.values()]
        .map(({detail, tests}) => ({...detail, testCaseIds: [...tests]}))
        .sort((a, b) =>
            a.code - b.code
            || a.operationId.localeCompare(b.operationId)
            || (a.context ?? "").localeCompare(b.context ?? ""));
};

// declaredIds is null when the report has no schema information, so every operation counts as declared
const buildFaultGroups = (details: FaultDetail[], declaredIds: Set<string> | null): FaultGroup[] => {
    const groups = new Map<number, {name: string; rows: Map<string, {row: FaultEndpointRow; tests: Set<string>}>}>();
    for (const d of details) {
        let group = groups.get(d.code);
        if (!group) {
            group = {name: d.name, rows: new Map()};
            groups.set(d.code, group);
        }
        let entry = group.rows.get(d.operationId);
        if (!entry) {
            entry = {
                row: {
                    operationId: d.operationId,
                    declared: declaredIds === null || declaredIds.has(d.operationId),
                    faults: 0,
                    example: null,
                    testCaseIds: [],
                },
                tests: new Set(),
            };
            group.rows.set(d.operationId, entry);
        }
        entry.row.faults++;
        if (entry.row.example === null && d.context !== null) entry.row.example = d.context;
        d.testCaseIds.forEach(id => entry.tests.add(id));
    }
    return [...groups.entries()].map(([code, group]) => {
        const rows = [...group.rows.values()]
            .map(({row, tests}) => ({...row, testCaseIds: [...tests]}))
            .sort((a, b) => b.faults - a.faults || a.operationId.localeCompare(b.operationId));
        return {code, name: group.name, faults: rows.reduce((sum, r) => sum + r.faults, 0), operations: rows.length, rows};
    });
};

const buildFaultCategories = (groups: FaultGroup[]): FaultCategorySummary[] =>
    groups.map(g => {
        const info = getFaultCategoryInfo(g.code);
        const undeclared = g.rows.filter(r => !r.declared).length;
        return {
            code: g.code,
            name: info.name,
            label: info.label,
            count: g.faults,
            operationCount: g.operations - undeclared,
            undeclaredOperationCount: undeclared,
        };
    });

const buildWarnings = (report: WebFuzzingCommonsReport): WarningSummary[] =>
    (report.warnings ?? [])
        .map(w => ({message: w.message ?? "", category: w.category ?? null, displayPriority: w.displayPriority ?? null}))
        .sort((a, b) =>
            (a.displayPriority ?? Number.MAX_SAFE_INTEGER) - (b.displayPriority ?? Number.MAX_SAFE_INTEGER));

const buildNamedExamples = (report: WebFuzzingCommonsReport): NamedExampleSummary[] => {
    const examples = new Map<string, Set<string>>();
    for (const tc of report.testCases) {
        const id = tc.id ?? tc.name ?? "";
        for (const example of tc.namedExamples ?? []) {
            if (!example) continue;
            const ids = examples.get(example) ?? new Set<string>();
            ids.add(id);
            examples.set(example, ids);
        }
    }
    return [...examples.entries()]
        .map(([name, ids]) => ({name, testCaseIds: [...ids]}))
        .sort((a, b) => a.name.localeCompare(b.name));
};

export const buildSummaryModel = (report: WebFuzzingCommonsReport): SummaryModel => {
    const rest = report.problemDetails?.rest;
    const endpointIds = rest?.endpointIds ?? [];
    const faultyTestIds = new Set(report.faults.foundFaults.map(ff => ff.testCaseId));
    const faultDetails = buildFaultDetails(report);
    const faultGroups = buildFaultGroups(faultDetails, rest ? new Set(endpointIds) : null);
    const faultCategories = buildFaultCategories(faultGroups);

    return {
        toolName: report.toolName,
        toolVersion: report.toolVersion,
        schemaVersion: report.schemaVersion,
        creationTime: report.creationTime,
        executionTimeInSeconds: report.executionTimeInSeconds,
        totals: {
            endpoints: rest ? endpointIds.length : null,
            testFiles: report.testFilePaths.length,
            testCases: report.testCases.length,
            outputHttpCalls: rest ? rest.outputHttpCalls : null,
            evaluatedHttpCalls: rest ? rest.evaluatedHttpCalls : null,
            faults: report.faults.totalNumber,
            distinctFaultTypes: faultCategories.length,
        },
        statusCoverage: rest
            ? buildStatusCoverage(endpointIds, rest.coveredHttpStatus)
            : null,
        coverage: (report.extra ?? []).map(c => ({
            toolName: c.toolName,
            criteria: c.criteria.map(cr => ({name: cr.name, covered: cr.covered, total: cr.total ?? null})),
        })),
        faultCategories,
        endpoints: buildEndpoints(report),
        faultDetails,
        faultGroups,
        warnings: buildWarnings(report),
        namedExamples: buildNamedExamples(report),
        testFiles: report.testFilePaths.map(path => ({
            path,
            testCases: report.testCases.filter(tc => tc.filePath === path).length,
        })),
        testCases: report.testCases.map(tc => {
            const id = tc.id ?? tc.name ?? "";
            return {
                id,
                name: tc.name ?? id,
                filePath: tc.filePath ?? null,
                startLine: tc.startLine ?? null,
                endLine: tc.endLine ?? null,
                hasFaults: faultyTestIds.has(id),
            };
        }),
    };
};

export const toStats = (model: SummaryModel): SummaryStats => ({
    faults: model.totals.faults,
    distinctFaultTypes: model.totals.distinctFaultTypes,
    testCases: model.totals.testCases,
    endpoints: model.totals.endpoints,
    warnings: model.warnings.length,
});
