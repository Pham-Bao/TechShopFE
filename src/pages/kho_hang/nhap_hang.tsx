/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
    Box,
    Button,
    Grid,
    IconButton,
    ListItemIcon,
    Menu,
    MenuItem,
    Select,
    SelectChangeEvent,
    Stack,
    TextField
} from '@mui/material';
import { Search } from '@mui/icons-material';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined';
import AddIcon from '@mui/icons-material/Add';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import PhoneIphoneOutlinedIcon from '@mui/icons-material/PhoneIphoneOutlined';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import { ReactComponent as DownloadIcon } from '../../images/download.svg';
import { TextTranslate } from '../../components/TableLanguage';
import CustomTablePagination from '../../components/Pagination/CustomTablePagination';
import { AppContext } from '../../services/chi_nhanh/ChiNhanhContext';
import { format } from 'date-fns';
import SnackbarAlert from '../../components/AlertDialog/SnackbarAlert';
import fileDowloadService from '../../services/file-dowload.service';
import ActionRowSelect from '../../components/DataGrid/ActionRowSelect';
import ConfirmDelete from '../../components/AlertDialog/ConfirmDelete';
import { PropConfirmOKCancel } from '../../utils/PropParentToChild';
import DateFilterCustom from '../../components/DatetimePicker/DateFilterCustom';
import AppConsts from '../../lib/appconst';
import abpCustom from '../../components/abp-custom';
import { IList } from '../../services/dto/IList';
import { Guid } from 'guid-typescript';
import utils from '../../utils/utils';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import KhoHangService, { PhieuNhapListItemDto, PhieuNhapListRequestDto } from '../../services/kho_hang/KhoHangService';
import { inPhieuNhap } from './components/inPhieuNhap';
import ModalXemPhieuNhap from './components/ModalXemPhieuNhap';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { docPhieuTam, LoaiPhieuNhap } from './components/usePhieuNhap';

const formatMoney = (value: number) => new Intl.NumberFormat('vi-VN').format(value ?? 0);

// phiếu đang lập, mới lưu tạm trên trình duyệt (localStorage), chưa có trên server
const TRANG_THAI_CHUA_HOAN_THANH = -2;

// trạng thái lọc: '' = tất cả trừ đã hủy
const LOC_TRANG_THAI = [
    { value: '', text: 'Tất cả trạng thái' },
    { value: String(TRANG_THAI_CHUA_HOAN_THANH), text: 'Chưa hoàn thành' },
    { value: '3', text: 'Hoàn thành' },
    { value: '1', text: 'Tạm lưu' },
    { value: '0', text: 'Đã hủy' }
];

