// Wraps the app in the Aureo Material UI theme so every MUI component picks
// up the black/gold palette automatically, and owns the light/dark theme
// state so any component can read or toggle it through `useTheme()`.
//
// It is mounted once in `src/main.jsx`. Pages that only use plain HTML never
// need to know about it.
//
// The Material UI `CssBaseline` reset is deliberately not used. Aureo already
// has its own global reset in `src/index.css` and `src/App.css`, and a second
// reset would fight with it over the heading, list, and paragraph styles.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { createAureoTheme } from "./aureoTheme";

const STORAGE_KEY = "aureo-theme";
const DEFAULT_THEME = "dark";

const ThemeContext = createContext({ theme: DEFAULT_THEME, toggleTheme: () => {} });

function readStoredTheme() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved === "light" || saved === "dark" ? saved : DEFAULT_THEME;
    } catch (error) {
        return DEFAULT_THEME;
    }
}

export function AureoProvider({ children }) {
    const [theme, setTheme] = useState(readStoredTheme);

    // Keep the document attribute and the stored preference in sync with state.
    // The same attribute is set pre-paint in `index.html` to avoid a flash.
    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch (error) {
            /* Storage can be unavailable (private mode); the attribute is enough. */
        }
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme((current) => (current === "dark" ? "light" : "dark"));
    }, []);

    const muiTheme = useMemo(() => createAureoTheme(theme), [theme]);
    const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

    return (
        <ThemeContext.Provider value={value}>
            <ThemeProvider theme={muiTheme}>{children}</ThemeProvider>
        </ThemeContext.Provider>
    );
}

/** Read and toggle the active theme: `const { theme, toggleTheme } = useTheme()`. */
export function useTheme() {
    return useContext(ThemeContext);
}

export default AureoProvider;
