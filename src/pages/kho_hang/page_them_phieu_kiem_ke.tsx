import React, { useEffect, useMemo, useState } from 'react';
import {
    Autocomplete,
    Box,
    Button,
    Divider,
    Grid,
    IconButton,
    InputAdornment,
    Paper,
    Stack,
    TextField,
    Typography
} from '@mui/material';

import { DataGrid, GridColDef } from '@mui/x-data-grid';
import SaveIcon from '@mui/icons-material/Save';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import UploadFileIcon from '@mui/icons-material/UploadFile';

import ProductService from '../../services/product/ProductService';
import { ModelHangHoaDto, PagedProductSearchDto } from '../../services/product/dto';
import HoaDonService from '../../services/ban_hang/HoaDonService';
import { LoaiChungTu } from '../../lib/appconst';
import KhoHangService from '../../services/kho_hang/KhoHangService';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { enqueueSnackbar } from 'notistack';
import { format } from 'date-fns';

interface IHangHoa {
    id: string;

    idDonViQuyDoi?: string;

    maHang: string;

    tenHang: string;

    soLuongTon: number;

    soLuongThucTe: number;

    soLuongLech: number;

    donGia: number;

    giamGia: number;

    ghiChu?: string;
}

const Page_them_phieu_kiem_ke = () => {
    const [loading, setLoading] = useState(false);
    const [isSavingHoaDon, setIsSavingHoaDon] = useState(false);

    const [listSearch, setListSearch] = useState<ModelHangHoaDto[]>([]);

    const [listHangHoa, setListHangHoa] = useState<IHangHoa[]>([]);

    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);

        if (parts.length === 2) {
            return parts.pop()?.split(';').shift();
        }

        return undefined;
    };

    const idChiNhanhChosed = getCookie('IdChiNhanh');
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const idPhieu = searchParams.get('id'); // mở lại phiếu tạm lưu
    const [maPhieu, setMaPhieu] = useState('');
    const [ngayLap, setNgayLap] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    const [ghiChu, setGhiChu] = useState('');

    useEffect(() => {
        if (!idPhieu) return;
        (async () => {
            const dataPhieu = await HoaDonService.GetInforHoaDon_byId(idPhieu);
            const dataCT: any[] = await HoaDonService.GetChiTietHoaDon_byIdHoaDon(idPhieu);
            const phieu = dataPhieu?.[0];
            if (!phieu) return;
            if (phieu.trangThai !== 1) {
                enqueueSnackbar('Phiếu đã hoàn thành, không sửa được', { variant: 'warning' });
                navigate('/phieu-kiem-kes');
                return;
            }
            setMaPhieu(phieu.maHoaDon ?? '');
            setGhiChu(phieu.ghiChuHD ?? '');
            if (phieu.ngayLapHoaDon) setNgayLap(format(new Date(phieu.ngayLapHoaDon), "yyyy-MM-dd'T'HH:mm"));
            // tồn phần mềm lấy lại theo hiện tại
            const tonKho = await KhoHangService.GetTonKho(
                (dataCT ?? []).map((x) => x.idHangHoa),
                phieu.idChiNhanh ?? idChiNhanhChosed
            );
            setListHangHoa(
                (dataCT ?? []).map((x) => {
                    const ton = tonKho.find((t) => t.idHangHoa === x.idHangHoa)?.soLuongTon ?? 0;
                    return {
                        id: x.idHangHoa,
                        idDonViQuyDoi: x.idDonViQuyDoi,
                        maHang: x.maHangHoa,
                        tenHang: x.tenHangHoa,
                        soLuongTon: ton,
                        soLuongThucTe: x.soLuong ?? 0,
                        soLuongLech: (x.soLuong ?? 0) - ton,
                        donGia: 0,
                        giamGia: 0,
                        ghiChu: x.ghiChu ?? ''
                    };
                })
            );
        })();
    }, [idPhieu]);

    const getListHangHoa = async (value: string) => {
        if (!value?.trim()) {
            setListSearch([]);
            return;
        }

        setLoading(true);

        try {
            const input = {
                idNhomHangHoas: [],
                textSearch: value,
                idLoaiHangHoa: 1,
                idChiNhanhs: idChiNhanhChosed ? [idChiNhanhChosed] : [],
                currentPage: 0,
                pageSize: 20
            } as PagedProductSearchDto;

            const data = await ProductService.Get_DMHangHoa(input);

            setListSearch(data?.items ?? []);
        } finally {
            setLoading(false);
        }
    };

    const addHangHoa = (item: any) => {
        const exist = listHangHoa.find((x) => x.id === item.id);

        if (exist) {
            setListHangHoa((prev) =>
                prev.map((x) =>
                    x.id === item.id
                        ? {
                              ...x,
                              soLuongThucTe: x.soLuongThucTe + 1,
                              soLuongLech: x.soLuongThucTe + 1 - x.soLuongTon
                          }
                        : x
                )
            );

            return;
        }

        const tonKho = item?.soLuongTon ?? 0;
        setListHangHoa((prev) => [
            ...prev,
            {
                id: item.id,
                maHang: item.maHangHoa,
                tenHang: item.tenHangHoa,

                soLuongTon: tonKho,

                soLuongThucTe: tonKho,

                soLuongLech: 0,

                donGia: item.giaBan || 0,

                giamGia: 0,

                idDonViQuyDoi: item.idDonViQuyDoi,

                ghiChu: ''
            }
        ]);
    };

    const removeItem = (id: string) => {
        setListHangHoa((prev) => prev.filter((x) => x.id !== id));
    };

    const changeSoLuongThucTe = (id: string, value: number) => {
        setListHangHoa((prev) =>
            prev.map((x) => {
                if (x.id !== id) return x;

                const slThucTe = Number(value || 0);

                return {
                    ...x,
                    soLuongThucTe: slThucTe,
                    soLuongLech: slThucTe - x.soLuongTon
                };
            })
        );
    };

    const tongSLThucTe = useMemo(() => {
        return listHangHoa.reduce((sum, item) => sum + item.soLuongThucTe, 0);
    }, [listHangHoa]);

    const tongHangKiemKe = useMemo(() => {
        return listHangHoa.length;
    }, [listHangHoa]);

    const tongHangLech = useMemo(() => {
        return listHangHoa.filter((x) => x.soLuongLech !== 0).length;
    }, [listHangHoa]);

    const tongHangThieu = useMemo(() => {
        return listHangHoa.filter((x) => x.soLuongLech < 0).length;
    }, [listHangHoa]);

    const tongHangThua = useMemo(() => {
        return listHangHoa.filter((x) => x.soLuongLech > 0).length;
    }, [listHangHoa]);

    // trangThai: 1.Tạm lưu (chưa ảnh hưởng tồn kho), 3.Hoàn thành (điều chỉnh tồn kho theo số lệch)
    const savePhieuKiem = async (trangThai: number) => {
        if (isSavingHoaDon) return;
        if (listHangHoa.length === 0) {
            enqueueSnackbar('Phiếu kiểm kê chưa có hàng hóa', { variant: 'warning' });
            return;
        }

        setIsSavingHoaDon(true);

        try {
            const hoadonDB = await KhoHangService.SavePhieuKho({
                id: idPhieu,
                idLoaiChungTu: LoaiChungTu.PHIEU_KIEM_KE,
                idChiNhanh: idChiNhanhChosed ?? null,
                maHoaDon: maPhieu,
                ngayLapHoaDon: ngayLap ? new Date(ngayLap).toISOString() : new Date().toISOString(),
                ghiChuHD: ghiChu,
                trangThai: trangThai,
                chiTiet: listHangHoa.map((item) => ({
                    idDonViQuyDoi: item.idDonViQuyDoi ?? '',
                    soLuong: item.soLuongThucTe,
                    tonLuyKe: item.soLuongTon,
                    ghiChu: item.ghiChu
                }))
            });

            if (!hoadonDB) return;

            enqueueSnackbar(
                trangThai === 1
                    ? `Đã tạm lưu phiếu ${hoadonDB.maHoaDon ?? ''}`
                    : `Hoàn thành phiếu ${hoadonDB.maHoaDon ?? ''}, tồn kho đã được cân bằng`,
                { variant: 'success' }
            );
            navigate('/phieu-kiem-kes');

            return hoadonDB;
        } catch (error: any) {
            console.error(
                error?.response?.data?.error?.details || error?.response?.data?.error?.message || error?.message
            );
        } finally {
            setIsSavingHoaDon(false);
        }
    };
    const columns: GridColDef[] = [
        {
            field: 'maHang',
            headerName: 'Mã hàng',
            width: 140,
            sortable: false,
            renderCell: (params) => (
                <Typography
                    sx={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: 'var(--color-main)'
                    }}>
                    {params.row.maHang}
                </Typography>
            )
        },

        {
            field: 'tenHang',
            headerName: 'Tên hàng',
            flex: 1,
            minWidth: 260,
            sortable: false,
            renderCell: (params) => (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        height: '100%'
                    }}>
                    <Typography
                        noWrap
                        sx={{
                            fontSize: 14,
                            fontWeight: 700
                        }}>
                        {params.row.tenHang}
                    </Typography>

                    <Typography
                        sx={{
                            fontSize: 11,
                            color: '#9ca3af'
                        }}>
                        {params.row.ghiChu || '✎ Ghi chú'}
                    </Typography>
                </Box>
            )
        },

        {
            field: 'soLuongTon',
            headerName: 'SL phần mềm',
            width: 140,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <Typography
                    sx={{
                        fontWeight: 700
                    }}>
                    {params.row.soLuongTon}
                </Typography>
            )
        },

        {
            field: 'soLuongThucTe',
            headerName: 'SL thực tế',
            width: 150,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <TextField
                    type="number"
                    size="small"
                    value={params.row.soLuongThucTe}
                    onChange={(e) => changeSoLuongThucTe(params.row.id, Number(e.target.value))}
                    sx={{
                        width: 100,
                        '& input': {
                            textAlign: 'center',
                            fontWeight: 700
                        }
                    }}
                />
            )
        },

        {
            field: 'soLuongLech',
            headerName: 'SL lệch',
            width: 120,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <Typography
                    sx={{
                        fontWeight: 800,
                        color:
                            params.row.soLuongLech > 0 ? '#16a34a' : params.row.soLuongLech < 0 ? '#dc2626' : '#111827'
                    }}>
                    {params.row.soLuongLech > 0 ? `+${params.row.soLuongLech}` : params.row.soLuongLech}
                </Typography>
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
                    onClick={() => removeItem(params.row.id)}
                    sx={{
                        color: '#9ca3af',
                        '&:hover': {
                            backgroundColor: '#fee2e2',
                            color: '#dc2626'
                        }
                    }}>
                    <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                </IconButton>
            )
        }
    ];

    return (
        <Box
            sx={{
                background: '#f5f6fa',
                minHeight: '100vh',
                p: 2
            }}>
            {/* HEADER */}
            <Paper
                elevation={0}
                sx={{
                    p: 1,
                    borderRadius: 2,
                    mb: 2
                }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <IconButton onClick={() => navigate('/phieu-kiem-kes')}>
                        <ArrowBackIcon />
                    </IconButton>

                    <Typography
                        sx={{
                            fontWeight: 800,
                            fontSize: 18
                        }}>
                        Phiếu kiểm kê
                    </Typography>
                </Stack>
            </Paper>

            <Grid container spacing={2}>
                {/* LEFT */}
                <Grid item xs={12} md={9}>
                    <Paper
                        elevation={0}
                        sx={{
                            borderRadius: 2,
                            overflow: 'hidden'
                        }}>
                        {/* SEARCH */}
                        <Box
                            sx={{
                                p: 1,
                                borderBottom: '1px solid #edf0f5'
                            }}>
                            <Stack direction="row" spacing={1}>
                                <Autocomplete
                                    fullWidth
                                    options={listSearch}
                                    loading={loading}
                                    filterOptions={(x) => x}
                                    getOptionLabel={(option) => `${option.maHangHoa ?? ''} ${option.tenHangHoa ?? ''}`}
                                    onInputChange={(_, value) => {
                                        getListHangHoa(value);
                                    }}
                                    onChange={(_, value) => {
                                        if (value) {
                                            addHangHoa(value);
                                        }
                                    }}
                                    renderOption={(props, option) => (
                                        <Box
                                            component="li"
                                            {...props}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                width: '100%',
                                                py: 1,
                                                px: 1.5
                                            }}>
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1,
                                                    overflow: 'hidden'
                                                }}>
                                                <Typography
                                                    sx={{
                                                        //fontWeight: 500,
                                                        fontSize: 13,
                                                        color: 'var(--color-main)',
                                                        minWidth: 90
                                                    }}>
                                                    Mã:{option.maHangHoa}
                                                </Typography>

                                                <Typography
                                                    noWrap
                                                    sx={{
                                                        fontWeight: 500,

                                                        fontSize: 13,
                                                        color: '#111827'
                                                    }}>
                                                    {option.tenHangHoa}
                                                </Typography>
                                            </Box>

                                            <Box
                                                sx={{
                                                    background: '#eff6ff',
                                                    color: 'var(--color-main)',
                                                    px: 1.2,
                                                    py: 0.3,
                                                    borderRadius: 10,
                                                    fontWeight: 800,
                                                    fontSize: 12,
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                Tồn: {option.soLuongTon ?? 0}
                                            </Box>
                                        </Box>
                                    )}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            size="small"
                                            placeholder="Tìm hàng hóa"
                                            InputProps={{
                                                ...params.InputProps,
                                                startAdornment: (
                                                    <>
                                                        <InputAdornment position="start">
                                                            <SearchIcon />
                                                        </InputAdornment>

                                                        {params.InputProps.startAdornment}
                                                    </>
                                                )
                                            }}
                                        />
                                    )}
                                />

                                <Button
                                    variant="outlined"
                                    startIcon={<UploadFileIcon sx={{ fontSize: 20 }} />}
                                    sx={{
                                        height: 42,
                                        px: 2,
                                        whiteSpace: 'nowrap',
                                        textTransform: 'none',
                                        fontWeight: 700,
                                        fontSize: 14,
                                        borderWidth: '1.5px',
                                        borderColor: '#dbe2ea',
                                        color: '#374151'
                                    }}>
                                    Nhập Excel
                                </Button>

                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon sx={{ fontSize: 20 }} />}
                                    sx={{
                                        height: 42,
                                        px: 2.5,
                                        whiteSpace: 'nowrap',
                                        textTransform: 'none',
                                        fontWeight: 800,
                                        fontSize: 14,
                                        boxShadow: 'none',
                                        '&:hover': {
                                            boxShadow: 'none'
                                        }
                                    }}>
                                    Hàng hóa
                                </Button>
                            </Stack>
                        </Box>

                        {/* GRID */}
                        <DataGrid
                            autoHeight
                            rows={listHangHoa}
                            columns={columns}
                            hideFooter
                            disableRowSelectionOnClick
                            rowHeight={64}
                            sx={{
                                border: 0,
                                '& .MuiDataGrid-columnHeaders': {
                                    background: '#f8fafc'
                                }
                            }}
                        />
                    </Paper>
                </Grid>

                {/* RIGHT */}
                <Grid item xs={12} md={3}>
                    <Paper
                        elevation={0}
                        sx={{
                            borderRadius: 2,
                            p: 2,
                            position: 'sticky',
                            top: 16,
                            border: '1px solid #e5e7eb'
                        }}>
                        <Typography
                            sx={{
                                fontWeight: 800,
                                mb: 3,
                                textTransform: 'uppercase'
                            }}>
                            Thông tin phiếu
                        </Typography>

                        <TextField
                            fullWidth
                            label="Mã phiếu"
                            placeholder="Tự động"
                            size="small"
                            value={maPhieu}
                            onChange={(e) => setMaPhieu(e.target.value)}
                            sx={{ mb: 2 }}
                        />

                        <TextField
                            fullWidth
                            type="datetime-local"
                            size="small"
                            label="Ngày kiểm"
                            InputLabelProps={{
                                shrink: true
                            }}
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

                        <Box
                            sx={{
                                mt: 2,
                                border: '1px solid #e5e7eb',
                                borderRadius: 2,
                                p: 2
                            }}>
                            <Typography
                                sx={{
                                    fontWeight: 800,
                                    mb: 2,
                                    textTransform: 'uppercase'
                                }}>
                                Thông tin kiểm kê
                            </Typography>

                            <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                                <Typography>Tổng SL thực tế</Typography>

                                <Typography
                                    sx={{
                                        color: '#dc2626',
                                        fontWeight: 800
                                    }}>
                                    {tongSLThucTe}
                                </Typography>
                            </Stack>

                            <Divider sx={{ mb: 2 }} />

                            <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                                <Typography>SL hàng kiểm kê</Typography>

                                <Typography fontWeight={700}>{tongHangKiemKe}</Typography>
                            </Stack>

                            <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                                <Typography>SL hàng chênh lệch</Typography>

                                <Typography fontWeight={700}>{tongHangLech}</Typography>
                            </Stack>

                            <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                                <Typography>SL hàng chưa nhập đủ (thiếu)</Typography>

                                <Typography
                                    sx={{
                                        fontWeight: 700,
                                        color: '#dc2626'
                                    }}>
                                    {tongHangThieu}
                                </Typography>
                            </Stack>

                            <Stack direction="row" justifyContent="space-between">
                                <Typography>SL hàng chưa xuất hết (thừa)</Typography>

                                <Typography
                                    sx={{
                                        fontWeight: 700,
                                        color: '#16a34a'
                                    }}>
                                    {tongHangThua}
                                </Typography>
                            </Stack>
                        </Box>

                        <Box
                            sx={{
                                display: 'flex',
                                gap: 1,
                                mt: 2
                            }}>
                            <Button
                                variant="contained"
                                startIcon={<SaveIcon />}
                                onClick={() => savePhieuKiem(1)}
                                disabled={isSavingHoaDon}
                                sx={{
                                    flex: 4,
                                    backgroundColor: '#9e9e9e',
                                    color: '#fff',
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    boxShadow: 'none',
                                    py: 1.2,
                                    '&:hover': {
                                        backgroundColor: '#757575',
                                        boxShadow: 'none'
                                    }
                                }}>
                                Tạm lưu
                            </Button>

                            <Button
                                variant="contained"
                                startIcon={<SaveIcon />}
                                onClick={() => savePhieuKiem(3)}
                                disabled={isSavingHoaDon}
                                sx={{
                                    flex: 6,
                                    backgroundColor: 'var(--color-main)',
                                    color: '#fff',
                                    textTransform: 'none',
                                    fontWeight: 800,
                                    boxShadow: 'none',
                                    py: 1.2,
                                    opacity: isSavingHoaDon ? 0.7 : 1,
                                    '&:hover': {
                                        backgroundColor: 'var(--color-main-dark)',
                                        boxShadow: 'none'
                                    }
                                }}>
                                {isSavingHoaDon ? 'Đang lưu...' : 'Hoàn thành'}
                            </Button>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Page_them_phieu_kiem_ke;
