import {SummaryModel} from "@/summary/model.ts";
import {plural} from "@/summary/format.ts";

export interface Annotation {
    level: "warning" | "notice";
    title: string;
    message: string;
}

export const DEFAULT_MAX_ANNOTATIONS = 10;

const MAX_OPERATIONS_IN_MESSAGE = 5;

export const buildAnnotations = (model: SummaryModel, max: number = DEFAULT_MAX_ANNOTATIONS): Annotation[] => {
    const faults = [...model.faultCategories]
        .sort((a, b) => b.count - a.count || a.code - b.code)
        .map((f): Annotation => {
            const operations = [...new Set(model.faultDetails.filter(d => d.code === f.code).map(d => d.operationId))];
            const shown = operations.slice(0, MAX_OPERATIONS_IN_MESSAGE).join(", ");
            const more = operations.length > MAX_OPERATIONS_IN_MESSAGE
                ? ` and ${operations.length - MAX_OPERATIONS_IN_MESSAGE} more`
                : "";
            return {
                level: "warning",
                title: `${f.label} (${plural(f.count, "potential fault")})`,
                message: `${f.name}. Affected operations: ${shown}${more}.`,
            };
        });

    const warnings = model.warnings.map((w): Annotation => ({
        level: "notice",
        title: w.category ? `Fuzzer warning: ${w.category}` : "Fuzzer warning",
        message: w.message,
    }));

    return [...faults, ...warnings].slice(0, Math.max(0, max));
};
