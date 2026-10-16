import { createTheme } from '@mui/material/styles';
import appTheme from './theme'; // kế thừa theme chung (màu chủ đạo) của app

class StyleOveride {
    placeholderTextField = createTheme(appTheme, {
        components: {
            MuiInputBase: {
                styleOverrides: {
                    input: {
                        '&::placeholder': {
                            fontSize: 14 // Change this value to your desired font size
                        }
                    }
                }
            }
        }
    });
}

export default new StyleOveride();
