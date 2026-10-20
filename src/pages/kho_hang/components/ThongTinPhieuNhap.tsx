import React, { useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Divider,
    IconButton,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    Tooltip,
    Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PrintIcon from '@mui/icons-material/Print';
import SaveIcon from '@mui/icons-material/Save';
import { Guid } from 'guid-typescript';
import CreateOrEditCustomerDialog from '../../customer/components/create-or-edit-customer-modal';
import MenuWithDataFromDB from '../../../components/Menu/MenuWithData_fromDB';
import AutocompleteAccountBank from '../../../components/Autocomplete/AccountBank';
import { TypeSearchfromDB } from '../../../enum/TypeSearch_fromDB';
import { IList } from '../../../services/dto/IList';
import { KhachHangDto } from '../../../services/khach-hang/dto/KhachHangDto';
import { CreateOrEditKhachHangDto } from '../../../services/khach-hang/dto/CreateOrEditKhachHangDto';
import { TaiKhoanNganHangDto } from '../../../services/so_quy/Dto/TaiKhoanNganHangDto';
import { HINH_THUC_THANH_TOAN } from '../../../lib/appconst';
import { HINH_THUC_NO, PhieuNhapState } from './usePhieuNhap';

const formatMoney = (value: number) => Number(value || 0).toLocaleString('vi-VN');

/**
 * Khung "Thông tin phiếu nhập" (bên phải màn lập phiếu): nhà cung cấp, tổng tiền, thanh toán, ghi chú,
 * In nháp / Lưu tạm (trình duyệt) / Hoàn thành
 */
const ThongTinPhieuNhap = ({ p }: { p: PhieuNhapState }) => {
    const [anchorNCC, setAnchorNCC] = useState<HTMLElement | null>(null);
    const [isShowModalAddNCC, setIsShowModalAddNCC] = useState(false);
    const [newNCC, setNewNCC] = useState<CreateOrEditKhachHangDto>({} as CreateOrEditKhachHangDto);

    const chonNCC = (item: IList) => {
        setAnchorNCC(null);
        p.setKhachHang({
            ...p.khachHang,
            id: item?.id,
            maKhachHang: item?.maKhachHang ?? '',
            tenKhachHang: item?.text ?? '',
            soDienThoai: item?.text2 ?? ''
        } as CreateOrEditKhachHangDto);
    };
    const themNCC = (customer?: KhachHangDto) => {
        setIsShowModalAddNCC(false);
        if (customer) {
            p.setKhachHang({
                ...p.khachHang,
                id: customer?.id?.toString(),
                maKhachHang: customer?.maKhachHang,
                tenKhachHang: customer?.tenKhachHang ?? '',
                soDienThoai: customer?.soDienThoai ?? ''
            } as CreateOrEditKhachHangDto);
        }
    };
    const moThemNCC = () => {
        setNewNCC({
            id: Guid.EMPTY,
            maKhachHang: '',
            tenKhachHang: '',
            soDienThoai: '',
            diaChi: '',
            idNhomKhach: '',
            idNguonKhach: '',
            gioiTinhNam: false,
            moTa: '',
            idLoaiKhach: 1
        } as CreateOrEditKhachHangDto);
        setIsShowModalAddNCC(true);
    };

    return (
        <Paper elevation={0} sx={{ borderRadius: 2, p: 2, position: 'sticky', top: 16 }}>
            <CreateOrEditCustomerDialog
                visible={isShowModalAddNCC}
                onCancel={() => setIsShowModalAddNCC(false)}
                onOk={themNCC}
                title="Thêm mới nhà cung cấp"
                formRef={newNCC}
            />
            <MenuWithDataFromDB
                open={Boolean(anchorNCC)}
                anchorEl={anchorNCC}
                handleClose={() => setAnchorNCC(null)}
                typeSearch={TypeSearchfromDB.CUSTOMER}
                handleChoseItem={chonNCC}
            />

            <Typography sx={{ fontWeight: 800, mb: 2 }}>
                {p.maPhieu ? `Thông tin phiếu nhập ${p.maPhieu}` : 'Thông tin phiếu nhập'}
            </Typography>

            {p.thoiGianLuuTam && (
                <Alert
                    severity="info"
                    sx={{ mb: 2, fontSize: 13 }}
                    action={
                        <Button color="inherit" size="small" onClick={p.boPhieuTam} sx={{ textTransform: 'none' }}>
                            Bỏ phiếu tạm
                        </Button>
                    }>
                    Đang mở phiếu lưu tạm lúc {p.thoiGianLuuTam}
                </Alert>
            )}

            <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: 'center' }}>
                <TextField
                    id="phieu-nhap-ncc"
                    fullWidth
                    placeholder="Tìm nhà cung cấp"
                    size="small"
                    value={p.khachHang?.tenKhachHang ?? ''}
                    InputProps={{ readOnly: true }}
                    onClick={(e) => setAnchorNCC(e.currentTarget)}
                    sx={{ '& .MuiInputBase-root': { height: 40, fontSize: 13 } }}
                />
                <Tooltip title="Thêm nhà cung cấp">
                    <IconButton
                        sx={{
                            width: 40,
                            height: 40,
                            backgroundColor: 'var(--color-main)',
                            color: '#fff',
                            borderRadius: 1,
                            '&:hover': { backgroundColor: 'var(--color-main-dark)' }
                        }}
                        onClick={moThemNCC}>
                        <AddIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Stack>

            <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                <Typography>Ngày tạo</Typography>
                <Typography fontWeight={700}>{new Date().toLocaleString('vi-VN')}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                <Typography>Tổng tiền hàng</Typography>
                <Typography fontWeight={800}>{formatMoney(p.tongTienHang)}</Typography>
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography sx={{ fontWeight: 800, fontSize: 16 }}>Cần trả nhà cung cấp</Typography>
                <Typography sx={{ fontWeight: 800, color: 'var(--color-main)', fontSize: 22 }}>
                    {formatMoney(p.tongTienHang)}
                </Typography>
            </Stack>

            <Box sx={{ mb: 2 }}>
                <Typography sx={{ mb: 1, fontWeight: 600 }}>Hình thức thanh toán</Typography>
                <Select
                    id="phieu-nhap-hinh-thuc"
                    fullWidth
                    size="small"
                    value={p.hinhThucThanhToan}
                    onChange={(e) => p.changeHinhThucThanhToan(Number(e.target.value))}>
                    <MenuItem value={HINH_THUC_THANH_TOAN.TIEN_MAT}>Tiền mặt</MenuItem>
                    <MenuItem value={HINH_THUC_THANH_TOAN.CHUYEN_KHOAN}>Chuyển khoản</MenuItem>
                    <MenuItem value={HINH_THUC_NO}>Nợ</MenuItem>
                </Select>
            </Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography sx={{ fontWeight: 500, fontSize: 13 }}>Số tiền thanh toán</Typography>
                <TextField
                    id="phieu-nhap-so-tien"
                    value={formatMoney(p.soTienThanhToan)}
                    disabled={p.hinhThucThanhToan === HINH_THUC_NO}
                    onChange={(e) => {
                        const value = Number(e.target.value.replace(/\./g, '').replace(/,/g, '') || 0);
                        // không trả quá số cần trả; phần còn lại là nợ nhà cung cấp
                        p.setSoTienThanhToan(Number.isNaN(value) ? 0 : Math.min(value, p.tongTienHang));
                    }}
                    size="small"
                    sx={{ width: 160, '& input': { textAlign: 'right', fontSize: 13, fontWeight: 500 } }}
                />
            </Stack>
            {p.hinhThucThanhToan === HINH_THUC_THANH_TOAN.CHUYEN_KHOAN && (
                <Box sx={{ mb: 2 }}>
                    <AutocompleteAccountBank
                        handleChoseItem={(item: TaiKhoanNganHangDto | null) =>
                            p.setIdTaiKhoanNganHang(item?.id || null)
                        }
                        idChosed={p.idTaiKhoanNganHang}
                        listOption={p.allBankAccount}
                    />
                </Box>
            )}
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                <Typography sx={{ fontWeight: 500, fontSize: 13 }}>Còn nợ nhà cung cấp</Typography>
                <Typography sx={{ fontWeight: 700, fontSize: 13, color: p.conNo > 0 ? '#d32f2f' : 'inherit' }}>
                    {formatMoney(p.conNo)}
                </Typography>
            </Stack>

            <TextField
                id="phieu-nhap-ghi-chu"
                fullWidth
                multiline
                rows={3}
                placeholder="Ghi chú nhập hàng..."
                value={p.ghiChu}
                onChange={(e) => p.setGhiChu(e.target.value)}
            />

            <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                <Button
                    variant="contained"
                    startIcon={<PrintIcon />}
                    onClick={p.inNhap}
                    sx={{
                        flex: '1 1 30%',
                        backgroundColor: '#9e9e9e',
                        color: '#fff',
                        textTransform: 'none',
                        fontWeight: 700,
                        boxShadow: 'none',
                        '&:hover': { backgroundColor: '#757575', boxShadow: 'none' }
                    }}>
                    In nháp
                </Button>
                <Button
                    variant="outlined"
                    onClick={p.luuTam}
                    disabled={p.isSaving}
                    sx={{ flex: '1 1 30%', textTransform: 'none', fontWeight: 700 }}>
                    Lưu tạm
                </Button>
                <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={p.hoanThanh}
                    disabled={p.isSaving}
                    sx={{
                        flex: '1 1 100%',
                        backgroundColor: 'var(--color-main)',
                        color: '#fff',
                        textTransform: 'none',
                        fontWeight: 800,
                        boxShadow: 'none',
                        py: 1.2,
                        '&:hover': { backgroundColor: 'var(--color-main-dark)', boxShadow: 'none' }
                    }}>
                    {p.isSaving ? 'Đang lưu...' : 'Hoàn thành'}
                </Button>
            </Box>
        </Paper>
    );
};

export default ThongTinPhieuNhap;
