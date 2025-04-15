import type React from "react";
import {RestReports} from "@/components/RestReports.tsx";
import {GeneratedTests} from "@/components/GeneratedTests.tsx";
import {Faults} from "@/components/Faults.tsx";
import {IFaultsType, IRestType, ITestCaseType} from "@/Types.tsx";

interface IOverviewType{
    rest: IRestType
    test_cases: Array<ITestCaseType>,
    test_file_paths: Array<string>,
    faults: IFaultsType
}
export const Overview: React.FC<IOverviewType> = ({rest, test_cases, test_file_paths, faults}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Panel */}
            <RestReports {...rest}/>
            {/* Right Panel */}
            <div className="flex flex-col gap-6">
                {/* Generated Tests */}
                <GeneratedTests total_tests={test_cases.length} total_test_files={test_file_paths.length} />
                {/* Faults */}
                <Faults {...faults}/>
            </div>
        </div>
    )
}