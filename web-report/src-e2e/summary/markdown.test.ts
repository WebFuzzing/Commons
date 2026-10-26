import {describe, it, expect} from "vitest";
import {code, details, escapeInline, link, omittedNote, renderWithinBudget, table, OMITTED_ROWS_TEXT} from "../../src/summary/markdown";
import {formatDuration, formatPercent, plural, ratioCell, shortenContext, statusCell, statusCodeLabel, textBar} from "../../src/summary/format";
import {tablesOf} from "./helpers";

describe("escapeInline", () => {
    it("escapes markdown specials, html and newlines", () => {
        expect(escapeInline("a|b")).toBe("a\\|b");
        expect(escapeInline("*_`[]~\\")).toBe("\\*\\_\\`\\[\\]\\~\\\\");
        expect(escapeInline("<x> & y")).toBe("&lt;x&gt; &amp; y");
        expect(escapeInline("one\ntwo\r\nthree")).toBe("one<br>two<br>three");
    });
});

describe("table", () => {
    it("produces a GFM table that a real parser reads with the same shape", () => {
        const md = table(["A", "B"], [[escapeInline("x|y"), "z"], [code("GET:/a|b"), "w"]]);
        const [t] = tablesOf(md);
        expect(t.header.map(h => h.text)).toEqual(["A", "B"]);
        expect(t.rows).toHaveLength(2);
        expect(t.rows[0].map(c => c.text)).toEqual(["x|y", "z"]);
        expect(t.rows[1]).toHaveLength(2);
        expect(t.rows[1][1].text).toBe("w");
    });

    it("keeps a multi-line cell inside a single row", () => {
        const md = table(["A"], [[escapeInline("first\nsecond")]]);
        const [t] = tablesOf(md);
        expect(t.rows).toHaveLength(1);
        expect(t.rows[0][0].text).toContain("second");
    });

    it("is still parsed as a table inside details", () => {
        const md = "intro\n\n" + details("More", table(["A"], [["1"]]));
        expect(tablesOf(md)).toHaveLength(1);
    });
});

describe("link", () => {
    it("percent-encodes characters that would break the markdown link", () => {
        expect(link("x", "https://e.org/a(1) b")).toBe("[x](https://e.org/a%281%29%20b)");
    });
});

describe("renderWithinBudget", () => {
    const items = Array.from({length: 100}, (_, i) => i);
    const render = (shown: number[], omitted: number) => shown.join(",") + omittedNote(omitted);

    it("returns the full rendering when it fits", () => {
        expect(renderWithinBudget([1, 2], render, 1000)).toBe("1,2");
    });

    it("drops rows until the output fits, and reports how many were omitted", () => {
        const out = renderWithinBudget(items, render, 120);
        expect(Buffer.byteLength(out, "utf8")).toBeLessThanOrEqual(120);
        const shown = out.split("\n")[0].split(",").length;
        expect(out).toContain(`_${100 - shown} ${OMITTED_ROWS_TEXT}_`);
    });

    it("returns an empty string when even zero rows do not fit", () => {
        expect(renderWithinBudget(items, render, 5)).toBe("");
    });
});

describe("format", () => {
    it("formats durations", () => {
        expect(formatDuration(3725)).toBe("1h 2m 5s");
        expect(formatDuration(0)).toBe("0s");
        expect(formatDuration(59)).toBe("59s");
        expect(formatDuration(60)).toBe("1m 0s");
    });

    it("formats percentages, labels and plurals", () => {
        expect(formatPercent(2, 3)).toBe("67%");
        expect(formatPercent(1, 0)).toBe("-");
        expect(statusCodeLabel(-1)).toBe("no response");
        expect(statusCodeLabel(404)).toBe("404");
        expect(plural(1, "fault")).toBe("1 fault");
        expect(plural(2, "fault")).toBe("2 faults");
    });

    it("draws text bars", () => {
        expect(textBar(2, 3)).toBe("&#x2588;".repeat(7) + "&#x2591;".repeat(3));
        expect(textBar(0, 0)).toBe("&#x2591;".repeat(10));
        expect(textBar(5, 3)).toBe("&#x2588;".repeat(10));
        expect(ratioCell(1, 2)).toBe(`<code>${"&#x2588;".repeat(5)}${"&#x2591;".repeat(5)}</code> 50%`);
        expect(ratioCell(1, 0)).toBe("-");
    });

    it("adds status icons by class", () => {
        expect(statusCell(200)).toBe("&#x1F7E2; 200");
        expect(statusCell(302)).toBe("&#x1F535; 302");
        expect(statusCell(404)).toBe("&#x1F7E0; 404");
        expect(statusCell(503)).toBe("&#x1F534; 503");
        expect(statusCell(-1)).toBe("&#x26AA; no response");
        expect(statusCell(101)).toBe("101");
    });

    it("shortens fault contexts", () => {
        expect(shortenContext("GET:/a -> Response status 400", "GET:/a")).toBe("Response status 400");
        expect(shortenContext("other", "GET:/a")).toBe("other");
        const long = shortenContext("x".repeat(300), "GET:/a");
        expect(long).toHaveLength(200);
        expect(long.endsWith("...")).toBe(true);
    });
});
