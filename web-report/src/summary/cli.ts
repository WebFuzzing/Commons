import {dirname, isAbsolute, join} from "node:path";
import {parseArgs} from "node:util";
import {WebFuzzingCommonsReport} from "@/types/GeneratedTypes.tsx";
import {webFuzzingCommonsReportSchema} from "@/types/GeneratedTypesZod.ts";
import {buildSummaryModel, toStats} from "@/summary/model.ts";
import {renderJobSummary} from "@/summary/jobSummary.ts";
import {renderPrComment} from "@/summary/prComment.ts";
import {buildAnnotations} from "@/summary/annotations.ts";

export interface CliIo {
    readFile(path: string): string;
    stdout(text: string): void;
    stderr(text: string): void;
}

export const EXIT_OK = 0;
export const EXIT_USAGE = 1;
export const EXIT_INVALID_REPORT = 2;

export const OUTPUT_FORMATS = ["summary", "pr", "annotations", "stats"] as const;
export type OutputFormat = typeof OUTPUT_FORMATS[number];

export const USAGE = [
    "Usage: node wfc-summary.cjs --report <report.json> [options]",
    "",
    "Options:",
    "  --format <summary|pr|annotations|stats>  Output type (default: summary)",
    "  --artifact-url <url>                     Link to the uploaded interactive report",
    "  --run-url <url>                          Link to the CI run",
    "  --max-bytes <n>                          Size limit for summary and pr output",
    "  --max-annotations <n>                    Maximum number of annotations (default: 10)",
    "  --include-tests                          Embed the code of the generated tests in the summary",
    "  --help                                   Show this message",
].join("\n") + "\n";

interface CliOptions {
    report?: string;
    format: string;
    artifactUrl?: string;
    runUrl?: string;
    maxBytes?: number;
    maxAnnotations?: number;
    includeTests: boolean;
    help: boolean;
}

const errorMessage = (e: unknown): string => (e instanceof Error ? e.message : String(e));

const parseNonNegativeInt = (name: string, value: string | undefined): number | undefined => {
    if (value === undefined) return undefined;
    if (!/^\d+$/.test(value)) {
        throw new Error(`Option --${name} must be a non-negative integer, got '${value}'`);
    }
    return Number(value);
};

const parseOptions = (argv: string[]): CliOptions => {
    const {values} = parseArgs({
        args: argv,
        strict: true,
        allowPositionals: false,
        options: {
            "report": {type: "string"},
            "format": {type: "string"},
            "artifact-url": {type: "string"},
            "run-url": {type: "string"},
            "max-bytes": {type: "string"},
            "max-annotations": {type: "string"},
            "include-tests": {type: "boolean"},
            "help": {type: "boolean"},
        },
    });
    return {
        report: values["report"],
        format: values["format"] ?? "summary",
        artifactUrl: values["artifact-url"],
        runUrl: values["run-url"],
        maxBytes: parseNonNegativeInt("max-bytes", values["max-bytes"]),
        maxAnnotations: parseNonNegativeInt("max-annotations", values["max-annotations"]),
        includeTests: values["include-tests"] ?? false,
        help: values["help"] ?? false,
    };
};

// Test file paths in the report are relative to the report itself
const readTestSources = (reportPath: string, testFilePaths: string[], io: CliIo): Map<string, string> => {
    const sources = new Map<string, string>();
    for (const path of testFilePaths) {
        const resolved = isAbsolute(path) ? path : join(dirname(reportPath), path);
        try {
            sources.set(path, io.readFile(resolved));
        } catch (e) {
            io.stderr(`Cannot read test file '${resolved}': ${errorMessage(e)}\n`);
        }
    }
    return sources;
};

export const runCli = (argv: string[], io: CliIo): number => {
    let options: CliOptions;
    try {
        options = parseOptions(argv);
    } catch (e) {
        io.stderr(`${errorMessage(e)}\n\n${USAGE}`);
        return EXIT_USAGE;
    }

    if (options.help) {
        io.stdout(USAGE);
        return EXIT_OK;
    }
    if (!options.report) {
        io.stderr(`Missing required option --report\n\n${USAGE}`);
        return EXIT_USAGE;
    }
    if (!(OUTPUT_FORMATS as readonly string[]).includes(options.format)) {
        io.stderr(`Unknown format '${options.format}'. Expected one of: ${OUTPUT_FORMATS.join(", ")}\n`);
        return EXIT_USAGE;
    }

    let raw: unknown;
    try {
        raw = JSON.parse(io.readFile(options.report));
    } catch (e) {
        io.stderr(`Cannot read report '${options.report}': ${errorMessage(e)}\n`);
        return EXIT_USAGE;
    }

    const validation = webFuzzingCommonsReportSchema.safeParse(raw);
    if (!validation.success) {
        const issues = validation.error.issues
            .slice(0, 20)
            .map(i => `- ${i.path.join(".") || "(root)"}: ${i.message}`)
            .join("\n");
        io.stderr(`Invalid WFC report:\n${issues}\n`);
        return EXIT_INVALID_REPORT;
    }

    const report = raw as WebFuzzingCommonsReport;
    const model = buildSummaryModel(report);
    const links = {artifactUrl: options.artifactUrl, runUrl: options.runUrl};

    switch (options.format as OutputFormat) {
        case "summary":
            io.stdout(renderJobSummary(model, {
                ...links,
                maxBytes: options.maxBytes,
                testSources: options.includeTests ? readTestSources(options.report, report.testFilePaths, io) : undefined,
            }));
            break;
        case "pr":
            io.stdout(renderPrComment(model, {...links, maxBytes: options.maxBytes}));
            break;
        case "annotations":
            io.stdout(JSON.stringify(buildAnnotations(model, options.maxAnnotations), null, 2) + "\n");
            break;
        case "stats":
            io.stdout(JSON.stringify(toStats(model), null, 2) + "\n");
            break;
    }
    return EXIT_OK;
};
