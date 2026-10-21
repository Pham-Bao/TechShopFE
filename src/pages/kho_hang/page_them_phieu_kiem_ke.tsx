import React, { useEffect, useMemo, useState } from 'react';
import {
    Box,
    Button,
    Chip,
    Divider,
    Grid,
    IconButton,
    InputAdornment,
    Paper,
    SelectChangeEvent,
    Stack,
    TextField,
    Typography
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { enqueueSnackbar } from 'notistack';
import { format } from 'date-fns';
import Cookies from 'js-cookie';
import { LoaiChungTu } from '../../lib/appconst';
import AppConsts from '../../lib/appconst';
import utils from '../../utils/utils';
import KhoHangService, {
    PhieuKhoViewChiTietDto,
    PhieuNhapListItemDto,
    PhieuNhapListRequestDto
} from '../../services/kho_hang/KhoHangService';
import DateFilterCustom from '../../components/DatetimePicker/DateFilterCustom';
import CustomTablePagination from '../../components/Pagination/CustomTablePagination';
import ConfirmDelete from '../../components/AlertDialog/ConfirmDelete';
import ModalKiemKe, { IDongKiemKe } from './components/ModalKiemKe';
import ModalXemPhieuNhap from './components/ModalXemPhieuNhap';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

const formatMoney = (value: number) => new Intl.NumberFormat('vi-VN').format(value ?? 0);

// SL nhập theo đơn vị quy đổi (chỉ hàng hóa, điện thoại không kiểm kê)
const tongHopSoLuongNhap = (chiTiet: PhieuKhoViewChiTietDto[]) => {
    const map = new Map<string, PhieuKhoViewChiTietDto & { tong: number }>();
    chiTiet
        .filter((x) => x.idLoaiHangHoa === 1 && !x.dienThoai)
        .forEach((x) => {
            const cu = map.get(x.idDonViQuyDoi);
            map.set(x.idDonViQuyDoi, { ...x, tong: (cu?.tong ?? 0) + x.soLuong });
        });
    return Array.from(map.values());
};

/**
 * Lập phiếu kiểm kê: danh sách phiếu nhập bên trái, thông tin phiếu bên phải.
 * Chọn 1 phiếu nhập -> "Kiểm kê" -> nhập SL thực tế -> Tạm lưu / Xác nhận (cân bằng tồn kho).
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

    // phiếu nhập đang được kiểm và các dòng kiểm kê của nó
    const [phieuNhap, setPhieuNhap] = useState<{ id: string; maHoaDon: string } | null>(null);
    const [lstDong, setLstDong] = useState<IDongKiemKe[]>([]);
    const [isShowModal, setIsShowModal] = useState(false);
    const [isShowConfirm, setIsShowConfirm] = useState(false);

    // danh sách phiếu nhập (chỉ phiếu hoàn thành có hàng hóa)
    const [txtSearch, setTxtSearch] = useState('');
    const [txtThoiGian, setTxtThoiGian] = useState('Toàn thời gian');
    const [anchorDateEl, setAnchorDateEl] = useState<HTMLDivElement | null>(null);
    const [paramSearch, setParamSearch] = useState<PhieuNhapListRequestDto>({
        textSearch: '',
        loaiHang: 1,
        trangThais: [3],
        idChiNhanhs: idChiNhanh ? [idChiNhanh] : [],
        fromDate: null,
        toDate: null,
        currentPage: 1,
        pageSize: AppConsts.pageOption[0].value
    });
    const [pageData, setPageData] = useState<{ totalCount: number; items: PhieuNhapListItemDto[] }>({
        totalCount: 0,
        items: []
    });
    const [idChon, setIdChon] = useState<string | null>(null);
    const [idXemPhieu, setIdXemPhieu] = useState<string | null>(null);

    useEffect(() => {
        KhoHangService.GetListPhieuNhap(paramSearch).then((data) =>
            setPageData({ totalCount: data?.totalCount ?? 0, items: data?.items ?? [] })
        );
    }, [paramSearch]);

    useEffect(() => {
        if (idPhieu) moPhieuTamLuu(idPhieu);
    }, [idPhieu]);

    const layTonKho = async (idHangHoas: string[]) => {
        const ton = await KhoHangService.GetTonKho(idHangHoas, idChiNhanh);
        return (idHangHoa: string) => ton.find((t) => t.idHangHoa === idHangHoa)?.soLuongTon ?? 0;
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
        if (phieu.ngayLapHoaDon) setNgayLap(format(new Date(phieu.ngayLapHoaDon), "yyyy-MM-dd'T'HH:mm"));

        let slNhap: Map<string, number> | null = null;
        if (phieu.idHoaDon) {
            setPhieuNhap({ id: phieu.idHoaDon, maHoaDon: phieu.maHoaDonLienQuan ?? '' });
            setIdChon(phieu.idHoaDon);
            const pn = await KhoHangService.GetPhieuKho(phieu.idHoaDon);
            slNhap = new Map(tongHopSoLuongNhap(pn?.chiTiet ?? []).map((x) => [x.idDonViQuyDoi, x.tong]));
        }
        const getTon = await layTonKho(phieu.chiTiet.map((x) => x.idHangHoa));
        setLstDong(
            phieu.chiTiet.map((x) => ({
                id: x.idDonViQuyDoi,
                idHangHoa: x.idHangHoa,
                maHang: x.maHangHoa,
                tenHang: x.tenHangHoa,
                soLuongNhap: slNhap ? slNhap.get(x.idDonViQuyDoi) ?? 0 : null,
                soLuongTon: getTon(x.idHangHoa),
                soLuongThucTe: x.soLuong,
                ghiChu: x.ghiChu ?? ''
            }))
        );
        setIsShowModal(true);
    };

    // bấm "Kiểm kê": lấy hàng hóa của phiếu nhập đang chọn (giữ số đã đếm nếu vẫn là phiếu đó)
    const moKiemKe = async () => {
        if (!idChon) return;
        if (phieuNhap?.id === idChon && lstDong.length > 0) {
            setIsShowModal(true);
            return;
        }
        const pn = await KhoHangService.GetPhieuKho(idChon);
        const lstHang = tongHopSoLuongNhap(pn?.chiTiet ?? []);
        if (lstHang.length === 0) {
            enqueueSnackbar('Phiếu nhập không có hàng hóa cần kiểm kê', { variant: 'warning' });
            return;
        }
        const getTon = await layTonKho(lstHang.map((x) => x.idHangHoa));
        setPhieuNhap({ id: pn.id, maHoaDon: pn.maHoaDon });
        setLstDong(
            lstHang.map((x) => {
                const ton = getTon(x.idHangHoa);
                return {
                    id: x.idDonViQuyDoi,
                    idHangHoa: x.idHangHoa,
                    maHang: x.maHangHoa,
                    tenHang: x.tenHangHoa,
                    soLuongNhap: x.tong,
                    soLuongTon: ton,
                    soLuongThucTe: ton, // mặc định khớp tồn, chỉ sửa hàng đếm lệch
                    ghiChu: ''
                };
            })
        );
        setIsShowModal(true);
    };

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
                idHoaDon: phieuNhap?.id ?? null,
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

    const thongKe = useMemo(
        () => ({
            tongThucTe: lstDong.reduce((s, x) => s + x.soLuongThucTe, 0),
            lech: lstDong.filter((x) => x.soLuongThucTe !== x.soLuongTon).length,
            thieu: lstDong.filter((x) => x.soLuongThucTe < x.soLuongTon).length,
            thua: lstDong.filter((x) => x.soLuongThucTe > x.soLuongTon).length
        }),
        [lstDong]
    );

    const onApplyFilterDate = async (from: string, to: string, dateType: string, dateTypeText: string) => {
        setAnchorDateEl(null);
        setTxtThoiGian(
            from && to && !from.startsWith('2000-01-01') // "Toàn thời gian" tính từ 01/01/2000
                ? `${format(new Date(from), 'dd/MM/yyyy')} - ${format(new Date(to), 'dd/MM/yyyy')}`
                : dateTypeText || 'Toàn thời gian'
        );
        setParamSearch({ ...paramSearch, fromDate: from || null, toDate: to || null, currentPage: 1 });
    };

    const columns: GridColDef[] = [
        {
            field: 'maHoaDon',
            headerName: 'Mã phiếu nhập',
            minWidth: 120,
            flex: 0.8,
            renderCell: (p) => <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{p.value}</Typography>
        },
        {
            field: 'ngayLapHoaDon',
            headerName: 'Ngày nhập',
            minWidth: 130,
            flex: 0.9,
            align: 'center',
            headerAlign: 'center',
            renderCell: (p) => (utils.checkNull(p.value) ? '' : format(new Date(p.value), 'dd/MM/yyyy HH:mm'))
        },
        {
            field: 'tenKhachHang',
            headerName: 'Nhà cung cấp',
            minWidth: 140,
            flex: 1,
            renderCell: (p) => (
                <Box component="span" title={p.row.maKhachHang} sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.value}
                </Box>
            )
        },
        {
            field: 'soLuong',
            headerName: 'Số lượng',
            minWidth: 90,
            flex: 0.5,
            align: 'right',
            headerAlign: 'right',
            renderCell: (p) => formatMoney(p.value)
        },
        {
            field: 'tongThanhToan',
            headerName: 'Tổng tiền',
            minWidth: 110,
            flex: 0.7,
            align: 'right',
            headerAlign: 'right',
            renderCell: (p) => formatMoney(p.value)
        },
        {
            field: 'soLanKiemKe',
            headerName: 'Kiểm kê',
            minWidth: 120,
            flex: 0.7,
            align: 'center',
            headerAlign: 'center',
            renderCell: (p) =>
                p.value > 0 ? (
                    <Chip size="small" color="success" variant="outlined" label={`Đã kiểm ${p.value} lần`} />
                ) : (
                    <Typography sx={{ fontSize: 12, color: '#9ca3af' }}>Chưa kiểm</Typography>
                )
        },
        {
            field: 'actions',
            headerName: '',
            width: 60,
            sortable: false,
            align: 'center',
            renderCell: (p) => (
                <IconButton
                    size="small"
                    title="Xem phiếu nhập"
                    onClick={(e) => {
                        e.stopPropagation(); // chỉ xem, không đổi phiếu nhập đang chọn để kiểm
                        setIdXemPhieu(p.row.id);
                    }}
                    sx={{ color: '#9e9e9e', '&:hover': { color: '#757575' } }}>
                    <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                </IconButton>
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
            <ModalXemPhieuNhap idPhieu={idXemPhieu} onClose={() => setIdXemPhieu(null)} />
            <ModalKiemKe
                open={isShowModal}
                tieuDe={
                    phieuNhap
                        ? `Kiểm kê phiếu nhập ${phieuNhap.maHoaDon}`
                        : `Kiểm kê ${maPhieu ? `phiếu ${maPhieu}` : ''}`
                }
                lstDong={lstDong}
                setLstDong={setLstDong}
                isSaving={isSaving}
                onClose={() => setIsShowModal(false)}
                onTamLuu={() => savePhieuKiem(1)}
                onXacNhan={() => setIsShowConfirm(true)}
            />
            <ConfirmDelete
                isShow={isShowConfirm}
                title="Xác nhận kiểm kê"
                mes={`Tồn kho của ${lstDong.length} mặt hàng sẽ được cân bằng theo số lượng thực tế (${thongKe.lech} mặt hàng lệch). Bạn có chắc chắn muốn hoàn thành phiếu kiểm kê?`}
                onOk={() => savePhieuKiem(3)}
                onCancel={() => setIsShowConfirm(false)}
            />
            <Box sx={{ background: '#f5f6fa', minHeight: '100vh', p: 2 }}>
                <Paper elevation={0} sx={{ p: 1, borderRadius: 2, mb: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <IconButton onClick={() => navigate('/phieu-kiem-kes')}>
                            <ArrowBackIcon />
                        </IconButton>
                        <Typography sx={{ fontWeight: 800, fontSize: 18 }}>Lập phiếu kiểm kê</Typography>
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
                                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1.5 }}>
                                    <Typography sx={{ fontSize: 14 }}>Phiếu nhập kiểm kê</Typography>
                                    <Typography sx={{ fontWeight: 800, color: 'var(--color-main)' }}>
                                        {phieuNhap?.maHoaDon || '-'}
                                    </Typography>
                                </Stack>
                                <Divider sx={{ mb: 1.5 }} />
                                {dongThongKe('Tổng SL thực tế', thongKe.tongThucTe, 'var(--color-main)')}
                                {dongThongKe('SL hàng kiểm kê', lstDong.length)}
                                {dongThongKe('SL hàng chênh lệch', thongKe.lech)}
                                {dongThongKe('SL hàng thiếu', thongKe.thieu, '#dc2626')}
                                {dongThongKe('SL hàng thừa', thongKe.thua, '#16a34a')}
                            </Box>

                            {lstDong.length > 0 && (
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    onClick={() => setIsShowModal(true)}
                                    sx={{ mt: 2, textTransform: 'none', fontWeight: 700 }}>
                                    Mở lại bảng kiểm kê
                                </Button>
                            )}
                        </Paper>
                    </Grid>

                    {/* TRÁI: danh sách phiếu nhập */}
                    <Grid item xs={12} md={8} lg={8.5} sx={{ order: 1 }}>
                        <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                            <Stack
                                direction="row"
                                spacing={1}
                                sx={{
                                    p: 1,
                                    borderBottom: '1px solid #edf0f5',
                                    flexWrap: { xs: 'wrap', lg: 'nowrap' },
                                    rowGap: 1
                                }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Tìm phiếu nhập theo mã phiếu, mã / tên nhà cung cấp"
                                    value={txtSearch}
                                    onChange={(e) => setTxtSearch(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter')
                                            setParamSearch({ ...paramSearch, textSearch: txtSearch, currentPage: 1 });
                                    }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <IconButton
                                                    size="small"
                                                    onClick={() =>
                                                        setParamSearch({
                                                            ...paramSearch,
                                                            textSearch: txtSearch,
                                                            currentPage: 1
                                                        })
                                                    }>
                                                    <SearchIcon />
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                    sx={{ minWidth: 240, '& .MuiInputBase-root': { height: 42 } }}
                                />
                                <Box>
                                    <TextField
                                        label="Thời gian"
                                        size="small"
                                        value={txtThoiGian}
                                        InputProps={{ readOnly: true }}
                                        onClick={(e) => setAnchorDateEl(e.currentTarget)}
                                        sx={{ width: 220, '& .MuiInputBase-root': { height: 42 } }}
                                    />
                                    <DateFilterCustom
                                        id="popover-date-filter-kiem-ke"
                                        open={Boolean(anchorDateEl)}
                                        anchorEl={anchorDateEl}
                                        onClose={() => setAnchorDateEl(null)}
                                        onApplyDate={onApplyFilterDate}
                                    />
                                </Box>
                                <Button
                                    variant="contained"
                                    startIcon={<FactCheckOutlinedIcon />}
                                    disabled={!idChon}
                                    onClick={moKiemKe}
                                    sx={{
                                        height: 42,
                                        px: 2.5,
                                        whiteSpace: 'nowrap',
                                        textTransform: 'none',
                                        fontWeight: 800,
                                        boxShadow: 'none'
                                    }}>
                                    Kiểm kê
                                </Button>
                            </Stack>
                            <DataGrid
                                autoHeight
                                rows={pageData.items}
                                columns={columns}
                                hideFooter
                                rowHeight={48}
                                onRowClick={(p) => setIdChon(p.id as string)}
                                getRowClassName={(p) => (p.id === idChon ? 'row-chon' : '')}
                                localeText={{ noRowsLabel: 'Không có phiếu nhập hàng hóa nào' }}
                                sx={{
                                    border: 0,
                                    '& .MuiDataGrid-columnHeaders': { background: '#f8fafc' },
                                    '& .MuiDataGrid-columnHeaderTitle': {
                                        fontWeight: 800,
                                        fontSize: 13,
                                        color: '#4b5563'
                                    },
                                    '& .MuiDataGrid-cell': { outline: 'none !important' },
                                    '& .MuiDataGrid-row': { cursor: 'pointer' },
                                    '& .row-chon, & .row-chon:hover': {
                                        backgroundColor: 'var(--color-bg, #e8f0fe)',
                                        boxShadow: 'inset 4px 0 0 var(--color-main)'
                                    }
                                }}
                            />
                            <Box sx={{ p: 1 }}>
                                <CustomTablePagination
                                    currentPage={paramSearch.currentPage}
                                    rowPerPage={paramSearch.pageSize}
                                    totalRecord={pageData.totalCount}
                                    totalPage={utils.getTotalPage(pageData.totalCount, paramSearch.pageSize)}
                                    handlePerPageChange={(e: SelectChangeEvent<number>) =>
                                        setParamSearch({
                                            ...paramSearch,
                                            currentPage: 1,
                                            pageSize: parseInt(e.target.value.toString(), 10)
                                        })
                                    }
                                    handlePageChange={(e: any, value: number) =>
                                        setParamSearch({ ...paramSearch, currentPage: value })
                                    }
                                />
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </>
    );
};

export default Page_them_phieu_kiem_ke;
