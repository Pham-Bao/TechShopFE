import React, { useEffect, useState } from 'react';
import {
    Alert,
    Autocomplete,
    Box,
    Button,
    Checkbox,
    Divider,
    FormControlLabel,
    Grid,
    IconButton,
    Paper,
    Radio,
    Stack,
    TextField,
    Typography
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import Cookies from 'js-cookie';
import { format } from 'date-fns';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { enqueueSnackbar } from 'notistack';
import HoaDonService from '../../services/ban_hang/HoaDonService';
import PageHoaDonDto from '../../services/ban_hang/PageHoaDonDto';
import KhoHangService, { ChiTietTraHangDto } from '../../services/kho_hang/KhoHangService';
import { LoaiChungTu, LoaiHangHoa } from '../../lib/appconst';
import AppConsts from '../../lib/appconst';

const formatMoney = (value: number) => Number(value || 0).toLocaleString('vi-VN');
// giống dialog điện thoại bên trang Hàng hóa / Điện thoại
const TINH_TRANG = ['Kính phẩy', 'Zin', 'Keng', 'Áp', 'A', 'A-', 'B+', 'B', 'B-', 'C', 'D'];
const TRANG_THAI_DA_BAN = 2;
const tachTinhTrang = (value?: string | null) =>
    (value ?? '')
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean);

// có thể trả: máy thuộc hóa đơn, chưa trả và vẫn đang ở trạng thái "Đã bán"
const coTheTra = (x: ChiTietTraHangDto) => x.soLuongMua - x.soLuongDaTra > 0 && x.trangThaiMay === TRANG_THAI_DA_BAN;

