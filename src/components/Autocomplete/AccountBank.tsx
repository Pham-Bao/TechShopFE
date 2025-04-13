import * as React from 'react';
import { useState, useEffect } from 'react';
import { Autocomplete, Button, TextField, Typography, Box, Stack } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { TaiKhoanNganHangDto } from '../../services/so_quy/Dto/TaiKhoanNganHangDto';

export default function AutocompleteAccountBank({
    handleChoseItem,
    idChosed,
    listOption = [],
    handleClickBtnAdd,
    roleAdd = false,
    setTienChuyenKhoan,
    setTienQuyeThePos,
    tongPhaiTra,
    setOtherFieldsZero = () => {
        // Hàm mặc định thực hiện một thao tác nhỏ thay vì để trống
    }
}: any) {
    const [itemChosed, setItemChosed] = useState<TaiKhoanNganHangDto | null>(null);

    useEffect(() => {
        const item = listOption?.find((x: TaiKhoanNganHangDto) => x.id === idChosed);
        setItemChosed(item || null);
    }, [idChosed, listOption]);

    const choseItem = (item: TaiKhoanNganHangDto | null) => {
        if (item) {
            // Nếu có item, cập nhật số tiền cần trả
            handleChoseItem(item);
            if (setTienChuyenKhoan) setTienChuyenKhoan(tongPhaiTra); // Cập nhật tiền chuyển khoản
            if (setTienQuyeThePos) setTienQuyeThePos(tongPhaiTra); // Cập nhật tiền POS
        } else {
            // Nếu bỏ chọn tài khoản, reset các trường
            if (setTienChuyenKhoan) setTienChuyenKhoan(0); // Reset tiền chuyển khoản
            if (setTienQuyeThePos) setTienQuyeThePos(0); // Reset tiền POS
        }
        setOtherFieldsZero(); // Reset các trường còn lại về 0
    };

    return (
        <Autocomplete
            size="small"
            fullWidth
            disablePortal
            autoComplete
            multiple={false}
            value={itemChosed}
            onChange={(event, newValue) => {
                if (!newValue) {
                    // Nếu chọn lại "null" (tức là nhấn X), xóa tài khoản
                    setItemChosed(null); // Xóa tài khoản đã chọn
                    choseItem(null); // Reset các trường liên quan
                } else {
                    setItemChosed(newValue);
                    choseItem(newValue);
                }
            }}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            options={[{ id: '', soTaiKhoan: '' } as TaiKhoanNganHangDto, ...listOption]} // Thêm item rỗng cho việc tạo mới
            getOptionLabel={(option) =>
                option.tenChuThe ? `${option.tenRutGon} - ${option.soTaiKhoan} - ${option.tenChuThe}` : ''
            }
            renderInput={(params) => <TextField {...params} label="Chọn tài khoản" />}
            renderOption={(props, option) => (
                <li {...props} key={option.id || 'add-button'}>
                    {option.id === '' && roleAdd && (
                        <Button
                            sx={{ color: 'var(--color-main)' }}
                            variant="outlined"
                            startIcon={<AddIcon />}
                            fullWidth
                            onClick={handleClickBtnAdd}>
                            Thêm mới
                        </Button>
                    )}
                    {option.id !== '' && (
                        <Stack direction={'row'} spacing={2}>
                            <Stack
                                sx={{ border: '1px solid #ccc', borderRadius: '4px', width: 135, height: 50 }}
                                alignItems={'center'}>
                                <img src={option?.logoNganHang} alt="logo" style={{ width: 135, height: 50 }} />
                            </Stack>
                            <Stack alignItems={'center'}>
                                <Typography style={{ fontSize: '14px', fontWeight: 500 }}>
                                    {option.tenChuThe} ({option.soTaiKhoan})
                                </Typography>
                                <Box component="span" style={{ fontWeight: 500, color: '#acaca5', fontSize: '12px' }}>
                                    {`${option.tenNganHang} ${option.maNganHang}`}
                                </Box>
                            </Stack>
                        </Stack>
                    )}
                </li>
            )}
        />
    );
}
