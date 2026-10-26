import {describe, it, expect} from "vitest";
import {readFileSync} from "fs";
import {dirname, resolve} from "path";
import {CliIo, EXIT_INVALID_REPORT, EXIT_OK, EXIT_USAGE, runCli, USAGE} from "../../src/summary/cli";
import {PR_COMMENT_MARKER} from "../../src/summary/prComment";
import {buildLargeReport, SMALL_REPORT_PATH} from "./helpers";

const makeIo = (files: Record<string, string>) => {
    const out: string[] = [];
    const err: string[] = [];
    const io: CliIo = {
        readFile: (path) => {
            if (!(path in files)) throw new Error(`ENOENT: no such file '${path}'`);
            return files[path];
        },
        stdout: (text) => { out.push(text); },
        stderr: (text) => { err.push(text); },
    };
    return {io, out: () => out.join(""), err: () => err.join("")};
};

const files: Record<string, string> = {
    "report.json": readFileSync(SMALL_REPORT_PATH, "utf-8"),
    "tests.java": readFileSync(resolve(dirname(SMALL_REPORT_PATH), "tests.java"), "utf-8"),
    "large.json": JSON.stringify(buildLargeReport(2000)),
    "empty.json": "{}",
    "broken.json": "{",
};

describe("runCli", () => {
    it("prints stats", () => {
        const {io, out} = makeIo(files);
        expect(runCli(["--report", "report.json", "--format", "stats"], io)).toBe(EXIT_OK);
        expect(JSON.parse(out())).toEqual({faults: 3, distinctFaultTypes: 2, faultCategories: [
            {id: "HTTP_STATUS_500", code: 100, count: 2},
            {id: "HTTP_STATUS_NO_NON_STANDARD_CODES", code: 101, count: 1},
        ], testCases: 4, endpoints: 3, warnings: 2});
    });

    it("prints the job summary by default, with links", () => {
        const {io, out} = makeIo(files);
        expect(runCli(["--report", "report.json", "--artifact-url", "https://example.org/a/1"], io)).toBe(EXIT_OK);
        expect(out()).toContain("Found 3 potential faults");
        expect(out()).toContain("(https://example.org/a/1)");
    });

    it("embeds the generated tests only with --include-tests", () => {
        const withTests = makeIo(files);
        expect(runCli(["--report", "report.json", "--include-tests"], withTests.io)).toBe(EXIT_OK);
        expect(withTests.out()).toContain("### Generated tests (4)");

        const withoutTests = makeIo(files);
        runCli(["--report", "report.json"], withoutTests.io);
        expect(withoutTests.out()).not.toContain("Generated tests");
    });

    it("still renders the summary when a test file cannot be read", () => {
        const {io, out, err} = makeIo({"report.json": files["report.json"]});
        expect(runCli(["--report", "report.json", "--include-tests"], io)).toBe(EXIT_OK);
        expect(out()).toContain("Found 3 potential faults");
        expect(out()).not.toContain("Generated tests");
        expect(err()).toContain("Cannot read test file");
    });

    it("prints the PR comment", () => {
        const {io, out} = makeIo(files);
        expect(runCli(["--report", "report.json", "--format", "pr"], io)).toBe(EXIT_OK);
        expect(out().startsWith(PR_COMMENT_MARKER)).toBe(true);
    });

    it("prints annotations as JSON and honours the maximum", () => {
        const {io, out} = makeIo(files);
        expect(runCli(["--report", "report.json", "--format", "annotations", "--max-annotations", "3"], io)).toBe(EXIT_OK);
        const annotations = JSON.parse(out());
        expect(annotations).toHaveLength(3);
        expect(annotations[0].level).toBe("warning");
    });

    it("honours --max-bytes", () => {
        const unlimited = makeIo(files);
        runCli(["--report", "large.json"], unlimited.io);
        expect(Buffer.byteLength(unlimited.out(), "utf8")).toBeGreaterThan(20_000);

        const limited = makeIo(files);
        expect(runCli(["--report", "large.json", "--max-bytes", "20000"], limited.io)).toBe(EXIT_OK);
        expect(Buffer.byteLength(limited.out(), "utf8")).toBeLessThanOrEqual(20_000);
    });

    it("prints usage on --help", () => {
        const {io, out} = makeIo(files);
        expect(runCli(["--help"], io)).toBe(EXIT_OK);
        expect(out()).toBe(USAGE);
    });

    it("fails with usage errors", () => {
        const cases: string[][] = [
            [],
            ["--report", "report.json", "--format", "sarif"],
            ["--report", "report.json", "--unknown"],
            ["--report", "report.json", "--max-bytes", "abc"],
            ["--report", "missing.json"],
            ["--report", "broken.json"],
        ];
        for (const argv of cases) {
            const {io, err} = makeIo(files);
            expect(runCli(argv, io), argv.join(" ")).toBe(EXIT_USAGE);
            expect(err().length, argv.join(" ")).toBeGreaterThan(0);
        }
    });

    it("mentions the file when it cannot be read", () => {
        const {io, err} = makeIo(files);
        runCli(["--report", "missing.json"], io);
        expect(err()).toContain("Cannot read report 'missing.json'");
    });

    it("rejects reports that do not match the WFC schema", () => {
        const {io, err} = makeIo(files);
        expect(runCli(["--report", "empty.json"], io)).toBe(EXIT_INVALID_REPORT);
        expect(err()).toContain("Invalid WFC report");
        expect(err()).toContain("schemaVersion");
    });
});
