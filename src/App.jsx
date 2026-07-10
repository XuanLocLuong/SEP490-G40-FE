import './App.css'
import {AuthProvider} from "./contexts/AuthContext.jsx";
import {BrowserRouter} from "react-router-dom";
import AppRouter from "./routes/AppRouter.jsx";

function App() {
    return (
        <>
            <AuthProvider>
                <BrowserRouter>
                    <AppRouter />
                </BrowserRouter>
            </AuthProvider>
        </>
    )
}

export default App