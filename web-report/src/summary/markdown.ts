const encoder = new TextEncoder();

export const byteLength = (text: string): number => encoder.encode(text).length;

export const DOT = " &middot; ";

export const OMITTED_ROWS_TEXT = "more rows omitted. See the interactive report for the full list.";

export const escapeHtml = (text: string): string =>
    text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

export const escapeInline = (text: string): string =>
    escapeHtml(text)
        .replace(/[\\`*_[\]|~]/g, ch => "\\" + ch)
        .replace(/\r?\n/g, "<br>");

export const code = (text: string): string =>
    `<code>${escapeInline(text.replace(/\r?\n/g, " "))}</code>`;

const URL_UNSAFE: Record<string, string> = {"(": "%28", ")": "%29", " ": "%20", "<": "%3C", ">": "%3E"};

export const link = (text: string, url: string): string =>
    `[${text}](${url.replace(/[() <>]/g, ch => URL_UNSAFE[ch])})`;

export const anchor = (name: string): string => `<a name="${name}"></a>`;

// GitHub prefixes user-defined anchor names with "user-content-"; only <a name> anchors are reachable in job summaries
export const anchorLink = (name: string): string => `#user-content-${name}`;

export const table =(headers: string[], rows: string[][]): string => {
    const line = (cells: string[]) => "| " + cells.join(" | ") + " |";
    return [line(headers), line(headers.map(() => "---")), ...rows.map(line)].join("\n") + "\n";
};

export const details = (summary: string, body: string): string =>
    `<details>\n<summary>${summary}</summary>\n\n${body}\n</details>\n`;

export const heading = (level: number, text: string): string => `${"#".repeat(level)} ${text}\n`;

export const section = (title: string, body: string): string => heading(3, title) + "\n" + body;

export const withAnchor = (name: string, text: string): string => `${anchor(name)}\n\n${text}`;

export const omittedNote = (omitted: number): string =>
    omitted > 0 ? `\n_${omitted} ${OMITTED_ROWS_TEXT}_\n` : "";

export const renderWithinBudget = <T>(
    items: T[],
    render: (shown: T[], omitted: number) => string,
    maxBytes: number,
): string => {
    const full = render(items, 0);
    if (byteLength(full) <= maxBytes) return full;

    let lo = 0;
    let hi = items.length - 1;
    while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        if (byteLength(render(items.slice(0, mid), items.length - mid)) <= maxBytes) {
            lo = mid;
        } else {
            hi = mid - 1;
        }
    }
    const text = render(items.slice(0, lo), items.length - lo);
    return byteLength(text) <= maxBytes ? text : "";
};
