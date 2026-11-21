import React, { useContext, useEffect, useState } from 'react';
import {
    Box,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    Radio,
    RadioGroup,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography
} from '@mui/material';
import { format } from 'date-fns';
import Cookies from 'js-cookie';
import { enqueueSnackbar } from 'notistack';
import { NumericFormat } from 'react-number-format';
import BankAccount from '../../../components/Switch/BankAccount';
import DateTimePickerCustom from '../../../components/DatetimePicker/DateTimePickerCustom';
import DialogButtonClose from '../../../components/Dialog/ButtonClose';
import AppConsts, { HINH_THUC_THANH_TOAN } from '../../../lib/appconst';
import { AppContext } from '../../../services/chi_nhanh/ChiNhanhContext';
import { HoaDonCuaKhachHangDto } from '../../../services/khach-hang/dto/HoaDonCuaKhachHangDto';
import khachHangService from '../../../services/khach-hang/khachHangService';
import { TaiKhoanNganHangDto } from '../../../services/so_quy/Dto/TaiKhoanNganHangDto';
import SoQuyServices from '../../../services/so_quy/SoQuyServices';
import suggestStore from '../../../stores/suggestStore';
import utils from '../../../utils/utils';

type Props = {
    isShow: boolean;
    idKhachHang?: string;
    tenKhachHang?: string;
    onClose: () => void;
    onOk: () => void; // đã lưu phiếu thu
};

type DongHoaDon = HoaDonCuaKhachHangDto & { chon: boolean; tienThu: number };

const formatMoney = (value: number) => new Intl.NumberFormat('vi-VN').format(value ?? 0);

/**
 * Phiếu thu cho nhiều hóa đơn còn nợ của 1 khách (hóa đơn thuộc chi nhánh đang chọn), lưu thành 1 phiếu thu
 */
