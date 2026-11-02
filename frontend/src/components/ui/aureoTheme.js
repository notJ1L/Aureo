// Unit 2: Material UI components, themed for Aureo.
//
// The palette mirrors the black/gold tokens in `src/index.css` so MUI and the
// hand-written CSS never disagree. `createAureoTheme` builds the theme for a
// given `mode` so the same component rules can serve both the dark default and
// the light alternative. The dark values are unchanged from the original theme.

import { createTheme } from "@mui/material/styles";

const PALETTES = {
    dark: {
        mode: "dark",
        gold: "#c9a45c",
        goldHover: "#d8b574",
        goldSoft: "rgba(201, 164, 92, 0.3)",
        goldSoftHover: "rgba(201, 164, 92, 0.08)",
        goldTint: "rgba(201, 164, 92, 0.1)",
        goldTintStrong: "rgba(201, 164, 92, 0.15)",
        goldTintStronger: "rgba(201, 164, 92, 0.22)",
        goldFaint: "rgba(201, 164, 92, 0.4)",
        contrast: "#111",
        secondary: "#b8b2a6",
        bgDefault: "#0b0b0c",
        bgPaper: "#141416",
        textPrimary: "#f4efe6",
        textSecondary: "#b8b2a6",
        textDisabled: "#7d786e",
        divider: "#2a2d33",
        inputBg: "#141416",
        popoverBg: "#1a1a1a",
        dialogBg: "#171a20",
        error: "#e5484d",
        success: "#3fb97f",
        emptyIcon: "#2a2d33",
        shadow: "0 18px 44px rgba(0, 0, 0, 0.75)"
    },
    light: {
        mode: "light",
        gold: "#8b6d12",
        goldHover: "#a5871c",
        goldSoft: "rgba(139, 109, 18, 0.3)",
        goldSoftHover: "rgba(139, 109, 18, 0.08)",
        goldTint: "rgba(139, 109, 18, 0.1)",
        goldTintStrong: "rgba(139, 109, 18, 0.15)",
        goldTintStronger: "rgba(139, 109, 18, 0.22)",
        goldFaint: "rgba(139, 109, 18, 0.4)",
        contrast: "#ffffff",
        secondary: "#4a4a4a",
        bgDefault: "#f5f0e8",
        bgPaper: "#ffffff",
        textPrimary: "#1a1a1a",
        textSecondary: "#4a4a4a",
        textDisabled: "#7a756c",
        divider: "rgba(139, 109, 18, 0.25)",
        inputBg: "#ffffff",
        popoverBg: "#ffffff",
        dialogBg: "#ffffff",
        error: "#c0392b",
        success: "#1f8a54",
        emptyIcon: "rgba(139, 109, 18, 0.2)",
        shadow: "0 18px 44px rgba(26, 26, 26, 0.18)"
    }
};

export function createAureoTheme(mode = "dark") {
    const t = PALETTES[mode] || PALETTES.dark;

    return createTheme({
        palette: {
            mode: t.mode,
            primary: {
                main: t.gold,
                hover: t.goldHover,
                contrastText: t.contrast
            },
            secondary: {
                main: t.secondary
            },
            background: {
                default: t.bgDefault,
                paper: t.bgPaper
            },
            text: {
                primary: t.textPrimary,
                secondary: t.textSecondary,
                disabled: t.textDisabled
            },
            divider: t.divider,
            error: {
                main: t.error
            },
            success: {
                main: t.success
            },
            warning: {
                main: t.gold
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
                        color: t.contrast,
                        "&:hover": {
                            backgroundColor: t.goldHover
                        }
                    },
                    outlined: {
                        borderColor: t.gold,
                        color: t.gold,
                        "&:hover": {
                            borderColor: t.goldHover,
                            backgroundColor: t.goldSoftHover
                        }
                    }
                }
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        backgroundImage: "none",
                        border: `1px solid ${t.divider}`
                    }
                }
            },
            MuiDialog: {
                styleOverrides: {
                    paper: {
                        backgroundColor: t.dialogBg,
                        border: `1px solid ${t.divider}`,
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
                        backgroundColor: t.inputBg,
                        "& fieldset": {
                            borderColor: t.goldSoft
                        },
                        "&:hover fieldset": {
                            borderColor: t.gold
                        },
                        "&.Mui-focused fieldset": {
                            borderColor: t.gold,
                            borderWidth: 1
                        }
                    },
                    input: {
                        color: t.textPrimary
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
                        color: t.textPrimary,
                        fontSize: "0.92rem",
                        padding: "0.5rem 0.8rem",
                        paddingRight: "34px",
                        boxSizing: "border-box"
                    },
                    icon: {
                        color: t.gold,
                        right: 8
                    }
                }
            },
            MuiPopover: {
                styleOverrides: {
                    paper: {
                        backgroundColor: t.popoverBg,
                        backgroundImage: "none",
                        border: `1px solid ${t.goldSoft}`,
                        borderRadius: 8,
                        boxShadow: t.shadow
                    }
                }
            },
            MuiMenu: {
                styleOverrides: {
                    list: {
                        backgroundColor: t.popoverBg,
                        padding: 6
                    },
                    paper: {
                        backgroundColor: t.popoverBg,
                        backgroundImage: "none",
                        border: `1px solid ${t.goldSoft}`
                    }
                }
            },
            MuiMenuItem: {
                styleOverrides: {
                    root: {
                        color: t.textPrimary,
                        fontSize: "0.88rem",
                        borderRadius: 6,
                        "&:hover": {
                            backgroundColor: t.goldTint
                        },
                        "&.Mui-selected": {
                            backgroundColor: t.goldTintStrong,
                            color: t.gold,
                            "&:hover": {
                                backgroundColor: t.goldTintStronger
                            }
                        }
                    }
                }
            },
            /* Fix 3: no browser-blue checkbox anywhere. */
            MuiCheckbox: {
                styleOverrides: {
                    root: {
                        color: t.goldFaint,
                        padding: 4,
                        "&.Mui-checked": {
                            color: t.gold
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
                        color: t.gold
                    },
                    iconEmpty: {
                        color: t.emptyIcon
                    }
                }
            },
            MuiTableCell: {
                styleOverrides: {
                    root: {
                        borderColor: t.divider
                    },
                    head: {
                        color: t.gold,
                        fontWeight: 700
                    }
                }
            }
        }
    });
}

export const aureoTheme = createAureoTheme("dark");

export default aureoTheme;
