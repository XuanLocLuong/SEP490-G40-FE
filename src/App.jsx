import './App.css'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop />
        </>
    )
}

export default App