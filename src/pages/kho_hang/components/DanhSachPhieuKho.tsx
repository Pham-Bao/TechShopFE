import React, { useContext, useEffect, useState } from 'react';
import { Box, Button, Grid, IconButton, SelectChangeEvent, Stack, TextField } from '@mui/material';
import { Search } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import { format } from 'date-fns';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import { enqueueSnackbar } from 'notistack';
import { TextTranslate } from '../../../components/TableLanguage';
import CustomTablePagination from '../../../components/Pagination/CustomTablePagination';
import ConfirmDelete from '../../../components/AlertDialog/ConfirmDelete';
import DateFilterCustom from '../../../components/DatetimePicker/DateFilterCustom';
import { AppContext } from '../../../services/chi_nhanh/ChiNhanhContext';
import { HoaDonRequestDto } from '../../../services/dto/ParamSearchDto';
import { PagedResultDto } from '../../../services/dto/pagedResultDto';
import PageHoaDonDto from '../../../services/ban_hang/PageHoaDonDto';
import HoaDonService from '../../../services/ban_hang/HoaDonService';
import KhoHangService from '../../../services/kho_hang/KhoHangService';
import AppConsts, { LoaiChungTu } from '../../../lib/appconst';
import utils from '../../../utils/utils';
import ModalChiTietPhieuKho from './ModalChiTietPhieuKho';

type Props = {
    title: string;
    idLoaiChungTu: number;
    pathTaoMoi?: string; // trang lập phiếu (không có: ẩn nút Lập phiếu)
    labelDoiTuong?: string; // tên cột đối tượng (nhà cung cấp / khách hàng), không có thì ẩn cột
    coTamLuu?: boolean; // hiện cả phiếu tạm lưu, bấm vào phiếu tạm lưu để mở lại và tiếp tục
};

