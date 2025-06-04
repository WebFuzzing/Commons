import {useAppContext} from "@/AppProvider.tsx";
import {LoadingScreen} from "@/components/LoadingScreen.tsx";
import {Dashboard} from "@/components/Dashboard.tsx";

export const AppContent: React.FC = () => {
    const {data, loading, error} = useAppContext();

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
            {data && <Dashboard/>}
        </main>
    )
}