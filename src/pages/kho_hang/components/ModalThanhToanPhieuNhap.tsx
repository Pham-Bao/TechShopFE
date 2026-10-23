import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography
} from '@mui/material';
import { enqueueSnackbar } from 'notistack';
import { Guid } from 'guid-typescript';
import Cookies from 'js-cookie';
import KhoHangService from '../../../services/kho_hang/KhoHangService';
import TaiKhoanNganHangServices from '../../../services/so_quy/TaiKhoanNganHangServices';
import { TaiKhoanNganHangDto } from '../../../services/so_quy/Dto/TaiKhoanNganHangDto';
import AutocompleteAccountBank from '../../../components/Autocomplete/AccountBank';
import { HINH_THUC_THANH_TOAN } from '../../../lib/appconst';

const formatMoney = (value: number) => Number(value || 0).toLocaleString('vi-VN');

export interface IPhieuCanThanhToan {
    id: string;
    maHoaDon: string;
    tenNhaCungCap?: string;
    conNo: number; // số còn nợ nhà cung cấp của phiếu (đã lưu)
}

type Props = {
    phieu: IPhieuCanThanhToan | null; // null: đóng
    onClose: () => void;
    onDaThanhToan: (soTien: number) => void;
};

/**
 * Thanh toán thêm cho nhà cung cấp theo phiếu nhập đã hoàn thành: tạo phiếu chi gắn với phiếu nhập
 * (tối đa số còn nợ). Dùng ở màn sửa phiếu nhập và danh sách nhập hàng.
 */
const ModalThanhToanPhieuNhap = ({ phieu, onClose, onDaThanhToan }: Props) => {
    const [hinhThuc, setHinhThuc] = useState<number>(HINH_THUC_THANH_TOAN.TIEN_MAT);
    const [soTien, setSoTien] = useState(0);
    const [idTaiKhoan, setIdTaiKhoan] = useState<string | null>(null);
    const [allBankAccount, setAllBankAccount] = useState<TaiKhoanNganHangDto[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        TaiKhoanNganHangServices.GetAllBankAccount(Cookies.get('IdChiNhanh') ?? Guid.EMPTY).then((data) =>
            setAllBankAccount(data ?? [])
        );
    }, []);

    useEffect(() => {
        if (!phieu) return;
        // mặc định trả hết số còn nợ
        setHinhThuc(HINH_THUC_THANH_TOAN.TIEN_MAT);
        setSoTien(phieu.conNo);
        setIdTaiKhoan(null);
    }, [phieu]);

    const doiHinhThuc = (value: number) => {
        setHinhThuc(value);
        setIdTaiKhoan(
            value === HINH_THUC_THANH_TOAN.CHUYEN_KHOAN ? allBankAccount.find((x) => x.isDefault)?.id ?? null : null
        );
    };

    const thanhToan = async () => {
        if (!phieu || isSaving) return;
        if (soTien <= 0 || soTien > phieu.conNo + 0.000001) {
            enqueueSnackbar('Số tiền thanh toán phải lớn hơn 0 và không vượt quá số còn nợ', { variant: 'warning' });
            return;
        }
        if (hinhThuc === HINH_THUC_THANH_TOAN.CHUYEN_KHOAN && !idTaiKhoan) {
            enqueueSnackbar('Vui lòng chọn tài khoản ngân hàng', { variant: 'warning' });
            return;
        }
        setIsSaving(true);
        try {
            const ok = await KhoHangService.ThanhToanPhieuNhap({
                idPhieuNhap: phieu.id,
                soTien,
                hinhThucThanhToan: hinhThuc,
                idTaiKhoanNganHang: idTaiKhoan
            });
            if (!ok) return;
            enqueueSnackbar(`Đã thanh toán ${formatMoney(soTien)} cho phiếu nhập ${phieu.maHoaDon}`, {
                variant: 'success'
            });
            onDaThanhToan(soTien);
        } catch (error: any) {
            // lỗi từ Backend đã được httpService hiển thị
            if (!error?.response) {
                enqueueSnackbar(error?.message || 'Thanh toán thất bại', { variant: 'error' });
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={phieu != null} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 800 }}>Thanh toán nhà cung cấp</DialogTitle>
            <DialogContent>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1.5 }}>
                    <Typography sx={{ fontSize: 14 }}>Phiếu nhập</Typography>
                    <Typography sx={{ fontWeight: 700 }}>{phieu?.maHoaDon}</Typography>
                </Stack>
                {phieu?.tenNhaCungCap && (
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 1.5 }}>
                        <Typography sx={{ fontSize: 14 }}>Nhà cung cấp</Typography>
                        <Typography sx={{ fontWeight: 700 }}>{phieu.tenNhaCungCap}</Typography>
                    </Stack>
                )}
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Typography sx={{ fontSize: 14 }}>Còn nợ nhà cung cấp</Typography>
                    <Typography sx={{ fontWeight: 800, color: '#d32f2f' }}>{formatMoney(phieu?.conNo ?? 0)}</Typography>
                </Stack>
                <Typography sx={{ mb: 1, fontWeight: 600 }}>Hình thức thanh toán</Typography>
                <Select
                    fullWidth
                    size="small"
                    value={hinhThuc}
                    onChange={(e) => doiHinhThuc(Number(e.target.value))}
                    sx={{ mb: 2 }}>
                    <MenuItem value={HINH_THUC_THANH_TOAN.TIEN_MAT}>Tiền mặt</MenuItem>
                    <MenuItem value={HINH_THUC_THANH_TOAN.CHUYEN_KHOAN}>Chuyển khoản</MenuItem>
                </Select>
                {hinhThuc === HINH_THUC_THANH_TOAN.CHUYEN_KHOAN && (
                    <Box sx={{ mb: 2 }}>
                        <AutocompleteAccountBank
                            handleChoseItem={(item: TaiKhoanNganHangDto | null) => setIdTaiKhoan(item?.id || null)}
                            idChosed={idTaiKhoan}
                            listOption={allBankAccount}
                        />
                    </Box>
                )}
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography sx={{ fontSize: 14 }}>Số tiền thanh toán</Typography>
                    <TextField
                        size="small"
                        value={formatMoney(soTien)}
                        onChange={(e) => {
                            const value = Number(e.target.value.replace(/\./g, '').replace(/,/g, '') || 0);
                            setSoTien(Math.min(Number.isNaN(value) ? 0 : value, phieu?.conNo ?? 0));
                        }}
                        sx={{ width: 170, '& input': { textAlign: 'right', fontWeight: 700 } }}
                    />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} sx={{ textTransform: 'none' }}>
                    Hủy
                </Button>
                <Button
                    variant="contained"
                    onClick={thanhToan}
                    disabled={isSaving}
                    sx={{ textTransform: 'none', boxShadow: 'none', backgroundColor: 'var(--color-main)' }}>
                    {isSaving ? 'Đang lưu...' : 'Thanh toán'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ModalThanhToanPhieuNhap;
