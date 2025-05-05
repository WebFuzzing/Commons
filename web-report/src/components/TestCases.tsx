import {Card} from "@/components/ui/card.tsx";
import type React from "react";
import {getColor} from "@/utils.tsx";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip.tsx";

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
            <div className={`font-bold cursor-default text-lg mb-2 mt-4  ${getColor(code, false, isFault)}`}>{code}</div>
            <Card className="border-2 border-black p-0 rounded-none">
                <div className="max-h-[300px] overflow-auto">
                    {
                        // Test Cases
                        test_cases.map((testCase, key) => (
                            <TooltipProvider key={key}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div onClick={(event) => addTestTab(testCase, event)}
                                             className="border-b-2 border-black p-3 hover:bg-gray-100 cursor-pointer">{testCase}</div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Press ctrl while clicking to open without navigating it.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                        ))
                    }
                </div>
            </Card>
        </>
    )
}