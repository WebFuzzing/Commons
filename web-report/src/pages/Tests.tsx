import React, {useCallback, useMemo, useRef, useState} from "react";
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from "@/components/ui/accordion.tsx";
import {Button} from "@/components/ui/button.tsx";
import {useAppContext} from "@/AppProvider.tsx";
import {REVIEW_STATES, ReviewState} from "@/types/Review.ts";
import {TestReviewRow} from "@/components/TestReviewRow.tsx";
import {TestDetailDialog} from "@/components/TestDetailDialog.tsx";
import {Download, Upload, X} from "lucide-react";

type Filter = "ALL" | ReviewState;

const filterButtonClass = (active: boolean) =>
    `px-3 py-1 border-2 border-black font-mono text-xs ${
        active
            ? "bg-blue-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            : "bg-white hover:bg-gray-100"
    }`;

export const Tests: React.FC = () => {
    const {
        data,
        getReview,
        isDirty,
        saveReviews,
        loadReviews,
        reviewMessage,
        clearReviewMessage,
    } = useAppContext();

    const [filter, setFilter] = useState<Filter>("ALL");
    const [openTestId, setOpenTestId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleOpen = useCallback((id: string) => setOpenTestId(id), []);
    const handleClose = useCallback(() => setOpenTestId(null), []);

    const testCases = useMemo(() => data?.testCases ?? [], [data]);
    const testFilePaths = useMemo(() => data?.testFilePaths ?? [], [data]);

    const counts = useMemo(() => {
        const c: Record<ReviewState, number> = {
            "NOT-REVIEWED": 0,
            "ACCEPTED": 0,
            "REJECTED": 0,
            "PREVIOUSLY-ACCEPTED": 0,
            "PREVIOUSLY-REJECTED": 0,
        };
        for (const tc of testCases) {
            if (!tc.id) continue;
            c[getReview(tc.id).state]++;
        }
        return c;
    }, [testCases, getReview]);

    const grouped = useMemo(() => {
        const map = new Map<string, Array<{id: string; name: string}>>();
        for (const file of testFilePaths) map.set(file, []);
        for (const tc of testCases) {
            if (!tc.id || !tc.filePath) continue;
            if (filter !== "ALL" && getReview(tc.id).state !== filter) continue;
            const arr = map.get(tc.filePath) ?? [];
            arr.push({id: tc.id, name: tc.name ?? tc.id});
            map.set(tc.filePath, arr);
        }
        return map;
    }, [testCases, testFilePaths, filter, getReview]);

    const triggerLoad = () => fileInputRef.current?.click();
    const onFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
        const f = e.target.files?.[0];
        if (f) await loadReviews(f);
        e.target.value = "";
    };

    return (
        <div className="border-2 border-black p-6 rounded-none w-[80%] mx-auto">
            <div className="flex flex-wrap items-center gap-2 mb-4">
                <Button onClick={saveReviews} className="bg-black text-white hover:bg-gray-800" data-testid="reviews-save">
                    <Download className="w-4 h-4 mr-1"/> Save reviews
                </Button>
                <Button onClick={triggerLoad} variant="outline" className="border-2 border-black" data-testid="reviews-load">
                    <Upload className="w-4 h-4 mr-1"/> Load reviews
                </Button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json,.json"
                    className="hidden"
                    onChange={onFileChange}
                    data-testid="reviews-file-input"
                />
                {isDirty && (
                    <span className="font-mono text-xs px-2 py-1 border-2 border-black bg-yellow-200">
                        UNSAVED CHANGES
                    </span>
                )}
            </div>

            {isDirty && (
                <div className="border-2 border-yellow-500 bg-yellow-50 p-3 mb-4 text-sm" data-testid="reviews-unsaved-banner">
                    You have unsaved review changes. Click <span className="font-bold">Save reviews</span> to download
                    the updated <span className="font-mono">report-review.json</span> and place it next to the report.
                </div>
            )}

            {reviewMessage && (
                <div
                    className={`border-2 p-3 mb-4 text-sm flex items-start justify-between gap-2 ${
                        reviewMessage.type === "error"
                            ? "border-red-500 bg-red-50 text-red-800"
                            : "border-blue-500 bg-blue-50 text-blue-800"
                    }`}
                    data-testid="reviews-message"
                >
                    <span>{reviewMessage.text}</span>
                    <button onClick={clearReviewMessage} className="shrink-0" aria-label="Dismiss">
                        <X size={16}/>
                    </button>
                </div>
            )}

            <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-sm font-bold">Filter:</span>
                <button
                    className={filterButtonClass(filter === "ALL")}
                    onClick={() => setFilter("ALL")}
                    data-testid="reviews-filter-ALL"
                >
                    ALL ({testCases.length})
                </button>
                {REVIEW_STATES.filter(s => s !== "PREVIOUSLY-ACCEPTED" && s !== "PREVIOUSLY-REJECTED").map(s => (
                    <button
                        key={s}
                        className={filterButtonClass(filter === s)}
                        onClick={() => setFilter(s)}
                        data-testid={`reviews-filter-${s}`}
                    >
                        {s} ({counts[s]})
                    </button>
                ))}
            </div>

            <Accordion type="multiple" className="w-full">
                {testFilePaths.map((file, idx) => {
                    const items = grouped.get(file) ?? [];
                    return (
                        <AccordionItem
                            key={file}
                            value={`file-${idx}`}
                            className="border-2 border-black mb-4 overflow-hidden"
                            data-testid={`test-file-${idx}`}
                        >
                            <AccordionTrigger className="bg-blue-100 px-4 py-3 text-lg font-bold hover:no-underline hover:bg-blue-200">
                                <div className="flex-1 font-mono text-left break-all">{file}</div>
                                <div className="mr-4 font-mono text-sm">{items.length}</div>
                            </AccordionTrigger>
                            <AccordionContent className="p-4">
                                {items.length === 0 ? (
                                    <div className="text-gray-500 italic text-sm">
                                        No tests match the current filter.
                                    </div>
                                ) : (
                                    items.map(tc => (
                                        <TestReviewRow
                                            key={tc.id}
                                            testId={tc.id}
                                            testName={tc.name}
                                            onOpen={handleOpen}
                                        />
                                    ))
                                )}
                            </AccordionContent>
                        </AccordionItem>
                    );
                })}
            </Accordion>

            <TestDetailDialog testId={openTestId} onClose={handleClose}/>
        </div>
    );
};
