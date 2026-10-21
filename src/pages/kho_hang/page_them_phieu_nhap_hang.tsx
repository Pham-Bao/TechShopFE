import React, { useState } from 'react';
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
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RemoveIcon from '@mui/icons-material/Remove';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { useNavigate } from 'react-router-dom';
import { enqueueSnackbar } from 'notistack';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import ProductService from '../../services/product/ProductService';
import { ModelHangHoaDto, PagedProductSearchDto } from '../../services/product/dto';
import KhoHangService from '../../services/kho_hang/KhoHangService';
import ImportExcel from '../../components/ImportComponent/ImportExcel';
import BangBaoLoiFileImport from '../../components/ImportComponent/BangBaoLoiFileImport';
import { BangBaoLoiFileimportDto } from '../../services/dto/BangBaoLoiFileimportDto';
import { FileUpload } from '../../services/dto/FileUpload';
import uploadFileService from '../../services/uploadFileService';
import fileDowloadService from '../../services/file-dowload.service';
import ModalHangHoa from '../product/ModalProduct';
import { PropModal } from '../../utils/PropParentToChild';
import Cookies from 'js-cookie';
import ThongTinPhieuNhap from './components/ThongTinPhieuNhap';
import { chiTietToDong, IDongPhieuNhap, usePhieuNhap } from './components/usePhieuNhap';

const formatMoney = (value: number) => Number(value || 0).toLocaleString('vi-VN');
const parseMoney = (text: string) => Number(text.replace(/\./g, '').replace(/,/g, '') || 0);

/**
 * Lập phiếu nhập hàng hóa: danh sách hàng bên trái, thông tin phiếu bên phải
 */
