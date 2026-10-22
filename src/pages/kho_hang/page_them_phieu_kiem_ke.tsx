import React, { useEffect, useMemo, useState } from 'react';
import {
    Box,
    Button,
    Checkbox,
    Divider,
    Grid,
    IconButton,
    InputAdornment,
    MenuItem,
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
import KhoHangService, { KiemKeGanNhatDto } from '../../services/kho_hang/KhoHangService';
import ProductService from '../../services/product/ProductService';
import GroupProductService from '../../services/product/GroupProductService';
import { ModelHangHoaDto, ModelNhomHangHoa, PagedProductSearchDto } from '../../services/product/dto';
import CustomTablePagination from '../../components/Pagination/CustomTablePagination';
import ConfirmDelete from '../../components/AlertDialog/ConfirmDelete';
import ModalKiemKe, { IDongKiemKe } from './components/ModalKiemKe';

// hàng hóa được tick chọn để kiểm (giữ qua các trang / bộ lọc)
interface IHangChon {
    id: string; // idDonViQuyDoi
    idHangHoa: string;
    maHang: string;
    tenHang: string;
}

const toHangChon = (x: ModelHangHoaDto): IHangChon => ({
    id: x.idDonViQuyDoi ?? '',
    idHangHoa: x.idHangHoa ?? x.id ?? '',
    maHang: x.maHangHoa ?? '',
    tenHang: x.tenHangHoa ?? ''
});

/**
 * Lập phiếu kiểm kê theo hàng hóa: danh sách hàng hóa bên trái (tick chọn hàng cần kiểm), thông tin phiếu bên phải.
 * Bấm "Kiểm kê" -> nhập SL thực tế -> đối chiếu tồn hệ thống -> Tạm lưu / Xác nhận (cân bằng tồn kho).
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
    const [isShowModal, setIsShowModal] = useState(false);
    const [isShowConfirm, setIsShowConfirm] = useState(false);

    // danh sách hàng hóa (chỉ hàng hóa thường, điện thoại không kiểm kê)
    const [lstNhom, setLstNhom] = useState<ModelNhomHangHoa[]>([]);
    const [txtSearch, setTxtSearch] = useState('');
    const [paramSearch, setParamSearch] = useState<PagedProductSearchDto>({
        textSearch: '',
        idNhomHangHoas: [],
        idLoaiHangHoa: 1,
        idChiNhanhs: idChiNhanh ? [idChiNhanh] : [],
        currentPage: 1,
        pageSize: AppConsts.pageOption[0].value
    });
    const [pageData, setPageData] = useState<{ totalCount: number; items: ModelHangHoaDto[] }>({
        totalCount: 0,
        items: []
    });
    const [kiemKeGanNhat, setKiemKeGanNhat] = useState<Record<string, KiemKeGanNhatDto>>({});
    const [lstChon, setLstChon] = useState<IHangChon[]>([]);

    useEffect(() => {
        GroupProductService.GetDM_NhomHangHoa().then((data) =>
            setLstNhom((data?.items ?? []).filter((x) => x.laNhomHangHoa))
        );
    }, []);

    useEffect(() => {
        ProductService.Get_DMHangHoa(paramSearch).then(async (data) => {
            const items = (data?.items ?? []).filter((x) => x.idDonViQuyDoi);
            setPageData({ totalCount: data?.totalCount ?? 0, items });
            const lanKiem = await KhoHangService.GetKiemKeGanNhat(
                items.map((x) => x.idHangHoa ?? x.id ?? ''),
                idChiNhanh
            );
            setKiemKeGanNhat((prev) => ({ ...prev, ...Object.fromEntries(lanKiem.map((x) => [x.idHangHoa, x])) }));
        });
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
        setIdHoaDonCu(phieu.idHoaDon ?? null);
        if (phieu.ngayLapHoaDon) setNgayLap(format(new Date(phieu.ngayLapHoaDon), "yyyy-MM-dd'T'HH:mm"));

        const getTon = await layTonKho(phieu.chiTiet.map((x) => x.idHangHoa));
        setLstChon(
            phieu.chiTiet.map((x) => ({
                id: x.idDonViQuyDoi,
                idHangHoa: x.idHangHoa,
                maHang: x.maHangHoa,
                tenHang: x.tenHangHoa
            }))
        );
        setLstDong(
            phieu.chiTiet.map((x) => ({
                id: x.idDonViQuyDoi,
                idHangHoa: x.idHangHoa,
                maHang: x.maHangHoa,
                tenHang: x.tenHangHoa,
                soLuongTon: getTon(x.idHangHoa),
                soLuongThucTe: x.soLuong,
                ghiChu: x.ghiChu ?? ''
            }))
        );
        setIsShowModal(true);
    };

    const daChon = (id?: string) => lstChon.some((x) => x.id === id);
    const doiChon = (x: ModelHangHoaDto) => {
        const id = x.idDonViQuyDoi;
        setLstChon((prev) =>
            prev.some((c) => c.id === id) ? prev.filter((c) => c.id !== id) : [...prev, toHangChon(x)]
        );
    };
    const themVaoChon = (lst: ModelHangHoaDto[]) =>
        setLstChon((prev) => [
            ...prev,
            ...lst.filter((x) => !prev.some((c) => c.id === x.idDonViQuyDoi)).map(toHangChon)
        ]);
    const chonCaTrang = pageData.items.length > 0 && pageData.items.every((x) => daChon(x.idDonViQuyDoi));
    const doiChonCaTrang = () =>
        chonCaTrang
            ? setLstChon((prev) => prev.filter((c) => !pageData.items.some((x) => x.idDonViQuyDoi === c.id)))
            : themVaoChon(pageData.items);

    // bấm "Kiểm kê": dựng bảng kiểm từ hàng đã chọn (giữ số đã đếm của hàng đã có trong bảng)
    const moKiemKe = async () => {
        if (lstChon.length === 0) return;
        const getTon = await layTonKho(lstChon.map((x) => x.idHangHoa));
        setLstDong((prev) =>
            lstChon.map((x) => {
                const cu = prev.find((d) => d.id === x.id);
                const ton = getTon(x.idHangHoa);
                return cu
                    ? { ...cu, soLuongTon: ton }
                    : {
                          ...x,
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

    const thongKe = useMemo(
        () => ({
            tongThucTe: lstDong.reduce((s, x) => s + x.soLuongThucTe, 0),
            lech: lstDong.filter((x) => x.soLuongThucTe !== x.soLuongTon).length,
            thieu: lstDong.filter((x) => x.soLuongThucTe < x.soLuongTon).length,
            thua: lstDong.filter((x) => x.soLuongThucTe > x.soLuongTon).length
        }),
        [lstDong]
    );

    const timKiem = () => setParamSearch({ ...paramSearch, textSearch: txtSearch, currentPage: 1 });

    const columns: GridColDef[] = [
        {
            field: 'chon',
            width: 56,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderHeader: () => <Checkbox size="small" checked={chonCaTrang} onChange={doiChonCaTrang} />,
            renderCell: (p) => (
                <Checkbox
                    size="small"
                    checked={daChon(p.row.idDonViQuyDoi)}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => doiChon(p.row)}
                />
            )
        },
        {
            field: 'maHangHoa',
            headerName: 'Mã hàng',
            minWidth: 110,
            flex: 0.7,
            sortable: false,
            renderCell: (p) => <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{p.value}</Typography>
        },
        {
            field: 'tenHangHoa',
            headerName: 'Tên hàng',
            minWidth: 180,
            flex: 1.4,
            sortable: false,
            renderCell: (p) => (
                <Box component="span" title={p.value} sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.value}
                </Box>
            )
        },
        {
            field: 'tenNhomHang',
            headerName: 'Nhóm hàng',
            minWidth: 120,
            flex: 0.8,
            sortable: false
        },
        {
            field: 'soLuongTon',
            headerName: 'Tồn hệ thống',
            minWidth: 110,
            flex: 0.6,
            sortable: false,
            align: 'right',
            headerAlign: 'right',
            renderCell: (p) => <Typography sx={{ fontWeight: 700 }}>{p.value ?? 0}</Typography>
        },
        {
            field: 'kiemKeGanNhat',
            headerName: 'Kiểm kê gần nhất',
            minWidth: 140,
            flex: 0.8,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (p) => {
                const lan = kiemKeGanNhat[p.row.idHangHoa ?? p.row.id];
                return lan ? (
                    <Typography sx={{ fontSize: 13 }} title={lan.maPhieu}>
                        {format(new Date(lan.ngayKiemKe), 'dd/MM/yyyy HH:mm')}
                    </Typography>
                ) : (
                    <Typography sx={{ fontSize: 12, color: '#9ca3af' }}>Chưa kiểm</Typography>
                );
            }
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
            <ModalKiemKe
                open={isShowModal}
                tieuDe={`Kiểm kê ${maPhieu ? `phiếu ${maPhieu}` : 'hàng hóa'}`}
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
                                {dongThongKe('Hàng hóa đã chọn', lstChon.length, 'var(--color-main)')}
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

                    {/* TRÁI: danh sách hàng hóa */}
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
                                    placeholder="Tìm hàng hóa theo mã / tên"
                                    value={txtSearch}
                                    onChange={(e) => setTxtSearch(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') timKiem();
                                    }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <IconButton size="small" onClick={timKiem}>
                                                    <SearchIcon />
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                    sx={{ minWidth: 220, '& .MuiInputBase-root': { height: 42 } }}
                                />
                                <TextField
                                    select
                                    size="small"
                                    label="Nhóm hàng"
                                    value={paramSearch.idNhomHangHoas?.[0] ?? ''}
                                    onChange={(e) =>
                                        setParamSearch({
                                            ...paramSearch,
                                            idNhomHangHoas: e.target.value ? [e.target.value] : [],
                                            currentPage: 1
                                        })
                                    }
                                    sx={{ minWidth: 180, '& .MuiInputBase-root': { height: 42 } }}>
                                    <MenuItem value="">Tất cả nhóm</MenuItem>
                                    {lstNhom.map((x) => (
                                        <MenuItem key={x.id} value={x.id ?? ''}>
                                            {x.tenNhomHang}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <Button
                                    variant="contained"
                                    startIcon={<FactCheckOutlinedIcon />}
                                    disabled={lstChon.length === 0}
                                    onClick={moKiemKe}
                                    sx={{
                                        height: 42,
                                        px: 2.5,
                                        whiteSpace: 'nowrap',
                                        textTransform: 'none',
                                        fontWeight: 800,
                                        boxShadow: 'none'
                                    }}>
                                    Kiểm kê ({lstChon.length})
                                </Button>
                            </Stack>
                            <DataGrid
                                autoHeight
                                rows={pageData.items}
                                getRowId={(r) => r.idDonViQuyDoi}
                                columns={columns}
                                hideFooter
                                disableColumnMenu
                                rowHeight={48}
                                onRowClick={(p) => doiChon(p.row)}
                                getRowClassName={(p) => (daChon(p.row.idDonViQuyDoi) ? 'row-chon' : '')}
                                localeText={{ noRowsLabel: 'Không có hàng hóa nào' }}
                                sx={{
                                    border: 0,
                                    '& .MuiDataGrid-columnHeaders': { background: '#f8fafc' },
                                    '& .MuiDataGrid-columnHeaderTitle': {
                                        fontWeight: 800,
                                        fontSize: 13,
                                        color: '#4b5563'
                                    },
                                    '& .MuiDataGrid-cell, & .MuiDataGrid-columnHeader': { outline: 'none !important' },
                                    '& .MuiDataGrid-row': { cursor: 'pointer' },
                                    '& .row-chon, & .row-chon:hover': {
                                        backgroundColor: 'var(--color-bg, #e8f0fe)',
                                        boxShadow: 'inset 4px 0 0 var(--color-main)'
                                    }
                                }}
                            />
                            <Box sx={{ p: 1 }}>
                                <CustomTablePagination
                                    currentPage={paramSearch.currentPage ?? 1}
                                    rowPerPage={paramSearch.pageSize ?? 10}
                                    totalRecord={pageData.totalCount}
                                    totalPage={utils.getTotalPage(pageData.totalCount, paramSearch.pageSize ?? 10)}
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
