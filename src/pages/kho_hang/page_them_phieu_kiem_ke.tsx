import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Autocomplete,
    Box,
    Button,
    Divider,
    Grid,
    IconButton,
    Paper,
    Stack,
    TextField,
    Tooltip,
    Typography
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { enqueueSnackbar } from 'notistack';
import { format } from 'date-fns';
import Cookies from 'js-cookie';
import { LoaiChungTu } from '../../lib/appconst';
import KhoHangService from '../../services/kho_hang/KhoHangService';
import ProductService from '../../services/product/ProductService';
import { ModelHangHoaDto, PagedProductSearchDto } from '../../services/product/dto';
import ConfirmDelete from '../../components/AlertDialog/ConfirmDelete';
import { DanhSachMaChungTu } from '../../components/MaChungTu/MaChungTuLink';

// 1 hàng hóa đang kiểm (theo đơn vị quy đổi)
interface IDongKiemKe {
    id: string; // idDonViQuyDoi
    idHangHoa: string;
    maHang: string;
    tenHang: string;
    maPhieuNhaps: string[]; // phiếu nhập đã hoàn thành có hàng này
    soLuongTon: number; // tồn phần mềm hiện tại
    soLuongThucTe: number; // cửa hàng đếm được
    ghiChu: string;
}

const parseSo = (text: string) => {
    const value = Number(text.replace(/\./g, '').replace(/,/g, '.') || 0);
    return Number.isNaN(value) || value < 0 ? 0 : value;
};

/**
 * Lập phiếu kiểm kê: tìm và chọn hàng hóa -> hàng vào ngay bảng kiểm kê (tồn phần mềm, SL thực tế, lệch, ghi chú)
 * -> Tạm lưu (chưa ảnh hưởng tồn kho) / Xác nhận (cân bằng tồn kho theo SL thực tế) / Hủy.
 */
