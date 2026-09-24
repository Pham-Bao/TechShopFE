import { Box, Snackbar, Alert, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { IOSSwitch } from '../../../components/Switch/IOSSwitch';
import CauHinhHoaDonService from '../../../services/cau_hinh_hoa_don/CauHinhHoaDonService';
import { LoaiChungTu } from '../../../lib/appconst';

const LoaiHoaDonSetting: React.FC = () => {
    const [checkedBan, setCheckedBan] = useState(true);
    const [checkedSua, setCheckedSua] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        (async () => {
            const data = await CauHinhHoaDonService.GetAll();
            const rowBan = data?.find((x: any) => x.loaiHoaDon === LoaiChungTu.HOA_DON_BAN_LE);
            const rowSua = data?.find((x: any) => x.loaiHoaDon === LoaiChungTu.HOA_DON_SUA_CHUA);
            setCheckedBan(rowBan?.batTat ?? true);
            setCheckedSua(rowSua?.batTat ?? true);
        })();
    }, []);

    const handleToggleBan = async () => {
        const nextBan = !checkedBan;
        if (!nextBan && !checkedSua) {
            setErrorMsg('Phải bật ít nhất 1 loại hóa đơn');
            return;
        }
        setCheckedBan(nextBan);
        await CauHinhHoaDonService.UpdateBatTat(LoaiChungTu.HOA_DON_BAN_LE, nextBan);
    };

    const handleToggleSua = async () => {
        const nextSua = !checkedSua;
        if (!nextSua && !checkedBan) {
            setErrorMsg('Phải bật ít nhất 1 loại hóa đơn');
            return;
        }
        setCheckedSua(nextSua);
        await CauHinhHoaDonService.UpdateBatTat(LoaiChungTu.HOA_DON_SUA_CHUA, nextSua);
    };

    return (
        <Box marginTop={'8px'}>
            <Snackbar open={!!errorMsg} autoHideDuration={3000} onClose={() => setErrorMsg('')}>
                <Alert severity="warning" onClose={() => setErrorMsg('')}>
                    {errorMsg}
                </Alert>
            </Snackbar>

            <Typography
                sx={{
                    color: 'black',
                    fontSize: '14px',
                    fontWeight: '400',
                    fontFamily: 'Roboto',
                    marginBottom: '4px'
                }}>
                Loại hóa đơn
            </Typography>

            <Stack direction={'row'} justifyContent={'space-between'} alignItems={'center'} mb={1}>
                <Typography sx={{ color: '#4C4B4C', fontSize: '13px', fontFamily: 'Roboto' }}>Hóa đơn bán</Typography>
                <IOSSwitch checked={checkedBan} onChange={handleToggleBan} />
            </Stack>

            <Stack direction={'row'} justifyContent={'space-between'} alignItems={'center'}>
                <Typography sx={{ color: '#4C4B4C', fontSize: '13px', fontFamily: 'Roboto' }}>Hóa đơn sửa</Typography>
                <IOSSwitch checked={checkedSua} onChange={handleToggleSua} />
            </Stack>
        </Box>
    );
};

export default LoaiHoaDonSetting;
