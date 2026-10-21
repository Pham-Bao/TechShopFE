import React, { useEffect, useRef, useState } from 'react';
import { NumericFormat } from 'react-number-format';
import {
    Autocomplete,
    Box,
    Button,
    Checkbox,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    Grid,
    Stack,
    TextField,
    Typography
} from '@mui/material';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import DialogButtonClose from '../../../components/Dialog/ButtonClose';
import ProductService from '../../../services/product/ProductService';
import utils from '../../../utils/utils';
import { COLOR_SUGGEST } from '../../../lib/mauSacSuggest';
import { STORAGE_SUGGEST } from '../../../lib/dungLuongSugget';
import { PHONE_SUGGEST } from '../../../lib/phoneSuggest';

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
    matKhau?: string;
    loi?: string;
    ghiChu?: string;
    giaNhap: number;
    giaBan: number;
    daGiaoDich?: boolean; // sửa phiếu nhập đã hoàn thành: máy đã bán / đã giao dịch -> không sửa / xóa được
}

type PropsModalNhapDienThoai = {
    open: boolean;
    onClose: () => void;
    onAdd: (item: IDienThoaiNhap) => void;
    imeiDaCo: string[]; // IMEI đã có trên phiếu (trừ máy đang sửa), không cho nhập trùng
    duLieu?: IDienThoaiNhap | null; // có: sửa máy đã thêm vào phiếu
};

const emptyForm: IDienThoaiNhap = {
    tenHangHoa: '',
    idNhomHangHoa: null,
    imel: '',
    mau: '',
    dungLuong: null,
    pin: null,
    tinhTrang: '',
    matKhau: '',
    loi: '',
    ghiChu: '',
    giaNhap: 0,
    giaBan: 0
};

// giống dialog điện thoại bên trang Hàng hóa / Điện thoại
const TINH_TRANG = ['Kính phẩy', 'Zin', 'Keng', 'Áp', 'A', 'A-', 'B+', 'B', 'B-', 'C', 'D'];

