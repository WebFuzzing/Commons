import React, {useMemo, useState} from "react";
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from "@/components/ui/accordion.tsx";
import {useAppContext} from "@/AppProvider.tsx";
import {ChevronRight, Code} from "lucide-react";

interface IProps {
    addTestTab: (testName: string, event: React.MouseEvent<HTMLElement>) => void;
    openExamples: string[];
    setOpenExamples: (value: string[]) => void;
}

interface ExampleEntry {
    name: string;
    cases: Array<{id: string; name: string}>;
}

export const Examples: React.FC<IProps> = ({addTestTab, openExamples, setOpenExamples}) => {
    const {data} = useAppContext();
    const testCases = useMemo(() => data?.testCases ?? [], [data]);

    const [filter, setFilter] = useState("");

    const namedExamples = useMemo<ExampleEntry[]>(() => {
        const map = new Map<string, Array<{id: string; name: string}>>();
        for (const tc of testCases) {
            if (!tc.namedExamples || !tc.id) continue;
            const tcId = tc.id;
            const tcName = tc.name ?? tc.id;
            for (const ex of tc.namedExamples) {
                if (!ex) continue;
                const arr = map.get(ex) ?? [];
                if (!arr.some(existing => existing.id === tcId)) {
                    arr.push({id: tcId, name: tcName});
                }
                map.set(ex, arr);
            }
        }
        const out: ExampleEntry[] = Array.from(map.entries()).map(([name, cases]) => ({name, cases}));
        out.sort((a, b) => a.name.localeCompare(b.name));
        return out;
    }, [testCases]);

    const filteredExamples = useMemo(() => {
        const q = filter.trim().toLowerCase();
        if (!q) return namedExamples;
        return namedExamples.filter(e => e.name.toLowerCase().includes(q));
    }, [namedExamples, filter]);

    return (
        <div className="border-2 border-black p-3 sm:p-6 rounded-none" data-testid="examples-page">
            <div className="flex flex-wrap items-center gap-2 mb-4">
                <h2 className="text-lg font-bold">Named Examples</h2>
                <span className="ml-2 font-mono text-xs px-2 py-1 border-2 border-black bg-white" data-testid="examples-count">
                    {namedExamples.length}
                </span>
            </div>
            <p className="text-sm text-gray-700 mb-4">
                Unique named examples used across the generated test cases (sorted alphabetically).
                Click on one to see all test cases that include it.
            </p>

            {namedExamples.length > 0 && (
                <input
                    type="text"
                    placeholder="Filter by name..."
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    className="border-2 border-black px-2 py-1 mb-4 w-full sm:w-80 font-mono text-sm"
                    data-testid="examples-filter"
                />
            )}

            {namedExamples.length === 0 ? (
                <div className="border-2 border-dashed border-gray-400 bg-gray-50 p-6 text-center text-sm text-gray-600 font-mono" data-testid="examples-empty">
                    No named examples recorded.
                </div>
            ) : filteredExamples.length === 0 ? (
                <div className="text-gray-500 italic text-sm">No named examples match the current filter.</div>
            ) : (
                <Accordion type="multiple" value={openExamples} onValueChange={setOpenExamples} className="w-full">
                    {filteredExamples.map((ex, idx) => (
                        <AccordionItem
                            key={ex.name}
                            value={ex.name}
                            className="border-2 border-black mb-4 overflow-hidden"
                            data-testid={`example-${idx}`}
                        >
                            <AccordionTrigger className="bg-blue-100 px-3 sm:px-4 py-3 text-sm sm:text-lg font-bold hover:no-underline hover:bg-blue-200">
                                <div className="flex-1 font-mono text-left break-all">{ex.name}</div>
                                <div className="mr-4 font-mono text-sm">{ex.cases.length}</div>
                            </AccordionTrigger>
                            <AccordionContent className="p-3 sm:p-4">
                                <div className="flex flex-col gap-2">
                                    {ex.cases.map((tc, j) => (
                                        <button
                                            key={`${tc.id}-${j}`}
                                            onClick={(event) => addTestTab(tc.id, event)}
                                            className="w-full flex items-center justify-between p-3 border border-gray-200 hover:bg-blue-50 hover:border-blue-300 text-left transition-colors"
                                            data-testid={`example-${idx}-test-${j}`}
                                        >
                                            <div className="flex items-center">
                                                <Code className="mr-3 text-gray-500 shrink-0" size={20}/>
                                                <span className="font-mono text-sm break-all">{tc.name}</span>
                                            </div>
                                            <ChevronRight className="text-gray-400 shrink-0" size={18}/>
                                        </button>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            )}
        </div>
    );
};
