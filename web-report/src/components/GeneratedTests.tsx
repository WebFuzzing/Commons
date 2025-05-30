import {Card} from "@/components/ui/card.tsx";
import {Target} from "lucide-react";
import type React from "react";
import {getFileColor} from "@/lib/utils";
import info from "@/assets/info.json";
import {ReportTooltip} from "@/components/ui/report-tooltip.tsx";

interface IGeneratedTests {
    total_tests: number
    test_files: Array<{
        file_name: string,
        number_of_test_cases: number
    }>
    total_http_calls?: number
}

export const GeneratedTests: React.FC<IGeneratedTests> = ({total_tests, test_files, total_http_calls}) => (
    <Card className="border-2 border-black p-6 rounded-none">
        <div className="flex items-start gap-4">
            <Target className="w-6 h-6 text-gray-500"/>
            <div className="flex-1">
                <div className="flex justify-between">
                    <ReportTooltip tooltipText={info.generated_test_files}>
                        <span className="text-lg font-bold">Generated Test Files:</span>
                    </ReportTooltip>
                    <span className="text-lg font-bold" data-testid="generated-tests-total-test-files">{test_files.length}</span>
                </div>
                <div className="flex justify-between">
                    <ReportTooltip tooltipText={info.generated_test_cases}>
                        <span className="text-lg font-bold">Generated Tests Cases:</span>
                    </ReportTooltip>
                    <span className="text-lg font-bold" data-testid="generated-tests-total-tests">{total_tests}</span>
                </div>
                <div className="flex justify-between">
                    <ReportTooltip tooltipText={info.number_of_http_calls}>
                        <span className="text-lg font-bold"># HTTP Calls:</span>
                    </ReportTooltip>
                    <span className="text-lg font-bold" data-testid="rest-report-http-calls">{total_http_calls}</span>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm font-medium text-gray-700 mb-2">Test Files</div>
                    <div className="space-y-1">
                        {
                            test_files.length > 0 ? (
                                test_files.map((file, index) => (
                                    <div className="flex items-center gap-2 text-sm text-gray-600" key={index}>
                                        <div className={`w-2 h-2 ${getFileColor(index, file.file_name)} rounded-full`}></div>
                                        <ReportTooltip tooltipText={`${file.number_of_test_cases} test cases are located in ${file.file_name}`}>
                                            <span>{file.file_name} (# {file.number_of_test_cases})</span>
                                        </ReportTooltip>
                                    </div>
                                ))
                            ) : (
                                <div className="text-gray-500 italic">No test files generated.</div>
                            )
                        }
                    </div>
                </div>
            </div>
        </div>
    </Card>
)