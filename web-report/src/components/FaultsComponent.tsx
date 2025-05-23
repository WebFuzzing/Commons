import {Card} from "@/components/ui/card.tsx";
import {ShieldAlert} from "lucide-react";
import React, {useState} from "react";
import {Faults} from "@/types/GeneratedTypes.tsx";
import {getFaultCounts} from "@/utils.tsx";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip.tsx";
import info from "@/assets/info.json";
import {StatusCodeModal} from "@/components/StatusCodeModal.tsx";

export const FaultsComponent: React.FC<Faults> = ({total_number, found_faults}) => {
    const faultCounts = getFaultCounts(found_faults);
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [currentStatus, setCurrentStatus] = useState(-1);

    const handleOpenModal = (status: number) => {
        setCurrentStatus(status);
        setIsModalOpen(true);
    }

    const getShortNameOfCode = (code: number) => {
        const codeInfo = info.fault_codes.find((fault) => fault.code === code);
        if (codeInfo) {
            return codeInfo.short_definition;
        }
    }
    return(
        <Card className="border-2 border-black p-6 rounded-none">
            <div className="flex items-start gap-4 mb-4">
                <ShieldAlert className="w-6 h-6 text-gray-500" />
                <div className="flex-1">
                    <div className="flex justify-between">
                        <span className="text-lg font-bold">Total Faults</span>
                        <span className="text-lg font-bold" data-testid="faults-component-total-faults">{total_number}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-lg font-bold">Distinct Fault Types:</span>
                        <span className="text-lg font-bold" data-testid="faults-component-fault-counts">{faultCounts.size}</span>
                    </div>
                </div>
            </div>

            <div className="mt-4">
                <div className="flex justify-between font-bold border-b border-black pb-2">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span>Codes</span>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{info.number_of_fault_codes}</p>
                        </TooltipContent>
                    </Tooltip>
                    <span>Name</span>
                    <span>#</span>
                </div>
                <div className="border-2 border-black mt-2 p-2">
                    {
                        Array.from(faultCounts).map(([code, count]) => (
                            <div className="flex justify-between py-1" key={code}>
                                <span className="font-bold cursor-help font-mono hover:text-green-300" onClick={() => handleOpenModal(code)}>{code}</span>
                                <span className="font-mono  cursor-help hover:text-green-300"  onClick={() => handleOpenModal(code)}>{getShortNameOfCode(code)}</span>
                                <span className="font-bold">{count}</span>
                            </div>
                        ))
                    }
                </div>
            </div>
            <StatusCodeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} statusCode={currentStatus} />
        </Card>
    )
}