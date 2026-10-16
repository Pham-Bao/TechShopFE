import { createTheme } from '@mui/material/styles';

/**
 * Theme giao diện chung của TechShop: tông sáng trung tính, nút chính đen, điểm nhấn xanh dương.
 * Chỉ thay đổi màu sắc / hình thức hiển thị của component MUI, không ảnh hưởng tính năng.
 * Các màu ở đây đồng bộ với biến CSS trong custom.css (--color-main, --color-second...).
 */
const COLOR_MAIN = '#111827'; // đen xám
const COLOR_MAIN_DARK = '#030712';
const COLOR_MAIN_LIGHT = '#374151';
const COLOR_ACCENT = '#2563EB'; // xanh dương
const COLOR_ACCENT_DARK = '#1D4ED8';

const appTheme = createTheme({
    palette: {
        primary: { main: COLOR_MAIN, dark: COLOR_MAIN_DARK, light: COLOR_MAIN_LIGHT, contrastText: '#fff' },
        secondary: { main: COLOR_ACCENT, dark: COLOR_ACCENT_DARK, contrastText: '#fff' },
        info: { main: COLOR_ACCENT_DARK, contrastText: '#fff' },
        background: { default: '#F5F6F8', paper: '#fff' },
        text: { primary: '#111827', secondary: '#6B7280' },
        divider: '#E5E7EB'
    },
    shape: { borderRadius: 10 },
    typography: {
        fontFamily:
            "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        button: { fontWeight: 500 }
    },
    components: {
        MuiButton: {
            defaultProps: { disableElevation: true },
            styleOverrides: {
                root: { textTransform: 'none', borderRadius: 8 },
                containedPrimary: {
                    '&:hover': { backgroundColor: COLOR_MAIN_LIGHT }
                },
                // nút phụ: nền trắng, viền xám nhạt, chữ đậm (kiểu Filter / Sort / Export)
                outlined: {
                    borderColor: '#E5E7EB',
                    backgroundColor: '#fff',
                    '&:hover': { borderColor: '#D1D5DB', backgroundColor: '#F9FAFB' }
                },
                outlinedPrimary: { color: COLOR_MAIN }
            }
        },
        MuiIconButton: {
            styleOverrides: { root: { borderRadius: 8 } }
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#9CA3AF' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: COLOR_ACCENT }
                },
                notchedOutline: { borderColor: '#D1D5DB' }
            }
        },
        MuiInputLabel: {
            styleOverrides: {
                root: { '&.Mui-focused': { color: COLOR_ACCENT_DARK } }
            }
        },
        MuiTabs: {
            styleOverrides: {
                indicator: { backgroundColor: COLOR_MAIN, height: 2, borderRadius: 2 }
            }
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 500,
                    '&.Mui-selected': { color: COLOR_MAIN, fontWeight: 600 }
                }
            }
        },
        MuiPaginationItem: {
            styleOverrides: {
                root: {
                    '&.Mui-selected': {
                        backgroundColor: COLOR_MAIN,
                        color: '#fff',
                        '&:hover': { backgroundColor: COLOR_MAIN_DARK }
                    }
                }
            }
        },
        MuiDialog: {
            styleOverrides: { paper: { borderRadius: 14 } }
        },
        MuiDialogTitle: {
            styleOverrides: { root: { color: COLOR_MAIN_DARK } }
        },
        MuiChip: {
            styleOverrides: { root: { borderRadius: 6 } }
        },
        MuiTooltip: {
            styleOverrides: { tooltip: { backgroundColor: COLOR_MAIN_DARK } }
        }
    }
});

export default appTheme;
