import {Card} from "@/components/ui/card.tsx";
import {ShieldAlert} from "lucide-react";
import React, {useState} from "react";
import {Faults} from "@/types/GeneratedTypes.tsx";
import {getFaultCounts, getText} from "@/lib/utils";
import info from "@/assets/info.json";
import {StatusCodeModal} from "@/components/StatusCodeModal.tsx";
import {ReportTooltip} from "@/components/ui/report-tooltip.tsx";
import {useAppContext} from "@/AppProvider.tsx";
import faults from "../../../src/main/resources/wfc/faults/fault_categories.json";

export const FaultsComponent: React.FC<Faults> = ({totalNumber, foundFaults}) => {
    const {data} = useAppContext();
    const totalEndpointNumber = data?.problemDetails.rest?.endpointIds.length;

    const faultCounts = getFaultCounts(foundFaults);
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [currentStatus, setCurrentStatus] = useState(-1);

    const handleOpenModal = (status: number) => {
        setCurrentStatus(status);
        setIsModalOpen(true);
    }

    const getShortNameOfCode = (code: number) => {
        const codeInfo = faults.find((fault) => fault.code === code);
        if (codeInfo) {
            return codeInfo.descriptiveName;
        }
        if(code >= 900 && code <= 999) {
            return `Custom Code`;
        }
        return `Unrecognized Code`;
    }
    return(
        <Card className="border-2 border-black p-6 rounded-none">
            <div className="flex items-start gap-4 mb-4">
                <ShieldAlert className="w-6 h-6 text-gray-500" />
                <div className="flex-1">
                    <div className="flex justify-between">
                        <ReportTooltip tooltipText={info.totalFaults}>
                            <span className="text-lg font-bold">Total Faults:</span>
                        </ReportTooltip>
                        <span className="text-lg font-bold" data-testid="faults-component-total-faults">{totalNumber}</span>
                    </div>
                    <div className="flex justify-between">
                        <ReportTooltip tooltipText={info.distinctFaultTypes}>
                            <span className="text-lg font-bold">Distinct Fault Types:</span>
                        </ReportTooltip>
                        <span className="text-lg font-bold" data-testid="faults-component-fault-counts">{faultCounts.length}</span>
                    </div>
                </div>
            </div>
            <div className="mt-6">
                <div className="bg-gray-50 rounded-t-lg">
                    <div className="grid grid-cols-12 gap-4 p-6 font-semibold text-gray-700 border-b">
                        <ReportTooltip className="col-span-2 text-center" tooltipText={info.codeNumberIdentifiers}>
                            <div>Codes</div>
                        </ReportTooltip>
                        <ReportTooltip className="col-span-6 text-center" tooltipText={info.identifierName}>
                            <div>Name</div>
                        </ReportTooltip>
                        <ReportTooltip className="col-span-2 text-center" tooltipText={info.distributionOfEndpointsPerCode}>
                            <div>Ratio</div>
                        </ReportTooltip>
                        <ReportTooltip className="col-span-2 text-center" tooltipText={info.numberOfFaultsPerCode}>
                            <div>#</div>
                        </ReportTooltip>
                    </div>
                </div>
                <div className="border border-t-0 rounded-b-lg overflow-hidden">
                    {
                        faultCounts.map((fault) => (
                            <div className="grid grid-cols-12 gap-4 p-6 transition-colors border-b border-gray-200" key={fault.code}>
                                <div className="col-span-2 text-center font-bold cursor-help font-mono hover:text-green-300" onClick={() => handleOpenModal(fault.code)}>{fault.code}</div>
                                <div className="col-span-6 text-center font-mono cursor-help hover:text-green-300"  onClick={() => handleOpenModal(fault.code)}>{getShortNameOfCode(fault.code)}</div>
                                <ReportTooltip className="col-span-2 text-center font-mono" tooltipText={getText(info.distributionTooltip,
                                    {
                                        operationCount: fault.operationCount,
                                        endpointText: fault.operationCount > 1 ? "endpoints have" : "endpoint has",
                                        code: fault.code,
                                        totalEndpoints:totalEndpointNumber ? totalEndpointNumber : 0
                                    })}>
                                    <div>{fault.operationCount}/{totalEndpointNumber}</div>
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