const Page_them_phieu_kiem_ke = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const idPhieu = searchParams.get('id'); // mở lại phiếu kiểm kê tạm lưu
    const idChiNhanh = Cookies.get('IdChiNhanh') ?? null;

    const [maPhieu, setMaPhieu] = useState('');
    const [ngayLap, setNgayLap] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    const [ghiChu, setGhiChu] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    // phiếu kiểm kê cũ (lập theo phiếu nhập): giữ nguyên liên kết khi lưu lại
    const [idHoaDonCu, setIdHoaDonCu] = useState<string | null>(null);

    const [lstDong, setLstDong] = useState<IDongKiemKe[]>([]);
    const [isShowConfirm, setIsShowConfirm] = useState(false);
    const [isShowHuy, setIsShowHuy] = useState(false);

    // tìm hàng hóa (chỉ hàng hóa thường, điện thoại không kiểm kê)
    const [listSearch, setListSearch] = useState<ModelHangHoaDto[]>([]);
    const [txtSearch, setTxtSearch] = useState('');
    const [loading, setLoading] = useState(false);
    // chỉ nhận kết quả của lần tìm mới nhất
    const lanTimMoiNhat = useRef(0);
    const getListHangHoa = async (value: string) => {
        const lanTim = ++lanTimMoiNhat.current;
        setLoading(true);
        try {
            const data = await ProductService.Get_DMHangHoa({
                idNhomHangHoas: [],
                textSearch: value?.trim() ?? '',
                idLoaiHangHoa: 1,
                idChiNhanhs: idChiNhanh ? [idChiNhanh] : [],
                currentPage: 0,
                pageSize: 20
            } as PagedProductSearchDto);
            if (lanTim === lanTimMoiNhat.current) {
                setListSearch((data?.items ?? []).filter((x) => x.idDonViQuyDoi));
            }
        } finally {
            if (lanTim === lanTimMoiNhat.current) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        if (idPhieu) moPhieuTamLuu(idPhieu);
    }, [idPhieu]);

    // tồn phần mềm + phiếu nhập của các hàng
    const layThongTinHang = async (idHangHoas: string[]) => {
        const [ton, phieuNhap] = await Promise.all([
            KhoHangService.GetTonKho(idHangHoas, idChiNhanh),
            KhoHangService.GetPhieuNhap_ofHangHoa(idHangHoas, idChiNhanh)
        ]);
        return {
            getTon: (idHangHoa: string) => ton.find((t) => t.idHangHoa === idHangHoa)?.soLuongTon ?? 0,
            getPhieuNhap: (idHangHoa: string) => phieuNhap.find((t) => t.idHangHoa === idHangHoa)?.maPhieuNhaps ?? []
        };
    };

    // phiếu kiểm kê tạm lưu: lấy lại SL thực tế đã nhập, tồn phần mềm tính theo hiện tại
    const moPhieuTamLuu = async (id: string) => {
        const phieu = await KhoHangService.GetPhieuKho(id);
        if (!phieu) return;
        if (phieu.idLoaiChungTu !== LoaiChungTu.PHIEU_KIEM_KE || phieu.trangThai !== 1) {
            enqueueSnackbar('Phiếu đã hoàn thành, không sửa được', { variant: 'warning' });
            navigate('/phieu-kiem-kes');
            return;
        }
        setMaPhieu(phieu.maHoaDon ?? '');
        setGhiChu(phieu.ghiChuHD ?? '');
        setIdHoaDonCu(phieu.idHoaDon ?? null);
        if (phieu.ngayLapHoaDon) setNgayLap(format(new Date(phieu.ngayLapHoaDon), "yyyy-MM-dd'T'HH:mm"));

        const info = await layThongTinHang(phieu.chiTiet.map((x) => x.idHangHoa));
        setLstDong(
            phieu.chiTiet.map((x) => ({
                id: x.idDonViQuyDoi,
                idHangHoa: x.idHangHoa,
                maHang: x.maHangHoa,
                tenHang: x.tenHangHoa,
                maPhieuNhaps: info.getPhieuNhap(x.idHangHoa),
                soLuongTon: info.getTon(x.idHangHoa),
                soLuongThucTe: x.soLuong,
                ghiChu: x.ghiChu ?? ''
            }))
        );
    };

    // chọn hàng: thêm vào bảng kiểm kê, SL thực tế mặc định = tồn (chỉ sửa hàng đếm lệch)
    const themHang = async (item: ModelHangHoaDto) => {
        const id = item.idDonViQuyDoi ?? '';
        if (lstDong.some((x) => x.id === id)) {
            enqueueSnackbar(`${item.tenHangHoa} đã có trong phiếu kiểm kê`, { variant: 'info' });
            return;
        }
        const idHangHoa = item.idHangHoa ?? item.id ?? '';
        const info = await layThongTinHang([idHangHoa]);
        const ton = info.getTon(idHangHoa);
        setLstDong((prev) =>
            prev.some((x) => x.id === id)
                ? prev
                : [
                      ...prev,
                      {
                          id,
                          idHangHoa,
                          maHang: item.maHangHoa ?? '',
                          tenHang: item.tenHangHoa ?? '',
                          maPhieuNhaps: info.getPhieuNhap(idHangHoa),
                          soLuongTon: ton,
                          soLuongThucTe: ton,
                          ghiChu: ''
                      }
                  ]
        );
    };

    const updateDong = (id: string, change: Partial<IDongKiemKe>) =>
        setLstDong((prev) => prev.map((x) => (x.id === id ? { ...x, ...change } : x)));

    // trangThai: 1.Tạm lưu (chưa ảnh hưởng tồn kho), 3.Hoàn thành (cân bằng tồn kho theo SL thực tế)
    const savePhieuKiem = async (trangThai: number) => {
        if (isSaving) return;
        if (lstDong.length === 0) {
            enqueueSnackbar('Phiếu kiểm kê chưa có hàng hóa', { variant: 'warning' });
            return;
        }
        setIsSaving(true);
        try {
            const result = await KhoHangService.SavePhieuKho({
                id: idPhieu,
                idLoaiChungTu: LoaiChungTu.PHIEU_KIEM_KE,
                idChiNhanh: idChiNhanh,
                idHoaDon: idHoaDonCu,
                maHoaDon: maPhieu,
                ngayLapHoaDon: ngayLap ? new Date(ngayLap).toISOString() : new Date().toISOString(),
                ghiChuHD: ghiChu,
                trangThai: trangThai,
                chiTiet: lstDong.map((x) => ({
                    idDonViQuyDoi: x.id,
                    soLuong: x.soLuongThucTe,
                    tonLuyKe: x.soLuongTon,
                    ghiChu: x.ghiChu
                }))
            });
            if (!result) return;
            enqueueSnackbar(
                trangThai === 1
                    ? `Đã tạm lưu phiếu kiểm kê ${result.maHoaDon ?? ''}`
                    : `Hoàn thành phiếu kiểm kê ${result.maHoaDon ?? ''}, tồn kho đã được cân bằng`,
                { variant: 'success' }
            );
            navigate('/phieu-kiem-kes');
        } catch (error: any) {
            // lỗi từ Backend đã được httpService hiển thị
            if (!error?.response) {
                enqueueSnackbar(error?.message || 'Lưu phiếu kiểm kê thất bại', { variant: 'error' });
            }
        } finally {
            setIsSaving(false);
            setIsShowConfirm(false);
        }
    };

    // Hủy: bỏ phiếu đang lập; phiếu tạm lưu đang mở thì hủy luôn phiếu đó
    const huyPhieu = async () => {
        setIsShowHuy(false);
        if (idPhieu) {
            try {
                await KhoHangService.HuyPhieuKho([idPhieu]);
                enqueueSnackbar(`Đã hủy phiếu kiểm kê ${maPhieu}`, { variant: 'success' });
            } catch {
                // lỗi từ Backend đã được httpService hiển thị
                return;
            }
        }
        navigate('/phieu-kiem-kes');
    };

    const thongKe = useMemo(
        () => ({
            tongThucTe: lstDong.reduce((s, x) => s + x.soLuongThucTe, 0),
            lech: lstDong.filter((x) => x.soLuongThucTe !== x.soLuongTon).length,
            thieu: lstDong.filter((x) => x.soLuongThucTe < x.soLuongTon).length,
            thua: lstDong.filter((x) => x.soLuongThucTe > x.soLuongTon).length
        }),
        [lstDong]
    );

    const columns: GridColDef[] = [
        {
            field: 'maHang',
            headerName: 'Mã hàng',
            width: 120,
            sortable: false,
            renderCell: (p) => (
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'var(--color-main)' }}>{p.value}</Typography>
            )
        },
        {
            field: 'tenHang',
            headerName: 'Tên hàng',
            flex: 1,
            minWidth: 180,
            sortable: false,
            renderCell: (p) => (
                <Typography noWrap sx={{ fontSize: 14, fontWeight: 700 }} title={p.value}>
                    {p.value}
                </Typography>
            )
        },
        {
            field: 'maPhieuNhaps',
            headerName: 'Phiếu nhập',
            width: 160,
            sortable: false,
            renderCell: (p) =>
                p.row.maPhieuNhaps.length > 0 ? (
                    <Typography noWrap sx={{ fontSize: 13 }} title={p.row.maPhieuNhaps.join(', ')}>
                        <DanhSachMaChungTu ma={p.row.maPhieuNhaps.join(', ')} />
                    </Typography>
                ) : (
                    <Typography sx={{ fontSize: 12, color: '#9ca3af' }}>Chưa có phiếu nhập</Typography>
                )
        },
        {
            field: 'soLuongTon',
            headerName: 'SL tồn phần mềm',
            width: 130,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (p) => <Typography sx={{ fontWeight: 700 }}>{p.value}</Typography>
        },
        {
            field: 'soLuongThucTe',
            headerName: 'SL thực tế',
            width: 120,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (p) => (
                <TextField
                    size="small"
                    value={p.row.soLuongThucTe}
                    onChange={(e) => updateDong(p.row.id, { soLuongThucTe: parseSo(e.target.value) })}
                    onKeyDown={(e) => e.stopPropagation()}
                    onFocus={(e) => e.target.select()}
                    sx={{ width: 90, '& input': { textAlign: 'center', fontWeight: 700 } }}
                />
            )
        },
        {
            field: 'soLuongLech',
            headerName: 'SL lệch',
            width: 100,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (p) => {
                const lech = p.row.soLuongThucTe - p.row.soLuongTon;
                return (
                    <Typography
                        sx={{ fontWeight: 800, color: lech < 0 ? '#dc2626' : lech > 0 ? '#16a34a' : '#6b7280' }}>
                        {lech > 0 ? `+${lech}` : lech}
                    </Typography>
                );
            }
        },
        {
            field: 'ghiChu',
            headerName: 'Ghi chú',
            width: 200,
            sortable: false,
            renderCell: (p) => (
                <TextField
                    size="small"
                    fullWidth
                    placeholder="Ghi chú"
                    value={p.row.ghiChu}
                    onChange={(e) => updateDong(p.row.id, { ghiChu: e.target.value })}
                    onKeyDown={(e) => e.stopPropagation()}
                />
            )
        },
        {
            field: 'action',
            headerName: '',
            width: 56,
            sortable: false,
            align: 'center',
            renderCell: (p) => (
                <Tooltip title="Bỏ khỏi phiếu">
                    <IconButton
                        size="small"
                        onClick={() => setLstDong((prev) => prev.filter((x) => x.id !== p.row.id))}
                        sx={{ color: '#9ca3af', '&:hover': { backgroundColor: '#fee2e2', color: '#dc2626' } }}>
                        <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                </Tooltip>
            )
        }
    ];

    const dongThongKe = (label: string, value: number, color?: string) => (
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1.5 }}>
            <Typography sx={{ fontSize: 14 }}>{label}</Typography>
            <Typography sx={{ fontWeight: 700, color }}>{value}</Typography>
        </Stack>
    );

    return (
        <>
            <ConfirmDelete
                isShow={isShowConfirm}
                title="Xác nhận kiểm kê"
                mes={`Tồn kho của ${lstDong.length} mặt hàng sẽ được cân bằng theo số lượng thực tế (${thongKe.lech} mặt hàng lệch). Bạn có chắc chắn muốn hoàn thành phiếu kiểm kê?`}
                onOk={() => savePhieuKiem(3)}
                onCancel={() => setIsShowConfirm(false)}
            />
            <ConfirmDelete
                isShow={isShowHuy}
                title="Hủy phiếu kiểm kê"
                mes={
                    idPhieu
                        ? `Phiếu kiểm kê tạm lưu ${maPhieu} sẽ bị hủy. Bạn có chắc chắn?`
                        : 'Bỏ phiếu kiểm kê đang lập (chưa lưu)?'
                }
                onOk={huyPhieu}
                onCancel={() => setIsShowHuy(false)}
            />
            <Box sx={{ background: '#f5f6fa', minHeight: '100vh', p: 2 }}>
                <Paper elevation={0} sx={{ p: 1, borderRadius: 2, mb: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <IconButton onClick={() => navigate('/phieu-kiem-kes')}>
                            <ArrowBackIcon />
                        </IconButton>
                        <Typography sx={{ fontWeight: 800, fontSize: 18 }}>
                            {maPhieu ? `Kiểm kê ${maPhieu}` : 'Lập phiếu kiểm kê'}
                        </Typography>
                    </Stack>
                </Paper>

                <Grid container spacing={2}>
                    {/* PHẢI: thông tin phiếu kiểm kê */}
                    <Grid item xs={12} md={4} lg={3.5} sx={{ order: 2 }}>
                        <Paper elevation={0} sx={{ borderRadius: 2, p: 2, position: 'sticky', top: 16 }}>
                            <Typography sx={{ fontWeight: 800, mb: 2, textTransform: 'uppercase' }}>
                                Thông tin phiếu kiểm kê
                            </Typography>
                            <TextField
                                fullWidth
                                label="Mã phiếu"
                                size="small"
                                value={maPhieu || 'Tự động'}
                                InputProps={{ readOnly: true }}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                fullWidth
                                type="datetime-local"
                                size="small"
                                label="Ngày kiểm kê"
                                InputLabelProps={{ shrink: true }}
                                value={ngayLap}
                                onChange={(e) => setNgayLap(e.target.value)}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Ghi chú"
                                value={ghiChu}
                                onChange={(e) => setGhiChu(e.target.value)}
                                sx={{ mb: 2 }}
                            />

                            <Box sx={{ border: '1px solid #e5e7eb', borderRadius: 2, p: 2 }}>
                                <Typography sx={{ fontWeight: 800, mb: 2, textTransform: 'uppercase' }}>
                                    Thông tin kiểm kê
                                </Typography>
                                {dongThongKe('SL hàng kiểm kê', lstDong.length, 'var(--color-main)')}
                                {dongThongKe('Tổng SL thực tế', thongKe.tongThucTe)}
                                <Divider sx={{ mb: 1.5 }} />
                                {dongThongKe('SL hàng chênh lệch', thongKe.lech)}
                                {dongThongKe('SL hàng thiếu', thongKe.thieu, '#dc2626')}
                                {dongThongKe('SL hàng thừa', thongKe.thua, '#16a34a')}
                            </Box>

                            <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    onClick={() => setIsShowHuy(true)}
                                    disabled={isSaving}
                                    sx={{ flex: '1 1 30%', textTransform: 'none', fontWeight: 700 }}>
                                    Hủy
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={() => savePhieuKiem(1)}
                                    disabled={isSaving || lstDong.length === 0}
                                    sx={{ flex: '1 1 30%', textTransform: 'none', fontWeight: 700 }}>
                                    Tạm lưu
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={() => setIsShowConfirm(true)}
                                    disabled={isSaving || lstDong.length === 0}
                                    sx={{
                                        flex: '1 1 100%',
                                        backgroundColor: 'var(--color-main)',
                                        textTransform: 'none',
                                        fontWeight: 800,
                                        boxShadow: 'none',
                                        py: 1.2
                                    }}>
                                    {isSaving ? 'Đang lưu...' : 'Xác nhận'}
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* TRÁI: tìm hàng + bảng kiểm kê */}
                    <Grid item xs={12} md={8} lg={8.5} sx={{ order: 1 }}>
                        <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                            <Box sx={{ p: 1, borderBottom: '1px solid #edf0f5' }}>
                                <Autocomplete
                                    fullWidth
                                    options={listSearch}
                                    loading={loading}
                                    filterOptions={(x) => x}
                                    getOptionLabel={(option) =>
                                        `${option.maHangHoa ?? ''} - ${option.tenHangHoa ?? ''}`
                                    }
                                    // luôn để trống sau khi chọn để chọn tiếp hàng khác
                                    value={null}
                                    inputValue={txtSearch}
                                    onOpen={() => getListHangHoa(txtSearch)}
                                    onInputChange={(_, value, reason) => {
                                        if (reason !== 'input') return;
                                        setTxtSearch(value);
                                        getListHangHoa(value);
                                    }}
                                    onChange={(_, value) => {
                                        if (!value) return;
                                        themHang(value);
                                        setTxtSearch('');
                                        getListHangHoa('');
                                    }}
                                    noOptionsText={loading ? 'Đang tải...' : 'Không tìm thấy hàng hóa'}
                                    renderOption={(props, option) => (
                                        <li {...props} key={option.idDonViQuyDoi}>
                                            <Box sx={{ width: '100%', py: 0.5 }}>
                                                <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
                                                    {option.tenHangHoa}
                                                </Typography>
                                                <Stack direction="row" spacing={1.5} sx={{ mt: 0.5, flexWrap: 'wrap' }}>
                                                    <Typography sx={{ fontSize: 12, color: '#6b7280' }}>
                                                        Mã: {option.maHangHoa}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: 12, color: '#2563eb' }}>
                                                        Tồn: {option.soLuongTon}
                                                    </Typography>
                                                    {lstDong.some((x) => x.id === option.idDonViQuyDoi) && (
                                                        <Typography sx={{ fontSize: 12, color: '#16a34a' }}>
                                                            Đã có trong phiếu
                                                        </Typography>
                                                    )}
                                                </Stack>
                                            </Box>
                                        </li>
                                    )}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            size="small"
                                            placeholder="Tìm hàng hóa cần kiểm kê theo mã hoặc tên"
                                        />
                                    )}
                                />
                            </Box>
                            <DataGrid
                                autoHeight
                                rows={lstDong}
                                columns={columns}
                                hideFooter
                                disableColumnMenu
                                disableRowSelectionOnClick
                                rowHeight={52}
                                localeText={{ noRowsLabel: 'Tìm và chọn hàng hóa để kiểm kê' }}
                                sx={{
                                    border: 0,
                                    '& .MuiDataGrid-columnHeaders': { background: '#f8fafc' },
                                    '& .MuiDataGrid-columnHeaderTitle': {
                                        fontWeight: 800,
                                        fontSize: 13,
                                        color: '#4b5563'
                                    },
                                    '& .MuiDataGrid-cell, & .MuiDataGrid-columnHeader': { outline: 'none !important' }
                                }}
                            />
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </>
    );
};

export default Page_them_phieu_kiem_ke;
