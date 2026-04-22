import React, {useEffect} from "react";
import {X} from "lucide-react";
import {TestResults} from "@/pages/TestResults.tsx";

interface IProps {
    testId: string | null;
    onClose: () => void;
}

export const TestDetailDialog: React.FC<IProps> = ({testId, onClose}) => {
    useEffect(() => {
        if (!testId) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handler);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", handler);
            document.body.style.overflow = prevOverflow;
        };
    }, [testId, onClose]);

    if (!testId) return null;

    return (
        <div
            className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-auto"
            onClick={onClose}
            data-testid="test-detail-dialog"
        >
            <div
                className="bg-white border-2 border-black w-full max-w-5xl my-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <div className="flex items-center justify-between px-4 py-2 border-b-2 border-black bg-gray-100 sticky top-0">
                    <span className="font-mono font-bold break-all mr-2">{testId}</span>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-red-200 rounded shrink-0"
                        aria-label="Close"
                        data-testid="test-detail-dialog-close"
                    >
                        <X size={20}/>
                    </button>
                </div>
                <div className="max-h-[80vh] overflow-auto">
                    <TestResults testCaseName={testId} embedded/>
                </div>
            </div>
        </div>
    );
};
