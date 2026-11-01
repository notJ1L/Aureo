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
            default: "#0b0b0c",
            paper: "#141416"
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
                    backgroundColor: "#141416",
                    "& fieldset": {
                        borderColor: "rgba(201, 164, 92, 0.3)"
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
        /* Fix 2: one gold-themed Select for every dropdown in the app. The
         * theme-level overrides mean no component has to pass an sx prop. */
        MuiSelect: {
            defaultProps: {
                size: "small"
            },
            styleOverrides: {
                root: {
                    backgroundColor: "transparent"
                },
                select: {
                    color: "#f4efe6",
                    fontSize: "0.92rem",
                    padding: "0.5rem 0.8rem",
                    paddingRight: "34px",
                    boxSizing: "border-box"
                },
                icon: {
                    color: gold,
                    right: 8
                }
            }
        },
        MuiPopover: {
            styleOverrides: {
                paper: {
                    backgroundColor: "#1a1a1a",
                    backgroundImage: "none",
                    border: "1px solid rgba(201, 164, 92, 0.3)",
                    borderRadius: 8,
                    boxShadow: "0 18px 44px rgba(0, 0, 0, 0.75)"
                }
            }
        },
        MuiMenu: {
            styleOverrides: {
                list: {
                    backgroundColor: "#1a1a1a",
                    padding: 6
                },
                paper: {
                    backgroundColor: "#1a1a1a",
                    backgroundImage: "none",
                    border: "1px solid rgba(201, 164, 92, 0.3)"
                }
            }
        },
        MuiMenuItem: {
            styleOverrides: {
                root: {
                    color: "#f4efe6",
                    fontSize: "0.88rem",
                    borderRadius: 6,
                    "&:hover": {
                        backgroundColor: "rgba(201, 164, 92, 0.1)"
                    },
                    "&.Mui-selected": {
                        backgroundColor: "rgba(201, 164, 92, 0.15)",
                        color: gold,
                        "&:hover": {
                            backgroundColor: "rgba(201, 164, 92, 0.22)"
                        }
                    }
                }
            }
        },
        /* Fix 3: no browser-blue checkbox anywhere. */
        MuiCheckbox: {
            styleOverrides: {
                root: {
                    color: "rgba(201, 164, 92, 0.4)",
                    padding: 4,
                    "&.Mui-checked": {
                        color: gold
                    }
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
