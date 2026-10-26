import {EndpointSummary, FaultGroup} from "@/summary/model.ts";
import {code, details, omittedNote, table} from "@/summary/markdown.ts";
import {FAULT_ICON, OK_ICON, statusCell} from "@/summary/format.ts";

export type EndpointFaultCounts = Map<string, {code: number; faults: number}[]>;

export const faultCountsByEndpoint = (groups: FaultGroup[]): EndpointFaultCounts => {
    const counts: EndpointFaultCounts = new Map();
    for (const g of groups) {
        for (const r of g.rows) {
            const list = counts.get(r.operationId) ?? [];
            list.push({code: g.code, faults: r.faults});
            counts.set(r.operationId, list);
        }
    }
    return counts;
};

export const sortByFaults = (endpoints: EndpointSummary[], counts: EndpointFaultCounts): EndpointSummary[] =>
    endpoints
        .map((e, index) => ({e, index, faults: (counts.get(e.endpoint) ?? []).reduce((sum, c) => sum + c.faults, 0)}))
        .sort((a, b) => b.faults - a.faults || a.index - b.index)
        .map(x => x.e);

export const endpointsSection = (total: number, counts: EndpointFaultCounts) => (items: EndpointSummary[], omitted: number): string =>
    details(`Endpoints (${total})`, table(["Endpoint", "Responses", "Faults", "Test cases"], items.map(e => {
        const faults = counts.get(e.endpoint) ?? [];
        return [
            code(e.endpoint) + (e.declared ? "" : " _(not in schema)_"),
            e.statusCodes.map(statusCell).join(", ") || "-",
            faults.length > 0 ? faults.map(f => `${FAULT_ICON} F${f.code} &times;${f.faults}`).join(", ") : `${OK_ICON} none`,
            String(e.testCaseIds.length),
        ];
    })) + omittedNote(omitted));
