import React, { useState, useEffect } from 'react';
import { TextField, Menu, MenuItem, InputAdornment, IconButton } from '@mui/material';
// import MaskedInput from 'react-text-mask';
import { format, parse, isValid } from 'date-fns';
import { vi } from 'date-fns/locale';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

interface DateInputWithMaskProps {
    label: string;
    formatType: 'dd/MM/yyyy' | 'dd/MM';
    value: string;
    onChange: (date: string) => void;
    width?: string; // Tuỳ chỉnh chiều rộng
    height?: string; // Tuỳ chỉnh chiều cao
}

const DateInputWithMask: React.FC<DateInputWithMaskProps> = ({
    label,
    formatType,
    value,
    onChange,
    width = '100%',
    height = '40px' // Giá trị mặc định
}) => {
    const [inputValue, setInputValue] = useState(value);
    const [currentFormat, setCurrentFormat] = useState(formatType);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    useEffect(() => {
        if (value) {
            const isValidFormat = /^\d{2}\/\d{2}\/\d{4}$/.test(value);
            if (!isValidFormat) {
                // console.error('Giá trị không đúng định dạng dd/MM/yyyy:', value);
                setInputValue(value);
                return;
            }

            const parsedDate = parse(value, 'dd/MM/yyyy', new Date(), { locale: vi });

            if (isValid(parsedDate)) {
                if (parsedDate.getFullYear() === 1000) {
                    setInputValue(format(parsedDate, 'dd/MM'));
                    setCurrentFormat('dd/MM'); // Đổi format để ẩn phần năm
                } else {
                    setInputValue(format(parsedDate, 'dd/MM/yyyy'));
                    setCurrentFormat('dd/MM/yyyy');
                }
            } else {
                setInputValue('');
            }
        } else {
            console.log('Giá trị value ban đầu là null hoặc rỗng.');
            setInputValue('');
        }
    }, [value]);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = event.target.value;

        let formattedDate;

        if (currentFormat === 'dd/MM/yyyy' && rawValue.length === 10 && rawValue.endsWith('____')) {
            const [day, month] = rawValue.split('/').map(Number);

            if (day && month) {
                const newDateWithYear1000 = new Date(1000, month - 1, day);
                if (!isNaN(newDateWithYear1000.getTime())) {
                    formattedDate = format(newDateWithYear1000, 'yyyy-MM-dd');
                }
            }
        } else {
            const parsedDate = parse(rawValue, currentFormat, new Date(), { locale: vi });

            if (isValid(parsedDate)) {
                if (currentFormat === 'dd/MM') {
                    const newDateWithYear1000 = new Date(parsedDate);
                    newDateWithYear1000.setFullYear(1000);
                    formattedDate = format(newDateWithYear1000, 'yyyy-MM-dd');
                } else {
                    formattedDate = format(parsedDate, 'yyyy-MM-dd');
                }
            }
        }

        if (formattedDate) {
            onChange(formattedDate);
        }

        setInputValue(rawValue);
    };

    const mask =
        currentFormat === 'dd/MM/yyyy'
            ? [/[0-3]/, /[0-9]/, '/', /[0-1]/, /[0-9]/, '/', /[1-9]/, /[0-9]/, /[0-9]/, /[0-9]/]
            : [/[0-3]/, /[0-9]/, '/', /[0-1]/, /[0-9]/];

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleFormatChange = (format: 'dd/MM/yyyy' | 'dd/MM') => {
        setCurrentFormat(format);
        handleClose();
    };

    return (
        <div style={{ position: 'relative', width }}>
            <TextField
                label={label}
                value={inputValue}
                onChange={handleInputChange}
                InputLabelProps={{
                    shrink: true, // Đảm bảo nhãn luôn hiển thị
                    style: {
                        color: '#1976d2', // Màu xanh dương
                        fontSize: '14px'
                    }
                }}
                InputProps={{
                    // inputComponent: MaskedInput as any,
                    inputProps: {
                        mask: mask,
                        placeholder: currentFormat === 'dd/MM/yyyy' ? 'dd/mm/yyyy' : 'dd/mm',
                        style: {
                            fontSize: '16px',
                            height: height
                        }
                    },
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton onClick={handleClick}>
                                <ArrowDropDownIcon />
                            </IconButton>
                        </InputAdornment>
                    )
                }}
                sx={{
                    width: width,
                    height: height,
                    '& .MuiInputBase-root': {
                        height: height // Điều chỉnh chiều cao tổng thể
                    }
                }}
            />
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                MenuListProps={{ 'aria-labelledby': 'basic-button' }}>
                <MenuItem onClick={() => handleFormatChange('dd/MM/yyyy')}>Ngày/Tháng/Năm</MenuItem>
                <MenuItem onClick={() => handleFormatChange('dd/MM')}>Ngày/Tháng</MenuItem>
            </Menu>
        </div>
    );
};

export default DateInputWithMask;
