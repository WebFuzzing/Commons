import React from "react";
import {Dialog} from "radix-ui";
import {X} from "lucide-react";
import {TestResults} from "@/pages/TestResults.tsx";

interface IProps {
    testId: string | null;
    onClose: () => void;
}

export const TestDetailDialog: React.FC<IProps> = ({testId, onClose}) => {
    return (
        <Dialog.Root
            open={!!testId}
            onOpenChange={(open) => { if (!open) onClose(); }}
        >
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
                <Dialog.Content
                    className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-black w-[min(95vw,64rem)] max-h-[90vh] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden"
                    data-testid="test-detail-dialog"
                    aria-describedby={undefined}
                >
                    <div className="flex items-center justify-between px-4 py-2 border-b-2 border-black bg-gray-100 shrink-0">
                        <Dialog.Title className="font-mono font-bold break-all mr-2">
                            {testId ?? ""}
                        </Dialog.Title>
                        <Dialog.Close asChild>
                            <button
                                className="p-1 hover:bg-red-200 rounded shrink-0"
                                aria-label="Close"
                                data-testid="test-detail-dialog-close"
                            >
                                <X size={20}/>
                            </button>
                        </Dialog.Close>
                    </div>
                    <div className="overflow-auto flex-1">
                        {testId && <TestResults testCaseName={testId} embedded/>}
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};
