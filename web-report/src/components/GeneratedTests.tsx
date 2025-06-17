import {Card} from "@/components/ui/card.tsx";
import {Target} from "lucide-react";
import type React from "react";
import {getFileColor, getText} from "@/lib/utils";
import info from "@/assets/info.json";
import {ReportTooltip} from "@/components/ui/report-tooltip.tsx";

interface IGeneratedTests {
    totalTests: number
    testFiles: Array<{
        fileName: string,
        numberOfTestCases: number
    }>
    totalHttpCalls?: number
}

export const GeneratedTests: React.FC<IGeneratedTests> = ({totalTests, testFiles, totalHttpCalls}) => (
    <Card className="border-2 border-black p-6 rounded-none">
        <div className="flex items-start gap-4">
            <Target className="w-6 h-6 text-gray-500"/>
            <div className="flex-1">
                <div className="flex justify-between">
                    <ReportTooltip tooltipText={info.generatedTestFiles}>
                        <span className="text-lg font-bold">Generated Test Files:</span>
                    </ReportTooltip>
                    <span className="text-lg font-bold" data-testid="generated-tests-total-test-files">{testFiles.length}</span>
                </div>
                <div className="flex justify-between">
                    <ReportTooltip tooltipText={info.generatedTestCases}>
                        <span className="text-lg font-bold">Generated Tests Cases:</span>
                    </ReportTooltip>
                    <span className="text-lg font-bold" data-testid="generated-tests-total-tests">{totalTests}</span>
                </div>
                <div className="flex justify-between">
                    <ReportTooltip tooltipText={info.numberOfHttpCalls}>
                        <span className="text-lg font-bold"># HTTP Calls:</span>
                    </ReportTooltip>
                    <span className="text-lg font-bold" data-testid="rest-report-http-calls">{totalHttpCalls}</span>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm font-medium text-gray-700 mb-2">Test Files</div>
                    <div className="space-y-1">
                        {
                            testFiles.length > 0 ? (
                                testFiles.map((file, index) => (
                                    <div className="flex items-center gap-2 text-sm text-gray-600" key={index}>
                                        <div className={`w-2 h-2 ${getFileColor(index, file.fileName)} rounded-full`}></div>
                                        <ReportTooltip tooltipText={getText(info.testFilesLocated,
                                            {
                                                fileName: file.fileName,
                                                numberOfTestCases: file.numberOfTestCases
                                            })}>
                                            <span>{file.fileName} (# {file.numberOfTestCases})</span>
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