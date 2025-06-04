import {Card} from "@/components/ui/card.tsx";
import type React from "react";
import {Badge} from "@/components/ui/badge.tsx";
import {CodeBlock} from "@/components/CodeBlock.tsx";
import {extractCodeLines, getColor, getLanguage} from "@/lib/utils";
import {useAppContext} from "@/AppProvider.tsx";


interface IProps {
    test_case_name: string;
}

export const TestResults: React.FC<IProps> = ({test_case_name}) => {

    const {data, testFiles} = useAppContext();

    const test_cases = data?.test_cases || [];
    const found_faults = data?.faults.found_faults || [];
    const problem_details = data?.problem_details || {};
    if (!problem_details.rest) {
        return <div>We are only supporting REST results now. You need to provide rest results.</div>
    }

    const test_case = test_cases.find((test) => test.id === test_case_name);
    const related_faults = found_faults.filter(fault => fault.test_case_id === test_case_name);
    const related_http_status = problem_details.rest.covered_http_status.filter(status => status.test_case_id === test_case_name);

    const all_fault_codes = related_faults.map((fault) =>
        fault.fault_categories.map((f) => f.code)).flat();
    const unique_fault_codes = [...new Set(all_fault_codes)].sort((a, b) => a - b);

    const all_status_codes = related_http_status.map((status) =>
        status.http_status.map((s) => s)).flat();
    const unique_status_codes = [...new Set(all_status_codes)].sort((a, b) => a - b);
    const current_file = testFiles.find((file) => file.name === test_case?.file_path);


    const extractedCode = current_file && test_case ? extractCodeLines(current_file.code, test_case?.start_line, test_case?.end_line) : "";

    return (
        <div className="border-2 border-black p-6 rounded-none w-[80%] mx-auto">
            <div className="gap-6 mb-6">

                {/* Others Section */}
                <Card className="border-2 border-black p-8 rounded-none">
                    <h3 className="text-xl font-bold mb-4">Related Codes</h3>
                    {
                        unique_status_codes.length > 0 && <div className="flex flex-wrap gap-2 mb-3">
                            <Badge
                                className="bg-green-500 cursor-default text-white px-4 py-2 text-base font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                HTTPS
                            </Badge>

                            {
                                unique_status_codes.map((code, i) => (
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
                        unique_fault_codes.length > 0 && <div className="flex flex-wrap gap-2">
                            <Badge
                                className="bg-red-500 cursor-default text-white px-4 py-2 text-base font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                FAULTS
                            </Badge>
                            {
                                unique_fault_codes.map((code, index) => (
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
                    <span>{test_case?.id}</span>
                </div>
                {
                    test_case && current_file && (
                        <pre className="p-4 overflow-auto max-h-[500px] text-sm text-left font-mono">
                        <CodeBlock content={extractedCode} language={getLanguage(current_file?.name)}/>
                    </pre>
                    )
                }
            </Card>
        </div>
    )
}