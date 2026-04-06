import { MenuItem, Select } from '@mui/material';

const listTrangThai = [
    { value: 1, label: 'Chưa bán', color: '#2e7d32', bg: '#edf7ed' },
    { value: 2, label: 'Đã bán', color: '#c62828', bg: '#fdecea' },
    { value: 3, label: 'Khách hẹn', color: '#ed6c02', bg: '#fff4e5' },
    { value: 4, label: 'Cho mượn', color: '#0288d1', bg: '#e8f4fd' },
    { value: 5, label: 'Khác', color: '#616161', bg: '#f5f5f5' }
];

export default function TrangThaiHangSelect({ value, onChange }: any) {
    const current = listTrangThai.find((x) => x.value === value);

    return (
        <Select
            size="small"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            sx={{
                minWidth: 95,
                height: 24,
                fontSize: 12,
                borderRadius: '16px',
                backgroundColor: current?.bg,
                color: current?.color,
                fontWeight: 500,

                '& .MuiSelect-select': {
                    padding: '2px 8px'
                },

                '& fieldset': {
                    border: 'none'
                }
            }}>
            {listTrangThai.map((x) => (
                <MenuItem
                    key={x.value}
                    value={x.value}
                    sx={{
                        fontSize: 12,
                        color: x.color
                    }}>
                    {x.label}
                </MenuItem>
            ))}
        </Select>
    );
}
