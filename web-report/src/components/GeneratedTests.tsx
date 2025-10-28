import {Card} from "@/components/ui/card.tsx";
import {Target, Clock} from "lucide-react";
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
    outputHttpCalls?: number
    evaluatedHttpCalls?: number
    executionTimeInSeconds?: number
}

const formatExecutionTime = (totalSeconds?: number) => {
    if (totalSeconds === undefined || totalSeconds === null) return null;

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    return { days, hours, minutes, seconds };
};

export const GeneratedTests: React.FC<IGeneratedTests> = ({totalTests, testFiles, outputHttpCalls, evaluatedHttpCalls, executionTimeInSeconds}) => {
    const timeBreakdown = formatExecutionTime(executionTimeInSeconds);

    return (
    <Card className="border-2 border-black p-6 rounded-none">
        <div className="flex items-start gap-4">
            <Target className="w-6 h-6 text-gray-500"/>
            <div className="flex-1">
                <div className="flex justify-between">
                    <ReportTooltip tooltipText={info.generatedTestFiles}>
                        <span className="text-lg font-bold"># Generated Test Files:</span>
                    </ReportTooltip>
                    <span className="text-lg font-bold" data-testid="generated-tests-total-test-files">{testFiles.length}</span>
                </div>
                <div className="flex justify-between">
                    <ReportTooltip tooltipText={info.generatedTestCases}>
                        <span className="text-lg font-bold"># Generated Tests Cases:</span>
                    </ReportTooltip>
                    <span className="text-lg font-bold" data-testid="generated-tests-total-tests">{totalTests}</span>
                </div>
                <div className="flex justify-between">
                    <ReportTooltip tooltipText={info.outputHttpCalls}>
                        <span className="text-lg font-bold"># Output HTTP Calls:</span>
                    </ReportTooltip>
                    <span className="text-lg font-bold" data-testid="rest-report-output-http-calls">{outputHttpCalls}</span>
                </div>
                <div className="flex justify-between">
                    <ReportTooltip tooltipText={info.evaluatedHttpCalls}>
                        <span className="text-lg font-bold"># Evaluated HTTP Calls:</span>
                    </ReportTooltip>
                    <span className="text-lg font-bold" data-testid="rest-report-evaluated-http-calls">{evaluatedHttpCalls}</span>
                </div>
                {timeBreakdown && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg">
                        <ReportTooltip tooltipText={info.executionTimeInSeconds}>
                            <div className="flex items-center gap-2 mb-3">
                                <Clock className="w-5 h-5 text-blue-600"/>
                                <span className="text-base font-bold text-blue-900">Execution Time</span>
                            </div>
                        </ReportTooltip>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" data-testid="rest-report-execution-time">
                            <div className="text-center bg-white rounded-lg p-3 border border-blue-200 shadow-sm">
                                <div className="text-2xl font-bold text-blue-600">{timeBreakdown.days}</div>
                                <div className="text-xs font-medium text-gray-600 mt-1">Days</div>
                            </div>
                            <div className="text-center bg-white rounded-lg p-3 border border-blue-200 shadow-sm">
                                <div className="text-2xl font-bold text-indigo-600">{timeBreakdown.hours}</div>
                                <div className="text-xs font-medium text-gray-600 mt-1">Hours</div>
                            </div>
                            <div className="text-center bg-white rounded-lg p-3 border border-blue-200 shadow-sm">
                                <div className="text-2xl font-bold text-purple-600">{timeBreakdown.minutes}</div>
                                <div className="text-xs font-medium text-gray-600 mt-1">Minutes</div>
                            </div>
                            <div className="text-center bg-white rounded-lg p-3 border border-blue-200 shadow-sm">
                                <div className="text-2xl font-bold text-violet-600">{timeBreakdown.seconds}</div>
                                <div className="text-xs font-medium text-gray-600 mt-1">Seconds</div>
                            </div>
                        </div>
                    </div>
                )}

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
    );
};
