import React, {useMemo} from "react";
import {useAppContext} from "@/AppProvider.tsx";
import {Warning} from "@/types/GeneratedTypes.tsx";
import {AlertTriangle} from "lucide-react";

export const Warnings: React.FC = () => {
    const {data} = useAppContext();

    const sortedWarnings = useMemo<Warning[]>(() => {
        const warnings = data?.warnings ?? [];
        return [...warnings].sort((a, b) => {
            const pa = a.displayPriority ?? Number.MAX_SAFE_INTEGER;
            const pb = b.displayPriority ?? Number.MAX_SAFE_INTEGER;
            return pa - pb;
        });
    }, [data]);

    return (
        <div className="border-2 border-black p-3 sm:p-6 rounded-none" data-testid="warnings-page">
            <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="text-orange-500" size={22}/>
                <h2 className="text-lg font-bold">Warnings</h2>
                <span className="ml-2 font-mono text-xs px-2 py-1 border-2 border-black bg-white" data-testid="warnings-count">
                    {sortedWarnings.length}
                </span>
            </div>

            {sortedWarnings.length === 0 ? (
                <div className="border-2 border-dashed border-gray-400 bg-gray-50 p-6 text-center text-sm text-gray-600 font-mono" data-testid="warnings-empty">
                    No warnings reported.
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {sortedWarnings.map((w, idx) => (
                        <div
                            key={idx}
                            className="border-2 p-3 bg-blue-50 border-blue-500 text-blue-900"
                            data-testid={`warning-${idx}`}
                        >
                            {w.category && (
                                <div className="mb-2">
                                    <span className="font-mono text-xs px-2 py-0.5 border-2 border-black bg-white" data-testid={`warning-${idx}-category`}>
                                        {w.category}
                                    </span>
                                </div>
                            )}
                            <div className="text-sm whitespace-pre-wrap break-words" data-testid={`warning-${idx}-message`}>
                                {w.message ?? <span className="italic text-gray-500">(no message)</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
