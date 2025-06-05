import {Card} from "@/components/ui/card.tsx";
import type React from "react";
import {ReportTooltip} from "@/components/ui/report-tooltip.tsx";
import {TestCaseButton} from "@/components/TestCaseButton.tsx";

interface ITestCaseProps {
    code: string | number;
    test_cases: Array<string>;
    addTestTab: (value: string, event: React.MouseEvent<HTMLElement>) => void;
    isFault: boolean;
}

export const TestCases: React.FC<ITestCaseProps> = ({code, test_cases, addTestTab, isFault}) => {

    return (
        <>
            <div className="border-t border-black my-2"></div>
            <Card className="border-2 border-black p-0 rounded-none">
                <div className="max-h-[300px] overflow-auto">
                    {
                        // Test Cases
                        test_cases.map((testCase, key) => (
                            <ReportTooltip key={key} tooltipText="Press CTRL while clicking to open without navigating it.">
                                <TestCaseButton testName={testCase} statusCode={code} onClick={addTestTab} isFault={isFault}/>
                            </ReportTooltip>
                        ))
                    }
                </div>
            </Card>
        </>
    )
}