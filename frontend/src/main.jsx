import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import store from "./redux/store";
import { loadUser } from "./redux/actions/authActions";
import { AureoProvider } from "./components/ui/AureoProvider";
import "./index.css";
import App from "./App.jsx";

// Restore session from stored token on every page load
store.dispatch(loadUser());

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <Provider store={store}>
            <AureoProvider>
                <App />
                <ToastContainer
                    position="bottom-right"
                    autoClose={3200}
                    theme="dark"
                    pauseOnFocusLoss
                    draggable
                />
            </AureoProvider>
        </Provider>
    </StrictMode>
);
