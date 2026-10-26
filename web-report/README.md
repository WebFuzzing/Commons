# Web Report

Web Fuzzing Commons (WFC): A set of standards and library support for facilitating fuzzing Web APIs.


## Prerequisites

- Node.js (version 18.x or higher)
- npm (comes with Node.js) or Yarn (version 1.22.x or higher)

## Installation

Install dependencies using npm:
```bash
npm install
```

Or using Yarn:
```bash
yarn install
```

## Development

To start the development server:

```bash
npm run dev
# or
yarn dev
```

The development server will start at `http://localhost:5173` by default.

## Building for Production

To build the project for production:

```bash
npm run build
# or
yarn build
```

The build artifacts will be stored in the `../target/generated-sources/webreport` directory.

## Preview Production Build

To preview the production build locally (uses existing build without rebuilding):

```bash
npm run preview
# or
yarn preview
```

## Debug Mode

To run the application in debug mode using static test files:

```bash
npm run debug
# or
yarn debug
```

This will build the project and copy static test files from `tests/static` directory to `../target/classes/webreport` before previewing.

To preview what the CI summary CLI produces for the same static report:

```bash
npm run debug-ci
# or
yarn debug-ci
```

This builds `wfc-summary.cjs`, runs it on `src-e2e/static/report.json` and opens `../target/debug-ci/index.html`, which shows the job summary, the PR comment, the annotations, the stats and the raw Markdown roughly as GitHub renders them (mermaid charts and the Markdown styles are loaded from a CDN).

## Available Scripts

- `dev` - Start development server
- `build` - Build for production
- `preview` - Preview production build
- `lint` - Run ESLint
- `installAndBuild` - Install dependencies, run tests and build
- `debug` - Build the project and run in debug mode using static test files from `tests/static` directory
- `build:summary` - Build the CI summary CLI (`wfc-summary.cjs`)
- `summary:smoke` - Run the built CI summary CLI on a test report
- `debug-ci` - Preview the CI summary CLI outputs for the static test report in the browser

## CI Summary CLI

Besides the web app, the build produces `wfc-summary.cjs`, a self-contained Node (>= 18) script that renders a WFC `report.json` for CI systems:

```bash
node wfc-summary.cjs --report report.json --format summary      # Markdown, e.g. for $GITHUB_STEP_SUMMARY
node wfc-summary.cjs --report report.json --format pr           # short Markdown for a sticky PR comment
node wfc-summary.cjs --report report.json --format annotations  # JSON list of annotations
node wfc-summary.cjs --report report.json --format stats        # JSON with the main counters
```

Options: `--artifact-url <url>`, `--run-url <url>`, `--max-bytes <n>`, `--max-annotations <n>`, `--include-tests`, `--help`.
With `--include-tests`, the summary also embeds the code of the generated tests (read from the test files next to `report.json`), and test case ids in the fault details link to it.
Exit codes: `0` success, `1` usage or I/O error, `2` the report does not match the WFC schema.
The script is packaged in the Commons jar under `/webreport/wfc-summary.cjs`.
