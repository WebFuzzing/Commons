import './App.css'
import {AppProvider} from "@/AppProvider.tsx";
import {AppContent} from "@/AppContent.tsx";

function App() {
    return(
        <AppProvider>
            <AppContent/>
        </AppProvider>
    )
}

export default App