// Khách trả điện thoại theo hóa đơn bán: mỗi phiếu trả 1 máy.
// Hoàn thành: máy về "Đang kinh doanh", tình trạng máy cập nhật theo tình trạng sau khi trả. Chưa hoàn tiền cho khách.
const PageThemKhachTraHang: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const idPhieu = searchParams.get('id'); // mở lại phiếu nháp
    const idChiNhanh = Cookies.get('IdChiNhanh') ?? '';
    const [listHoaDon, setListHoaDon] = useState<PageHoaDonDto[]>([]);
    const [hoaDon, setHoaDon] = useState<PageHoaDonDto | null>(null);
    const [lstMay, setLstMay] = useState<ChiTietTraHangDto[]>([]);
    const [idMayChon, setIdMayChon] = useState<string | null>(null);
    const [tinhTrangSau, setTinhTrangSau] = useState<string[]>([]);
    const [maPhieu, setMaPhieu] = useState('');
    const [ngayLap, setNgayLap] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    const [lyDo, setLyDo] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const mayChon = lstMay.find((x) => x.idDonViQuyDoi === idMayChon) ?? null;
    const tinhTrangTruoc = tachTinhTrang(mayChon?.tinhTrang);

    useEffect(() => {
        if (idPhieu) moPhieuNhap(idPhieu);
    }, [idPhieu]);

    const searchHoaDon = async (txt: string) => {
        const data = await HoaDonService.GetListHoaDon({
            idChiNhanhs: idChiNhanh ? [idChiNhanh] : [],
            idLoaiChungTus: [LoaiChungTu.HOA_DON_BAN_LE],
            textSearch: txt,
            currentPage: 1,
            pageSize: AppConsts.pageOption[0].value,
            columnSort: 'NgayLapHoaDon',
            typeSort: 'DESC',
            trangThais: [3]
        });
        setListHoaDon(data?.items ?? []);
    };

    // chỉ lấy điện thoại trong hóa đơn; tự chọn nếu chỉ có 1 máy trả được
    const loadMay = async (idHoaDon: string) => {
        const data = await KhoHangService.GetChiTietCoTheTra(idHoaDon);
        const may = (data ?? []).filter((x) => x.idLoaiHangHoa === LoaiHangHoa.DIEN_THOAI);
        setLstMay(may);
        return may;
    };

    const chonMay = (may: ChiTietTraHangDto | null) => {
        setIdMayChon(may?.idDonViQuyDoi ?? null);
        setTinhTrangSau(tachTinhTrang(may?.tinhTrang)); // mặc định giữ như lúc bán
    };

    const choseHoaDon = async (hd: PageHoaDonDto | null) => {
        setHoaDon(hd);
        chonMay(null);
        if (!hd) {
            setLstMay([]);
            return;
        }
        const may = await loadMay(hd.id);
        const traDuoc = may.filter(coTheTra);
        if (traDuoc.length === 1) chonMay(traDuoc[0]);
    };

    const moPhieuNhap = async (id: string) => {
        const phieu = await KhoHangService.GetPhieuKho(id);
        if (!phieu) return;
        if (phieu.idLoaiChungTu !== LoaiChungTu.KHACH_TRA_HANG || phieu.trangThai !== 1) {
            enqueueSnackbar('Phiếu đã hoàn thành, không sửa được', { variant: 'warning' });
            navigate('/khach-tra-hangs');
            return;
        }
        setMaPhieu(phieu.maHoaDon ?? '');
        setLyDo(phieu.ghiChuHD ?? '');
        if (phieu.ngayLapHoaDon) setNgayLap(format(new Date(phieu.ngayLapHoaDon), "yyyy-MM-dd'T'HH:mm"));
        if (!phieu.idHoaDon) return;
        const hd = (await HoaDonService.GetInforHoaDon_byId(phieu.idHoaDon))?.[0];
        if (hd) setHoaDon({ ...hd, id: phieu.idHoaDon } as PageHoaDonDto);
        const may = await loadMay(phieu.idHoaDon);
        const ct = phieu.chiTiet?.[0];
        const mayNhap = may.find((x) => x.idDonViQuyDoi === ct?.idDonViQuyDoi);
        if (mayNhap) {
            setIdMayChon(mayNhap.idDonViQuyDoi);
            setTinhTrangSau(tachTinhTrang(ct?.ghiChu || mayNhap.tinhTrang));
        }
    };

    const toggleTinhTrang = (item: string) =>
        setTinhTrangSau((prev) => (prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]));

    // trangThai: 1.Lưu nháp (chưa đổi máy), 3.Lưu (máy về đang kinh doanh, cập nhật tình trạng)
    const save = async (trangThai: number) => {
        if (isSaving) return;
        if (!hoaDon || !mayChon) {
            enqueueSnackbar('Chọn hóa đơn và điện thoại khách trả', { variant: 'warning' });
            return;
        }
        if (trangThai === 3 && !lyDo.trim()) {
            enqueueSnackbar('Vui lòng nhập lý do trả', { variant: 'warning' });
            return;
        }
        setIsSaving(true);
        try {
            const data = await KhoHangService.SavePhieuKho({
                id: idPhieu,
                idLoaiChungTu: LoaiChungTu.KHACH_TRA_HANG,
                idChiNhanh: idChiNhanh || null,
                idKhachHang: hoaDon.idKhachHang ?? null,
                idHoaDon: hoaDon.id,
                maHoaDon: maPhieu,
                ngayLapHoaDon: ngayLap ? new Date(ngayLap).toISOString() : new Date().toISOString(),
                ghiChuHD: lyDo.trim(), // lý do trả
                trangThai: trangThai,
                chiTiet: [
                    {
                        idDonViQuyDoi: mayChon.idDonViQuyDoi,
                        soLuong: 1,
                        donGiaTruocCK: mayChon.donGia,
                        donGiaSauCK: mayChon.donGia,
                        thanhTienTruocCK: mayChon.donGia,
                        thanhTienSauCK: mayChon.donGia,
                        // tình trạng sau khi trả: hoàn thành sẽ ghi đè lên tình trạng máy
                        ghiChu: TINH_TRANG.filter((x) => tinhTrangSau.includes(x)).join(',')
                    }
                ]
            });
            if (data) {
                enqueueSnackbar(
                    trangThai === 1
                        ? `Đã lưu nháp phiếu trả hàng ${data.maHoaDon ?? ''}`
                        : `Lưu phiếu trả hàng ${data.maHoaDon ?? ''} thành công, máy đã về trạng thái đang kinh doanh`,
                    { variant: 'success' }
                );
                navigate('/khach-tra-hangs');
            }
        } finally {
            setIsSaving(false);
        }
    };

    const columns: GridColDef[] = [
        {
            field: 'chon',
            headerName: '',
            width: 50,
            sortable: false,
            renderCell: (p) => (
                <Radio size="small" checked={p.row.idDonViQuyDoi === idMayChon} disabled={!coTheTra(p.row)} />
            )
        },
        {
            field: 'tenHangHoa',
            headerName: 'Tên điện thoại',
            flex: 1,
            minWidth: 200,
            sortable: false,
            renderCell: (p) => (
                <Typography noWrap sx={{ fontSize: 14, fontWeight: 700 }} title={p.value}>
                    {(p.value as string)?.replace(` - ${p.row.imel}`, '')}
                </Typography>
            )
        },
        { field: 'imel', headerName: 'IMEI', width: 150, sortable: false },
        { field: 'mau', headerName: 'Màu', width: 100, sortable: false },
        {
            field: 'dungLuong',
            headerName: 'GB',
            width: 70,
            align: 'center',
            headerAlign: 'center',
            sortable: false,
            valueGetter: (p) => (p.row.dungLuong ? `${p.row.dungLuong}GB` : '')
        },
        {
            field: 'pin',
            headerName: 'Pin',
            width: 70,
            align: 'center',
            headerAlign: 'center',
            sortable: false,
            valueGetter: (p) => (p.row.pin != null ? `${p.row.pin}%` : '')
        },
        { field: 'tinhTrang', headerName: 'Tình trạng lúc bán', width: 150, sortable: false },
        {
            field: 'donGia',
            headerName: 'Giá bán',
            width: 120,
            align: 'right',
            headerAlign: 'right',
            sortable: false,
            valueFormatter: (p) => formatMoney(p.value)
        },
        {
            field: 'trangThai',
            headerName: '',
            width: 110,
            sortable: false,
            renderCell: (p) =>
                coTheTra(p.row) ? null : (
                    <Typography sx={{ fontSize: 12, color: '#9ca3af' }}>
                        {p.row.soLuongDaTra > 0 ? 'Đã trả' : 'Không ở trạng thái đã bán'}
                    </Typography>
                )
        }
    ];

    const dong = (label: string, value: React.ReactNode) => (
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1.5 }}>
            <Typography sx={{ fontSize: 14 }}>{label}</Typography>
            <Typography sx={{ fontSize: 14, fontWeight: 700, textAlign: 'right' }}>{value}</Typography>
        </Stack>
    );

    return (
        <Box sx={{ background: '#f5f6fa', minHeight: '100vh', p: 2 }}>
            <Paper elevation={0} sx={{ p: 1, borderRadius: 2, mb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <IconButton onClick={() => navigate('/khach-tra-hangs')}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography sx={{ fontWeight: 800, fontSize: 18 }}>Khách trả điện thoại</Typography>
                </Stack>
            </Paper>
            <Grid container spacing={2}>
                {/* TRÁI: chọn hóa đơn bán và máy trả */}
                <Grid item xs={12} md={8}>
                    <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                        <Box sx={{ p: 1, borderBottom: '1px solid #edf0f5' }}>
                            <Autocomplete
                                options={listHoaDon}
                                value={hoaDon}
                                filterOptions={(x) => x}
                                isOptionEqualToValue={(a, b) => a.id === b.id}
                                getOptionLabel={(x) => `${x.maHoaDon ?? ''} - ${x.tenKhachHang ?? ''}`}
                                onOpen={() => searchHoaDon('')}
                                onInputChange={(_, value, reason) => reason === 'input' && searchHoaDon(value)}
                                onChange={(_, value) => choseHoaDon(value)}
                                renderOption={(props, x) => (
                                    <li {...props} key={x.id}>
                                        <Stack direction="row" justifyContent="space-between" width="100%">
                                            <span>
                                                <b>{x.maHoaDon}</b> - {x.tenKhachHang}{' '}
                                                {x.soDienThoai ? `(${x.soDienThoai})` : ''}
                                            </span>
                                            <span style={{ color: '#6b7280' }}>
                                                {x.ngayLapHoaDon
                                                    ? format(new Date(x.ngayLapHoaDon), 'dd/MM/yyyy HH:mm')
                                                    : ''}
                                            </span>
                                        </Stack>
                                    </li>
                                )}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        size="small"
                                        placeholder="Tìm hóa đơn bán theo mã, tên / SĐT khách"
                                    />
                                )}
                            />
                        </Box>
                        <DataGrid
                            autoHeight
                            rows={lstMay}
                            getRowId={(r) => r.idDonViQuyDoi}
                            columns={columns}
                            hideFooter
                            rowHeight={52}
                            onRowClick={(p) => coTheTra(p.row) && chonMay(p.row)}
                            localeText={{
                                noRowsLabel: hoaDon
                                    ? 'Hóa đơn không có điện thoại để trả'
                                    : 'Chọn hóa đơn bán có máy khách trả'
                            }}
                            sx={{
                                border: 0,
                                '& .MuiDataGrid-columnHeaders': { background: '#f8fafc' },
                                '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 800, fontSize: 13 },
                                '& .MuiDataGrid-cell': { outline: 'none !important' },
                                '& .MuiDataGrid-row': { cursor: 'pointer' }
                            }}
                        />
                    </Paper>
                </Grid>

                {/* PHẢI: thông tin phiếu */}
                <Grid item xs={12} md={4}>
                    <Paper elevation={0} sx={{ borderRadius: 2, p: 2, position: 'sticky', top: 16 }}>
                        <Typography sx={{ fontWeight: 800, mb: 2, textTransform: 'uppercase' }}>
                            Thông tin phiếu
                        </Typography>
                        {dong('Mã phiếu', maPhieu || 'Tự động')}
                        {dong('Khách hàng trả', hoaDon?.tenKhachHang || '-')}
                        {dong('Hóa đơn bán', hoaDon?.maHoaDon || '-')}
                        {dong(
                            'Ngày lập hóa đơn bán',
                            hoaDon?.ngayLapHoaDon ? format(new Date(hoaDon.ngayLapHoaDon), 'dd/MM/yyyy HH:mm') : '-'
                        )}
                        <TextField
                            fullWidth
                            type="datetime-local"
                            size="small"
                            label="Ngày lập phiếu trả"
                            InputLabelProps={{ shrink: true }}
                            value={ngayLap}
                            onChange={(e) => setNgayLap(e.target.value)}
                            sx={{ my: 1.5 }}
                        />
                        <TextField
                            fullWidth
                            multiline
                            rows={2}
                            label="Lý do trả *"
                            value={lyDo}
                            onChange={(e) => setLyDo(e.target.value)}
                            sx={{ mb: 2 }}
                        />

                        <Divider sx={{ mb: 1.5 }} />
                        <Typography sx={{ fontWeight: 800, mb: 1 }}>
                            Máy trả:{' '}
                            <span style={{ color: 'var(--color-main)' }}>
                                {mayChon
                                    ? `${mayChon.tenHangHoa?.replace(` - ${mayChon.imel}`, '')} - ${mayChon.imel}`
                                    : '-'}
                            </span>
                        </Typography>
                        <Typography sx={{ fontSize: 13, color: '#6b7280', mb: 0.5 }}>
                            Tình trạng trước khi bán
                        </Typography>
                        <Typography sx={{ fontSize: 14, fontWeight: 700, mb: 1.5 }}>
                            {mayChon ? tinhTrangTruoc.join(', ') || 'Chưa ghi tình trạng' : '-'}
                        </Typography>
                        <Typography sx={{ fontSize: 13, color: '#6b7280' }}>Tình trạng sau khi trả</Typography>
                        <Stack direction="row" spacing={3} sx={{ mb: 1 }}>
                            {[0, 4, 8].map((start) => (
                                <Stack key={start} spacing={0}>
                                    {TINH_TRANG.slice(start, start + 4).map((item) => {
                                        const chon = tinhTrangSau.includes(item);
                                        const truoc = tinhTrangTruoc.includes(item);
                                        // so sánh với lúc bán: xanh = mới có, đỏ = mất đi
                                        const color =
                                            chon && !truoc ? '#16a34a' : !chon && truoc ? '#dc2626' : undefined;
                                        return (
                                            <FormControlLabel
                                                key={item}
                                                sx={{
                                                    m: 0,
                                                    '& .MuiFormControlLabel-label': {
                                                        color,
                                                        fontWeight: color ? 700 : 400
                                                    }
                                                }}
                                                disabled={!mayChon}
                                                control={
                                                    <Checkbox
                                                        size="small"
                                                        checked={chon}
                                                        onChange={() => toggleTinhTrang(item)}
                                                    />
                                                }
                                                label={item}
                                            />
                                        );
                                    })}
                                </Stack>
                            ))}
                        </Stack>
                        <Alert severity="info" sx={{ mb: 2, fontSize: 12 }}>
                            Khi lưu, máy chuyển từ <b>Đã bán</b> sang <b>Đang kinh doanh</b> và tình trạng máy được cập
                            nhật theo tình trạng sau khi trả. Nếu hoàn tiền cho khách, hãy lập phiếu chi ở Sổ quỹ.
                        </Alert>
                        <Stack direction="row" spacing={1}>
                            <Button
                                variant="contained"
                                onClick={() => save(1)}
                                disabled={isSaving || !mayChon}
                                sx={{
                                    flex: 4,
                                    backgroundColor: '#9e9e9e',
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    boxShadow: 'none',
                                    '&:hover': { backgroundColor: '#757575', boxShadow: 'none' }
                                }}>
                                Lưu nháp
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<SaveIcon />}
                                onClick={() => save(3)}
                                disabled={isSaving || !mayChon}
                                sx={{
                                    flex: 6,
                                    backgroundColor: 'var(--color-main)',
                                    textTransform: 'none',
                                    fontWeight: 800,
                                    boxShadow: 'none',
                                    py: 1.2
                                }}>
                                {isSaving ? 'Đang lưu...' : 'Lưu'}
                            </Button>
                        </Stack>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default PageThemKhachTraHang;
