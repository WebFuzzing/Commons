import type React from "react";
import {RestReports} from "@/components/RestReports.tsx";
import {GeneratedTests} from "@/components/GeneratedTests.tsx";
import {FaultsComponent} from "@/components/FaultsComponent.tsx";
import {Faults, RESTReport, TestCase} from "@/types/GeneratedTypes.tsx";

interface IOverviewType {
    rest: RESTReport | undefined
    test_cases: Array<TestCase>,
    test_files: Array<{
        file_name: string,
        number_of_test_cases: number
    }>,
    faults: Faults
}

export const Overview: React.FC<IOverviewType> = ({rest, test_cases, test_files, faults}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Panel */}
            {rest ? <RestReports {...rest}/> : <div>Please provide rest report.</div>}
            {/* Right Panel */}
            <div className="flex flex-col gap-6">
                {/* Generated Tests */}
                <GeneratedTests total_tests={test_cases.length} test_files={test_files} total_http_calls={rest?.total_http_calls}/>
                {/* Faults */}
                <FaultsComponent {...faults}/>
            </div>
        </div>
    )
}