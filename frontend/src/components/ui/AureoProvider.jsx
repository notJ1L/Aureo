// Wraps the app in the Aureo Material UI theme so every MUI component picks
// up the black/gold palette automatically.
//
// It is mounted once in `src/main.jsx`. Pages that only use plain HTML never
// need to know about it.
//
// The Material UI `CssBaseline` reset is deliberately not used. Aureo already
// has its own global reset in `src/index.css` and `src/App.css`, and a second
// reset would fight with it over the heading, list, and paragraph styles.

import { ThemeProvider } from "@mui/material/styles";
import aureoTheme from "./aureoTheme";

export function AureoProvider({ children }) {
    return <ThemeProvider theme={aureoTheme}>{children}</ThemeProvider>;
}

export default AureoProvider;
