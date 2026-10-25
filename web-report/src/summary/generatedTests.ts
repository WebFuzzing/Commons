import {getLanguage} from "@/lib/utils.tsx";
import {FaultDetail, TestCaseSummary} from "@/summary/model.ts";
import {anchor, DOT, escapeHtml, escapeInline, heading, omittedNote, section} from "@/summary/markdown.ts";
import {UP_ICON} from "@/summary/format.ts";

export interface GeneratedTest {
    id: string;
    name: string;
    filePath: string;
    anchor: string;
    language: string;
    code: string;
}

export interface TestFaultInfo {
    codes: number[];
    operations: string[];
}

const slug = (id: string): string =>
    id.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// Same line rules as extractCodeLines in lib/utils.tsx, but on a file that is split only once
const sliceLines = (lines: string[], startLine: number | null, endLine: number | null): string | null => {
    if (!startLine || !endLine) return null;
    const startIndex = Math.max(0, startLine);
    const endIndex = Math.min(lines.length - 1, endLine - 1);
    if (startIndex > endIndex || startIndex >= lines.length) return null;
    return lines.slice(startIndex, endIndex + 2).join("\n");
};

export const buildGeneratedTests = (testCases: TestCaseSummary[], sources: Map<string, string>): GeneratedTest[] => {
    const ordered = [...testCases.filter(t => t.hasFaults), ...testCases.filter(t => !t.hasFaults)];
    const splitFiles = new Map<string, string[]>();
    const linesOf = (path: string): string[] | undefined => {
        const content = sources.get(path);
        if (content === undefined) return undefined;
        let lines = splitFiles.get(path);
        if (!lines) {
            lines = content.replace(/\r/g, "").split("\n");
            splitFiles.set(path, lines);
        }
        return lines;
    };

    const usedAnchors = new Set<string>();
    const tests: GeneratedTest[] = [];
    for (const tc of ordered) {
        if (tc.filePath === null) continue;
        const lines = linesOf(tc.filePath);
        if (!lines) continue;
        const code = sliceLines(lines, tc.startLine, tc.endLine);
        if (code === null || code.trim().length === 0) continue;

        const base = "test-" + (slug(tc.id) || "case");
        let name = base;
        for (let i = 2; usedAnchors.has(name); i++) name = `${base}-${i}`;
        usedAnchors.add(name);

        const language = getLanguage(tc.filePath);
        tests.push({
            id: tc.id,
            name: tc.name,
            filePath: tc.filePath,
            anchor: name,
            language: language === "plaintext" ? "text" : language,
            code,
        });
    }
    return tests;
};

const fenceFor = (code: string): string => {
    const longest = (code.match(/`+/g) ?? []).reduce((max, run) => Math.max(max, run.length), 0);
    return "`".repeat(Math.max(3, longest + 1));
};

const renderTestSummary = (test: GeneratedTest, faults: TestFaultInfo): string => {
    const parts = [`<b>${escapeHtml(test.name)}</b>`];
    if (faults.codes.length > 0) parts.push(faults.codes.map(c => `F${c}`).join(", "));
    if (faults.operations.length > 0) {
        const more = faults.operations.length > 1 ? ` (+${faults.operations.length - 1} more)` : "";
        parts.push(`<code>${escapeHtml(faults.operations[0])}</code>${more}`);
    }
    return parts.join(DOT);
};

export const renderGeneratedTest = (test: GeneratedTest, faults: TestFaultInfo, backLink: string | null): string => {
    const fence = fenceFor(test.code);
    const back = backLink ? `\n[${UP_ICON} back to faults](${backLink})\n` : "";
    return `${anchor(test.anchor)}\n<details open>\n<summary>${renderTestSummary(test, faults)}</summary>\n\n`
        + `${fence}${test.language}\n${test.code.replace(/\s+$/, "")}\n${fence}\n${back}\n</details>\n`;
};

export const testFaultInfo = (faultDetails: FaultDetail[]): Map<string, TestFaultInfo> => {
    const found = new Map<string, {codes: Set<number>; operations: Set<string>}>();
    for (const d of faultDetails) {
        for (const id of d.testCaseIds) {
            const entry = found.get(id) ?? {codes: new Set<number>(), operations: new Set<string>()};
            entry.codes.add(d.code);
            entry.operations.add(d.operationId);
            found.set(id, entry);
        }
    }
    return new Map([...found.entries()].map(([id, e]) =>
        [id, {codes: [...e.codes].sort((a, b) => a - b), operations: [...e.operations]}]));
};

export const generatedTestsSection = (all: GeneratedTest[], info: Map<string, TestFaultInfo>, backLink: string | null) =>
    (items: GeneratedTest[], omitted: number): string => {
        const fileTotals = new Map<string, number>();
        all.forEach(t => fileTotals.set(t.filePath, (fileTotals.get(t.filePath) ?? 0) + 1));
        const byFile = new Map<string, GeneratedTest[]>();
        for (const t of items) {
            const tests = byFile.get(t.filePath) ?? [];
            tests.push(t);
            byFile.set(t.filePath, tests);
        }
        const blocks = [...byFile.entries()].map(([file, tests]) =>
            heading(4, `${escapeInline(file)} (${fileTotals.get(file)})`) + "\n"
            + tests.map(t => renderGeneratedTest(t, info.get(t.id) ?? {codes: [], operations: []}, backLink)).join("\n"));
        return section(`Generated tests (${all.length})`,
            "Click a test case id in the tables above to jump to its code.\n\n"
            + blocks.join("\n") + omittedNote(omitted));
    };
