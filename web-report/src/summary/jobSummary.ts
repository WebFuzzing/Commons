import {SummaryModel} from "@/summary/model.ts";
import {anchor, anchorLink, byteLength, renderWithinBudget} from "@/summary/markdown.ts";
import {ENDPOINTS_ANCHOR, FAULTS_ANCHOR, TESTS_ANCHOR} from "@/summary/anchors.ts";
import {
    LinkOptions,
    namedExamplesSection,
    renderCodeCoverage,
    renderGlance,
    renderHeader,
    renderLinks,
    renderNavigation,
    renderOverview,
    renderStatusCoverage,
    warningsSection,
} from "@/summary/overviewSections.ts";
import {faultDetailsSection, faultRowsOf, renderFaultCategories} from "@/summary/faultSections.ts";
import {endpointsSection, faultCountsByEndpoint, sortByFaults} from "@/summary/endpointSections.ts";
import {buildGeneratedTests, generatedTestsSection, testFaultInfo} from "@/summary/generatedTests.ts";

export interface JobSummaryOptions extends LinkOptions {
    maxBytes?: number;
    testSources?: Map<string, string>;
}

export const DEFAULT_JOB_SUMMARY_MAX_BYTES = 1_000_000;

const TRUNCATED_NOTE = "\n\n_Summary truncated due to the size limit. See the interactive report._\n";

const sectionOmittedNote = (title: string): string =>
    `_${title}: section omitted due to the size limit. See the interactive report._\n`;

interface BudgetedSection {
    note: string;
    render: (maxBytes: number) => string;
}

const budgetedSection = <T>(
    items: T[],
    title: string,
    render: (shown: T[], omitted: number) => string,
    anchorName?: string,
): BudgetedSection | null => {
    if (items.length === 0) return null;
    const prefix = anchorName ? `${anchor(anchorName)}\n\n` : "";
    return {
        note: prefix + sectionOmittedNote(title),
        render: (maxBytes) => {
            const text = renderWithinBudget(items, render, maxBytes - byteLength(prefix));
            return text.length > 0 ? prefix + text : "";
        },
    };
};

const truncateToBytes = (text: string, maxBytes: number): string => {
    if (byteLength(text) <= maxBytes) return text;
    const limit = maxBytes - byteLength(TRUNCATED_NOTE);
    if (limit <= 0) return "";
    let lo = 0;
    let hi = text.length;
    while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        if (byteLength(text.slice(0, mid)) <= limit) {
            lo = mid;
        } else {
            hi = mid - 1;
        }
    }
    const lastLineEnd = text.lastIndexOf("\n", lo);
    return text.slice(0, lastLineEnd > 0 ? lastLineEnd : lo) + TRUNCATED_NOTE;
};

export const renderJobSummary = (model: SummaryModel, options: JobSummaryOptions = {}): string => {
    const maxBytes = options.maxBytes ?? DEFAULT_JOB_SUMMARY_MAX_BYTES;
    const generatedTests = options.testSources ? buildGeneratedTests(model.testCases, options.testSources) : [];
    const anchors = new Map<string, string>();
    generatedTests.forEach(t => { if (!anchors.has(t.id)) anchors.set(t.id, t.anchor); });
    const counts = faultCountsByEndpoint(model.faultGroups);
    const backLink = model.faultCategories.length > 0 ? anchorLink(FAULTS_ANCHOR) : null;

    const fixed = [
        renderHeader(model),
        renderGlance(model),
        renderNavigation(model, options, generatedTests.length > 0),
        renderLinks(options),
        renderOverview(model),
        renderStatusCoverage(model),
        renderCodeCoverage(model),
        renderFaultCategories(model),
    ].filter(s => s.length > 0).join("\n");

    const budgeted = [
        budgetedSection(model.warnings, `Warnings (${model.warnings.length})`, warningsSection(model.warnings.length)),
        budgetedSection(faultRowsOf(model.faultGroups), `Fault details (${model.faultDetails.length})`,
            faultDetailsSection(model.faultDetails.length, anchors)),
        budgetedSection(sortByFaults(model.endpoints, counts), `Endpoints (${model.endpoints.length})`,
            endpointsSection(model.endpoints.length, counts), ENDPOINTS_ANCHOR),
        budgetedSection(model.namedExamples, `Named examples (${model.namedExamples.length})`,
            namedExamplesSection(model.namedExamples.length)),
        budgetedSection(generatedTests, `Generated tests (${generatedTests.length})`,
            generatedTestsSection(generatedTests, testFaultInfo(model.faultDetails), backLink), TESTS_ANCHOR),
    ].filter(s => s !== null);

    // one extra byte per part for the "\n" used to join parts
    const noteBytes = budgeted.map(s => byteLength(s.note) + 1);
    const parts = [fixed];
    let remaining = maxBytes - byteLength(fixed);
    budgeted.forEach((s, i) => {
        const reserved = noteBytes.slice(i + 1).reduce((a, b) => a + b, 0);
        const text = s.render(remaining - reserved - 1);
        const chosen = text.length > 0 ? text : (noteBytes[i] <= remaining - reserved ? s.note : "");
        if (chosen.length === 0) return;
        parts.push(chosen);
        remaining -= byteLength(chosen) + 1;
    });

    return truncateToBytes(parts.join("\n"), maxBytes);
};
