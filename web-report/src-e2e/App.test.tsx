import {render, waitFor, screen, act, fireEvent} from '@testing-library/react';
import '@testing-library/jest-dom';
import {resolve} from "path";
import {readFileSync} from "fs";
import {vi} from "vitest";
import App from "../src/App";
import {fetchFileContent, getFaultCounts} from "@/lib/utils";

// Read the report.json file
const reportJsonPath = resolve(__dirname, './static/report.json');
const reportData = JSON.parse(readFileSync(reportJsonPath, 'utf-8'));

// Mock the fetchFileContent function to return the content of the report.json file
vi.mock('@/lib/utils.tsx', async (importOriginal) => {
    const originalModule = await importOriginal();
    return{
        ...originalModule as typeof importOriginal,
        fetchFileContent: vi.fn(async (filePath: string) => {
            const folderPath = resolve(__dirname, './static/');
            const fullPath = resolve(folderPath, filePath);
            if (fullPath.endsWith('.json')) {
                return reportData;
            } else if (filePath.endsWith('.java')) {
                return readFileSync(fullPath, 'utf-8');
            }
            throw new Error('File not found');
        })
    }
});

describe('App test', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        vi.clearAllMocks();
    });

    it('shows loading state initially', () => {
        render(<App />);
        expect(screen.getByText(/Please wait, files are loading.../)).toBeInTheDocument();
    });

    it('handles successful data loading', async () => {
        render(<App />);
        
        // Initially shows loading state
        expect(screen.getByText(/Please wait, files are loading.../)).toBeInTheDocument();
        
        // Wait for loading to complete and verify header data
        await waitFor(() => {
            expect(screen.queryByText(/Please wait, files are loading.../)).toBeNull();
        });

    });

    it('handles error state', async () => {
        // Mock fetchFileContent to throw an error
        vi.mocked(fetchFileContent).mockRejectedValueOnce(new Error('Failed to load'));

        render(<App />);

        // Wait for error state
        await waitFor(() => {
            expect(screen.getByText(/Could not load the report file/)).toBeInTheDocument();
        });
    });

    it('check header data', async () => {
        render(<App />);
        expect(screen.getByText(/Please wait, files are loading.../)).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByTestId('header-creation-date')).toContainHTML(new Date(reportData.creation_time).toUTCString());
            expect(screen.getByTestId('header-tool-name-version')).toContainHTML(`${reportData.tool_name}`);
            expect(screen.getByTestId('header-tool-name-version')).toContainHTML(`${reportData.tool_version}`);
            expect(screen.getByTestId('header-schema-version')).toContainHTML(reportData.schema_version);
        });
    });

    it('check rest report', async () => {
        render(<App />);
        expect(screen.getByText(/Please wait, files are loading.../)).toBeInTheDocument();
        const total = reportData.problem_details.rest.endpoint_ids.length;
        const total_http_calls = reportData.problem_details.rest.total_http_calls;

        await waitFor(() => {
            expect(screen.getByTestId('rest-report-endpoint')).toContainHTML(`${total}`);
            expect(screen.getByTestId('rest-report-http-calls')).toContainHTML(`${total_http_calls}`);
        });

    });

    it('check generated tests', async () => {
        render(<App />);
        expect(screen.getByText(/Please wait, files are loading.../)).toBeInTheDocument();
        const total_tests = reportData.total_tests;
        const total_test_files = reportData.test_file_paths.length;
        await waitFor(() => {
            expect(screen.getByTestId('generated-tests-total-tests')).toContainHTML(`${total_tests}`);
            expect(screen.getByTestId('generated-tests-total-test-files')).toContainHTML(`${total_test_files}`);
        });
    });

    it('check endpoints tab', async () => {
        render(<App />);
        expect(screen.getByText(/Please wait, files are loading.../)).toBeInTheDocument();

        await waitFor(() => {
            const overviewTab = screen.getByTestId('tab-overview');

            // check if the endpoints tab is active
            expect(overviewTab).toHaveClass('data-[state=active]:bg-white');

        });
        const endpointsTab = screen.getByTestId('tab-endpoints');

        act(() => {
            // click on the endpoints tab
            fireEvent.focus(endpointsTab);

        });

        await waitFor(() => {
            // check if the endpoints tab is active
            expect(endpointsTab).toHaveClass('data-[state=active]:bg-white');
        });

        await waitFor(() => {
            // check if the endpoints are displayed
            reportData.problem_details.rest.endpoint_ids.forEach((endpoint: string) => {
                // const testId = convertEndpointToTestId(endpoint);
                expect(screen.getByTestId(endpoint)).toBeInTheDocument();
            });
        });
    });

    it('check faults component', async () => {
        render(<App />);
        expect(screen.getByText(/Please wait, files are loading.../)).toBeInTheDocument();
        const total_faults = reportData.faults.total_number;
        const faultCounts = getFaultCounts(reportData.faults.found_faults);

        await waitFor(() => {
            expect(screen.getByTestId('faults-component-total-faults')).toContainHTML(`${total_faults}`);
            expect(screen.getByTestId('faults-component-fault-counts')).toContainHTML(faultCounts.length.toString());
        });
    });
});