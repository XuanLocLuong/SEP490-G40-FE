import './App.css'
import {AuthProvider} from "./contexts/AuthContext.jsx";
import {ChatProvider} from "./contexts/ChatContext.jsx";
import {BrowserRouter} from "react-router-dom";
import {ToastContainer} from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import AppRouter from "./routes/AppRouter.jsx";
import ScrollToTop from "./components/common/ScrollToTop.jsx";
import DocumentTitle from "./components/common/DocumentTitle.jsx";

function App() {
    return (
        <>
            <AuthProvider>
                <BrowserRouter>
                    <ChatProvider>
                        <ScrollToTop />
                        <DocumentTitle />
                        <AppRouter />
                    </ChatProvider>
                </BrowserRouter>
            </AuthProvider>
            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop
                closeButton
                pauseOnHover
                draggable
            />
        </>
    )
}

export default App
