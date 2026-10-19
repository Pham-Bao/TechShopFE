import React, { useEffect, useRef, useState } from 'react';
import {
    Autocomplete,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    InputAdornment,
    TextField
} from '@mui/material';
import { observer } from 'mobx-react';
import nhomHangHoaStore from '../../../stores/nhomHangHoaStore';
import { STORAGE_SUGGEST } from '../../../lib/dungLuongSugget';

// 1 máy điện thoại nhập trong phiếu nhập (Backend tạo máy khi lưu phiếu)
export interface IDienThoaiNhap {
    tenHangHoa: string;
    idNhomHangHoa?: string | null;
    tenNhomHang?: string;
    imel: string;
    mau?: string;
    dungLuong?: number | null;
    pin?: number | null;
    tinhTrang?: string;
    giaNhap: number;
    giaBan: number;
}

type PropsModalNhapDienThoai = {
    open: boolean;
    onClose: () => void;
    onAdd: (item: IDienThoaiNhap) => void;
    imeiDaCo: string[]; // IMEI đã có trên phiếu, không cho nhập trùng
};

const emptyForm: IDienThoaiNhap = {
    tenHangHoa: '',
    idNhomHangHoa: null,
    tenNhomHang: '',
    imel: '',
    mau: '',
    dungLuong: null,
    pin: null,
    tinhTrang: '',
    giaNhap: 0,
    giaBan: 0
};

const formatMoney = (value: number) => Number(value || 0).toLocaleString('vi-VN');
const parseMoney = (text: string) => {
    const value = Number(text.replace(/\./g, '').replace(/,/g, '') || 0);
    return Number.isNaN(value) ? 0 : value;
};

const ModalNhapDienThoai = ({ open, onClose, onAdd, imeiDaCo }: PropsModalNhapDienThoai) => {
    const [form, setForm] = useState<IDienThoaiNhap>(emptyForm);
    const [errors, setErrors] = useState<{ tenHangHoa?: string; imel?: string }>({});
    const refImei = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            setForm(emptyForm);
            setErrors({});
            if (!nhomHangHoaStore.listAllNhomHang || nhomHangHoaStore.listAllNhomHang.length === 0) {
                nhomHangHoaStore.getAllNhomHang();
            }
        }
    }, [open]);

    const validate = () => {
        const err: { tenHangHoa?: string; imel?: string } = {};
        if (!form.tenHangHoa.trim()) {
            err.tenHangHoa = 'Vui lòng nhập tên máy';
        }
        const imei = form.imel.trim();
        if (!imei) {
            err.imel = 'Vui lòng nhập IMEI';
        } else if (imeiDaCo.includes(imei)) {
            err.imel = 'IMEI này đã có trên phiếu';
        }
        setErrors(err);
        return Object.keys(err).length === 0;
    };

    const add = (nhapTiep: boolean) => {
        if (!validate()) {
            return;
        }
        onAdd({ ...form, tenHangHoa: form.tenHangHoa.trim(), imel: form.imel.trim() });
        if (nhapTiep) {
            // giữ thông tin dòng máy, chỉ xóa thông tin riêng của từng máy
            setForm({ ...form, imel: '', pin: null, tinhTrang: '' });
            setErrors({});
            setTimeout(() => refImei.current?.focus(), 0);
        } else {
            onClose();
        }
    };

    const nhomHangs = nhomHangHoaStore.listAllNhomHang ?? [];

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 800 }}>Nhập điện thoại</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ pt: 1 }}>
                    <Grid item xs={12}>
                        <TextField
                            id="nhap-dt-ten"
                            fullWidth
                            size="small"
                            label="Tên máy *"
                            value={form.tenHangHoa}
                            error={!!errors.tenHangHoa}
                            helperText={errors.tenHangHoa}
                            onChange={(e) => setForm({ ...form, tenHangHoa: e.target.value })}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Autocomplete
                            id="nhap-dt-nhom"
                            size="small"
                            options={nhomHangs}
                            value={nhomHangs.find((x) => x.id === form.idNhomHangHoa) ?? null}
                            getOptionLabel={(option) => option.tenNhomHang ?? ''}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            onChange={(_, value) =>
                                setForm({ ...form, idNhomHangHoa: value?.id ?? null, tenNhomHang: value?.tenNhomHang })
                            }
                            renderInput={(params) => <TextField {...params} label="Dòng máy / nhóm hàng" />}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            id="nhap-dt-imei"
                            inputRef={refImei}
                            fullWidth
                            size="small"
                            label="IMEI *"
                            value={form.imel}
                            error={!!errors.imel}
                            helperText={errors.imel}
                            onChange={(e) => setForm({ ...form, imel: e.target.value })}
                        />
                    </Grid>
                    <Grid item xs={6} sm={4}>
                        <TextField
                            id="nhap-dt-mau"
                            fullWidth
                            size="small"
                            label="Màu"
                            value={form.mau}
                            onChange={(e) => setForm({ ...form, mau: e.target.value })}
                        />
                    </Grid>
                    <Grid item xs={6} sm={4}>
                        <Autocomplete
                            id="nhap-dt-dung-luong"
                            size="small"
                            freeSolo
                            options={STORAGE_SUGGEST.map((x) => x.label)}
                            onInputChange={(_, value) => {
                                const so = parseInt((value ?? '').replace(/gb/i, '').trim(), 10);
                                setForm({ ...form, dungLuong: Number.isNaN(so) ? null : so });
                            }}
                            renderInput={(params) => <TextField {...params} label="Dung lượng" />}
                        />
                    </Grid>
                    <Grid item xs={6} sm={4}>
                        <TextField
                            id="nhap-dt-pin"
                            fullWidth
                            size="small"
                            label="Pin"
                            value={form.pin ?? ''}
                            onChange={(e) => {
                                const so = parseInt(e.target.value, 10);
                                setForm({ ...form, pin: Number.isNaN(so) ? null : Math.min(Math.max(so, 0), 100) });
                            }}
                            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                        />
                    </Grid>
                    <Grid item xs={6} sm={12}>
                        <TextField
                            id="nhap-dt-tinh-trang"
                            fullWidth
                            size="small"
                            label="Tình trạng"
                            placeholder="Ví dụ: Máy đẹp 99%, trầy nhẹ viền"
                            value={form.tinhTrang}
                            onChange={(e) => setForm({ ...form, tinhTrang: e.target.value })}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            id="nhap-dt-gia-nhap"
                            fullWidth
                            size="small"
                            label="Giá nhập"
                            value={formatMoney(form.giaNhap)}
                            onChange={(e) => setForm({ ...form, giaNhap: parseMoney(e.target.value) })}
                            inputProps={{ style: { textAlign: 'right' } }}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            id="nhap-dt-gia-ban"
                            fullWidth
                            size="small"
                            label="Giá bán"
                            value={formatMoney(form.giaBan)}
                            onChange={(e) => setForm({ ...form, giaBan: parseMoney(e.target.value) })}
                            inputProps={{ style: { textAlign: 'right' } }}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} sx={{ textTransform: 'none' }}>
                    Hủy
                </Button>
                <Button variant="outlined" onClick={() => add(true)} sx={{ textTransform: 'none', fontWeight: 700 }}>
                    Thêm &amp; nhập máy tiếp
                </Button>
                <Button
                    variant="contained"
                    onClick={() => add(false)}
                    sx={{ textTransform: 'none', fontWeight: 800, boxShadow: 'none' }}>
                    Thêm
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default observer(ModalNhapDienThoai);