// Danh sách phiếu kho dùng chung: xuất kho, kiểm kê, khách trả hàng, trả hàng nhà cung cấp
const DanhSachPhieuKho: React.FC<Props> = ({ title, idLoaiChungTu, pathTaoMoi, labelDoiTuong, coTamLuu }) => {
    const navigate = useNavigate();
    const appContext = useContext(AppContext);
    const idChiNhanh = utils.checkNull(appContext.chinhanhCurrent?.id)
        ? Cookies.get('IdChiNhanh') ?? ''
        : appContext.chinhanhCurrent?.id;

    const [txtSearch, setTxtSearch] = useState('');
    const [paramSearch, setParamSearch] = useState<HoaDonRequestDto>({
        textSearch: '',
        idChiNhanhs: [idChiNhanh],
        idLoaiChungTus: [idLoaiChungTu],
        currentPage: 1,
        pageSize: AppConsts.pageOption[0].value,
        columnSort: 'NgayLapHoaDon',
        typeSort: 'DESC',
        fromDate: null,
        toDate: null,
        trangThais: coTamLuu ? [1, 3] : [3]
    });
    const [pageData, setPageData] = useState<PagedResultDto<PageHoaDonDto>>({ totalCount: 0, totalPage: 0, items: [] });
    const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>([]);
    const [showConfirm, setShowConfirm] = useState(false);
    const [phieuChosed, setPhieuChosed] = useState<any>(null);
    const [anchorDateEl, setAnchorDateEl] = useState<HTMLDivElement | null>(null);
    const [txtThoiGian, setTxtThoiGian] = useState('Tất cả');

    useEffect(() => {
        setParamSearch((prev) => ({ ...prev, idChiNhanhs: [idChiNhanh], currentPage: 1 }));
    }, [idChiNhanh]);

    useEffect(() => {
        (async () => {
            const data = await HoaDonService.GetListHoaDon(paramSearch);
            setPageData({
                totalCount: data?.totalCount ?? 0,
                totalPage: utils.getTotalPage(data?.totalCount ?? 0, paramSearch.pageSize),
                items: data?.items ?? []
            });
        })();
    }, [paramSearch]);

    const reload = () => setParamSearch({ ...paramSearch });

    const huyPhieu = async () => {
        setShowConfirm(false);
        await KhoHangService.HuyPhieuKho(rowSelectionModel.map((x) => x.toString()));
        enqueueSnackbar('Hủy phiếu thành công', { variant: 'success' });
        setRowSelectionModel([]);
        reload();
    };

    const openRow = (row: any) => {
        if (coTamLuu && pathTaoMoi && row.trangThai === 1) {
            navigate(`${pathTaoMoi}?id=${row.id}`);
            return;
        }
        setPhieuChosed(row);
    };

    const columns: GridColDef[] = [
        { field: 'maHoaDon', headerName: 'Mã phiếu', minWidth: 120, flex: 0.8 },
        {
            field: 'ngayLapHoaDon',
            headerName: 'Ngày lập',
            minWidth: 140,
            flex: 0.8,
            renderCell: (params) => (params.value ? format(new Date(params.value), 'dd/MM/yyyy HH:mm') : '')
        },
        ...(labelDoiTuong
            ? [
                  {
                      field: 'tenKhachHang',
                      headerName: labelDoiTuong,
                      minWidth: 160,
                      flex: 1
                  } as GridColDef
              ]
            : []),
        { field: 'ghiChuHD', headerName: 'Ghi chú', minWidth: 200, flex: 1.5 },
        { field: 'userName', headerName: 'Người lập', minWidth: 110, flex: 0.6 },
        {
            field: 'txtTrangThaiHD',
            headerName: 'Trạng thái',
            headerAlign: 'center',
            align: 'center',
            minWidth: 120,
            flex: 0.6,
            renderCell: (params) => (
                <Box
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
            sortable: false,
            width: 70,
            align: 'center',
            renderCell: (params) =>
                coTamLuu && params.row.trangThai === 1 ? (
                    <EditOutlinedIcon
                        titleAccess="Tiếp tục phiếu tạm lưu"
                        sx={{ fontSize: 18, cursor: 'pointer', color: '#9e9e9e' }}
                        onClick={() => openRow(params.row)}
                    />
                ) : (
                    <VisibilityOutlinedIcon
                        titleAccess="Xem chi tiết"
                        sx={{ fontSize: 18, cursor: 'pointer', color: '#9e9e9e' }}
                        onClick={() => openRow(params.row)}
                    />
                )
        }
    ];

    return (
        <>
            <ConfirmDelete
                isShow={showConfirm}
                mes="Hủy các phiếu đã chọn? Tồn kho sẽ được tính lại."
                onOk={huyPhieu}
                onCancel={() => setShowConfirm(false)}
            />
            <ModalChiTietPhieuKho open={phieuChosed != null} phieu={phieuChosed} onClose={() => setPhieuChosed(null)} />
            <Box paddingTop={2}>
                <Grid container spacing={1} alignItems="center">
                    <Grid item xs={12} lg={6}>
                        <Grid container spacing={1} alignItems="center">
                            <Grid item xs={12} sm={5}>
                                <span className="page-title">{title}</span>
                            </Grid>
                            <Grid item xs={12} sm={7}>
                                <TextField
                                    size="small"
                                    fullWidth
                                    className="text-search"
                                    type="search"
                                    placeholder="Tìm theo mã phiếu, ghi chú"
                                    InputProps={{
                                        startAdornment: (
                                            <IconButton
                                                type="button"
                                                onClick={() =>
                                                    setParamSearch({
                                                        ...paramSearch,
                                                        textSearch: txtSearch,
                                                        currentPage: 1
                                                    })
                                                }>
                                                <Search />
                                            </IconButton>
                                        )
                                    }}
                                    onChange={(e) => setTxtSearch(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            setParamSearch({ ...paramSearch, textSearch: txtSearch, currentPage: 1 });
                                        }
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item xs={12} lg={6}>
                        <Stack direction="row" spacing={1} justifyContent={{ lg: 'end' }}>
                            {rowSelectionModel.length > 0 && (
                                <Button
                                    variant="outlined"
                                    color="error"
                                    startIcon={<DeleteSweepOutlinedIcon />}
                                    onClick={() => setShowConfirm(true)}>
                                    Hủy {rowSelectionModel.length} phiếu
                                </Button>
                            )}
                            <TextField
                                label="Thời gian"
                                size="small"
                                value={txtThoiGian}
                                onClick={(e) => setAnchorDateEl(e.currentTarget)}
                                sx={{ backgroundColor: 'white', minWidth: 200 }}
                            />
                            <DateFilterCustom
                                id="popover-date-filter-phieu-kho"
                                open={Boolean(anchorDateEl)}
                                anchorEl={anchorDateEl}
                                onClose={() => setAnchorDateEl(null)}
                                onApplyDate={(from: string, to: string, txtShow: string) => {
                                    setAnchorDateEl(null);
                                    setTxtThoiGian(txtShow);
                                    setParamSearch({ ...paramSearch, fromDate: from, toDate: to, currentPage: 1 });
                                }}
                            />
                            {pathTaoMoi && (
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={() => navigate(pathTaoMoi)}
                                    sx={{
                                        backgroundColor: 'var(--color-main)',
                                        textTransform: 'none',
                                        boxShadow: 'none',
                                        whiteSpace: 'nowrap'
                                    }}>
                                    Lập phiếu
                                </Button>
                            )}
                        </Stack>
                    </Grid>
                </Grid>

                <Stack marginTop={3} className="page-box-right" spacing={1}>
                    <DataGrid
                        disableRowSelectionOnClick
                        rowHeight={40}
                        autoHeight={pageData.items.length === 0}
                        columns={columns}
                        rows={pageData.items}
                        hideFooter
                        checkboxSelection
                        localeText={TextTranslate}
                        isRowSelectable={(params) =>
                            !(params.row.idLoaiChungTu === LoaiChungTu.PHIEU_XUAT_KHO && params.row.idHoaDon)
                        }
                        onRowSelectionModelChange={(model) => setRowSelectionModel(model)}
                        rowSelectionModel={rowSelectionModel}
                    />
                    <CustomTablePagination
                        currentPage={paramSearch.currentPage ?? 1}
                        rowPerPage={paramSearch.pageSize ?? 10}
                        totalRecord={pageData.totalCount}
                        totalPage={pageData.totalPage}
                        handlePerPageChange={(event: SelectChangeEvent<number>) =>
                            setParamSearch({
                                ...paramSearch,
                                currentPage: 1,
                                pageSize: parseInt(event.target.value.toString(), 10)
                            })
                        }
                        handlePageChange={(event: any, value: number) =>
                            setParamSearch({ ...paramSearch, currentPage: value })
                        }
                    />
                </Stack>
            </Box>
        </>
    );
};

export default DanhSachPhieuKho;
