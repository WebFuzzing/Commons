import type React from "react"
import {useState} from "react"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {X} from "lucide-react"
import {Header} from "@/components/Header.tsx";
import {Overview} from "@/pages/Overview.tsx";
import {Endpoints} from "@/pages/Endpoints.tsx";
import {TestResults} from "@/pages/TestResults.tsx";

import {ScrollArea, ScrollBar} from "@/components/ui/scroll-area.tsx";
import {useAppContext} from "@/AppProvider.tsx";


export interface ITestTabs {
    value: string;
}

export const Dashboard: React.FC = () => {
    const {data} = useAppContext();

    const [activeTab, setActiveTab] = useState("overview")

    const [testTabs, setTestTabs] = useState<Array<ITestTabs>>([]);

    const addTestTab = (testName: string, event: React.MouseEvent<HTMLElement>) => {
        if (!testTabs.find((t) => t.value === testName)) {
            setTestTabs([{value: testName}, ...testTabs]);
        }

        if (!event.ctrlKey) {
            setActiveTab(testName);
        }
    }

    const handleCloseTestsTab = (testName: string) => {
        const updatedTabs = testTabs.filter((t) => t.value !== testName);
        setTestTabs(updatedTabs);
        if (updatedTabs.length === 0) {
            setActiveTab("endpoints")
        } else {
            setActiveTab(updatedTabs[0].value)
        }
    }

    if(!data) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-lg font-semibold">Loading...</p>
            </div>
        );
    }

    const numberOfTestCaseOfFiles = data.testFilePaths.map((testFile) => {
        return {
            "fileName":  testFile,
            "numberOfTestCases": data.testCases.filter((testCase) => testCase.filePath === testFile).length
        }
    });

    return (
        <div className="border border-black p-4 w-[80%] mx-auto bg-white">
            <Header date={data.creationTime}
                    schemaVersion={data.schemaVersion}
                    toolNameVersion={`${data.toolName}-${data.toolVersion}`}/>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex justify-center mb-2 w-full">
                    <TabsList className={`flex gap-4 w-[80%] max-w-[700px] h-auto p-1 bg-transparent`}>
                        <TabsTrigger
                            value="overview"
                            className="min-w-[150px] py-3 border border-gray-500 data-[state=active]:bg-blue-100 data-[state=active]:border-2 data-[state=active]:border-black data-[state=active]:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                            data-testid="tab-overview"
                        >
                            Overview
                        </TabsTrigger>
                        <TabsTrigger
                            value="endpoints"
                            className="min-w-[150px] py-3 border border-gray-500 data-[state=active]:bg-blue-100 data-[state=active]:border-2 data-[state=active]:border-black data-[state=active]:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                            data-testid="tab-endpoints"
                        >
                            Endpoints
                        </TabsTrigger>
                    </TabsList>
                </div>
                <div className="border-t border-black my-2"></div>

                <div className="flex justify-center w-full">
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
                    <Overview rest={data.problemDetails.rest}
                              testCases={data.testCases}
                              testFiles={numberOfTestCaseOfFiles}
                              faults={data.faults}/>
                </TabsContent>

                <TabsContent value="endpoints">
                    <Endpoints addTestTab={addTestTab}/>
                </TabsContent>

                {
                    testTabs.map((test, index) => (
                        <TabsContent value={`${test.value}`} key={index}>
                            <TestResults testCaseName={test.value} />
                        </TabsContent>
                    ))
                }
            </Tabs>
        </div>
    )
}

