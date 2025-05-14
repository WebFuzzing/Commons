import type React from "react"
import {useState} from "react"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {X} from "lucide-react"
import {Header} from "@/components/Header.tsx";
import {Overview} from "@/pages/Overview.tsx";
import {Endpoints} from "@/pages/Endpoints.tsx";
import {TestResults} from "@/pages/TestResults.tsx";

import {ScrollArea, ScrollBar} from "@/components/ui/scroll-area.tsx";
import {WebFuzzingReport} from "@/types/GeneratedTypes.tsx";
import {ITestFiles} from "@/types/General.tsx";


export interface ITestTabs {
    value: string;
}

export interface IDashboard {
    data: WebFuzzingReport;
    test_files: Array<ITestFiles>;
}

export const Dashboard: React.FC<IDashboard> = ({data, test_files}) => {
    const [activeTab, setActiveTab] = useState("overview")

    const [testTabs, setTestTabs] = useState<Array<ITestTabs>>([]);

    const addTestTab = (test_name: string, event: React.MouseEvent<HTMLElement>) => {
        if (!testTabs.find((t) => t.value === test_name)) {
            setTestTabs([{value: test_name}, ...testTabs]);
        }

        if (!event.ctrlKey) {
            setActiveTab(test_name);
        }
    }

    const handleCloseTestsTab = (test_name: string) => {
        const updatedTabs = testTabs.filter((t) => t.value !== test_name);
        setTestTabs(updatedTabs);
        if (updatedTabs.length === 0) {
            setActiveTab("endpoints")
        } else {
            setActiveTab(updatedTabs[0].value)
        }
    }
    return (
        <div className="border border-black p-4 w-[80%] mx-auto bg-white">
            <Header date={data.creation_time}
                    schema_version={data.schema_version}
                    tool_name_version={`${data.tool_name}-${data.tool_version}`}/>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex justify-center mb-8 w-full">
                    <TabsList className={`flex gap-4 w-[80%] max-w-[700px] h-auto p-1 bg-transparent`}>
                        <TabsTrigger
                            value="overview"
                            className="min-w-[150px] py-3 border border-gray-300 data-[state=active]:bg-white data-[state=active]:border-2 data-[state=active]:border-black data-[state=active]:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                            data-testid="tab-overview"
                        >
                            Overview
                        </TabsTrigger>
                        <TabsTrigger
                            value="endpoints"
                            className="min-w-[150px] py-3 border border-gray-300 data-[state=active]:bg-white data-[state=active]:border-2 data-[state=active]:border-black data-[state=active]:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                            data-testid="tab-endpoints"
                        >
                            Endpoints
                        </TabsTrigger>
                    </TabsList>
                </div>
                <div className="border-t border-black my-2"></div>

                <div className="flex justify-center mb-8 w-full">
                    {
                        <TabsList className={`flex gap-4 w-[80%] max-w-[700px] h-auto p-1 bg-transparent`}>
                            <ScrollArea className="w-[130%] whitespace-nowrap py-3">
                                {
                                    testTabs.map((test, index) => (
                                        <TabsTrigger
                                            value={`${test.value}`}
                                            key={index}
                                            className="min-w-[150px] py-3 border border-gray-300 data-[state=active]:bg-orange-50 data-[state=active]:border-2 data-[state=active]:border-black data-[state=active]:shadow-[2px_2px_0px_0px_rgba(0,0,0,0)]"
                                        >
                                            <div className="flex justify-between items-center w-full">
                                                {test.value}
                                                <div className="hover:bg-red-300 rounded-2xl"
                                                     onClick={() => handleCloseTestsTab(test.value)}>
                                                    <X size={16}/>
                                                </div>
                                            </div>
                                        </TabsTrigger>
                                    ))
                                }
                                <ScrollBar orientation="horizontal"/>
                            </ScrollArea>
                        </TabsList>
                    }
                </div>

                <TabsContent value="overview" className="mt-0">
                    <Overview rest={data.problem_details.rest}
                              test_cases={data.test_cases}
                              test_file_paths={data.test_file_paths}
                              faults={data.faults}/>
                </TabsContent>

                <TabsContent value="endpoints">
                    <Endpoints addTestTab={addTestTab} data={data}/>
                </TabsContent>

                {
                    testTabs.map((test, index) => (
                        <TabsContent value={`${test.value}`} key={index}>
                            <TestResults test_case_name={test.value}
                                         test_cases={data.test_cases}
                                         found_faults={data.faults.found_faults}
                                         problem_details={data.problem_details}
                                         test_files={test_files}/>
                        </TabsContent>
                    ))
                }
            </Tabs>
        </div>
    )
}

