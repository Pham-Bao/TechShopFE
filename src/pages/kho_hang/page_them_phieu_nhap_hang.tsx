import React, { useMemo, useState, useEffect } from 'react';
import {
    Autocomplete,
    Box,
    Button,
    Divider,
    Grid,
    IconButton,
    InputAdornment,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    Tooltip,
    Typography
} from '@mui/material';

import { DataGrid, GridColDef } from '@mui/x-data-grid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RemoveIcon from '@mui/icons-material/Remove';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import PrintIcon from '@mui/icons-material/Print';
import SaveIcon from '@mui/icons-material/Save';

import ProductService from '../../services/product/ProductService';
import { ModelHangHoaDto, PagedProductSearchDto } from '../../services/product/dto';
import { CreateOrEditKhachHangDto } from '../../services/khach-hang/dto/CreateOrEditKhachHangDto';
import { Guid } from 'guid-typescript';
import CreateOrEditCustomerDialog from '../customer/components/create-or-edit-customer-modal';
import { KhachHangDto } from '../../services/khach-hang/dto/KhachHangDto';
import MenuWithDataFromDB from '../../components/Menu/MenuWithData_fromDB';
import { TypeSearchfromDB } from '../../enum/TypeSearch_fromDB';
import { IList } from '../../services/dto/IList';
import SoQuyServices from '../../services/so_quy/SoQuyServices';
import { HINH_THUC_THANH_TOAN, LoaiChungTu } from '../../lib/appconst';
import HoaDonDto from '../../services/ban_hang/HoaDonDto';
import HoaDonChiTietDto from '../../services/ban_hang/HoaDonChiTietDto';
import KhoHangService from '../../services/kho_hang/KhoHangService';
import { useNavigate } from 'react-router-dom';
import { enqueueSnackbar } from 'notistack';

interface IHangHoa {
    id: string;

    idDonViQuyDoi?: string;

    maHang: string;

    tenHang: string;

    soLuong: number;

    donGia: number;

    giamGia: number;

    ghiChu?: string;
}

