import {AccordionContent, AccordionItem, AccordionTrigger} from "@/components/ui/accordion.tsx";
import {Badge} from "@/components/ui/badge.tsx";
import React, {useState} from "react";
import {TestCases} from "@/components/TestCases.tsx";
import {getColor, getHoverColor} from "@/lib/utils";
import info from "@/assets/info.json";

interface IStatusType {
    code: number | string;
    testCases: string[];
}

export interface IEndpointAccordionProps {
    endpoint: string;
    value: string;
    declared?: boolean;
    statusCodes: IStatusType[];
    faults: IStatusType[];
    addTestTab: (value: string, event: React.MouseEvent<HTMLElement>) => void;
}

export const EndpointAccordion: React.FC<IEndpointAccordionProps> = ({
                                                                        endpoint,
                                                                        value,
                                                                        declared = true,
                                                                        statusCodes,
                                                                        faults,
                                                                        addTestTab
                                                                    }) => {


    const sortedStatusCodes = statusCodes.sort((a, b) =>
        {
            const codeA = Number(a.code);
            const codeB = Number(b.code);
            if (isNaN(codeA) || isNaN(codeB)) {
                return String(a.code).localeCompare(String(b.code));
            }
            return codeA - codeB;
        }
    );

    type Selection = {code: number | string; isFault: boolean};
    const [selection, setSelection] = useState<Selection | null>(null);

    const toggleSelection = (code: number | string, fault: boolean) => {
        setSelection(prev =>
            prev && prev.code === code && prev.isFault === fault ? null : {code, isFault: fault}
        );
    };

    const sortedFaults = faults.sort((a, b) => {
        const codeA = Number(a.code);
        const codeB = Number(b.code);
        if (isNaN(codeA) || isNaN(codeB)) {
            return String(a.code).localeCompare(String(b.code));
        }
        return codeA - codeB;
    });

    const getSelectedStyle = (code: number | string, fault: boolean) => {
        const isSelected = selection?.code === code && selection?.isFault === fault;
        return isSelected ? "ring-2 ring-offset-2 ring-offset-white ring-blue-400 shadow-md" : "";
    }

    const selectedGroup = selection
        ? (selection.isFault
            ? sortedFaults.find(f => f.code === selection.code)
            : sortedStatusCodes.find(s => s.code === selection.code))
        : null;

    const nonEmptyStatusGroups = sortedStatusCodes.filter(c => c.testCases.length > 0);
    const nonEmptyFaultGroups = sortedFaults.filter(f => f.testCases.length > 0);
    const hasAnyTestCases = nonEmptyStatusGroups.length > 0 || nonEmptyFaultGroups.length > 0;

    const faultColors = ["bg-red-300", "bg-red-500", "bg-red-700"];
    return (
        <AccordionItem value={value} className="border-2 border-black mb-4 overflow-hidden" data-testid={endpoint}>
            <AccordionTrigger className={`px-3 sm:px-4 py-3 text-sm sm:text-lg font-bold hover:no-underline ${declared ? "bg-blue-100 hover:bg-blue-200" : "bg-amber-100 hover:bg-amber-200"}`}>
                <div className="flex-1 font-mono break-all text-left">{endpoint}</div>
                <div className="flex flex-wrap justify-end gap-1 sm:gap-2 mr-2 sm:mr-4">
                    {!declared && (
                        <Badge className="bg-amber-500 font-mono text-xs" title={info.notInSchema}>
                            NOT IN SCHEMA
                        </Badge>
                    )}
                    {sortedStatusCodes.map((code, idx) => (
                        <Badge key={`_${idx}`} className={`${getColor(code.code, true, false)} font-mono text-xs`}>
                            {code.code == -1 ? "NO-RESPONSE" : `H${code.code}`}
                        </Badge>
                    ))}
                    {sortedFaults.map((code, idx) => (
                        <Badge key={`_${idx}`} className={`${getColor(code.code, true, true)} font-mono text-xs`}>
                            F{code.code}
                        </Badge>
                    ))}
                </div>
            </AccordionTrigger>
            <AccordionContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row mb-6">
                    <div className="flex font-bold text-base sm:text-lg mb-2 mr-2">HTTP CODES:</div>
                    <div className="flex flex-wrap gap-2">
                        {
                            sortedStatusCodes.map((code, index) => (
                                <Badge key={index} onClick={() => toggleSelection(code.code, false)}
                                       className={`${getColor(code.code, true, false)} ${getSelectedStyle(code.code, false)} ${getHoverColor(code.code, false)} cursor-pointer text-white font-mono text-base border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                                    {code.code == -1 ? "NO-RESPONSE" : `H${code.code}`}
                                </Badge>
                            ))
                        }
                        {
                            sortedStatusCodes.length == 0 &&
                            <div className="text-gray-500 italic">No status codes recorded for this endpoint.</div>
                        }
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row mb-6">
                    <div className="flex font-bold text-base sm:text-lg mb-2 mr-2 text-red-500">FAULT CODES:</div>
                    <div className="flex flex-wrap gap-2">
                        {
                            sortedFaults.map((fault, index) => (
                                <Badge key={index} onClick={() => toggleSelection(fault.code, true)}
                                       className={`${faultColors[index % faultColors.length]} ${getSelectedStyle(fault.code, true)} hover:bg-red-400 cursor-pointer text-white text-base font-mono border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                                    F{fault.code}
                                </Badge>
                            ))
                        }
                        {
                            sortedFaults.length == 0 &&
                            <div className="text-gray-500 italic">No faults recorded for this endpoint.</div>
                        }
                    </div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                    {selection ? "Click the highlighted code again to clear the filter." : "Showing all test cases. Click a code to filter."}
                </div>

                {hasAnyTestCases && (
                    <div className="mt-6">
                        {selection && selectedGroup && selectedGroup.testCases.length > 0 && (
                            <TestCases addTestTab={addTestTab} isFault={selection.isFault} code={selection.code}
                                       testCases={selectedGroup.testCases}/>
                        )}
                        {!selection && (
                            <>
                                {nonEmptyStatusGroups.map(c => (
                                    <TestCases key={`s-${c.code}`} addTestTab={addTestTab} isFault={false}
                                               code={c.code} testCases={c.testCases}/>
                                ))}
                                {nonEmptyFaultGroups.map(f => (
                                    <TestCases key={`f-${f.code}`} addTestTab={addTestTab} isFault={true}
                                               code={f.code} testCases={f.testCases}/>
                                ))}
                            </>
                        )}
                    </div>
                )}
            </AccordionContent>
        </AccordionItem>
    )
}