const NhapHang: React.FC = () => {
    const firstLoad = useRef(true);
    const appContext = useContext(AppContext);
    const chinhanhCurrent = appContext.chinhanhCurrent;
    const idChiNhanhCookies = Cookies.get('IdChiNhanh') ?? '';
    const navigate = useNavigate();
    const [objAlert, setObjAlert] = useState({ show: false, type: 1, mes: '' });
    const [inforDelete, setInforDelete] = useState<PropConfirmOKCancel>(new PropConfirmOKCancel({ show: false }));

    const [txtSearch, setTxtSearch] = useState('');
    const [txtThoiGian, setTxtThoiGian] = useState('Tất cả');
    const [trangThai, setTrangThai] = useState('');
    const [paramSearch, setParamSearch] = useState<PhieuNhapListRequestDto>({
        textSearch: '',
        loaiHang: 0,
        idChiNhanhs: idChiNhanhCookies ? [idChiNhanhCookies] : [],
        currentPage: 1,
        pageSize: AppConsts.pageOption[0].value,
        fromDate: null,
        toDate: null,
        trangThais: []
    });
    const [pageData, setPageData] = useState<{ totalCount: number; totalPage: number; items: any[] }>({
        totalCount: 0,
        totalPage: 0,
        items: []
    });
    const [rowSelectionModel, setRowSelectionModel] = React.useState<GridRowSelectionModel>([]);
    const [idXemPhieu, setIdXemPhieu] = useState<string | null>(null);

    // phiếu tạm trên trình duyệt (mỗi loại tối đa 1 phiếu): hiện đầu trang 1, theo lọc loại hàng / ô tìm,
    // không lọc theo thời gian để khỏi bị quên phiếu; không tính vào tổng và phân trang
    const getPhieuTam = (): any[] => {
        const locTrangThai = trangThai === '' || trangThai === String(TRANG_THAI_CHUA_HOAN_THANH);
        if (!locTrangThai || (paramSearch.currentPage ?? 1) !== 1) return [];
        const txt = (paramSearch.textSearch ?? '').trim().toLowerCase();
        const lstLoai: LoaiPhieuNhap[] = ['hang-hoa', 'dien-thoai'];
        return lstLoai.flatMap((loai) => {
            if (
                (paramSearch.loaiHang === 1 && loai !== 'hang-hoa') ||
                (paramSearch.loaiHang === 4 && loai !== 'dien-thoai')
            ) {
                return [];
            }
            const tam = docPhieuTam(loai);
            if (!tam || !(tam.lstDong?.length > 0)) return [];
            const kh: any = tam.khachHang ?? {};
            const khopTim = [kh.maKhachHang, kh.tenKhachHang, 'phiếu tạm'].some((x) =>
                (x ?? '').toLowerCase().includes(txt)
            );
            if (txt && !khopTim) return [];
            return [
                {
                    id: `tam_${loai}`,
                    laPhieuTam: true,
                    loaiPhieu: loai,
                    maHoaDon: 'Phiếu tạm',
                    ngayLapHoaDon: tam.thoiGian,
                    maKhachHang: kh.maKhachHang ?? '',
                    tenKhachHang: kh.tenKhachHang ?? '',
                    loaiHang: loai === 'dien-thoai' ? 'Điện thoại' : 'Hàng hóa',
                    ghiChuHD: tam.ghiChu ?? '',
                    soLuong: tam.lstDong.reduce((s, x) => s + (x.soLuong ?? 0), 0),
                    tongThanhToan: tam.lstDong.reduce((s, x) => s + x.soLuong * x.donGia - x.giamGia, 0),
                    daThanhToan: 0,
                    trangThai: TRANG_THAI_CHUA_HOAN_THANH,
                    txtTrangThai: 'Chưa hoàn thành'
                }
            ];
        });
    };

    const getListPhieuNhap = async () => {
        const lstPhieuTam = getPhieuTam();
        // lọc "Chưa hoàn thành": chỉ có phiếu tạm trên trình duyệt, không cần gọi server
        const data =
            trangThai === String(TRANG_THAI_CHUA_HOAN_THANH)
                ? null
                : await KhoHangService.GetListPhieuNhap(paramSearch);
        const items: any[] = [...(data?.items ?? [])];
        if (items.length > 0 && data) {
            // dòng tổng cuối bảng (id rỗng, không chọn được)
            items.push({
                id: Guid.EMPTY,
                maHoaDon: 'Tổng',
                ngayLapHoaDon: '',
                maKhachHang: '',
                loaiHang: '',
                ghiChuHD: '',
                soLuong: data.sumSoLuong,
                tongThanhToan: data.sumTongThanhToan,
                daThanhToan: data.sumDaThanhToan,
                txtTrangThai: '',
                trangThai: -1
            });
        }
        setPageData({
            totalCount: data?.totalCount ?? 0,
            totalPage: utils.getTotalPage(data?.totalCount ?? 0, paramSearch.pageSize),
            items: [...lstPhieuTam, ...items]
        });
    };

    useEffect(() => {
        getListPhieuNhap();
    }, [paramSearch]);

    useEffect(() => {
        if (firstLoad.current) {
            firstLoad.current = false;
            return;
        }
        const id = chinhanhCurrent?.id || idChiNhanhCookies;
        setParamSearch((prev) => ({ ...prev, idChiNhanhs: id ? [id] : [], currentPage: 1 }));
    }, [chinhanhCurrent?.id]);

    const timKiem = () => setParamSearch({ ...paramSearch, textSearch: txtSearch, currentPage: 1 });

    const handleChangePage = (event: any, value: number) => setParamSearch({ ...paramSearch, currentPage: value });
    const handlePerPageChange = (event: SelectChangeEvent<number>) =>
        setParamSearch({ ...paramSearch, currentPage: 1, pageSize: parseInt(event.target.value.toString(), 10) });

    const [anchorDateEl, setAnchorDateEl] = useState<HTMLDivElement | null>(null);
    // DateFilterCustom trả về (từ ngày, đến ngày, loại ngày, chữ hiển thị loại ngày)
    const onApplyFilterDate = async (from: string, to: string, dateType: string, dateTypeText: string) => {
        setAnchorDateEl(null);
        setTxtThoiGian(
            from && to && !from.startsWith('2000-01-01') // "Toàn thời gian" tính từ 01/01/2000
                ? `${format(new Date(from), 'dd/MM/yyyy')} - ${format(new Date(to), 'dd/MM/yyyy')}`
                : dateTypeText || 'Tất cả'
        );
        setParamSearch({ ...paramSearch, fromDate: from || null, toDate: to || null, currentPage: 1 });
    };

    const changeTrangThai = (value: string) => {
        setTrangThai(value);
        // "Chưa hoàn thành" không phải trạng thái trên server
        const trangThais = value === '' || value === String(TRANG_THAI_CHUA_HOAN_THANH) ? [] : [Number(value)];
        setParamSearch({ ...paramSearch, trangThais, currentPage: 1 });
    };

    const exportToExcel = async () => {
        const file = await KhoHangService.ExportListPhieuNhap(paramSearch);
        fileDowloadService.downloadExportFile(file);
    };

    // nút Lập phiếu: chọn loại phiếu
    const [anchorLapPhieu, setAnchorLapPhieu] = useState<HTMLElement | null>(null);
    const lapPhieu = (loai: 'hang-hoa' | 'dien-thoai') => {
        setAnchorLapPhieu(null);
        navigate(`/nhap-hang/${loai}`);
    };
    // mở phiếu (tạm lưu / hoàn thành) ở màn lập phiếu đúng loại hàng để sửa
    const moPhieuTamLuu = (row: PhieuNhapListItemDto) => {
        const loai = row.loaiHang === 'Điện thoại' ? 'dien-thoai' : 'hang-hoa';
        navigate(`/nhap-hang/${loai}?id=${row.id}`);
    };
    // phiếu tạm trên trình duyệt: mở màn lập phiếu, màn này tự nạp lại phiếu tạm
    const moPhieuTamTrinhDuyet = (row: any) => navigate(`/nhap-hang/${row.loaiPhieu}`);

    const lstIdChon = () =>
        rowSelectionModel.map((x) => x.toString()).filter((x) => x !== Guid.EMPTY && !x.startsWith('tam_'));

    const DataGrid_handleAction = async (item: any) => {
        switch (parseInt(item.id)) {
            case 1:
                setInforDelete({
                    ...inforDelete,
                    show: true,
                    mes: 'Bạn có chắc chắn muốn hủy những phiếu nhập này không?'
                });
                break;
            case 2:
                {
                    const lstPhieu = await Promise.all(lstIdChon().map((id) => KhoHangService.GetPhieuKho(id)));
                    await inPhieuNhap(
                        lstPhieu.filter((x) => x),
                        appContext.congty
                    );
                }
                break;
            case 3:
                // mỗi phiếu xuất ra 1 file Excel riêng
                for (const id of lstIdChon()) {
                    const file = await KhoHangService.ExportPhieuKho(id);
                    fileDowloadService.downloadExportFile(file);
                }
                break;
        }
    };

    const huyPhieu = async () => {
        await KhoHangService.HuyPhieuKho(lstIdChon());
        setInforDelete({ ...inforDelete, show: false });
        setRowSelectionModel([]);
        setObjAlert({ show: true, mes: 'Hủy phiếu nhập thành công', type: 1 });
        getListPhieuNhap();
    };

    const renderText = (params: any) => (
        <Box component="span" title={params.value} sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {params.value}
        </Box>
    );
    const renderMoney = (params: any) => <Box title={params.value}>{formatMoney(params.value)}</Box>;

    const columns: GridColDef[] = [
        {
            field: 'maHoaDon',
            headerName: 'Mã phiếu nhập',
            minWidth: 120,
            flex: 0.8,
            renderCell: (params: any) =>
                params.row.laPhieuTam ? (
                    <Box
                        component="span"
                        title="Phiếu đang lập, lưu tạm trên trình duyệt này - bấm để lập tiếp"
                        onClick={(e) => {
                            e.stopPropagation();
                            moPhieuTamTrinhDuyet(params.row);
                        }}
                        sx={{ color: '#d97706', textDecoration: 'underline', cursor: 'pointer', fontStyle: 'italic' }}>
                        {params.value}
                    </Box>
                ) : params.row.trangThai === 1 ? (
                    // phiếu tạm lưu cũ trên server: bấm để sửa tiếp
                    <Box
                        component="span"
                        title="Phiếu tạm lưu - bấm để sửa tiếp"
                        onClick={(e) => {
                            e.stopPropagation();
                            moPhieuTamLuu(params.row);
                        }}
                        sx={{ color: 'var(--color-main)', textDecoration: 'underline', cursor: 'pointer' }}>
                        {params.value}
                    </Box>
                ) : (
                    renderText(params)
                )
        },
        {
            field: 'ngayLapHoaDon',
            headerName: 'Ngày tạo phiếu',
            headerAlign: 'center',
            align: 'center',
            minWidth: 130,
            flex: 0.9,
            renderCell: (params) => (
                <Box>{utils.checkNull(params.value) ? '' : format(new Date(params.value), 'dd/MM/yyyy HH:mm')}</Box>
            )
        },
        {
            field: 'maKhachHang',
            headerName: 'Mã nhà cung cấp',
            minWidth: 120,
            flex: 0.8,
            renderCell: (params: any) => (
                <Box component="span" title={params.row.tenKhachHang}>
                    {params.value}
                </Box>
            )
        },
        { field: 'loaiHang', headerName: 'Loại hàng hóa', minWidth: 130, flex: 0.9, renderCell: renderText },
        { field: 'ghiChuHD', headerName: 'Ghi chú', minWidth: 140, flex: 1.2, renderCell: renderText },
        {
            field: 'tongThanhToan',
            headerName: 'Tổng giá tiền',
            headerAlign: 'right',
            align: 'right',
            minWidth: 118,
            flex: 0.9,
            renderCell: renderMoney
        },
        {
            field: 'daThanhToan',
            headerName: 'Đã thanh toán',
            headerAlign: 'right',
            align: 'right',
            minWidth: 118,
            flex: 0.9,
            renderCell: renderMoney
        },
        {
            field: 'soLuong',
            headerName: 'Số lượng',
            headerAlign: 'right',
            align: 'right',
            minWidth: 90,
            flex: 0.6,
            renderCell: renderMoney
        },
        {
            field: 'txtTrangThai',
            headerAlign: 'center',
            align: 'center',
            headerName: 'Trạng thái',
            minWidth: 118,
            flex: 0.8,
            renderCell: (params: any) =>
                params.row.trangThai === -1 ? null : (
                    <Box
                        title={params.value}
                        sx={params.row.laPhieuTam ? { color: '#d97706', fontWeight: 600 } : undefined}
                        className={
                            params.row.trangThai === 3
                                ? 'data-grid-cell-trangthai-active'
                                : 'data-grid-cell-trangthai-notActive'
                        }>
                        {params.value}
                    </Box>
                )
        },
        {
            field: 'actions',
            headerName: '',
            width: 60,
            sortable: false,
            align: 'center',
            renderCell: (params: any) =>
                params.row.id === Guid.EMPTY ? null : (
                    <IconButton
                        size="small"
                        title={params.row.trangThai === 0 ? 'Xem phiếu nhập' : 'Xem / sửa phiếu nhập'}
                        onClick={(e) => {
                            e.stopPropagation();
                            // phiếu đã hủy: chỉ xem; tạm lưu / hoàn thành: mở màn sửa phiếu theo loại hàng
                            if (params.row.laPhieuTam) {
                                moPhieuTamTrinhDuyet(params.row);
                            } else if (params.row.trangThai === 0) {
                                setIdXemPhieu(params.row.id);
                            } else {
                                moPhieuTamLuu(params.row);
                            }
                        }}
                        sx={{ color: '#9e9e9e', '&:hover': { color: '#757575' } }}>
                        <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                )
        }
    ];

    return (
        <>
            <ModalXemPhieuNhap idPhieu={idXemPhieu} onClose={() => setIdXemPhieu(null)} />
            <SnackbarAlert
                showAlert={objAlert.show}
                type={objAlert.type}
                title={objAlert.mes}
                handleClose={() => setObjAlert({ show: false, mes: '', type: 1 })}></SnackbarAlert>
            <ConfirmDelete
                isShow={inforDelete.show}
                title={inforDelete.title}
                mes={inforDelete.mes}
                onOk={huyPhieu}
                onCancel={() => setInforDelete({ ...inforDelete, show: false })}></ConfirmDelete>

            <Box paddingTop={2}>
                <Grid container spacing={1}>
                    <Grid item xs={12} lg={6}>
                        <Grid container spacing={1} alignItems="center">
                            <Grid item xs={12} sm={4} md={3}>
                                <span className="page-title"> Phiếu nhập hàng</span>
                            </Grid>
                            <Grid item xs={12} sm={8} md={6}>
                                <TextField
                                    size="small"
                                    fullWidth
                                    className="text-search"
                                    variant="outlined"
                                    type="search"
                                    placeholder="Tìm theo mã phiếu, mã / tên nhà cung cấp"
                                    InputProps={{
                                        startAdornment: (
                                            <IconButton type="button" onClick={timKiem}>
                                                <Search />
                                            </IconButton>
                                        )
                                    }}
                                    onChange={(event) => setTxtSearch(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') timKiem();
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Select
                                    size="small"
                                    fullWidth
                                    value={paramSearch.loaiHang}
                                    onChange={(e) =>
                                        setParamSearch({
                                            ...paramSearch,
                                            loaiHang: Number(e.target.value),
                                            currentPage: 1
                                        })
                                    }
                                    sx={{ height: 40, backgroundColor: 'white' }}>
                                    <MenuItem value={0}>Tất cả loại hàng</MenuItem>
                                    <MenuItem value={1}>Hàng hóa</MenuItem>
                                    <MenuItem value={4}>Điện thoại</MenuItem>
                                </Select>
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item xs={12} lg={6}>
                        <Box sx={{ display: 'flex', gap: '8px', justifyContent: { lg: 'end' }, flexWrap: 'wrap' }}>
                            <Select
                                size="small"
                                value={trangThai}
                                displayEmpty
                                onChange={(e) => changeTrangThai(e.target.value)}
                                sx={{ height: 40, minWidth: 150, backgroundColor: 'white' }}>
                                {LOC_TRANG_THAI.map((x) => (
                                    <MenuItem key={x.value} value={x.value}>
                                        {x.text}
                                    </MenuItem>
                                ))}
                            </Select>
                            <Stack>
                                <TextField
                                    label="Thời gian"
                                    size="small"
                                    variant="outlined"
                                    InputProps={{ readOnly: true }}
                                    sx={{
                                        '& .MuiInputBase-root': { height: '40px!important' },
                                        backgroundColor: 'white'
                                    }}
                                    onClick={(event) => setAnchorDateEl(event.currentTarget)}
                                    value={txtThoiGian}
                                />
                                <DateFilterCustom
                                    id="popover-date-filter"
                                    open={Boolean(anchorDateEl)}
                                    anchorEl={anchorDateEl}
                                    onClose={() => setAnchorDateEl(null)}
                                    onApplyDate={onApplyFilterDate}
                                />
                            </Stack>
                            <Button
                                variant="outlined"
                                onClick={exportToExcel}
                                startIcon={<DownloadIcon />}
                                sx={{ display: abpCustom.isGrandPermission('Pages.HoaDon.Export') ? '' : 'none' }}
                                className="btn-outline-hover">
                                Xuất Excel
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                endIcon={<KeyboardArrowDownIcon />}
                                onClick={(e) => setAnchorLapPhieu(e.currentTarget)}
                                sx={{
                                    backgroundColor: 'var(--color-main)',
                                    color: '#fff',
                                    textTransform: 'none',
                                    boxShadow: 'none',
                                    '&:hover': { backgroundColor: 'var(--color-main-dark)', boxShadow: 'none' }
                                }}>
                                Lập phiếu
                            </Button>
                            <Menu
                                anchorEl={anchorLapPhieu}
                                open={Boolean(anchorLapPhieu)}
                                onClose={() => setAnchorLapPhieu(null)}
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
                                <MenuItem onClick={() => lapPhieu('hang-hoa')}>
                                    <ListItemIcon>
                                        <Inventory2OutlinedIcon fontSize="small" />
                                    </ListItemIcon>
                                    Lập phiếu hàng hóa
                                </MenuItem>
                                <MenuItem onClick={() => lapPhieu('dien-thoai')}>
                                    <ListItemIcon>
                                        <PhoneIphoneOutlinedIcon fontSize="small" />
                                    </ListItemIcon>
                                    Lập phiếu điện thoại
                                </MenuItem>
                            </Menu>
                        </Box>
                    </Grid>
                </Grid>

                {rowSelectionModel.length > 0 && (
                    <div style={{ marginTop: '24px' }}>
                        <ActionRowSelect
                            lstOption={
                                [
                                    {
                                        id: '1',
                                        text: 'Hủy phiếu',
                                        isShow: abpCustom.isGrandPermission('Pages.HoaDon.Delete'),
                                        icon: <DeleteSweepOutlinedIcon sx={{ width: '1rem', height: '1rem' }} />
                                    },
                                    {
                                        id: '2',
                                        text: 'In phiếu',
                                        isShow: abpCustom.isGrandPermission('Pages.HoaDon.Print'),
                                        icon: <PrintOutlinedIcon sx={{ width: '1rem', height: '1rem' }} />
                                    },
                                    {
                                        id: '3',
                                        text: 'Xuất Excel phiếu',
                                        isShow: abpCustom.isGrandPermission('Pages.HoaDon.Export'),
                                        icon: <FileDownloadOutlinedIcon sx={{ width: '1rem', height: '1rem' }} />
                                    }
                                ] as IList[]
                            }
                            countRowSelected={lstIdChon().length}
                            title="phiếu nhập"
                            choseAction={DataGrid_handleAction}
                            removeItemChosed={() => setRowSelectionModel([])}
                        />
                    </div>
                )}

                <Stack marginTop={rowSelectionModel.length > 0 ? 1 : 5} className="page-box-right" spacing={1}>
                    <DataGrid
                        disableRowSelectionOnClick
                        className={rowSelectionModel.length > 0 ? 'data-grid-row-chosed' : 'data-grid-row'}
                        rowHeight={40}
                        autoHeight={pageData.items.length === 0}
                        columns={columns}
                        rows={pageData.items}
                        hideFooter
                        checkboxSelection
                        isRowSelectable={(params) => params.id !== Guid.EMPTY && !params.row.laPhieuTam}
                        localeText={TextTranslate}
                        onRowSelectionModelChange={(newRowSelectionModel) => setRowSelectionModel(newRowSelectionModel)}
                        rowSelectionModel={rowSelectionModel}
                        sx={{
                            ' & .MuiDataGrid-row--lastVisible': {
                                fontWeight: 600,
                                backgroundColor: 'var(--color-header-table)'
                            }
                        }}
                    />
                    <CustomTablePagination
                        currentPage={paramSearch.currentPage ?? 1}
                        rowPerPage={paramSearch.pageSize ?? 10}
                        totalRecord={pageData.totalCount}
                        totalPage={pageData.totalPage}
                        handlePerPageChange={handlePerPageChange}
                        handlePageChange={handleChangePage}
                    />
                </Stack>
            </Box>
        </>
    );
};
export default NhapHang;
