import {NO_RESPONSE_CODE, SummaryModel} from "@/summary/model.ts";

export const formatDuration = (seconds: number): string => {
    const s = Math.max(0, Math.floor(seconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const parts: string[] = [];
    if (h > 0) parts.push(`${h}h`);
    if (h > 0 || m > 0) parts.push(`${m}m`);
    parts.push(`${s % 60}s`);
    return parts.join(" ");
};

export const formatPercent = (part: number, total: number): string =>
    total > 0 ? `${Math.round((part * 100) / total)}%` : "-";

export const statusCodeLabel = (code: number): string =>
    code === NO_RESPONSE_CODE ? "no response" : String(code);

export const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? "" : "s"}`;

export const FAULT_ICON = "&#x1F534;";
export const OK_ICON = "&#x2705;";
export const TIMER_ICON = "&#x23F1;";
export const UP_ICON = "&#x2191;";

const BAR_WIDTH = 10;

export const textBar = (part: number, total: number): string => {
    const filled = total > 0 ? Math.min(BAR_WIDTH, Math.max(0, Math.round((part / total) * BAR_WIDTH))) : 0;
    return "&#x2588;".repeat(filled) + "&#x2591;".repeat(BAR_WIDTH - filled);
};

export const ratioCell = (part: number, total: number): string =>
    total > 0 ? `<code>${textBar(part, total)}</code> ${formatPercent(part, total)}` : "-";

const statusIcon = (code: number): string => {
    if (code === NO_RESPONSE_CODE) return "&#x26AA;";
    if (code >= 200 && code < 300) return "&#x1F7E2;";
    if (code >= 300 && code < 400) return "&#x1F535;";
    if (code >= 400 && code < 500) return "&#x1F7E0;";
    if (code >= 500) return "&#x1F534;";
    return "";
};

export const statusCell = (code: number): string => {
    const icon = statusIcon(code);
    return (icon ? icon + " " : "") + statusCodeLabel(code);
};

const MAX_CONTEXT_LENGTH = 200;

export const shortenContext = (context: string, operationId: string): string => {
    const prefix = `${operationId} -> `;
    const text = context.startsWith(prefix) ? context.slice(prefix.length) : context;
    return text.length > MAX_CONTEXT_LENGTH ? text.slice(0, MAX_CONTEXT_LENGTH - 3) + "..." : text;
};

export const renderHeadline = (model: SummaryModel): string =>
    model.totals.faults > 0
        ? `&#x274C; Found ${plural(model.totals.faults, "potential fault")}`
        : "&#x2705; No potential faults found";
