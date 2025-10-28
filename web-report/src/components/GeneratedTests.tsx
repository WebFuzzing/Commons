import {Card} from "@/components/ui/card.tsx";
import {Target, Clock, FileText, TestTube, Network, CheckCircle, FolderOpen} from "lucide-react";
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ReportTooltip tooltipText={info.generatedTestFiles}>
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3">
                                <div className="bg-green-500 rounded-full p-2">
                                    <FileText className="w-5 h-5 text-white"/>
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-600">Generated Test Files</div>
                                    <div className="text-2xl font-bold text-green-700" data-testid="generated-tests-total-test-files">{testFiles.length}</div>
                                </div>
                            </div>
                        </div>
                    </ReportTooltip>

                    <ReportTooltip tooltipText={info.generatedTestCases}>
                        <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-300 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3">
                                <div className="bg-orange-500 rounded-full p-2">
                                    <TestTube className="w-5 h-5 text-white"/>
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-600">Generated Test Cases</div>
                                    <div className="text-2xl font-bold text-orange-700" data-testid="generated-tests-total-tests">{totalTests}</div>
                                </div>
                            </div>
                        </div>
                    </ReportTooltip>

                    <ReportTooltip tooltipText={info.outputHttpCalls}>
                        <div className="bg-gradient-to-br from-cyan-50 to-sky-50 border-2 border-cyan-300 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3">
                                <div className="bg-cyan-500 rounded-full p-2">
                                    <Network className="w-5 h-5 text-white"/>
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-600">Output HTTP Calls</div>
                                    <div className="text-2xl font-bold text-cyan-700" data-testid="rest-report-output-http-calls">{outputHttpCalls}</div>
                                </div>
                            </div>
                        </div>
                    </ReportTooltip>

                    <ReportTooltip tooltipText={info.evaluatedHttpCalls}>
                        <div className="bg-gradient-to-br from-pink-50 to-rose-50 border-2 border-pink-300 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3">
                                <div className="bg-pink-500 rounded-full p-2">
                                    <CheckCircle className="w-5 h-5 text-white"/>
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-600">Evaluated HTTP Calls</div>
                                    <div className="text-2xl font-bold text-pink-700" data-testid="rest-report-evaluated-http-calls">{evaluatedHttpCalls}</div>
                                </div>
                            </div>
                        </div>
                    </ReportTooltip>
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

                <div className="mt-4">
                    <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-2 border-slate-300 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <FolderOpen className="w-5 h-5 text-slate-600"/>
                            <span className="text-base font-bold text-slate-900">Test Files</span>
                        </div>
                        <div className="space-y-2">
                            {
                                testFiles.length > 0 ? (
                                    testFiles.map((file, index) => (
                                        <ReportTooltip key={index} tooltipText={getText(info.testFilesLocated,
                                            {
                                                fileName: file.fileName,
                                                numberOfTestCases: file.numberOfTestCases
                                            })}>
                                            <div className="flex items-center gap-3 bg-white rounded-md p-3 border border-slate-200 hover:border-slate-400 hover:shadow-sm transition-all">
                                                <div className={`w-3 h-3 ${getFileColor(index, file.fileName)} rounded-full flex-shrink-0`}></div>
                                                <div className="flex-1 min-w-0">
                                                    <span className="text-sm font-medium text-gray-700 truncate block">{file.fileName}</span>
                                                </div>
                                                <div className="flex-shrink-0 bg-slate-100 px-2 py-1 rounded-md">
                                                    <span className="text-xs font-bold text-slate-700">{file.numberOfTestCases}</span>
                                                </div>
                                            </div>
                                        </ReportTooltip>
                                    ))
                                ) : (
                                    <div className="text-center text-gray-500 italic py-4">No test files generated.</div>
                                )
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Card>
    );
};
