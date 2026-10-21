// Unit 2: Material UI components, themed for Aureo.
//
// The palette mirrors the black/gold tokens in `src/index.css` so MUI and the
// hand-written CSS never disagree. `createTheme` lives in `@mui/material/styles`
// so the whole app can share one theme instance.

import { createTheme } from "@mui/material/styles";

const gold = "#c9a45c";
const goldHover = "#d8b574";

export const aureoTheme = createTheme({
    palette: {
        mode: "dark",
        primary: {
            main: gold,
            hover: goldHover,
            contrastText: "#111"
        },
        secondary: {
            main: "#b8b2a6"
        },
        background: {
            default: "#0f1115",
            paper: "#171a20"
        },
        text: {
            primary: "#f4efe6",
            secondary: "#b8b2a6",
            disabled: "#7d786e"
        },
        divider: "#2a2d33",
        error: {
            main: "#e5484d"
        },
        success: {
            main: "#3fb97f"
        },
        warning: {
            main: gold
        }
    },
    shape: {
        borderRadius: 10
    },
    typography: {
        fontFamily: '"DM Sans", "Inter", sans-serif',
        button: {
            textTransform: "none",
            fontWeight: 600
        }
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8
                },
                containedPrimary: {
                    color: "#111",
                    "&:hover": {
                        backgroundColor: goldHover
                    }
                },
                outlined: {
                    borderColor: gold,
                    color: gold,
                    "&:hover": {
                        borderColor: goldHover,
                        backgroundColor: "rgba(201, 164, 92, 0.08)"
                    }
                }
            }
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: "none",
                    border: "1px solid #2a2d33"
                }
            }
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    backgroundColor: "#171a20",
                    border: "1px solid #2a2d33",
                    backgroundImage: "none"
                }
            }
        },
        MuiTextField: {
            defaultProps: {
                variant: "outlined"
            }
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    backgroundColor: "#1f232b",
                    "& fieldset": {
                        borderColor: "#2a2d33"
                    },
                    "&:hover fieldset": {
                        borderColor: gold
                    },
                    "&.Mui-focused fieldset": {
                        borderColor: gold,
                        borderWidth: 1
                    }
                },
                input: {
                    color: "#f4efe6"
                }
            }
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    fontWeight: 600
                }
            }
        },
        MuiRating: {
            styleOverrides: {
                icon: {
                    color: gold
                },
                iconEmpty: {
                    color: "#2a2d33"
                }
            }
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    borderColor: "#2a2d33"
                },
                head: {
                    color: gold,
                    fontWeight: 700
                }
            }
        }
    }
});

export default aureoTheme;
