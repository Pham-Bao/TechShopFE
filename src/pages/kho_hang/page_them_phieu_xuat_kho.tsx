import React, { useMemo, useState } from 'react';
import {
    Autocomplete,
    Box,
    Button,
    Grid,
    IconButton,
    InputAdornment,
    Paper,
    Stack,
    TextField,
    Typography
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SaveIcon from '@mui/icons-material/Save';
import Cookies from 'js-cookie';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { enqueueSnackbar } from 'notistack';
import ProductService from '../../services/product/ProductService';
import { ModelHangHoaDto, PagedProductSearchDto } from '../../services/product/dto';
import KhoHangService from '../../services/kho_hang/KhoHangService';
import MenuWithDataFromDB from '../../components/Menu/MenuWithData_fromDB';
import { TypeSearchfromDB } from '../../enum/TypeSearch_fromDB';
import { IList } from '../../services/dto/IList';
import { LoaiChungTu } from '../../lib/appconst';

interface IDongXuat {
    id: string; // id hàng hóa
    idDonViQuyDoi: string;
    maHang: string;
    tenHang: string;
    soLuongTon: number;
    soLuong: number;
    donGia: number;
}

type Props = {
    idLoaiChungTu: number; // 5.Xuất khác / xuất hủy, 7.Trả hàng nhà cung cấp
};

const formatMoney = (value: number) => Number(value || 0).toLocaleString('vi-VN');

// Lập phiếu giảm tồn kho bằng tay: xuất khác / xuất hủy, trả hàng nhà cung cấp
const PageThemPhieuXuatKho: React.FC<Props> = ({ idLoaiChungTu }) => {
    const laTraNCC = idLoaiChungTu === LoaiChungTu.TRA_HANG_NCC;
    const title = laTraNCC ? 'Trả hàng nhà cung cấp' : 'Phiếu xuất kho (xuất khác / xuất hủy)';
    const pathDanhSach = laTraNCC ? '/tra-hang-nccs' : '/xuat-hangs';

    const navigate = useNavigate();
    const idChiNhanh = Cookies.get('IdChiNhanh') ?? '';
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [listSearch, setListSearch] = useState<ModelHangHoaDto[]>([]);
    const [listHang, setListHang] = useState<IDongXuat[]>([]);
    const [ngayLap, setNgayLap] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    const [ghiChu, setGhiChu] = useState('');
    const [ncc, setNcc] = useState<{ id: string; ten: string } | null>(null);
    const [anchorNcc, setAnchorNcc] = useState<HTMLElement | null>(null);

    const tongTien = useMemo(() => listHang.reduce((s, x) => s + x.soLuong * x.donGia, 0), [listHang]);

    const getListHangHoa = async (value: string) => {
        if (!value?.trim()) {
            setListSearch([]);
            return;
        }
        setLoading(true);
        try {
            const data = await ProductService.Get_DMHangHoa({
                idNhomHangHoas: [],
                textSearch: value,
                idLoaiHangHoa: 1,
                idChiNhanhs: idChiNhanh ? [idChiNhanh] : [],
                currentPage: 0,
                pageSize: 20
            } as PagedProductSearchDto);
            setListSearch(data?.items ?? []);
        } finally {
            setLoading(false);
        }
    };

    const addHangHoa = (item: any) => {
        if (listHang.some((x) => x.id === item.id)) {
            setListHang((prev) => prev.map((x) => (x.id === item.id ? { ...x, soLuong: x.soLuong + 1 } : x)));
            return;
        }
        setListHang((prev) => [
            ...prev,
            {
                id: item.id,
                idDonViQuyDoi: item.idDonViQuyDoi,
                maHang: item.maHangHoa,
                tenHang: item.tenHangHoa,
                soLuongTon: item.soLuongTon ?? 0,
                soLuong: 1,
                donGia: item.giaVon ?? 0
            }
        ]);
    };

    const updateRow = (id: string, patch: Partial<IDongXuat>) => {
        setListHang((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    };

    const save = async () => {
        if (isSaving) return;
        if (listHang.length === 0) {
            enqueueSnackbar('Phiếu chưa có hàng hóa', { variant: 'warning' });
            return;
        }
        if (laTraNCC && !ncc) {
            enqueueSnackbar('Chưa chọn nhà cung cấp', { variant: 'warning' });
            return;
        }
        setIsSaving(true);
        try {
            const data = await KhoHangService.SavePhieuKho({
                idLoaiChungTu: idLoaiChungTu,
                idChiNhanh: idChiNhanh || null,
                idKhachHang: ncc?.id ?? null,
                ngayLapHoaDon: ngayLap ? new Date(ngayLap).toISOString() : new Date().toISOString(),
                ghiChuHD: ghiChu,
                trangThai: 3,
                chiTiet: listHang.map((x) => ({
                    idDonViQuyDoi: x.idDonViQuyDoi,
                    soLuong: x.soLuong,
                    donGiaTruocCK: x.donGia,
                    donGiaSauCK: x.donGia,
                    thanhTienTruocCK: x.soLuong * x.donGia,
                    thanhTienSauCK: x.soLuong * x.donGia
                }))
            });
            if (data) {
                enqueueSnackbar(`Lưu phiếu ${data.maHoaDon ?? ''} thành công`, { variant: 'success' });
                navigate(pathDanhSach);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const columns: GridColDef[] = [
        { field: 'maHang', headerName: 'Mã hàng', width: 130, sortable: false },
        { field: 'tenHang', headerName: 'Tên hàng', flex: 1, minWidth: 220, sortable: false },
        {
            field: 'soLuongTon',
            headerName: 'Tồn kho',
            width: 100,
            align: 'center',
            headerAlign: 'center',
            sortable: false
        },
        {
            field: 'soLuong',
            headerName: 'SL xuất',
            width: 130,
            align: 'center',
            headerAlign: 'center',
            sortable: false,
            renderCell: (params) => (
                <TextField
                    type="number"
                    size="small"
                    value={params.row.soLuong}
                    error={params.row.soLuong > params.row.soLuongTon}
                    title={params.row.soLuong > params.row.soLuongTon ? 'Vượt số tồn' : ''}
                    onChange={(e) => updateRow(params.row.id, { soLuong: Math.max(Number(e.target.value || 0), 0) })}
                    sx={{ width: 100, '& input': { textAlign: 'center', fontWeight: 700 } }}
                />
            )
        },
        {
            field: 'donGia',
            headerName: laTraNCC ? 'Giá trả' : 'Giá vốn',
            width: 140,
            align: 'right',
            headerAlign: 'right',
            sortable: false,
            renderCell: (params) =>
                laTraNCC ? (
                    <TextField
                        size="small"
                        value={formatMoney(params.row.donGia)}
                        onChange={(e) =>
                            updateRow(params.row.id, {
                                donGia: Number(e.target.value.replace(/\./g, '').replace(/,/g, '') || 0)
                            })
                        }
                        sx={{ width: 120, '& input': { textAlign: 'right' } }}
                    />
                ) : (
                    formatMoney(params.row.donGia)
                )
        },
        {
            field: 'action',
            headerName: '',
            width: 60,
            sortable: false,
            renderCell: (params) => (
                <IconButton
                    size="small"
                    onClick={() => setListHang((prev) => prev.filter((x) => x.id !== params.row.id))}>
                    <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                </IconButton>
            )
        }
    ];

    return (
        <>
            <MenuWithDataFromDB
                open={Boolean(anchorNcc)}
                anchorEl={anchorNcc}
                handleClose={() => setAnchorNcc(null)}
                typeSearch={TypeSearchfromDB.CUSTOMER}
                handleChoseItem={(item: IList) => {
                    setAnchorNcc(null);
                    setNcc({ id: item?.id, ten: item?.text ?? '' });
                }}
            />
            <Box sx={{ background: '#f5f6fa', minHeight: '100vh', p: 2 }}>
                <Paper elevation={0} sx={{ p: 1, borderRadius: 2, mb: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <IconButton onClick={() => navigate(pathDanhSach)}>
                            <ArrowBackIcon />
                        </IconButton>
                        <Typography sx={{ fontWeight: 800, fontSize: 18 }}>{title}</Typography>
                    </Stack>
                </Paper>

                <Grid container spacing={2}>
                    <Grid item xs={12} md={9}>
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
                                    onInputChange={(_, value) => getListHangHoa(value)}
                                    onChange={(_, value) => value && addHangHoa(value)}
                                    renderOption={(props, option: any) => (
                                        <li {...props}>
                                            <Stack direction="row" justifyContent="space-between" width="100%">
                                                <span>
                                                    {option.maHangHoa} - {option.tenHangHoa}
                                                </span>
                                                <b style={{ color: 'var(--color-main)' }}>
                                                    Tồn: {option.soLuongTon ?? 0}
                                                </b>
                                            </Stack>
                                        </li>
                                    )}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            size="small"
                                            placeholder="Tìm hàng hóa theo mã hoặc tên"
                                            InputProps={{
                                                ...params.InputProps,
                                                startAdornment: (
                                                    <>
                                                        <InputAdornment position="start">
                                                            <SearchIcon sx={{ fontSize: 20 }} />
                                                        </InputAdornment>
                                                        {params.InputProps.startAdornment}
                                                    </>
                                                )
                                            }}
                                        />
                                    )}
                                />
                            </Box>
                            <DataGrid
                                autoHeight
                                rows={listHang}
                                columns={columns}
                                hideFooter
                                disableRowSelectionOnClick
                                rowHeight={56}
                                sx={{ border: 0, '& .MuiDataGrid-columnHeaders': { background: '#f8fafc' } }}
                            />
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <Paper elevation={0} sx={{ borderRadius: 2, p: 2, position: 'sticky', top: 16 }}>
                            <Typography sx={{ fontWeight: 800, mb: 2 }}>Thông tin phiếu</Typography>
                            {laTraNCC && (
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Nhà cung cấp"
                                    placeholder="Chọn nhà cung cấp"
                                    value={ncc?.ten ?? ''}
                                    InputProps={{ readOnly: true }}
                                    InputLabelProps={{ shrink: true }}
                                    onClick={(e) => setAnchorNcc(e.currentTarget)}
                                    sx={{ mb: 2 }}
                                />
                            )}
                            <TextField
                                fullWidth
                                type="datetime-local"
                                size="small"
                                label="Ngày lập"
                                InputLabelProps={{ shrink: true }}
                                value={ngayLap}
                                onChange={(e) => setNgayLap(e.target.value)}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label={laTraNCC ? 'Ghi chú' : 'Lý do xuất'}
                                placeholder={laTraNCC ? '' : 'Ví dụ: hàng hỏng, mất, dùng nội bộ...'}
                                value={ghiChu}
                                onChange={(e) => setGhiChu(e.target.value)}
                                sx={{ mb: 2 }}
                            />
                            <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                                <Typography>Tổng số lượng</Typography>
                                <Typography fontWeight={700}>{listHang.reduce((s, x) => s + x.soLuong, 0)}</Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                                <Typography>{laTraNCC ? 'Tổng tiền trả' : 'Tổng giá vốn'}</Typography>
                                <Typography fontWeight={800}>{formatMoney(tongTien)}</Typography>
                            </Stack>
                            <Button
                                fullWidth
                                variant="contained"
                                startIcon={<SaveIcon />}
                                onClick={save}
                                disabled={isSaving}
                                sx={{
                                    backgroundColor: 'var(--color-main)',
                                    textTransform: 'none',
                                    fontWeight: 800,
                                    boxShadow: 'none',
                                    py: 1.2
                                }}>
                                {isSaving ? 'Đang lưu...' : 'Hoàn thành'}
                            </Button>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </>
    );
};

export default PageThemPhieuXuatKho;
