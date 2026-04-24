import {createContext, useContext, useState, ReactNode, useEffect, useRef, useCallback, useMemo} from 'react';
import {WebFuzzingCommonsReport} from "@/types/GeneratedTypes.tsx";
import {fetchFileContent, ITransformedReport, transformWebFuzzingReport} from "@/lib/utils.tsx";
import {webFuzzingCommonsReportSchema} from "@/types/GeneratedTypesZod.ts";
import {ZodIssue} from "zod";
import {
    DEFAULT_REVIEW,
    parseReviewFile,
    REVIEW_FILE_NAME,
    REVIEW_SCHEMA_VERSION,
    REVIEW_STATE,
    ReviewFile,
    ReviewState,
    reviewsEqual,
    TestReview,
} from "@/types/Review.ts";

type FileSystemApiHandle = {
    createWritable: () => Promise<{write: (data: string) => Promise<void>; close: () => Promise<void>}>;
    queryPermission?: (opts: {mode: 'read' | 'readwrite'}) => Promise<'granted' | 'denied' | 'prompt'>;
    requestPermission?: (opts: {mode: 'read' | 'readwrite'}) => Promise<'granted' | 'denied' | 'prompt'>;
};

type WindowWithFileSystemApi = Window & {
    showSaveFilePicker?: (opts: {
        suggestedName?: string;
        types?: Array<{description: string; accept: Record<string, string[]>}>;
    }) => Promise<FileSystemApiHandle>;
};