const Page_Them_Phieu_Nhap_Hang = () => {
    const navigate = useNavigate();
    const p = usePhieuNhap('hang-hoa');
    const { lstDong, setLstDong } = p;
    const idChiNhanh = Cookies.get('IdChiNhanh');

    // tìm hàng hóa để thêm vào phiếu
    const [loading, setLoading] = useState(false);
    const [listSearch, setListSearch] = useState<ModelHangHoaDto[]>([]);
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
                idChiNhanhs: idChiNhanh ? [idChiNhanh] : [],
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
        if (lstDong.some((x) => x.id === item.id)) {
            setLstDong((prev) => prev.map((x) => (x.id === item.id ? { ...x, soLuong: x.soLuong + 1 } : x)));
            return;
        }
        setLstDong((prev) => [
            ...prev,
            {
                id: item.id,
                maHang: item.maHangHoa,
                tenHang: item.tenHangHoa,
                soLuong: 1,
                // đơn giá nhập mặc định = giá vốn hiện tại (vẫn sửa được)
                donGia: item.giaVon || 0,
                giamGia: 0,
                idDonViQuyDoi: item.idDonViQuyDoi,
                ghiChu: ''
            }
        ]);
    };
    const updateDong = (id: string, change: Partial<IDongPhieuNhap>) =>
        setLstDong((prev) => prev.map((x) => (x.id === id ? { ...x, ...change } : x)));

    // thêm hàng hóa mới vào danh mục rồi đưa luôn vào phiếu
    const [triggerModalHangHoa, setTriggerModalHangHoa] = useState<PropModal>(new PropModal({ isShow: false }));
    const moThemHangHoa = () =>
        setTriggerModalHangHoa({ isShow: true, isNew: true, id: '', idLoaiHangHoa: 1 } as unknown as PropModal);
    const luuHangHoaMoi = (product: any) => {
        setTriggerModalHangHoa({ ...triggerModalHangHoa, isShow: false });
        if (product?.id) {
            addHangHoa(product);
        }
    };

    // nhập Excel: chỉ lấy dòng hàng hóa (điện thoại nhập ở phiếu điện thoại)
    const [isShowImport, setIsShowImport] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [lstErrImport, setLstErrImport] = useState<BangBaoLoiFileimportDto[]>([]);
    const downloadImportTemplate = async () => {
        const result = await uploadFileService.downloadImportTemplate('PhieuNhapHang_ImportTemplate.xlsx');
        fileDowloadService.downloadExportFile(result);
    };
    const importExcel = async (input: FileUpload) => {
        setIsImporting(true);
        try {
            const data = await KhoHangService.ImportChiTietPhieuNhap(input);
            if (data?.errors?.length > 0) {
                setLstErrImport(data.errors);
                return;
            }
            const dongHangHoa = (data?.chiTiet ?? []).filter((x) => !x.dienThoai);
            const soDongMay = (data?.chiTiet ?? []).length - dongHangHoa.length;
            // hàng hóa đã có trên phiếu thì cộng số lượng
            const next = [...lstDong];
            for (const ct of dongHangHoa) {
                const dong = chiTietToDong(ct);
                const idx = next.findIndex((x) => x.id === dong.id);
                if (idx > -1) {
                    next[idx] = { ...next[idx], soLuong: next[idx].soLuong + dong.soLuong, donGia: dong.donGia };
                } else {
                    next.push(dong);
                }
            }
            setLstDong(next);
            setIsShowImport(false);
            enqueueSnackbar(
                `Đã thêm ${dongHangHoa.length} dòng hàng hóa từ file Excel` +
                    (soDongMay > 0 ? `, bỏ qua ${soDongMay} dòng điện thoại (nhập ở phiếu điện thoại)` : ''),
                { variant: 'success' }
            );
        } finally {
            setIsImporting(false);
        }
    };

    // xuất các dòng đang lập ra Excel
    const xuatExcel = () => {
        if (lstDong.length === 0) {
            enqueueSnackbar('Phiếu nhập chưa có hàng hóa', { variant: 'warning' });
            return;
        }
        const rows = lstDong.map((x, i) => ({
            STT: i + 1,
            'Mã hàng': x.maHang,
            'Tên hàng': x.tenHang,
            'Số lượng': x.soLuong,
            'Đơn giá': x.donGia,
            'Giảm giá': x.giamGia,
            'Thành tiền': x.soLuong * x.donGia - x.giamGia
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        ws['!cols'] = [{ wch: 5 }, { wch: 14 }, { wch: 40 }, { wch: 10 }, { wch: 14 }, { wch: 12 }, { wch: 16 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'PhieuNhap');
        const data = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        saveAs(new Blob([data]), `PhieuNhapHangHoa_${p.maPhieu || 'moi'}.xlsx`);
    };

    const columns: GridColDef[] = [
        {
            field: 'maHang',
            headerName: 'Mã hàng',
            width: 130,
            sortable: false,
            renderCell: (params) => (
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'var(--color-main)' }}>
                    {params.row.maHang}
                </Typography>
            )
        },
        {
            field: 'tenHang',
            headerName: 'Tên hàng',
            flex: 1,
            minWidth: 220,
            sortable: false,
            renderCell: (params) => (
                <Typography noWrap sx={{ fontSize: 14, fontWeight: 700 }}>
                    {params.row.tenHang}
                </Typography>
            )
        },
        {
            field: 'soLuong',
            headerName: 'Số lượng',
            width: 140,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <Stack
                    direction="row"
                    alignItems="center"
                    sx={{ border: '1px solid #dbe2ea', borderRadius: 1.5, overflow: 'hidden', height: 36 }}>
                    <IconButton
                        size="small"
                        onClick={() => updateDong(params.row.id, { soLuong: Math.max(params.row.soLuong - 1, 1) })}>
                        <RemoveIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <Box sx={{ width: 40, textAlign: 'center', fontWeight: 700, fontSize: 13 }}>
                        {params.row.soLuong}
                    </Box>
                    <IconButton
                        size="small"
                        onClick={() => updateDong(params.row.id, { soLuong: params.row.soLuong + 1 })}>
                        <AddIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                </Stack>
            )
        },
        {
            field: 'donGia',
            headerName: 'Đơn giá',
            width: 140,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <TextField
                    size="small"
                    value={formatMoney(params.row.donGia)}
                    onChange={(e) => updateDong(params.row.id, { donGia: parseMoney(e.target.value) })}
                    sx={{
                        width: 120,
                        '& .MuiInputBase-root': { height: 36, fontSize: 13 },
                        '& input': { textAlign: 'right', fontWeight: 600 }
                    }}
                />
            )
        },
        {
            field: 'giamGia',
            headerName: 'Giảm giá',
            width: 130,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <TextField
                    size="small"
                    value={formatMoney(params.row.giamGia)}
                    onChange={(e) => updateDong(params.row.id, { giamGia: parseMoney(e.target.value) })}
                    sx={{
                        width: 110,
                        '& .MuiInputBase-root': { height: 36, fontSize: 13 },
                        '& input': { textAlign: 'right', fontWeight: 600 }
                    }}
                />
            )
        },
        {
            field: 'thanhTien',
            headerName: 'Thành tiền',
            width: 140,
            sortable: false,
            align: 'right',
            headerAlign: 'right',
            renderCell: (params) => (
                <Typography sx={{ width: '100%', textAlign: 'right', fontSize: 14, fontWeight: 800 }}>
                    {formatMoney(params.row.soLuong * params.row.donGia - params.row.giamGia)}
                </Typography>
            )
        },
        {
            field: 'action',
            headerName: '',
            width: 56,
            sortable: false,
            renderCell: (params) =>
                // sửa phiếu đã hoàn thành có lẫn điện thoại: máy đã bán không xóa được
                params.row.dienThoai?.daGiaoDich ? (
                    <Typography sx={{ fontSize: 11, color: '#d97706', fontWeight: 700 }} title="Máy đã giao dịch">
                        Đã bán
                    </Typography>
                ) : (
                    <IconButton
                        size="small"
                        onClick={() => setLstDong((prev) => prev.filter((x) => x.id !== params.row.id))}
                        sx={{ color: '#9ca3af', '&:hover': { backgroundColor: '#fee2e2', color: '#dc2626' } }}>
                        <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                )
        }
    ];

    const btnSx = {
        height: 42,
        px: 2,
        whiteSpace: 'nowrap',
        textTransform: 'none',
        fontWeight: 700,
        fontSize: 14
    };

    return (
        <>
            <ModalHangHoa trigger={triggerModalHangHoa} handleSave={luuHangHoaMoi} />
            <ImportExcel
                tieude={'Nhập hàng hóa từ Excel'}
                isOpen={isShowImport}
                isImporting={isImporting}
                onClose={() => setIsShowImport(false)}
                downloadImportTemplate={downloadImportTemplate}
                importFile={importExcel}
            />
            <BangBaoLoiFileImport
                isOpen={lstErrImport.length > 0}
                lstError={lstErrImport}
                onClose={() => setLstErrImport([])}
                clickImport={() => setLstErrImport([])}
            />
            <Box sx={{ background: '#f5f6fa', minHeight: '100vh', p: 2 }}>
                <Paper elevation={0} sx={{ p: 1, borderRadius: 2, mb: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <IconButton onClick={() => navigate('/nhap-hangs')}>
                            <ArrowBackIcon />
                        </IconButton>
                        <Typography sx={{ fontWeight: 800, fontSize: 18 }}>
                            {p.laSua ? `Sửa phiếu nhập hàng hóa ${p.maPhieu}` : 'Lập phiếu nhập hàng hóa'}
                        </Typography>
                    </Stack>
                </Paper>

                <Grid container spacing={2}>
                    {/* PHẢI: thông tin phiếu */}
                    <Grid item xs={12} md={4} lg={3.5} sx={{ order: 2 }}>
                        <ThongTinPhieuNhap p={p} />
                    </Grid>

                    {/* TRÁI: danh sách hàng */}
                    <Grid item xs={12} md={8} lg={8.5} sx={{ order: 1 }}>
                        <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                            <Box sx={{ p: 1, borderBottom: '1px solid #edf0f5' }}>
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    sx={{ flexWrap: { xs: 'wrap', lg: 'nowrap' }, rowGap: 1 }}>
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
                                        sx={{ minWidth: 240 }}
                                        renderOption={(props, option) => (
                                            <li {...props}>
                                                <Box sx={{ width: '100%', py: 0.5 }}>
                                                    <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
                                                        {option.tenHangHoa}
                                                    </Typography>
                                                    <Stack
                                                        direction="row"
                                                        spacing={1.5}
                                                        sx={{ mt: 0.5, flexWrap: 'wrap' }}>
                                                        <Typography sx={{ fontSize: 12, color: '#6b7280' }}>
                                                            Mã: {option.maHangHoa}
                                                        </Typography>
                                                        <Typography
                                                            sx={{ fontSize: 12, color: '#16a34a', fontWeight: 700 }}>
                                                            Giá vốn: {formatMoney(option.giaVon || 0)}
                                                        </Typography>
                                                        <Typography sx={{ fontSize: 12, color: '#2563eb' }}>
                                                            Tồn: {option.soLuongTon}
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
                                                                <SearchIcon sx={{ fontSize: 20 }} />
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
                                        startIcon={<UploadFileIcon />}
                                        onClick={() => setIsShowImport(true)}
                                        sx={{ ...btnSx, color: '#374151', borderColor: '#dbe2ea' }}>
                                        Nhập Excel
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        startIcon={<FileDownloadOutlinedIcon />}
                                        onClick={xuatExcel}
                                        sx={{ ...btnSx, color: '#374151', borderColor: '#dbe2ea' }}>
                                        Xuất Excel
                                    </Button>
                                    <Button
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        onClick={moThemHangHoa}
                                        sx={{ ...btnSx, fontWeight: 800, boxShadow: 'none' }}>
                                        Hàng hóa
                                    </Button>
                                </Stack>
                            </Box>
                            <DataGrid
                                autoHeight
                                rows={lstDong}
                                columns={columns}
                                hideFooter
                                disableRowSelectionOnClick
                                rowHeight={60}
                                localeText={{
                                    noRowsLabel: 'Chưa có hàng hóa. Tìm hàng hóa ở ô phía trên để thêm vào phiếu.'
                                }}
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
                                    }
                                }}
                            />
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </>
    );
};

export default Page_Them_Phieu_Nhap_Hang;
