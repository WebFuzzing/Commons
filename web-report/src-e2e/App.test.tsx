import {render, waitFor, screen, act, fireEvent, within} from '@testing-library/react';
import '@testing-library/jest-dom';
import {resolve} from "path";
import {readFileSync} from "fs";
import {vi} from "vitest";
import App from "../src/App";
import {fetchFileContent, getFaultCounts} from "../src/lib/utils";

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
            if (fullPath.endsWith('report.json')) {
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
            expect(screen.getByTestId('header-creation-date')).toContainHTML(new Date(reportData.creationTime).toUTCString());
            expect(screen.getByTestId('header-tool-name-version')).toContainHTML(`${reportData.toolName}`);
            expect(screen.getByTestId('header-tool-name-version')).toContainHTML(`${reportData.toolVersion}`);
            expect(screen.getByTestId('header-schema-version')).toContainHTML(reportData.schemaVersion);
        });
    });

    it('check rest report', async () => {
        render(<App />);
        expect(screen.getByText(/Please wait, files are loading.../)).toBeInTheDocument();
        const total = reportData.problemDetails.rest.endpointIds.length;
        const outputHttpCalls = reportData.problemDetails.rest.outputHttpCalls;
        const evaluatedHttpCalls = reportData.problemDetails.rest.evaluatedHttpCalls;

        await waitFor(() => {
            expect(screen.getByTestId('rest-report-endpoint')).toContainHTML(`${total}`);
            expect(screen.getByTestId('rest-report-output-http-calls')).toContainHTML(`${outputHttpCalls}`);
            expect(screen.getByTestId('rest-report-evaluated-http-calls')).toContainHTML(`${evaluatedHttpCalls}`);
        });

    });

    it('check generated tests', async () => {
        render(<App />);
        expect(screen.getByText(/Please wait, files are loading.../)).toBeInTheDocument();
        const totalTests = reportData.totalTests;
        const totalTestFiles = reportData.testFilePaths.length;
        await waitFor(() => {
            expect(screen.getByTestId('generated-tests-total-tests')).toContainHTML(`${totalTests}`);
            expect(screen.getByTestId('generated-tests-total-test-files')).toContainHTML(`${totalTestFiles}`);
        });
    });

    it('check endpoints tab', async () => {
        render(<App />);
        expect(screen.getByText(/Please wait, files are loading.../)).toBeInTheDocument();

        await waitFor(() => {
            const overviewTab = screen.getByTestId('tab-overview');

            // check if the endpoints tab is active
            expect(overviewTab).toHaveClass('data-[state=active]:bg-blue-100');

        });
        const endpointsTab = screen.getByTestId('tab-endpoints');

        act(() => {
            // click on the endpoints tab
            fireEvent.focus(endpointsTab);

        });

        await waitFor(() => {
            // check if the endpoints tab is active
            expect(endpointsTab).toHaveClass('data-[state=active]:bg-blue-100');
        });

        await waitFor(() => {
            // check if the endpoints are displayed
            reportData.problemDetails.rest.endpointIds.forEach((endpoint: string) => {
                // const testId = convertEndpointToTestId(endpoint);
                expect(screen.getByTestId(endpoint)).toBeInTheDocument();
            });
        });
    });

    it('changing a review state marks it dirty and updates counts', async () => {
        render(<App/>);
        await waitFor(() => {
            expect(screen.getByTestId('tab-tests')).toBeInTheDocument();
        });

        act(() => {
            fireEvent.focus(screen.getByTestId('tab-tests'));
        });

        await waitFor(() => {
            expect(screen.getByTestId('test-file-0')).toBeInTheDocument();
        });

        act(() => {
            fireEvent.click(within(screen.getByTestId('test-file-0')).getByRole('button'));
        });

        const firstTestId = reportData.testCases[0].id as string;
        await waitFor(() => {
            expect(screen.getByTestId(`test-review-state-${firstTestId}`)).toBeInTheDocument();
        });

        act(() => {
            fireEvent.change(screen.getByTestId(`test-review-state-${firstTestId}`), {
                target: {value: 'ACCEPTED'},
            });
        });

        await waitFor(() => {
            expect(screen.getByTestId('reviews-unsaved-banner')).toBeInTheDocument();
            expect(screen.getByTestId('reviews-filter-ACCEPTED')).toHaveTextContent('ACCEPTED (1)');
            expect(screen.getByTestId('reviews-filter-NOT-REVIEWED'))
                .toHaveTextContent(`NOT-REVIEWED (${reportData.testCases.length - 1})`);
        });
    });

    it('clicking a test opens the detail dialog and close dismisses it', async () => {
        render(<App/>);
        await waitFor(() => {
            expect(screen.getByTestId('tab-tests')).toBeInTheDocument();
        });

        act(() => {
            fireEvent.focus(screen.getByTestId('tab-tests'));
        });

        await waitFor(() => {
            expect(screen.getByTestId('test-file-0')).toBeInTheDocument();
        });

        act(() => {
            fireEvent.click(within(screen.getByTestId('test-file-0')).getByRole('button'));
        });

        const firstTestId = reportData.testCases[0].id as string;
        await waitFor(() => {
            expect(screen.getByTestId(`test-review-open-${firstTestId}`)).toBeInTheDocument();
        });

        act(() => {
            fireEvent.click(screen.getByTestId(`test-review-open-${firstTestId}`));
        });

        await waitFor(() => {
            expect(screen.getByTestId('test-detail-dialog')).toBeInTheDocument();
        });

        act(() => {
            fireEvent.click(screen.getByTestId('test-detail-dialog-close'));
        });

        await waitFor(() => {
            expect(screen.queryByTestId('test-detail-dialog')).toBeNull();
        });
    });

    it('check faults component', async () => {
        render(<App />);
        expect(screen.getByText(/Please wait, files are loading.../)).toBeInTheDocument();
        const totalFaults = reportData.faults.totalNumber;
        const faultCounts = getFaultCounts(reportData.faults.foundFaults);

        await waitFor(() => {
            expect(screen.getByTestId('faults-component-total-faults')).toContainHTML(`${totalFaults}`);
            expect(screen.getByTestId('faults-component-fault-counts')).toContainHTML(faultCounts.length.toString());
        });
    });
});