type AppContextType = {
    data: WebFuzzingCommonsReport | null;
    loading: boolean;
    error: string | null;
    testFiles: Record<string, string>;
    loadTestFile: (path: string) => Promise<void>;
    transformedReport: ITransformedReport[];
    filterEndpoints: (activeFilters: Record<number, string>) => ITransformedReport[];
    filteredEndpoints: ITransformedReport[];
    invalidReportErrors: ZodIssue[] | null;
    lowCodeMode: boolean;
    setLowCodeMode: (v: boolean) => void;
    reviews: Record<string, TestReview>;
    getReview: (testId: string) => TestReview;
    setReviewState: (testId: string, state: ReviewState) => void;
    setReviewComment: (testId: string, comment: string) => void;
    isDirty: boolean;
    saveReviews: () => void;
    loadReviews: (file: File) => Promise<void>;
    reviewMessage: {type: "info" | "error"; text: string} | null;
    clearReviewMessage: () => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

type AppProviderProps = {
    children: ReactNode;
};

export const AppProvider = ({ children }: AppProviderProps) => {

    const initialLowCode = (window as unknown as { __WFC_LOW_CODE__?: boolean }).__WFC_LOW_CODE__ === true;

    const [data, setData] = useState<WebFuzzingCommonsReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [invalidReportErrors, setInvalidReportErrors] = useState<ZodIssue[] | null>(null);
    const [testFiles, setTestFiles] = useState<Record<string, string>>({});
    const inFlightFilesRef = useRef<Map<string, Promise<void>>>(new Map());
    const [lowCodeMode, setLowCodeMode] = useState<boolean>(initialLowCode);
    const transformedReport = useMemo(() => transformWebFuzzingReport(data), [data]);

    const [reviews, setReviews] = useState<Record<string, TestReview>>({});
    const reviewsRef = useRef<Record<string, TestReview>>({});
    const baselineRef = useRef<Record<string, TestReview>>({});
    const [isDirty, setIsDirty] = useState(false);
    const [reviewMessage, setReviewMessage] = useState<{type: "info" | "error"; text: string} | null>(null);

    const applyReviews = useCallback((next: Record<string, TestReview>) => {
        reviewsRef.current = next;
        setReviews(next);
        setIsDirty(!reviewsEqual(next, baselineRef.current));
    }, []);

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

                const result = jsonData?.problemDetails?.rest?.coveredHttpStatus?.map(status => {
                    const httpStatus = status?.httpStatus ?? [null];
                    const httpStatusArray = Array.isArray(httpStatus) ? httpStatus : [httpStatus];
                    const updatedHttpStatus = httpStatusArray.map(code => code === null ? -1 : code);
                    return {
                        ...status,
                        httpStatus: updatedHttpStatus
                    };
                }) ?? [];

                const updatedJsonData = {
                    ...jsonData,
                    problemDetails: {
                        ...jsonData.problemDetails,
                        rest: {
                            ...jsonData.problemDetails.rest,
                            coveredHttpStatus: result
                        }
                    }
                } as WebFuzzingCommonsReport;

                setData(updatedJsonData);
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

    const loadTestFile = useCallback(async (path: string): Promise<void> => {
        if (!path) return;
        if (testFiles[path] !== undefined) return;
        const existing = inFlightFilesRef.current.get(path);
        if (existing) return existing;

        const promise = (async () => {
            try {
                const content = await fetchFileContent(path);
                if (typeof content === "string") {
                    setTestFiles(prev => (prev[path] !== undefined ? prev : {...prev, [path]: content}));
                } else {
                    setError("Could not load the test file. Please check if the file exists and is accessible.");
                }
            } catch (e) {
                console.error(e);
                setError("Could not load the test file. Please check if the file exists and is accessible.");
            } finally {
                inFlightFilesRef.current.delete(path);
            }
        })();

        inFlightFilesRef.current.set(path, promise);
        return promise;
    }, [testFiles]);

    useEffect(() => {
        if (!data) return;
        if (window.location.protocol === 'file:') {
            setReviewMessage({
                type: "info",
                text: `Auto-loading ${REVIEW_FILE_NAME} is not possible when opening this page directly from disk. Either launch the report via webreport.py, or click "Load reviews" to import the file manually.`,
            });
            return;
        }
        let cancelled = false;
        fetchFileContent('./' + REVIEW_FILE_NAME)
            .then(parsed => {
                if (cancelled || !parsed) return;
                try {
                    const loaded = parseReviewFile(parsed);
                    reviewsRef.current = loaded;
                    baselineRef.current = loaded;
                    setReviews(loaded);
                    setIsDirty(false);
                    setReviewMessage({
                        type: "info",
                        text: `Auto-loaded ${Object.keys(loaded).length} review(s) from ${REVIEW_FILE_NAME}.`,
                    });
                } catch (e) {
                    console.warn("Auto-load of reviews failed:", e);
                }
            })
            .catch(() => { /* silent — expected when no review file is present or under file:// */ });
        return () => { cancelled = true; };
    }, [data]);

    useEffect(() => {
        if (!isDirty) return;
        const handler = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = "";
        };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [isDirty]);

    const getReview = useCallback(
        (testId: string): TestReview => reviewsRef.current[testId] ?? DEFAULT_REVIEW,
        [],
    );

    const setReviewState = useCallback((testId: string, state: ReviewState) => {
        const prev = reviewsRef.current;
        const existing = prev[testId] ?? DEFAULT_REVIEW;
        if (existing.state === state) return;
        applyReviews({...prev, [testId]: {...existing, state}});
    }, [applyReviews]);

    const setReviewComment = useCallback((testId: string, comment: string) => {
        const prev = reviewsRef.current;
        const existing = prev[testId] ?? DEFAULT_REVIEW;
        if (existing.comment === comment) return;
        applyReviews({...prev, [testId]: {...existing, comment}});
    }, [applyReviews]);

    const fileHandleRef = useRef<FileSystemApiHandle | null>(null);

    const saveReviews = useCallback(async () => {
        // Flush any pending textarea edits (local-state rows commit on blur)
        const active = document.activeElement;
        if (active instanceof HTMLElement && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT')) {
            active.blur();
        }

        const source = reviewsRef.current;
        const file: ReviewFile = {
            schemaVersion: REVIEW_SCHEMA_VERSION,
            reviews: {},
        };
        for (const [id, r] of Object.entries(source)) {
            const comment = (r.comment ?? "").trim();
            if (r.state !== REVIEW_STATE.NOT_REVIEWED || comment !== "") {
                file.reviews[id] = {state: r.state, comment: r.comment ?? ""};
            }
        }
        const json = JSON.stringify(file, null, 2);
        const reviewCount = Object.keys(file.reviews).length;

        const commitBaseline = () => {
            baselineRef.current = {...source};
            setIsDirty(false);
        };

        // Preferred path: File System Access API (Chrome/Edge, secure context).
        // Lets subsequent saves overwrite the same file without the OS appending (1), (2)...
        const showSaveFilePicker = (window as WindowWithFileSystemApi).showSaveFilePicker;
        if (typeof showSaveFilePicker === 'function') {
            try {
                let handle = fileHandleRef.current;
                if (handle) {
                    const perm = (await handle.queryPermission?.({mode: 'readwrite'})) ?? 'granted';
                    if (perm !== 'granted') {
                        const req = (await handle.requestPermission?.({mode: 'readwrite'})) ?? 'denied';
                        if (req !== 'granted') handle = null;
                    }
                }
                if (!handle) {
                    handle = await showSaveFilePicker({
                        suggestedName: REVIEW_FILE_NAME,
                        types: [{description: 'JSON', accept: {'application/json': ['.json']}}],
                    });
                    fileHandleRef.current = handle;
                }
                const writable = await handle.createWritable();
                await writable.write(json);
                await writable.close();
                commitBaseline();
                setReviewMessage({
                    type: "info",
                    text: `Saved ${reviewCount} review(s). Subsequent saves will overwrite this file silently.`,
                });
                return;
            } catch (e) {
                // User cancelled the picker — bail without downloading.
                if (e instanceof DOMException && e.name === 'AbortError') return;
                console.warn('File System Access API failed, falling back to download:', e);
                fileHandleRef.current = null;
            }
        }

        // Fallback: anchor download. On Windows this may auto-rename to report-review(1).json
        // when "Ask where to save each file" is disabled — unavoidable without the API above.
        const blob = new Blob([json], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = REVIEW_FILE_NAME;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        commitBaseline();
        setReviewMessage({
            type: "info",
            text: `Saved ${reviewCount} review(s). Place the downloaded ${REVIEW_FILE_NAME} next to report.json.`,
        });
    }, []);

    const loadReviews = useCallback(async (file: File) => {
        try {
            const text = await file.text();
            const parsed = JSON.parse(text);
            const loaded = parseReviewFile(parsed);
            reviewsRef.current = loaded;
            baselineRef.current = loaded;
            setReviews(loaded);
            setIsDirty(false);
            setReviewMessage({
                type: "info",
                text: `Loaded ${Object.keys(loaded).length} review(s) from ${file.name}.`,
            });
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            setReviewMessage({type: "error", text: `Failed to load reviews: ${msg}`});
        }
    }, []);

    const clearReviewMessage = useCallback(() => setReviewMessage(null), []);

    const [filteredEndpoints, setFilteredEndpoints] = useState(transformedReport);

    useEffect(() => {
        if (data) {
            setFilteredEndpoints(transformedReport);
        }
    }, [data, transformedReport]);

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

    const value: AppContextType = {
        data,
        loading,
        error,
        testFiles,
        transformedReport,
        filterEndpoints,
        filteredEndpoints,
        invalidReportErrors,
        lowCodeMode,
        setLowCodeMode,
        reviews,
        getReview,
        setReviewState,
        setReviewComment,
        isDirty,
        saveReviews,
        loadReviews,
        reviewMessage,
        clearReviewMessage,
        loadTestFile,
    };

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