const ModalThanhToanNhieuHoaDon = ({ isShow, idKhachHang, tenKhachHang, onClose, onOk }: Props) => {
    const appContext = useContext(AppContext);
    const idChiNhanh = utils.checkNull(appContext.chinhanhCurrent?.id)
        ? Cookies.get('IdChiNhanh') ?? ''
        : appContext.chinhanhCurrent?.id;

    const [rows, setRows] = useState<DongHoaDon[]>([]);
    const [lstTaiKhoan, setLstTaiKhoan] = useState<TaiKhoanNganHangDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [ngayLap, setNgayLap] = useState(format(new Date(), 'yyyy-MM-dd HH:mm'));
    const [hinhThuc, setHinhThuc] = useState(HINH_THUC_THANH_TOAN.TIEN_MAT);
    const [idTaiKhoan, setIdTaiKhoan] = useState<string | null>(null);
    const [ghiChu, setGhiChu] = useState('');

    useEffect(() => {
        if (!isShow || !idKhachHang || !idChiNhanh) return;
        setNgayLap(format(new Date(), 'yyyy-MM-dd HH:mm'));
        setHinhThuc(HINH_THUC_THANH_TOAN.TIEN_MAT);
        setGhiChu('');
        setLoading(true);
        (async () => {
            try {
                const [data] = await Promise.all([
                    khachHangService.GetHoaDonConNo_ofKhachHang(idKhachHang, idChiNhanh),
                    suggestStore.GetAllBankAccount(idChiNhanh)
                ]);
                setRows((data ?? []).map((x) => ({ ...x, chon: true, tienThu: x.conNo })));
                const taiKhoans = (suggestStore.suggestTaiKhoanNganHangQr ?? []) as TaiKhoanNganHangDto[];
                setLstTaiKhoan(taiKhoans);
                setIdTaiKhoan((taiKhoans.find((x) => x.isDefault) ?? taiKhoans[0])?.id ?? null);
            } finally {
                setLoading(false);
            }
        })();
    }, [isShow, idKhachHang, idChiNhanh]);

    const dongDuocThu = rows.filter((x) => x.chon && x.tienThu > 0);
    const tongThu = dongDuocThu.reduce((sum, x) => sum + x.tienThu, 0);
    const chonTatCa = rows.length > 0 && rows.every((x) => x.chon);

    const capNhatDong = (id: string, giaTri: Partial<DongHoaDon>) => {
        setRows((prev) => prev.map((x) => (x.id === id ? { ...x, ...giaTri } : x)));
    };

    const luuPhieuThu = async () => {
        setSaving(true);
        try {
            await SoQuyServices.ThuTienNhieuHoaDon({
                idKhachHang: idKhachHang,
                idChiNhanh: idChiNhanh,
                ngayLapHoaDon: ngayLap,
                hinhThucThanhToan: hinhThuc,
                idTaiKhoanNganHang: hinhThuc === HINH_THUC_THANH_TOAN.TIEN_MAT ? null : idTaiKhoan,
                noiDungThu: ghiChu,
                hoaDons: dongDuocThu.map((x) => ({ idHoaDon: x.id, tienThu: x.tienThu }))
            });
            enqueueSnackbar('Thanh toán hóa đơn thành công', { variant: 'success' });
            onOk();
        } catch {
            // lỗi từ Backend đã được httpService hiển thị
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={isShow} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Typography className="modal-title">Phiếu thu - {tenKhachHang}</Typography>
                <DialogButtonClose onClose={onClose} />
            </DialogTitle>
            <DialogContent>
                <Stack spacing={2}>
                    <TableContainer sx={{ maxHeight: '40vh' }}>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            size="small"
                                            checked={chonTatCa}
                                            indeterminate={!chonTatCa && rows.some((x) => x.chon)}
                                            onChange={(e) =>
                                                setRows((prev) => prev.map((x) => ({ ...x, chon: e.target.checked })))
                                            }
                                        />
                                    </TableCell>
                                    <TableCell>Mã hóa đơn</TableCell>
                                    <TableCell>Ngày</TableCell>
                                    <TableCell>Loại</TableCell>
                                    <TableCell align="right">Còn nợ</TableCell>
                                    <TableCell align="right" sx={{ width: 170 }}>
                                        Tiền thu
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {rows.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                size="small"
                                                checked={row.chon}
                                                onChange={(e) => capNhatDong(row.id, { chon: e.target.checked })}
                                            />
                                        </TableCell>
                                        <TableCell>{row.maHoaDon}</TableCell>
                                        <TableCell>{format(new Date(row.ngayLapHoaDon), 'dd/MM/yyyy HH:mm')}</TableCell>
                                        <TableCell>{row.loaiHoaDon}</TableCell>
                                        <TableCell align="right" sx={{ color: 'red' }}>
                                            {formatMoney(row.conNo)}
                                        </TableCell>
                                        <TableCell align="right">
                                            <NumericFormat
                                                size="small"
                                                fullWidth
                                                disabled={!row.chon}
                                                value={row.tienThu}
                                                decimalSeparator=","
                                                thousandSeparator="."
                                                allowNegative={false}
                                                customInput={TextField}
                                                inputProps={{ style: { textAlign: 'right' } }}
                                                onChange={(event) =>
                                                    capNhatDong(row.id, {
                                                        tienThu: Math.min(
                                                            utils.formatNumberToFloat(event.target.value),
                                                            row.conNo
                                                        )
                                                    })
                                                }
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {!loading && rows.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center">
                                            Khách không có hóa đơn nào còn nợ ở chi nhánh này
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <Box sx={{ flex: 1 }}>
                            <DateTimePickerCustom
                                labelText="Ngày thu"
                                defaultVal={ngayLap}
                                handleChangeDate={(value: string) => setNgayLap(value)}
                            />
                        </Box>
                        <TextField
                            size="small"
                            label="Ghi chú"
                            sx={{ flex: 1 }}
                            value={ghiChu}
                            onChange={(e) => setGhiChu(e.target.value)}
                        />
                    </Stack>

                    <RadioGroup row value={hinhThuc} onChange={(e) => setHinhThuc(parseInt(e.target.value, 10))}>
                        {AppConsts.hinhThucThanhToan.map((item) => (
                            <FormControlLabel
                                key={item.value}
                                value={item.value}
                                control={<Radio size="small" />}
                                label={item.text}
                            />
                        ))}
                    </RadioGroup>

                    {hinhThuc !== HINH_THUC_THANH_TOAN.TIEN_MAT && (
                        <BankAccount
                            lstBankAccount={lstTaiKhoan}
                            idChosed={idTaiKhoan}
                            handleChoseItem={(item: TaiKhoanNganHangDto) => setIdTaiKhoan(item?.id)}
                        />
                    )}

                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography fontWeight={700}>Tổng thu ({dongDuocThu.length} hóa đơn)</Typography>
                        <Typography fontWeight={700} fontSize={18}>
                            {formatMoney(tongThu)}
                        </Typography>
                    </Stack>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ padding: '0 24px 16px' }}>
                <Button variant="outlined" onClick={onClose} disabled={saving}>
                    Hủy
                </Button>
                <Button
                    variant="contained"
                    onClick={luuPhieuThu}
                    disabled={saving || loading || dongDuocThu.length === 0}>
                    Thanh toán
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ModalThanhToanNhieuHoaDon;
