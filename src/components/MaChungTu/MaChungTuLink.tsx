import React, { useRef, useState } from 'react';
import { Box, SxProps, Theme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { enqueueSnackbar } from 'notistack';
import KhoHangService from '../../services/kho_hang/KhoHangService';
import ModalXemPhieuNhap from '../../pages/kho_hang/components/ModalXemPhieuNhap';

// thời gian ấn giữ để mở chứng từ
const THOI_GIAN_GIU = 1200;
// loại chứng từ mở được: 1.Hóa đơn bán, 19.Hóa đơn sửa, 4.Phiếu nhập
const LOAI_MO_DUOC = [1, 4, 19];

type Props = {
    ma?: string | null;
    id?: string | null; // có id thì không cần tìm theo mã
    idLoaiChungTu?: number | null; // biết trước loại: loại khác phiếu nhập / hóa đơn thì chỉ hiện chữ
    sx?: SxProps<Theme>;
};

/**
 * Mã phiếu nhập / mã hóa đơn trong các danh sách: ấn giữ ~1,2 giây (chuột hoặc cảm ứng) thì mở phiếu nhập
 * (màn sửa phiếu; phiếu đã hủy thì dialog xem) hoặc chi tiết hóa đơn. Bấm thường giữ nguyên hành vi của danh sách.
 */
const MaChungTuLink = ({ ma, id, idLoaiChungTu, sx }: Props) => {
    const navigate = useNavigate();
    const [dangGiu, setDangGiu] = useState(false);
    const [idXemPhieu, setIdXemPhieu] = useState<string | null>(null);
    const hen = useRef<ReturnType<typeof setTimeout> | null>(null);
    // vừa mở bằng ấn giữ: bỏ qua cú click ngay sau đó (không chọn dòng)
    const vuaMo = useRef(false);

    const moChungTu = async () => {
        try {
            const ct = await KhoHangService.GetChungTu_byMa(ma ?? '', id);
            if (!ct || !LOAI_MO_DUOC.includes(ct.idLoaiChungTu)) {
                enqueueSnackbar(ct ? 'Chỉ mở được phiếu nhập hoặc hóa đơn' : `Không tìm thấy chứng từ ${ma ?? ''}`, {
                    variant: 'warning'
                });
                return;
            }
            if (ct.idLoaiChungTu === 4) {
                if (ct.trangThai === 0) {
                    setIdXemPhieu(ct.id); // phiếu đã hủy: chỉ xem
                } else {
                    navigate(`/nhap-hang/${ct.loaiHang ?? 'hang-hoa'}?id=${ct.id}`);
                }
                return;
            }
            navigate(`/giao-dich-thanh-toan?id=${ct.id}`);
        } catch {
            // lỗi từ Backend đã được httpService hiển thị
        }
    };

    const huyGiu = () => {
        if (hen.current) clearTimeout(hen.current);
        hen.current = null;
        setDangGiu(false);
    };
    const batDauGiu = (e: React.PointerEvent) => {
        if (e.button !== 0) return; // chỉ chuột trái / chạm
        vuaMo.current = false;
        setDangGiu(true);
        hen.current = setTimeout(() => {
            hen.current = null;
            setDangGiu(false);
            vuaMo.current = true;
            moChungTu();
        }, THOI_GIAN_GIU);
    };

    if (!ma) return null;
    if (idLoaiChungTu != null && !LOAI_MO_DUOC.includes(idLoaiChungTu)) {
        return (
            <Box component="span" sx={sx}>
                {ma}
            </Box>
        );
    }
    return (
        <>
            {idXemPhieu && <ModalXemPhieuNhap idPhieu={idXemPhieu} onClose={() => setIdXemPhieu(null)} />}
            <Box
                component="span"
                title="Ấn giữ 1 giây để mở"
                onPointerDown={batDauGiu}
                onPointerUp={huyGiu}
                onPointerLeave={huyGiu}
                onPointerCancel={huyGiu}
                onContextMenu={(e) => dangGiu && e.preventDefault()}
                onClickCapture={(e) => {
                    if (vuaMo.current) {
                        vuaMo.current = false;
                        e.stopPropagation();
                        e.preventDefault();
                    }
                }}
                sx={{
                    cursor: 'pointer',
                    userSelect: 'none',
                    WebkitTouchCallout: 'none',
                    color: 'var(--color-main)',
                    // gạch chân chạy dần trong lúc giữ
                    backgroundImage: 'linear-gradient(currentColor, currentColor)',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: '0 100%',
                    backgroundSize: dangGiu ? '100% 2px' : '0% 2px',
                    transition: dangGiu ? `background-size ${THOI_GIAN_GIU}ms linear` : 'none',
                    ...sx
                }}>
                {ma}
            </Box>
        </>
    );
};

// danh sách mã ngăn cách bởi dấu phẩy ("HD001, HD002"): mỗi mã ấn giữ riêng
export const DanhSachMaChungTu = ({ ma, sx }: { ma?: string | null; sx?: SxProps<Theme> }) => {
    const lstMa = (ma ?? '')
        .split(',')
        .map((x) => x.trim())
        .filter((x) => x !== '');
    return (
        <>
            {lstMa.map((x, i) => (
                <React.Fragment key={`${x}_${i}`}>
                    {i > 0 && ', '}
                    <MaChungTuLink ma={x} sx={sx} />
                </React.Fragment>
            ))}
        </>
    );
};

export default MaChungTuLink;
