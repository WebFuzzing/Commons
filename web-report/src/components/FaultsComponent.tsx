import {Card} from "@/components/ui/card.tsx";
import {ShieldAlert} from "lucide-react";
import React, {useState} from "react";
import {Faults} from "@/types/GeneratedTypes.tsx";
import {getFaultCounts} from "@/utils.tsx";
import info from "@/assets/info.json";
import {StatusCodeModal} from "@/components/StatusCodeModal.tsx";
import {ReportTooltip} from "@/components/ui/report-tooltip.tsx";

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
                        <ReportTooltip tooltipText={info.total_faults}>
                            <span className="text-lg font-bold">Total Faults:</span>
                        </ReportTooltip>
                        <span className="text-lg font-bold" data-testid="faults-component-total-faults">{total_number}</span>
                    </div>
                    <div className="flex justify-between">
                        <ReportTooltip tooltipText={info.distinct_fault_types}>
                            <span className="text-lg font-bold">Distinct Fault Types:</span>
                        </ReportTooltip>
                        <span className="text-lg font-bold" data-testid="faults-component-fault-counts">{faultCounts.size}</span>
                    </div>
                </div>
            </div>

            <div className="mt-4">
                <div className="flex justify-between font-bold border-b border-black pb-2">
                    <ReportTooltip tooltipText={info.code_number_identifiers}>
                        <span>Codes</span>
                    </ReportTooltip>
                    <ReportTooltip tooltipText={info.identifier_name}>
                        <span>Name</span>
                    </ReportTooltip>
                    <ReportTooltip tooltipText={info.number_of_faults_per_code}>
                        <span>#</span>
                    </ReportTooltip>
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