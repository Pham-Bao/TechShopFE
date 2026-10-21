import React, { useEffect, useRef, useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';

// PhoneAgent chạy trên chính máy tính đang mở trình duyệt (xem Cài đặt > Lấy máy nhanh)
const URL_PHONE_AGENT = 'http://localhost:6789/api/iphone/info';
// chờ sau khi mỗi lần kiểm tra xong (không chồng request): có PhoneAgent 7s, không gọi được PhoneAgent 30s
const CHO_KHI_CO_AGENT = 7000;
const CHO_KHI_KHONG_CO_AGENT = 30000;
const TIMEOUT = 5000;

interface IMayDangCam {
    tenMay: string;
    dungLuong: string;
    pin: number | null;
    imei: string;
}

/**
 * Khung nhỏ góc dưới bên trái: iPhone đang cắm USB (đọc qua PhoneAgent). Không cắm máy / không có PhoneAgent: ẩn.
 */
const IphoneDangCam = () => {
    const [may, setMay] = useState<IMayDangCam | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const dangChay = useRef(true);

    useEffect(() => {
        dangChay.current = true;

        const henLan = (ms: number) => {
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(kiemTra, ms);
        };

        const kiemTra = async () => {
            // tab đang ẩn: không kiểm tra, mở lại tab sẽ kiểm tra ngay (visibilitychange)
            if (!dangChay.current || document.hidden) return;
            const controller = new AbortController();
            const t = setTimeout(() => controller.abort(), TIMEOUT);
            let coAgent = false;
            try {
                const res = await fetch(URL_PHONE_AGENT, { signal: controller.signal });
                coAgent = true;
                const data = await res.json().catch(() => null);
                const tenMay = String(data?.dongMay ?? '');
                // PhoneAgent trả "ERROR: No device found!" khi không có máy
                const coMay = !!data?.udid && !!tenMay && !tenMay.toUpperCase().startsWith('ERROR');
                if (dangChay.current) {
                    setMay(
                        coMay
                            ? {
                                  tenMay,
                                  dungLuong: String(data?.dungLuong ?? ''),
                                  pin: Number(data?.batteryHealth) > 0 ? Number(data.batteryHealth) : null,
                                  imei: String(data?.imei ?? '')
                                      .toUpperCase()
                                      .startsWith('ERROR')
                                      ? ''
                                      : String(data?.imei ?? '')
                              }
                            : null
                    );
                }
            } catch {
                if (dangChay.current) setMay(null);
            } finally {
                clearTimeout(t);
                if (dangChay.current) henLan(coAgent ? CHO_KHI_CO_AGENT : CHO_KHI_KHONG_CO_AGENT);
            }
        };

        const doiTab = () => {
            if (!document.hidden) henLan(0);
        };
        document.addEventListener('visibilitychange', doiTab);
        henLan(0);

        return () => {
            dangChay.current = false;
            document.removeEventListener('visibilitychange', doiTab);
            if (timer.current) clearTimeout(timer.current);
        };
    }, []);

    if (!may) return null;

    const dong = (nhan: string, giaTri: React.ReactNode) => (
        <Stack direction="row" spacing={1} justifyContent="space-between">
            <Typography sx={{ fontSize: 11, color: '#6b7280', lineHeight: 1.5 }}>{nhan}</Typography>
            <Typography sx={{ fontSize: 11, fontWeight: 700, textAlign: 'right', lineHeight: 1.5 }}>
                {giaTri}
            </Typography>
        </Stack>
    );

    return (
        <Box
            sx={{
                position: 'fixed',
                // vừa trong thanh menu trái (rộng 240px): lề 8px mỗi bên
                left: 8,
                bottom: 8,
                zIndex: 1200, // trên nội dung trang, dưới dialog (1300)
                width: 224,
                boxSizing: 'border-box',
                px: 1.25,
                py: 1,
                borderRadius: 2,
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                boxShadow: '0 4px 14px rgba(0,0,0,0.12)'
            }}>
            <Typography sx={{ fontSize: 10, color: '#6b7280', lineHeight: 1.4 }}>Đang kết nối với</Typography>
            <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.5 }}>
                <PhoneIphoneIcon sx={{ fontSize: 16, color: 'var(--color-main)' }} />
                <Typography sx={{ fontSize: 12, fontWeight: 800, flex: 1 }} noWrap title={may.tenMay}>
                    {may.tenMay}
                </Typography>
                <Box sx={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#16a34a' }} title="Đang cắm" />
            </Stack>
            <Stack spacing={0.25}>
                {dong('Dung lượng', may.dungLuong || '-')}
                {dong('Pin', may.pin != null ? `${may.pin}%` : '-')}
                {dong('IMEI', may.imei || '-')}
            </Stack>
        </Box>
    );
};

export default IphoneDangCam;
