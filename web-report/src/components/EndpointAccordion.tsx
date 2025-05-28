import {AccordionContent, AccordionItem, AccordionTrigger} from "@/components/ui/accordion.tsx";
import {Badge} from "@/components/ui/badge.tsx";
import React, {useState} from "react";
import {TestCases} from "@/components/TestCases.tsx";
import {getColor} from "@/utils.tsx";

interface IStatusType {
    code: number | string;
    test_cases: string[];
}

export interface IEndpointAccordionProps {
    endpoint: string;
    value: string;
    status_codes: IStatusType[];
    faults: IStatusType[];
    addTestTab: (value: string, event: React.MouseEvent<HTMLElement>) => void;
}

export const EndpointAccordion: React.FC<IEndpointAccordionProps> = ({
                                                                        endpoint,
                                                                        value,
                                                                        status_codes,
                                                                        faults,
                                                                        addTestTab
                                                                    }) => {


    const sortedStatusCodes = status_codes.sort((a, b) =>
        {
            const codeA = Number(a.code);
            const codeB = Number(b.code);
            if (isNaN(codeA) || isNaN(codeB)) {
                return String(a.code).localeCompare(String(b.code));
            }
            return codeA - codeB;
        }
    );

    const [selectedCode, setSelectedCode] = useState<number | string>(sortedStatusCodes[0]?.code || 0);
    const [isFault, setIsFault] = useState(false);

    const selectedTestCases = status_codes.find((code) => code.code === selectedCode)?.test_cases || [];
    const selectedFaultTestCases = faults.find((code) => code.code === selectedCode)?.test_cases || [];

    const sortedFaults = faults.sort((a, b) => {
        const codeA = Number(a.code);
        const codeB = Number(b.code);
        if (isNaN(codeA) || isNaN(codeB)) {
            return String(a.code).localeCompare(String(b.code));
        }
        return codeA - codeB;
    });
    const getSelectedStyle = (code: number | string, fault: boolean) => {

        const isSelected = selectedCode === code && isFault === fault;
        return isSelected ? "ring-2 ring-offset-2 ring-offset-white ring-blue-400 shadow-md" : "";

    }

    const faultColors = ["bg-red-300", "bg-red-500", "bg-red-700"];
    return (
        <AccordionItem value={value} className="border-2 border-black mb-4 overflow-hidden" data-testid={endpoint}>
            <AccordionTrigger className="bg-blue-100 px-4 py-3 text-lg font-bold hover:no-underline hover:bg-blue-200">
                <div className="flex-1 font-mono">{endpoint}</div>
                <div className="flex flex-wrap justify-end gap-2 mr-4">
                    {sortedStatusCodes.map((code, idx) => (
                        <Badge key={`_${idx}`} className={`${getColor(code.code, true, false)} font-mono`}>
                            H{code.code}
                        </Badge>
                    ))}
                    {sortedFaults.map((code, idx) => (
                        <Badge key={`_${idx}`} className={`${getColor(code.code, true, true)} font-mono`}>
                            F{code.code}
                        </Badge>
                    ))}
                </div>
            </AccordionTrigger>
            <AccordionContent className="p-4">
                <div className="mb-6">
                    <div className="font-bold text-lg mb-2">HTTP CODES</div>
                    <div className="flex flex-wrap gap-2">
                        {
                            sortedStatusCodes.map((code, index) => (
                                <Badge key={index} onClick={() => {
                                    setSelectedCode(code.code);
                                    setIsFault(false);
                                }}
                                       className={`${getColor(code.code, true, false)} ${getSelectedStyle(code.code, false)} hover:bg-green-600 cursor-pointer text-white px-4 py-2 text-base font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                                    {code.code}
                                </Badge>
                            ))
                        }
                        {
                            sortedStatusCodes.length == 0 &&
                            <div className="text-gray-500 italic">No status codes recorded for this endpoint.</div>
                        }
                    </div>
                </div>

                <div>
                    <div className="font-bold text-lg mb-2 text-red-500">FAULT CODES</div>
                    <div className="flex flex-wrap gap-2">
                        {
                            sortedFaults.map((fault, index) => (
                                <Badge key={index} onClick={() => {
                                    setSelectedCode(fault.code)
                                    setIsFault(true);
                                }}
                                       className={`${faultColors[index % faultColors.length]} ${getSelectedStyle(fault.code, true)} hover:bg-red-400 cursor-pointer text-white px-4 py-2 text-base font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                                    {fault.code}
                                </Badge>
                            ))
                        }
                        {
                            sortedFaults.length == 0 &&
                            <div className="text-gray-500 italic">No faults recorded for this endpoint.</div>
                        }
                    </div>
                </div>
                <div className="text-xs text-gray-500 mt-1">Click to show test cases.</div>

                {
                    (selectedTestCases.length > 0 || selectedFaultTestCases.length > 0) &&
                    <div className="mt-6">
                        <TestCases addTestTab={addTestTab} isFault={isFault} code={selectedCode}
                                   test_cases={selectedTestCases.length > 0 && !isFault ? selectedTestCases : selectedFaultTestCases}/>
                    </div>
                }
            </AccordionContent>
        </AccordionItem>
    )
}