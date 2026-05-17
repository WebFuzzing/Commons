import React, {useMemo} from "react";
import {useAppContext} from "@/AppProvider.tsx";
import {Warning} from "@/types/GeneratedTypes.tsx";
import {AlertTriangle} from "lucide-react";

type Palette = {container: string; badge: string};

const CATEGORY_PALETTE: Palette[] = [
    {container: "bg-blue-50 border-blue-500 text-blue-900", badge: "bg-blue-200 border-blue-700 text-blue-900"},
    {container: "bg-amber-50 border-amber-500 text-amber-900", badge: "bg-amber-200 border-amber-700 text-amber-900"},
    {container: "bg-emerald-50 border-emerald-500 text-emerald-900", badge: "bg-emerald-200 border-emerald-700 text-emerald-900"},
    {container: "bg-purple-50 border-purple-500 text-purple-900", badge: "bg-purple-200 border-purple-700 text-purple-900"},
    {container: "bg-pink-50 border-pink-500 text-pink-900", badge: "bg-pink-200 border-pink-700 text-pink-900"},
];

const UNCATEGORIZED_PALETTE: Palette = {
    container: "bg-gray-50 border-gray-400 text-gray-900",
    badge: "bg-gray-200 border-gray-600 text-gray-900",
};

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

    const categoryPalette = useMemo<Map<string, Palette>>(() => {
        const map = new Map<string, Palette>();
        for (const w of sortedWarnings) {
            if (!w.category) continue;
            if (!map.has(w.category)) {
                map.set(w.category, CATEGORY_PALETTE[map.size % CATEGORY_PALETTE.length]);
            }
        }
        return map;
    }, [sortedWarnings]);

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
                    {sortedWarnings.map((w, idx) => {
                        const palette = w.category ? (categoryPalette.get(w.category) ?? UNCATEGORIZED_PALETTE) : UNCATEGORIZED_PALETTE;
                        return (
                            <div
                                key={idx}
                                className={`border-2 p-3 flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 ${palette.container}`}
                                data-testid={`warning-${idx}`}
                            >
                                {w.category && (
                                    <span
                                        className={`shrink-0 self-start font-mono text-xs px-2 py-0.5 border-2 ${palette.badge}`}
                                        data-testid={`warning-${idx}-category`}
                                    >
                                        {w.category}
                                    </span>
                                )}
                                <div className="text-sm whitespace-pre-wrap break-words flex-1" data-testid={`warning-${idx}-message`}>
                                    {w.message ?? <span className="italic text-gray-500">(no message)</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
