import {Card} from "@/components/ui/card.tsx";
import type React from "react";
import {Badge} from "@/components/ui/badge.tsx";
import {CodeBlock} from "@/components/CodeBlock.tsx";
import {extractCodeLines, getColor, getLanguage} from "@/lib/utils";
import {useAppContext} from "@/AppProvider.tsx";


interface IProps {
    testCaseName: string;
}

export const TestResults: React.FC<IProps> = ({testCaseName}) => {

    const {data, testFiles} = useAppContext();

    const testCases = data?.testCases || [];
    const foundFaults = data?.faults.foundFaults || [];
    const problemDetails = data?.problemDetails || {};
    if (!problemDetails.rest) {
        return <div>We are only supporting REST results now. You need to provide rest results.</div>
    }

    const testCase = testCases.find((test) => test.id === testCaseName);
    const relatedFaults = foundFaults.filter(fault => fault.testCaseId === testCaseName);
    const relatedHttpStatus = problemDetails.rest.coveredHttpStatus.filter(status => status.testCaseId === testCaseName);

    const allFaultCodes = relatedFaults.map((fault) =>
        fault.faultCategories.map((f) => f.code)).flat();
    const uniqueFaultCodes = [...new Set(allFaultCodes)].sort((a, b) => a - b);

    const allStatusCodes = relatedHttpStatus.map((status) =>
        status.httpStatus.map((s) => s)).flat();
    const uniqueStatusCodes = [...new Set(allStatusCodes)].sort((a, b) => a - b);
    const currentFile = testFiles.find((file) => file.name === testCase?.filePath);


    const extractedCode = currentFile && testCase ? extractCodeLines(currentFile.code, testCase?.startLine, testCase?.endLine) : "";

    return (
        <div className="border-2 border-black p-6 rounded-none w-[80%] mx-auto">
            <div className="gap-6 mb-6">

                {/* Others Section */}
                <Card className="border-2 border-black p-8 rounded-none">
                    <h3 className="text-xl font-bold mb-4">Related Codes</h3>
                    {
                        uniqueStatusCodes.length > 0 && <div className="flex flex-wrap gap-2 mb-3">
                            <Badge
                                className="bg-green-500 cursor-default text-white px-4 py-2 text-base font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                HTTPS
                            </Badge>

                            {
                                uniqueStatusCodes.map((code, i) => (
                                    <Badge
                                        key={i}
                                        className={`${getColor(code, true, false)} cursor-default text-white px-4 py-2 text-base font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                                        {code}
                                    </Badge>
                                ))
                            }
                        </div>
                    }
                    {
                        uniqueFaultCodes.length > 0 && <div className="flex flex-wrap gap-2">
                            <Badge
                                className="bg-red-500 cursor-default text-white px-4 py-2 text-base font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                FAULTS
                            </Badge>
                            {
                                uniqueFaultCodes.map((code, index) => (
                                    <Badge
                                        key={index}
                                        className="bg-red-400 cursor-default text-white px-4 py-2 text-base font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                        {code}
                                    </Badge>
                                ))
                            }
                        </div>
                    }
                </Card>
            </div>

            {/* Code Section */}
            <Card className="border-2 border-black rounded-none">
                <div
                    className="bg-gray-100 px-4 py-2 border-b-2 border-black font-bold flex justify-between items-center">
                    <span>{testCase?.id}</span>
                </div>
                {
                    testCase && currentFile && (
                        <pre className="p-4 overflow-auto max-h-[500px] text-sm text-left font-mono">
                        <CodeBlock content={extractedCode} language={getLanguage(currentFile?.name)}/>
                    </pre>
                    )
                }
            </Card>
        </div>
    )
}