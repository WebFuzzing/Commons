import type React from "react";
import {RestReports} from "@/components/RestReports.tsx";
import {GeneratedTests} from "@/components/GeneratedTests.tsx";
import {FaultsComponent} from "@/components/FaultsComponent.tsx";
import {Faults, RESTReport, TestCase} from "@/types/GeneratedTypes.tsx";

interface IOverviewType {
    rest: RESTReport | undefined
    testCases: Array<TestCase>,
    testFiles: Array<{
        fileName: string,
        numberOfTestCases: number
    }>,
    faults: Faults
}

export const Overview: React.FC<IOverviewType> = ({rest, testCases, testFiles, faults}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Panel */}
            {rest ? <RestReports {...rest}/> : <div>Please provide rest report.</div>}
            {/* Right Panel */}
            <div className="flex flex-col gap-6">
                {/* Generated Tests */}
                <GeneratedTests totalTests={testCases.length} testFiles={testFiles} outputHttpCalls={rest?.outputHttpCalls}/>
                {/* Faults */}
                <FaultsComponent {...faults}/>
            </div>
        </div>
    )
}