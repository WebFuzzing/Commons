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

## Available Scripts

- `dev` - Start development server
- `build` - Build for production
- `preview` - Preview production build
- `lint` - Run ESLint
- `installAndBuild` - Install dependencies, run tests and build
- `debug` - Build the project and run in debug mode using static test files from `tests/static` directory