const Page_Them_Phieu_Nhap_Hang = () => {
    const [loading, setLoading] = useState(false);
    const [isSavingHoaDon, setIsSavingHoaDon] = useState(false);
    const [listSearch, setListSearch] = useState<ModelHangHoaDto[]>([]);
    const [listHangHoa, setListHangHoa] = useState<IHangHoa[]>([]);
    const [newCus, setNewCus] = useState<CreateOrEditKhachHangDto>({} as CreateOrEditKhachHangDto);
    const [isShowModalAddCus, setIsShowModalAddCus] = useState(false);
    const [customerChosed, setCustomerChosed] = useState<CreateOrEditKhachHangDto>({} as CreateOrEditKhachHangDto);
    const [anchorDropdownCustomer, setAnchorDropdownCustomer] = useState<HTMLElement | null>(null);
    const [expandSearchCus, setExpandSearchCus] = useState(false);
    const [ghiChu, setGhiChu] = useState('');
    const navigate = useNavigate();
    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);

        if (parts.length === 2) {
            return parts.pop()?.split(';').shift();
        }

        return undefined;
    };

    const idChiNhanhChosed = getCookie('IdChiNhanh');
    const formatMoney = (value: number) => {
        return Number(value || 0).toLocaleString('vi-VN');
    };
    const tongTienHang = useMemo(() => {
        return listHangHoa.reduce((prev, item) => {
            return prev + item.soLuong * item.donGia - item.giamGia;
        }, 0);
    }, [listHangHoa]);
    const [soTienThanhToan, setSoTienThanhToan] = useState<number>(tongTienHang);
    useEffect(() => {
        setSoTienThanhToan(tongTienHang);
    }, [tongTienHang]);
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

            setListSearch(data?.items ?? data ?? []);
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
                              soLuong: x.soLuong + 1
                          }
                        : x
                )
            );

            return;
        }

        setListHangHoa((prev) => [
            ...prev,
            {
                id: item.id,
                maHang: item.maHangHoa,
                tenHang: item.tenHangHoa,
                soLuong: 1,
                donGia: item.giaBan || 0,
                giamGia: 0,
                idDonViQuyDoi: item.idDonViQuyDoi,
                ghiChu: ''
            }
        ]);
    };

    const updateSoLuong = (id: string, value: number) => {
        setListHangHoa((prev) =>
            prev.map((x) => {
                if (x.id === id) {
                    return {
                        ...x,
                        soLuong: value < 1 ? 1 : value
                    };
                }

                return x;
            })
        );
    };

    const updateDonGia = (id: string, value: number) => {
        setListHangHoa((prev) =>
            prev.map((x) => {
                if (x.id === id) {
                    return {
                        ...x,
                        donGia: value
                    };
                }

                return x;
            })
        );
    };

    const updateGiamGia = (id: string, value: number) => {
        setListHangHoa((prev) =>
            prev.map((x) => {
                if (x.id === id) {
                    return {
                        ...x,
                        giamGia: value
                    };
                }

                return x;
            })
        );
    };
    const changeCustomer_fromModalAdd = async (customer?: KhachHangDto) => {
        setIsShowModalAddCus(false);
        if (customer) {
            setCustomerChosed({
                ...customerChosed,
                id: customer?.id?.toString(),
                maKhachHang: customer?.maKhachHang,
                tenKhachHang: customer?.tenKhachHang ?? 'Chưa chọn khách',
                soDienThoai: customer?.soDienThoai ?? ''
            });
            //setHoaDon({ ...hoadon, idKhachHang: item?.id, idCheckIn: idCheckin });
        }
    };
    const changeCustomer = async (item: IList) => {
        setAnchorDropdownCustomer(null);
        setCustomerChosed({
            ...customerChosed,
            id: item?.id,
            maKhachHang: item?.maKhachHang ?? '',
            tenKhachHang: item?.text ?? 'Chưa chọn khách',
            soDienThoai: item?.text2 ?? '',
            conNo: item?.conNo,
            tenNhomKhach: item.nhomKhach,
            isShow: true
        });
        //setHoaDon({ ...hoadon, idKhachHang: item?.id, idCheckIn: idCheckin });
    };

    const removeItem = (id: string) => {
        setListHangHoa((prev) => prev.filter((x) => x.id !== id));
    };
    const showModalAddCustomer = () => {
        setIsShowModalAddCus(true);
        setNewCus({
            ...newCus,
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
        });
    };
    const savePhieuNhap = async () => {
        if (isSavingHoaDon) return;

        setIsSavingHoaDon(true);
        try {
            if (listHangHoa.length === 0) {
                enqueueSnackbar('Phiếu nhập chưa có hàng hóa', { variant: 'warning' });
                return;
            }
            const tongTienChuaCK = listHangHoa.reduce((prev, item) => prev + item.soLuong * item.donGia, 0);

            // tồn kho, giá vốn bình quân do Backend tính khi lưu phiếu
            const hoadonDB = await KhoHangService.SavePhieuKho({
                idLoaiChungTu: LoaiChungTu.NHAP_HANG,
                idChiNhanh: idChiNhanhChosed ?? null,
                idKhachHang: customerChosed?.id ?? null,
                ngayLapHoaDon: new Date().toISOString(),
                ghiChuHD: ghiChu,
                trangThai: 3,
                tongTienHangChuaChietKhau: tongTienChuaCK,
                tongChietKhauHangHoa: tongTienChuaCK - tongTienHang,
                tongTienHang: tongTienHang,
                tongThanhToan: soTienThanhToan,
                chiTiet: listHangHoa.map((item) => {
                    const giamGia1Sp = item.soLuong > 0 ? item.giamGia / item.soLuong : 0;
                    return {
                        idDonViQuyDoi: item.idDonViQuyDoi ?? '',
                        soLuong: item.soLuong,
                        donGiaTruocCK: item.donGia,
                        tienChietKhau: giamGia1Sp,
                        donGiaSauCK: item.donGia - giamGia1Sp,
                        thanhTienTruocCK: item.soLuong * item.donGia,
                        thanhTienSauCK: item.soLuong * item.donGia - item.giamGia,
                        ghiChu: item.ghiChu
                    };
                })
            });

            if (hoadonDB != null) {
                enqueueSnackbar(`Lưu phiếu nhập ${hoadonDB.maHoaDon ?? ''} thành công`, { variant: 'success' });

                setListHangHoa([]);

                setSoTienThanhToan(0);

                setCustomerChosed({} as CreateOrEditKhachHangDto);
                setGhiChu('');

                return hoadonDB;
            }
        } catch (error: any) {
            console.log(error);

            const message =
                error?.response?.data?.error?.details || error?.response?.data?.error?.message || error?.message;

            console.error('Lỗi lưu phiếu nhập:', message);
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
            field: 'soLuong',
            headerName: 'Số lượng',
            width: 150,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <Stack
                    direction="row"
                    alignItems="center"
                    sx={{
                        border: '1px solid #dbe2ea',
                        borderRadius: 1.5,
                        overflow: 'hidden',
                        height: 36
                    }}>
                    <IconButton size="small" onClick={() => updateSoLuong(params.row.id, params.row.soLuong - 1)}>
                        <RemoveIcon sx={{ fontSize: 16 }} />
                    </IconButton>

                    <Box
                        sx={{
                            width: 40,
                            textAlign: 'center',
                            fontWeight: 700,
                            fontSize: 13
                        }}>
                        {params.row.soLuong}
                    </Box>

                    <IconButton size="small" onClick={() => updateSoLuong(params.row.id, params.row.soLuong + 1)}>
                        <AddIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                </Stack>
            )
        },

        {
            field: 'donGia',
            headerName: 'Đơn giá',
            width: 150,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <TextField
                    size="small"
                    value={formatMoney(params.row.donGia)}
                    onChange={(e) => {
                        const rawValue = e.target.value.replace(/\./g, '').replace(/,/g, '');

                        updateDonGia(params.row.id, Number(rawValue || 0));
                    }}
                    sx={{
                        width: 120,
                        '& .MuiInputBase-root': {
                            height: 36,
                            fontSize: 13
                        },
                        '& input': {
                            textAlign: 'right',
                            fontWeight: 600
                        }
                    }}
                />
            )
        },

        {
            field: 'giamGia',
            headerName: 'Giảm giá',
            width: 140,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <TextField
                    size="small"
                    value={formatMoney(params.row.giamGia)}
                    onChange={(e) => {
                        const rawValue = e.target.value.replace(/\./g, '').replace(/,/g, '');

                        updateGiamGia(params.row.id, Number(rawValue || 0));
                    }}
                    sx={{
                        width: 110,
                        '& .MuiInputBase-root': {
                            height: 36,
                            fontSize: 13
                        },
                        '& input': {
                            textAlign: 'right',
                            fontWeight: 600
                        }
                    }}
                />
            )
        },

        {
            field: 'thanhTien',
            headerName: 'Thành tiền',
            width: 170,
            sortable: false,
            align: 'right',
            headerAlign: 'right',
            renderCell: (params) => {
                const thanhTien = params.row.soLuong * params.row.donGia - params.row.giamGia;

                return (
                    <Typography
                        sx={{
                            width: '100%',
                            textAlign: 'right',
                            fontSize: 14,
                            fontWeight: 800
                        }}>
                        {formatMoney(thanhTien)}
                    </Typography>
                );
            }
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
        <>
            <CreateOrEditCustomerDialog
                visible={isShowModalAddCus}
                onCancel={() => setIsShowModalAddCus(false)}
                onOk={changeCustomer_fromModalAdd}
                title="Thêm mới khách hàng"
                formRef={newCus}
            />
            <MenuWithDataFromDB
                open={expandSearchCus}
                anchorEl={anchorDropdownCustomer}
                handleClose={() => {
                    setAnchorDropdownCustomer(null);
                    setExpandSearchCus(false);
                }}
                typeSearch={TypeSearchfromDB.CUSTOMER}
                handleChoseItem={changeCustomer}
            />
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
                        <IconButton onClick={() => navigate('/nhap-hangs')}>
                            <ArrowBackIcon />
                        </IconButton>

                        <Typography
                            sx={{
                                fontWeight: 800,
                                fontSize: 18
                            }}>
                            Phiếu nhập hàng
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
                                        getOptionLabel={(option) =>
                                            `${option.maHangHoa ?? ''} - ${option.tenHangHoa ?? ''}`
                                        }
                                        onInputChange={(_, value) => {
                                            getListHangHoa(value);
                                        }}
                                        onChange={(_, value) => {
                                            if (value) {
                                                addHangHoa(value);
                                            }
                                        }}
                                        renderOption={(props, option) => (
                                            <li {...props}>
                                                <Box
                                                    sx={{
                                                        width: '100%',
                                                        py: 0.5
                                                    }}>
                                                    <Typography
                                                        sx={{
                                                            fontSize: 14,
                                                            fontWeight: 700,
                                                            color: '#111827'
                                                        }}>
                                                        {option.tenHangHoa}
                                                    </Typography>

                                                    <Stack
                                                        direction="row"
                                                        spacing={1.5}
                                                        sx={{
                                                            mt: 0.5,
                                                            flexWrap: 'wrap'
                                                        }}>
                                                        <Typography
                                                            sx={{
                                                                fontSize: 12,
                                                                color: '#6b7280'
                                                            }}>
                                                            Mã: {option.maHangHoa}
                                                        </Typography>

                                                        <Typography
                                                            sx={{
                                                                fontSize: 12,
                                                                color: '#16a34a',
                                                                fontWeight: 700
                                                            }}>
                                                            Giá: {formatMoney(option.giaBan || 0)}
                                                        </Typography>

                                                        <Typography
                                                            sx={{
                                                                fontSize: 12,
                                                                color: '#2563eb'
                                                            }}>
                                                            Tồn:{option.soLuongTon}
                                                        </Typography>
                                                    </Stack>
                                                </Box>
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
                                                                <SearchIcon
                                                                    sx={{
                                                                        fontSize: 20
                                                                    }}
                                                                />
                                                            </InputAdornment>

                                                            {params.InputProps.startAdornment}
                                                        </>
                                                    )
                                                }}
                                                sx={{
                                                    '& .MuiInputBase-root': {
                                                        height: 42,
                                                        fontSize: 14,
                                                        fontWeight: 600
                                                    }
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
                                        background: '#f8fafc',
                                        borderBottom: '1px solid #edf0f5'
                                    },
                                    '& .MuiDataGrid-columnHeaderTitle': {
                                        fontWeight: 800,
                                        fontSize: 13,
                                        color: '#4b5563'
                                    },
                                    '& .MuiDataGrid-cell': {
                                        borderBottom: '1px solid #edf0f5',
                                        outline: 'none !important'
                                    },
                                    '& .MuiDataGrid-row:hover': {
                                        backgroundColor: '#fafafa'
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
                                top: 16
                            }}>
                            <Typography
                                sx={{
                                    fontWeight: 800,
                                    mb: 2
                                }}>
                                Thông tin phiếu nhập
                            </Typography>

                            <Stack direction="row" spacing={1} sx={{ mb: 3, alignItems: 'center' }}>
                                <TextField
                                    fullWidth
                                    placeholder="Tìm nhà cung cấp"
                                    size="small"
                                    value={customerChosed?.tenKhachHang ?? ''}
                                    InputProps={{ readOnly: true }}
                                    onClick={(e) => {
                                        setAnchorDropdownCustomer(e.currentTarget);
                                        setExpandSearchCus(true);
                                    }}
                                    sx={{
                                        '& .MuiInputBase-root': {
                                            height: 40,
                                            fontSize: 13
                                        }
                                    }}
                                />

                                <Tooltip title="Thêm nhà cung cấp">
                                    <IconButton
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            backgroundColor: 'var(--color-main)',
                                            color: '#fff',
                                            borderRadius: 1,
                                            '&:hover': {
                                                backgroundColor: 'var(--color-main-dark)'
                                            }
                                        }}
                                        onClick={showModalAddCustomer}>
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

                                <Typography fontWeight={800}>{formatMoney(tongTienHang)}</Typography>
                            </Stack>

                            <Divider sx={{ my: 2 }} />

                            <Stack direction="row" justifyContent="space-between" sx={{ mb: 3 }}>
                                <Typography
                                    sx={{
                                        fontWeight: 800,
                                        fontSize: 16
                                    }}>
                                    Cần trả nhà cung cấp
                                </Typography>

                                <Typography
                                    sx={{
                                        fontWeight: 800,
                                        color: 'var(--color-main)',
                                        fontSize: 24
                                    }}>
                                    {formatMoney(tongTienHang)}
                                </Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between" sx={{ mb: 3 }}>
                                <Typography
                                    sx={{
                                        fontWeight: 500,
                                        fontSize: 13
                                    }}>
                                    Số tiền thanh toán
                                </Typography>

                                <TextField
                                    value={formatMoney(soTienThanhToan)}
                                    onChange={(e) => {
                                        const raw = e.target.value.replace(/\./g, '').replace(/,/g, '');
                                        setSoTienThanhToan(Number(raw || 0));
                                    }}
                                    size="small"
                                    sx={{
                                        width: 160,
                                        '& input': {
                                            textAlign: 'right',
                                            fontSize: 13,
                                            fontWeight: 500
                                        }
                                    }}
                                />
                            </Stack>
                            <Box sx={{ mb: 3 }}>
                                <Typography
                                    sx={{
                                        mb: 1,
                                        fontWeight: 600
                                    }}>
                                    Hình thức thanh toán
                                </Typography>

                                <Select fullWidth defaultValue="TienMat" size="small">
                                    <MenuItem value="TienMat">Tiền mặt</MenuItem>

                                    <MenuItem value="ChuyenKhoan">Chuyển khoản</MenuItem>
                                </Select>
                            </Box>

                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                placeholder="Ghi chú nhập hàng..."
                                value={ghiChu}
                                onChange={(e) => setGhiChu(e.target.value)}
                            />

                            {/* BUTTON */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    gap: 1,
                                    mt: 2
                                }}>
                                <Button
                                    variant="contained"
                                    startIcon={<PrintIcon />}
                                    sx={{
                                        flex: 3,
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
                                    In nháp
                                </Button>

                                <Button
                                    variant="contained"
                                    startIcon={<SaveIcon />}
                                    onClick={savePhieuNhap}
                                    disabled={isSavingHoaDon}
                                    sx={{
                                        flex: 7,
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
                                    {isSavingHoaDon ? 'Đang lưu...' : 'Lưu phiếu nhập'}
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </>
    );
};

export default Page_Them_Phieu_Nhap_Hang;
