import './App.css'
import {Dashboard} from "@/components/Dashboard.tsx";
import {useEffect, useState} from "react";
import {WebFuzzingReport} from "@/types/GeneratedTypes.tsx";
import {LoadingScreen} from "@/components/LoadingScreen.tsx";
import {fetchFileContent} from "@/lib/utils";
import {ITestFiles} from "@/types/General.tsx";

function App() {

    const [data, setData] = useState<WebFuzzingReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [testFiles, setTestFiles] = useState<ITestFiles[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const jsonData = await fetchFileContent('./report.json') as WebFuzzingReport;
                setData(jsonData);
            } catch (error: Error | unknown) {
                if (error instanceof Error) {
                    setError("Could not load the report file. Please check if the file exists and is accessible in /public folder.");
                } else {
                    console.error(error);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        if(data?.test_file_paths){
            data.test_file_paths.map(file => {
                fetchFileContent(file).then((content) => {
                    if (typeof content === "string") {
                        setTestFiles(prev => [...prev, {
                            name: file,
                            code: content
                        }]);
                    } else {
                        setError("Could not load the test file. Please check if the file exists and is accessible.");
                    }
                }).catch((error) => {
                    console.error(error);
                    setError("Could not load the test file. Please check if the file exists and is accessible.");
                })
            })
        }
    }, [data]);

    if (error){
        return (
            <main className="min-h-screen p-4 bg-gray-100">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="bg-white p-4 rounded shadow-md">
                        <h1 className="text-xl font-bold">Error</h1>
                        <p>{error}</p>
                    </div>
                </div>
            </main>
        )
    }

    if (loading) {
        return (
            <main className="min-h-screen p-4 bg-gray-100">
                <LoadingScreen/>
            </main>
        )
    }
    return (
        <main className="min-h-screen p-4 bg-gray-100">
            {data && <Dashboard data={data} test_files={testFiles} />}
        </main>
    )
}

export default App
