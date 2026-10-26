import {readFileSync} from "node:fs";
import {runCli} from "@/summary/cli.ts";

process.exitCode = runCli(process.argv.slice(2), {
    readFile: (path) => readFileSync(path, "utf8"),
    stdout: (text) => { process.stdout.write(text); },
    stderr: (text) => { process.stderr.write(text); },
});