const ModalNhapDienThoai = ({ open, onClose, onAdd, imeiDaCo, duLieu }: PropsModalNhapDienThoai) => {
    const [form, setForm] = useState<IDienThoaiNhap>(emptyForm);
    const [errors, setErrors] = useState<{ tenHangHoa?: string; imel?: string }>({});
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'empty' | 'error'>('idle');
    const refImei = useRef<HTMLInputElement>(null);
    const laSua = !!duLieu;

    useEffect(() => {
        if (open) {
            setForm(duLieu ? { ...emptyForm, ...duLieu } : emptyForm);
            setErrors({});
            setStatus('idle');
        }
    }, [open]);

    // lấy nhanh thông tin iPhone đang kết nối máy tính
    const handleGetIphone = async () => {
        try {
            setLoading(true);
            setStatus('loading');
            const data = await ProductService.GetIphoneConnectPC();
            if (!data) {
                setStatus('empty');
                return;
            }
            const pin = parseInt(data.batteryHealth ?? '', 10);
            setForm((prev) => ({
                ...prev,
                tenHangHoa: data.dongMay ?? prev.tenHangHoa,
                dungLuong: STORAGE_SUGGEST.find((x) => x.label === data.dungLuong)?.value ?? prev.dungLuong,
                mau: data.mau ?? prev.mau,
                imel: data.imei ?? prev.imel,
                pin: Number.isNaN(pin) ? prev.pin : pin
            }));
            setErrors({});
            setStatus('success');
        } catch {
            setStatus('error');
        } finally {
            setLoading(false);
        }
    };

    const handleChangeTinhTrang = (value: string) => {
        setForm((prev) => {
            const list = prev.tinhTrang ? prev.tinhTrang.split(',').filter(Boolean) : [];
            const newList = list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
            return { ...prev, tinhTrang: newList.join(',') };
        });
    };

    const validate = () => {
        const err: { tenHangHoa?: string; imel?: string } = {};
        if (!form.tenHangHoa.trim()) {
            err.tenHangHoa = 'Vui lòng nhập tên điện thoại';
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
            setForm({ ...form, imel: '', pin: null, tinhTrang: '', matKhau: '', loi: '', ghiChu: '' });
            setErrors({});
            setStatus('idle');
            setTimeout(() => refImei.current?.focus(), 0);
        } else {
            onClose();
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogButtonClose onClose={onClose} />
            <DialogTitle className="modal-title">{laSua ? 'Cập nhật điện thoại' : 'Thêm điện thoại'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={4} display="flex" justifyContent="center" alignItems="center">
                        <Box
                            sx={{
                                width: '100%',
                                maxWidth: 220,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center'
                            }}>
                            <Button
                                fullWidth
                                variant="contained"
                                startIcon={
                                    loading ? <CircularProgress size={18} color="inherit" /> : <PhoneIphoneIcon />
                                }
                                onClick={handleGetIphone}
                                disabled={loading}
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    borderRadius: '12px',
                                    py: 1.2,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    background: 'linear-gradient(135deg, var(--color-main), var(--color-main-light))',
                                    '&:hover': {
                                        background:
                                            'linear-gradient(135deg, var(--color-main-dark), var(--color-main-light))',
                                        boxShadow: '0 6px 16px rgba(0,0,0,0.15)'
                                    }
                                }}>
                                {loading ? 'Đang lấy dữ liệu...' : 'Lấy nhanh máy'}
                            </Button>
                            <Typography
                                variant="caption"
                                mt={1}
                                textAlign="center"
                                sx={{
                                    color:
                                        status === 'success'
                                            ? 'green'
                                            : status === 'error' || status === 'empty'
                                            ? 'red'
                                            : 'text.secondary'
                                }}>
                                {status === 'loading' && 'Đang lấy dữ liệu...'}
                                {status === 'success' && '✅ Lấy thông tin thành công'}
                                {status === 'empty' && '⚠️ Không có thông tin thiết bị'}
                                {status === 'error' && '❌ Không phát hiện iPhone'}
                            </Typography>
                        </Box>
                    </Grid>

                    <Grid item xs={12} sm={8} sx={{ mt: 1 }}>
                        <Stack spacing={2}>
                            {/* TÊN MÁY */}
                            <Autocomplete
                                freeSolo
                                fullWidth
                                options={PHONE_SUGGEST}
                                inputValue={form.tenHangHoa || ''}
                                filterOptions={(options, state) => {
                                    const keyword = state.inputValue.toLowerCase().replace(/\s/g, '');
                                    return options.filter((x) => x.toLowerCase().replace(/\s/g, '').includes(keyword));
                                }}
                                onInputChange={(event, newValue) => {
                                    setForm((prev) => ({ ...prev, tenHangHoa: newValue }));
                                    setErrors((prev) => ({ ...prev, tenHangHoa: undefined }));
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        variant="outlined"
                                        size="small"
                                        autoFocus
                                        fullWidth
                                        error={!!errors.tenHangHoa}
                                        helperText={errors.tenHangHoa}
                                        label={
                                            <Typography variant="body2">
                                                Tên điện thoại<span className="text-danger"> *</span>
                                            </Typography>
                                        }
                                    />
                                )}
                            />

                            {/* DUNG LƯỢNG + MÀU */}
                            <Stack direction="row" spacing={2}>
                                <Autocomplete
                                    sx={{
                                        flex: 1.3,
                                        minWidth: 120,
                                        '& .MuiAutocomplete-popupIndicator': { display: 'none' },
                                        '& .MuiAutocomplete-endAdornment': { right: 8 },
                                        '& .MuiAutocomplete-input': { overflow: 'visible', textOverflow: 'clip' }
                                    }}
                                    options={STORAGE_SUGGEST}
                                    value={
                                        STORAGE_SUGGEST.find((x) => Number(x.value) === Number(form.dungLuong)) || null
                                    }
                                    getOptionLabel={(option) => option.label}
                                    isOptionEqualToValue={(option, value) => option.value === value.value}
                                    onChange={(event, newValue) =>
                                        setForm((prev) => ({ ...prev, dungLuong: newValue?.value ?? null }))
                                    }
                                    renderInput={(params) => (
                                        <TextField {...params} variant="outlined" size="small" label="Dung lượng *" />
                                    )}
                                />
                                <Autocomplete
                                    freeSolo
                                    sx={{ flex: 2 }}
                                    options={COLOR_SUGGEST}
                                    getOptionLabel={(option: any) =>
                                        typeof option === 'string' ? option : option.label
                                    }
                                    filterOptions={(options, state) => {
                                        const keyword = state.inputValue.toLowerCase().replace(/\s/g, '');
                                        return options.filter((item) =>
                                            item.search.some((x: string) => x.includes(keyword))
                                        );
                                    }}
                                    inputValue={form.mau || ''}
                                    onInputChange={(event, newValue) => setForm((prev) => ({ ...prev, mau: newValue }))}
                                    renderInput={(params) => (
                                        <TextField {...params} variant="outlined" size="small" label="Màu sắc *" />
                                    )}
                                />
                            </Stack>

                            {/* PIN + IMEI + MẬT KHẨU */}
                            <Stack direction="row" spacing={2}>
                                <TextField
                                    size="small"
                                    sx={{ flex: 0.7 }}
                                    label="Pin *"
                                    value={form.pin ?? ''}
                                    onChange={(e) => {
                                        const so = parseInt(e.target.value, 10);
                                        setForm((prev) => ({
                                            ...prev,
                                            pin: Number.isNaN(so) ? null : Math.min(Math.max(so, 0), 100)
                                        }));
                                    }}
                                />
                                <TextField
                                    size="small"
                                    sx={{ flex: 2 }}
                                    inputRef={refImei}
                                    label={
                                        <Typography variant="body2">
                                            IMEI<span className="text-danger"> *</span>
                                        </Typography>
                                    }
                                    value={form.imel}
                                    error={!!errors.imel}
                                    helperText={errors.imel}
                                    onChange={(e) => {
                                        setForm((prev) => ({ ...prev, imel: e.target.value }));
                                        setErrors((prev) => ({ ...prev, imel: undefined }));
                                    }}
                                />
                                <TextField
                                    size="small"
                                    sx={{ flex: 1 }}
                                    label="Mật khẩu"
                                    value={form.matKhau || ''}
                                    onChange={(e) => setForm((prev) => ({ ...prev, matKhau: e.target.value }))}
                                />
                            </Stack>

                            {/* GIÁ */}
                            <Stack direction="row" spacing={2}>
                                <NumericFormat
                                    size="small"
                                    fullWidth
                                    label="Giá bán"
                                    value={form.giaBan}
                                    thousandSeparator="."
                                    decimalSeparator=","
                                    customInput={TextField}
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            giaBan: utils.formatNumberToFloat(e.target.value)
                                        }))
                                    }
                                />
                                <NumericFormat
                                    size="small"
                                    fullWidth
                                    label="Giá nhập"
                                    value={form.giaNhap}
                                    thousandSeparator="."
                                    decimalSeparator=","
                                    customInput={TextField}
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            giaNhap: utils.formatNumberToFloat(e.target.value)
                                        }))
                                    }
                                />
                            </Stack>

                            {/* TÌNH TRẠNG */}
                            <Typography variant="body2" sx={{ mb: -1.5, color: '#6b7280' }}>
                                Tình trạng *
                            </Typography>
                            <Stack direction="row" spacing={4}>
                                {[0, 4, 8].map((start) => (
                                    <Stack key={start} spacing={0}>
                                        {TINH_TRANG.slice(start, start + 4).map((item) => (
                                            <FormControlLabel
                                                key={item}
                                                sx={{ m: 0 }}
                                                control={
                                                    <Checkbox
                                                        size="small"
                                                        checked={!!form.tinhTrang?.split(',').includes(item)}
                                                        onChange={() => handleChangeTinhTrang(item)}
                                                    />
                                                }
                                                label={item}
                                            />
                                        ))}
                                    </Stack>
                                ))}
                            </Stack>

                            {/* LỖI */}
                            <TextField
                                fullWidth
                                size="small"
                                label="Lỗi"
                                placeholder="Nhập mô tả lỗi"
                                value={form.loi || ''}
                                onChange={(e) => setForm((prev) => ({ ...prev, loi: e.target.value }))}
                            />

                            {/* GHI CHÚ */}
                            <TextField
                                fullWidth
                                multiline
                                rows={2}
                                label="Ghi chú"
                                value={form.ghiChu || ''}
                                onChange={(e) => setForm((prev) => ({ ...prev, ghiChu: e.target.value }))}
                            />
                        </Stack>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions style={{ paddingBottom: '20px' }}>
                <Button
                    variant="outlined"
                    sx={{ color: 'var(--color-main)' }}
                    onClick={onClose}
                    className="btn-outline-hover">
                    Hủy
                </Button>
                {!laSua && (
                    <Button variant="outlined" onClick={() => add(true)} sx={{ textTransform: 'none' }}>
                        Thêm &amp; nhập máy tiếp
                    </Button>
                )}
                <Button variant="contained" sx={{ bgcolor: 'var(--color-main)' }} onClick={() => add(false)}>
                    {laSua ? 'Lưu' : 'Thêm'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ModalNhapDienThoai;
