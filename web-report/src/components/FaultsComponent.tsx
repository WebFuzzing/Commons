import {Card} from "@/components/ui/card.tsx";
import {ShieldAlert} from "lucide-react";
import React, {useState} from "react";
import {Faults} from "@/types/GeneratedTypes.tsx";
import {getFaultCounts, getText} from "@/lib/utils";
import info from "@/assets/info.json";
import {StatusCodeModal} from "@/components/StatusCodeModal.tsx";
import {ReportTooltip} from "@/components/ui/report-tooltip.tsx";
import {useAppContext} from "@/AppProvider.tsx";

export const FaultsComponent: React.FC<Faults> = ({total_number, found_faults}) => {
    const {data} = useAppContext();
    const totalEndpointNumber = data?.problem_details.rest?.endpoint_ids.length;

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
                        <span className="text-lg font-bold" data-testid="faults-component-fault-counts">{faultCounts.length}</span>
                    </div>
                </div>
            </div>
            <div className="mt-6">
                <div className="bg-gray-50 rounded-t-lg">
                    <div className="grid grid-cols-12 gap-4 p-6 font-semibold text-gray-700 border-b">
                        <ReportTooltip className="col-span-2 text-center" tooltipText={info.code_number_identifiers}>
                            <div>Codes</div>
                        </ReportTooltip>
                        <ReportTooltip className="col-span-6 text-center" tooltipText={info.identifier_name}>
                            <div>Name</div>
                        </ReportTooltip>
                        <ReportTooltip className="col-span-2 text-center" tooltipText={info.distribution_of_endpoints_per_code}>
                            <div>Ratio</div>
                        </ReportTooltip>
                        <ReportTooltip className="col-span-2 text-center" tooltipText={info.number_of_faults_per_code}>
                            <div>#</div>
                        </ReportTooltip>
                    </div>
                </div>
                <div className="border border-t-0 rounded-b-lg overflow-hidden">
                    {
                        faultCounts.map((fault) => (
                            <div className="grid grid-cols-12 gap-4 p-6 transition-colors border-b border-gray-200" key={fault.code}>
                                <div className="col-span-2 text-center font-bold cursor-help font-mono hover:text-green-300" onClick={() => handleOpenModal(fault.code)}>{fault.code}</div>
                                <div className="col-span-6 text-left font-mono cursor-help hover:text-green-300"  onClick={() => handleOpenModal(fault.code)}>{getShortNameOfCode(fault.code)}</div>
                                <ReportTooltip className="col-span-2 text-center font-mono" tooltipText={getText(info.distribution_tooltip,
                                    {
                                        operation_count: fault.operation_count,
                                        endpoint_text: fault.operation_count > 1 ? "endpoints have" : "endpoint has",
                                        code: fault.code,
                                        total_endpoints:totalEndpointNumber ? totalEndpointNumber : 0
                                    })}>
                                    <div>{fault.operation_count}/{totalEndpointNumber}</div>
                                </ReportTooltip>
                                <div className="col-span-2 text-center font-bold">{fault.count}</div>
                            </div>
                        ))
                    }
                </div>
            </div>
            <StatusCodeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} statusCode={currentStatus} />
        </Card>
    )
}