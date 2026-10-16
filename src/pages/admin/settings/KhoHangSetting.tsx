import { Box, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { IOSSwitch } from '../../../components/Switch/IOSSwitch';
import KhoHangService from '../../../services/kho_hang/KhoHangService';

const KhoHangSetting: React.FC = () => {
    const [choPhepXuatAm, setChoPhepXuatAm] = useState(false);

    useEffect(() => {
        (async () => {
            const data = await KhoHangService.GetCauHinhKho();
            setChoPhepXuatAm(data?.choPhepXuatAm ?? false);
        })();
    }, []);

    const handleToggle = async () => {
        const next = !choPhepXuatAm;
        setChoPhepXuatAm(next);
        await KhoHangService.UpdateCauHinhKho(next);
    };

    return (
        <Box sx={{ bgcolor: '#F9FAFB', borderRadius: '8px', padding: '8px 12px' }}>
            <Stack direction={'row'} justifyContent={'space-between'} alignItems={'center'}>
                <Typography sx={{ color: '#374151', fontSize: '13px' }}>Cho phép xuất âm</Typography>
                <IOSSwitch checked={choPhepXuatAm} onChange={handleToggle} />
            </Stack>
            <Typography sx={{ color: '#6B7280', fontSize: '12px', mt: 0.5 }}>
                Tắt: không cho bán / xuất hàng hóa khi số tồn không đủ.
            </Typography>
        </Box>
    );
};

export default KhoHangSetting;
