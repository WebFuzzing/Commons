import {createContext, useContext, useState, ReactNode, useEffect} from 'react';
import {WebFuzzingCommonsReport} from "@/types/GeneratedTypes.tsx";
import {ITestFiles} from "@/types/General.tsx";
import {fetchFileContent, ITransformedReport, transformWebFuzzingReport} from "@/lib/utils.tsx";
import {webFuzzingCommonsReportSchema} from "@/types/GeneratedTypesZod.ts";
import {ZodIssue} from "zod";

type AppContextType = {
    data: WebFuzzingCommonsReport | null;
    loading: boolean;
    error: string | null;
    testFiles: ITestFiles[];
    transformedReport: ITransformedReport[];
    filterEndpoints: (activeFilters: Record<number, string>) => ITransformedReport[];
    filteredEndpoints: ITransformedReport[];
    invalidReportErrors: ZodIssue[] | null;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

type AppProviderProps = {
    children: ReactNode;
};

export const AppProvider = ({ children }: AppProviderProps) => {

    const [data, setData] = useState<WebFuzzingCommonsReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [invalidReportErrors, setInvalidReportErrors] = useState<ZodIssue[] | null>(null);
    const [testFiles, setTestFiles] = useState<ITestFiles[]>([]);
    const transformedReport = transformWebFuzzingReport(data);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const jsonData = await fetchFileContent('./report.json') as WebFuzzingCommonsReport;

                // Validate the JSON data against the schema
                const report = webFuzzingCommonsReportSchema.safeParse(jsonData);
                console.log(report)
                if (!report.success) {
                    setError("Invalid report format. Please ensure the report is generated correctly.");
                    setInvalidReportErrors(report.error.issues);
                    return;
                }
                setData(jsonData);
            } catch (error: Error | unknown) {
                if (error instanceof Error) {
                    setError("Could not load the report file. Please check if the file exists and is accessible in main folder.");
                } else {
                    console.error(error);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        if(data?.testFilePaths){
            data.testFilePaths.map(file => {
                fetchFileContent(file).then((content) => {
                    if (typeof content === "string") {
                        setTestFiles(prev => [...prev, {
                            name: file,
                            code: content
                        }]);
                    } else {
                        setError("Could not load the test file. Please check if the file exists and is accessible.");
                    }
                }).catch((error) => {
                    console.error(error);
                    setError("Could not load the test file. Please check if the file exists and is accessible.");
                })
            })
        }
    }, [data]);

    const [filteredEndpoints, setFilteredEndpoints] = useState(transformedReport);

    useEffect(() => {
        // Transform the report data into a format suitable for filtering
        if (data) {
            const transformed = transformWebFuzzingReport(data);
            setFilteredEndpoints(transformed);
        }
    }, [data]);

    const filterEndpoints = (activeFilters: Record<number, string>) => {
        // Filter the endpoints based on the active filters
        const filtered = transformedReport.filter(endpoint => {
            // If no filters are active, show all endpoints
            if (Object.keys(activeFilters).length === 0) {
                return true;
            }

            // Check if any status code or fault code is marked as "removed"
            const hasRemovedStatusCode = endpoint.httpStatusCodes.some(code =>
                activeFilters[code.code] === "removed"
            );
            const hasRemovedFaultCode = endpoint.faults.some(code =>
                activeFilters[-code.code] === "removed"
            );

            // Check if any status code or fault code is marked as "active"
            const hasActiveStatusCode = endpoint.httpStatusCodes.some(code =>
                activeFilters[code.code] === "active"
            );
            const hasActiveFaultCode = endpoint.faults.some(code =>
                activeFilters[-code.code] === "active"
            );

            const hasActiveFilter = activeFilters && Object.values(activeFilters).some((value) => value === "active");
            const hasRemovedFilter = activeFilters && Object.values(activeFilters).some((value) => value === "removed");

            if (!hasActiveFilter && !hasRemovedFilter) {
                // If no filters are active, show all endpoints
                return true;
            }

            if (hasActiveFilter) {
                if (hasRemovedFilter) {
                    // If there are both active and removed filters, check if the endpoint matches any of them
                    if(hasRemovedFaultCode || hasRemovedStatusCode) {
                        return false;
                    }

                    return !!(hasActiveStatusCode || hasActiveFaultCode);

                } else {
                    // If there are only active filters, check if the endpoint matches any of them
                    return !!(hasActiveStatusCode || hasActiveFaultCode);

                }
            } else if (hasRemovedFilter) {
                // If there are only removed filters, check if the endpoint matches any of them
                return !(hasRemovedStatusCode || hasRemovedFaultCode);

            } else {
                // If there are no active or removed filters, show all endpoints
                return true;
            }
        });
        setFilteredEndpoints(filtered)
        return filtered;
    }

    const value: AppContextType = { data, loading, error, testFiles, transformedReport, filterEndpoints, filteredEndpoints, invalidReportErrors };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = (): AppContextType => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within AppProvider');
    }
    return context;
};