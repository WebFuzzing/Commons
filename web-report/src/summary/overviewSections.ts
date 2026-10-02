import {NamedExampleSummary, StatusGroup, SummaryModel, WarningSummary} from "@/summary/model.ts";
import {anchorLink, details, DOT, escapeInline, heading, link, omittedNote, section, table, withAnchor} from "@/summary/markdown.ts";
import {formatDuration, plural, ratioCell, renderHeadline, TIMER_ICON} from "@/summary/format.ts";
import {ENDPOINTS_ANCHOR, FAULTS_ANCHOR, TESTS_ANCHOR, TOP_ANCHOR} from "@/summary/anchors.ts";

export interface LinkOptions {
    artifactUrl?: string;
    runUrl?: string;
}

const STATUS_ROWS: {group: StatusGroup; label: string}[] = [
    {group: "2XX", label: "2XX"},
    {group: "3XX", label: "3XX"},
    {group: "4XX", label: "4XX"},
    {group: "5XX", label: "5XX"},
    {group: "NO_RESPONSE", label: "No response"},
];

export const renderHeader = (m: SummaryModel): string =>
    withAnchor(TOP_ANCHOR, heading(2, renderHeadline(m)))
    + `\n<sub>WFC report schema ${escapeInline(m.schemaVersion)} &middot; created ${escapeInline(m.creationTime)}</sub>\n`;

export const renderGlance = (m: SummaryModel): string => {
    const t = m.totals;
    const parts: string[] = [];
    if (t.faults > 0) {
        parts.push(`**${plural(t.faults, "potential fault")}**`, plural(t.distinctFaultTypes, "fault type"));
        if (t.endpoints !== null) {
            const affected = m.endpoints.filter(e => e.declared && e.faultCodes.length > 0).length;
            parts.push(`${affected}/${t.endpoints} endpoints affected`);
        }
    } else {
        parts.push("**No potential faults found**");
    }
    parts.push(plural(t.testCases, "test case"), `${TIMER_ICON} ${formatDuration(m.executionTimeInSeconds)}`);
    return `> [!${t.faults > 0 ? "CAUTION" : "TIP"}]\n> ${parts.join(DOT)}\n`;
};

export const renderNavigation = (m: SummaryModel, o: LinkOptions, hasTests: boolean): string => {
    const items: string[] = [];
    if (m.faultCategories.length > 0) items.push(link("Faults", anchorLink(FAULTS_ANCHOR)));
    if (m.endpoints.length > 0) items.push(link("Endpoints", anchorLink(ENDPOINTS_ANCHOR)));
    if (hasTests) items.push(link("Tests", anchorLink(TESTS_ANCHOR)));
    if (o.artifactUrl) items.push(link("Interactive report", o.artifactUrl));
    return items.length > 0 ? items.join(DOT) + "\n" : "";
};

export const renderLinks = (o: LinkOptions): string => {
    const lines: string[] = [];
    if (o.artifactUrl) {
        lines.push(`> **Interactive report:** ${link("download the artifact", o.artifactUrl)}, unzip it and open \`low-code-index.html\` in a browser.`);
    }
    if (o.runUrl) {
        lines.push(`> **Workflow run:** ${link(o.runUrl, o.runUrl)}`);
    }
    return lines.length > 0 ? "> [!TIP]\n" + lines.join("\n>\n") + "\n" : "";
};

export const renderOverview = (m: SummaryModel): string => {
    const t = m.totals;
    const rows: string[][] = [];
    if (t.endpoints !== null) rows.push(["Endpoints", String(t.endpoints)]);
    rows.push(
        ["Test files", String(t.testFiles)],
        ["Test cases", String(t.testCases)],
    );
    if (t.outputHttpCalls !== null) rows.push(["HTTP calls in generated tests", String(t.outputHttpCalls)]);
    if (t.evaluatedHttpCalls !== null) rows.push(["HTTP calls evaluated during fuzzing", String(t.evaluatedHttpCalls)]);
    rows.push(
        ["Potential faults", String(t.faults)],
        ["Distinct fault types", String(t.distinctFaultTypes)],
        ["Execution time", formatDuration(m.executionTimeInSeconds)],
    );
    return section("Overview", table(["Metric", "Value"], rows));
};

export const renderStatusCoverage = (m: SummaryModel): string => {
    const sc = m.statusCoverage;
    if (!sc) return "";
    const rows = STATUS_ROWS
        .filter(r => r.group !== "NO_RESPONSE" || sc.counts.NO_RESPONSE > 0)
        .map(r => [r.label, `${sc.counts[r.group]}/${sc.total}`, ratioCell(sc.counts[r.group], sc.total)]);
    return section("Endpoint status coverage",
        "Endpoints for which at least one generated test received a response in the given status class.\n\n"
        + table(["Status", "Endpoints", "Ratio"], rows));
};

export const renderCodeCoverage = (m: SummaryModel): string =>
    m.coverage.map(c => section("Code coverage",
        table(["Criterion", "Covered", "Total", "Ratio"], c.criteria.map(cr => [
            escapeInline(cr.name),
            String(cr.covered),
            cr.total === null ? "-" : String(cr.total),
            cr.total === null ? "-" : ratioCell(cr.covered, cr.total),
        ])))).join("\n");

export const warningsSection = (total: number) => (items: WarningSummary[], omitted: number): string =>
    section(`Warnings (${total})`,
        "> [!WARNING]\n"
        + items.map(w => `> - ${w.category ? `**${escapeInline(w.category)}**: ` : ""}${escapeInline(w.message)}`).join("\n") + "\n"
        + omittedNote(omitted));

export const namedExamplesSection = (total: number) => (items: NamedExampleSummary[], omitted: number): string =>
    details(`Named examples (${total})`, table(["Example", "Test cases"], items.map(e => [
        escapeInline(e.name),
        String(e.testCaseIds.length),
    ])) + omittedNote(omitted));
