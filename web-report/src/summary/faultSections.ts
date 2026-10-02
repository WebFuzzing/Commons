import {FaultCategorySummary, FaultEndpointRow, FaultGroup, SummaryModel} from "@/summary/model.ts";
import {anchorLink, code, details, DOT, escapeHtml, escapeInline, link, omittedNote, section, table, withAnchor} from "@/summary/markdown.ts";
import {plural, shortenContext} from "@/summary/format.ts";
import {FAULTS_ANCHOR} from "@/summary/anchors.ts";

export const FAULT_CATEGORY_HEADERS = ["Code", "Name", "Affected endpoints", "Faults"];

const MAX_TEST_IDS_PER_CELL = 3;

export const faultCategoryRow = (f: FaultCategorySummary, totalEndpoints: number | null): string[] => [
    `F${f.code}`,
    escapeInline(f.name),
    totalEndpoints === null
        ? String(f.operationCount)
        : `${f.operationCount}/${totalEndpoints}`
            + (f.undeclaredOperationCount > 0 ? ` (+${f.undeclaredOperationCount} not in schema)` : ""),
    String(f.count),
];

// Categories do not overlap, so their counts add up to the total and suit a pie chart
const renderFaultPie = (m: SummaryModel): string =>
    m.faultCategories.length < 2 ? "" : "\n```mermaid\npie showData title Faults by category\n"
        + m.faultCategories.map(f => `    "F${f.code}" : ${f.count}`).join("\n") + "\n```\n";

export const renderFaultCategories = (m: SummaryModel): string =>
    m.faultCategories.length === 0 ? "" : withAnchor(FAULTS_ANCHOR, section("Faults by category",
        table(FAULT_CATEGORY_HEADERS, m.faultCategories.map(f => faultCategoryRow(f, m.totals.endpoints)))
        + renderFaultPie(m)));

const testIdsCell = (ids: string[], anchors: Map<string, string>): string =>
    ids.slice(0, MAX_TEST_IDS_PER_CELL).map(id => {
        const name = anchors.get(id);
        return name ? link(code(id), anchorLink(name)) : code(id);
    }).join(", ")
    + (ids.length > MAX_TEST_IDS_PER_CELL ? ` (+${ids.length - MAX_TEST_IDS_PER_CELL} more)` : "");

export interface FaultRowRef {
    group: FaultGroup;
    row: FaultEndpointRow;
}

export const faultRowsOf = (groups: FaultGroup[]): FaultRowRef[] =>
    groups.flatMap(group => group.rows.map(row => ({group, row})));

export const faultDetailsSection = (total: number, anchors: Map<string, string>) => (items: FaultRowRef[], omitted: number): string => {
    const byGroup = new Map<FaultGroup, FaultEndpointRow[]>();
    for (const {group, row} of items) {
        const rows = byGroup.get(group) ?? [];
        rows.push(row);
        byGroup.set(group, rows);
    }
    const blocks = [...byGroup.entries()].map(([g, rows]) => details(
        `<b>F${g.code}</b> ${escapeHtml(g.name)}${DOT}${plural(g.faults, "fault")} on ${plural(g.operations, "endpoint")}`,
        table(["Operation", "Faults", "Example", "Test cases"], rows.map(r => [
            code(r.operationId) + (r.declared ? "" : " _(not in schema)_"),
            String(r.faults),
            r.example === null ? "-" : escapeInline(shortenContext(r.example, r.operationId)),
            testIdsCell(r.testCaseIds, anchors),
        ]))));
    return section(`Fault details (${total})`, blocks.join("\n") + omittedNote(omitted));
};
