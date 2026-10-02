import {SummaryModel} from "@/summary/model.ts";
import {byteLength, DOT, heading, link, omittedNote, renderWithinBudget, table} from "@/summary/markdown.ts";
import {renderHeadline} from "@/summary/format.ts";
import {FAULT_CATEGORY_HEADERS, faultCategoryRow} from "@/summary/faultSections.ts";

export const PR_COMMENT_MARKER = "<!-- wfc-summary:pr-comment -->";

export const DEFAULT_PR_COMMENT_MAX_BYTES = 60_000;

export interface PrCommentOptions {
    artifactUrl?: string;
    runUrl?: string;
    maxBytes?: number;
}

export const renderPrComment = (model: SummaryModel, options: PrCommentOptions = {}): string => {
    const maxBytes = options.maxBytes ?? DEFAULT_PR_COMMENT_MAX_BYTES;
    const t = model.totals;

    const head = [
        PR_COMMENT_MARKER,
        heading(3, renderHeadline(model)),
        [
            ...(t.endpoints === null ? [] : [`**Endpoints:** ${t.endpoints}`]),
            `**Test cases:** ${t.testCases}`,
            `**Potential faults:** ${t.faults}`,
            `**Distinct fault types:** ${t.distinctFaultTypes}`,
            `**Warnings:** ${model.warnings.length}`,
        ].join(DOT) + "\n",
    ].join("\n");

    const links = [
        options.runUrl ? `Full summary: ${link("workflow run", options.runUrl)}` : "",
        options.artifactUrl ? `Interactive report: ${link("artifact", options.artifactUrl)}` : "",
    ].filter(s => s.length > 0).join(DOT);
    const tail = links.length > 0 ? "\n" + links + "\n" : "";

    const categories = model.faultCategories.length === 0 ? "" : renderWithinBudget(
        model.faultCategories,
        (shown, omitted) => table(FAULT_CATEGORY_HEADERS, shown.map(f => faultCategoryRow(f, t.endpoints))) + omittedNote(omitted),
        maxBytes - byteLength(head) - byteLength(tail) - 1,
    );

    return [head, categories].filter(s => s.length > 0).join("\n") + tail;
};
