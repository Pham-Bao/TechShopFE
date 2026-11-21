import React, { useEffect, useState } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box, SelectChangeEvent } from '@mui/material';
import { TextTranslate } from '../../../components/TableLanguage';
import khachHangStore from '../../../stores/khachHangStore';
import { observer } from 'mobx-react';
import CustomTablePagination from '../../../components/Pagination/CustomTablePagination';
import { format as formatDate } from 'date-fns';
import AppConsts from '../../../lib/appconst';
import { LoaiChungTu, TypeAction } from '../../../lib/appconst';
import MaChungTuLink from '../../../components/MaChungTu/MaChungTuLink';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { useNavigate } from 'react-router-dom';
import { enqueueSnackbar } from 'notistack';
import HoaDonService from '../../../services/ban_hang/HoaDonService';
import PageHoaDonDto from '../../../services/ban_hang/PageHoaDonDto';
import KhoHangService from '../../../services/kho_hang/KhoHangService';
import suggestStore from '../../../stores/suggestStore';
import ThongTinHoaDon from '../../ban_hang/Hoa_don/ThongTinHoaDon';

// nhomChungTu: 1.tab Hóa đơn, 2.tab Nhập xuất; onDaThayDoi: báo trang khách hàng khi hóa đơn được sửa / thanh toán / xóa
const TabMuaHang = ({ khachHangId, nhomChungTu, onDaThayDoi }: any) => {
    const navigate = useNavigate();
    //  const { khachHangId } = useParams();
    const [curentPage, setCurrentPage] = useState<number>(1);
    const [maxResultCount, setMaxResultCount] = useState<number>(10);
    const [sortBy, setSortBy] = useState('creationTime');
    const [sortType, setSortType] = useState('desc');
    const [hoaDonXem, setHoaDonXem] = useState<PageHoaDonDto | null>(null);
    useEffect(() => {
        getLichSuMuaHang();
    }, [maxResultCount, curentPage, sortBy, sortType]);
    const getLichSuMuaHang = async () => {
        await khachHangStore.getLichSuGiaoDich(
            khachHangId ?? AppConsts.guidEmpty,
            {
                keyword: '',
                maxResultCount: maxResultCount,
                skipCount: curentPage,
                sortBy: sortBy,
                sortType: sortType
            },
            nhomChungTu
        );
    };
    const coXemChiTiet = (idLoaiChungTu: number) =>
        [
            LoaiChungTu.HOA_DON_BAN_LE,
            LoaiChungTu.HOA_DON_SUA_CHUA,
            LoaiChungTu.NHAP_HANG,
            LoaiChungTu.PHIEU_XUAT_KHO,
            LoaiChungTu.KHACH_TRA_HANG,
            LoaiChungTu.TRA_HANG_NCC
        ].includes(idLoaiChungTu);
    const xemChiTiet = async (row: any) => {
        switch (row.idLoaiChungTu) {
            case LoaiChungTu.HOA_DON_BAN_LE:
            case LoaiChungTu.HOA_DON_SUA_CHUA: {
                // dòng lịch sử thiếu nhiều trường so với danh sách hóa đơn: lấy đầy đủ theo id
                const data = await HoaDonService.GetInforHoaDon_byId(row.id);
                const hd = data?.[0];
                if (!hd) return;
                // tài khoản ngân hàng cho phần thanh toán (màn Hóa đơn tự nạp, trang khách hàng thì chưa)
                await suggestStore.GetAllBankAccount(hd.idChiNhanh ?? '');
                setHoaDonXem({ ...hd, id: row.id } as PageHoaDonDto);
                break;
            }
            case LoaiChungTu.NHAP_HANG: {
                const ct = await KhoHangService.GetChungTu_byMa(row.maHoaDon, row.id);
                navigate(`/nhap-hang/${ct?.loaiHang ?? 'hang-hoa'}?id=${row.id}`);
                break;
            }
            case LoaiChungTu.PHIEU_XUAT_KHO:
                navigate(`/xuat-hangs?id=${row.id}`);
                break;
            case LoaiChungTu.KHACH_TRA_HANG:
                navigate(`/khach-tra-hangs?id=${row.id}`);
                break;
            case LoaiChungTu.TRA_HANG_NCC:
                navigate(`/tra-hang-nccs?id=${row.id}`);
                break;
        }
    };
    const dongHoaDon = (hoaDonSau: PageHoaDonDto, typeAction = TypeAction.NOTHING) => {
        setHoaDonXem(null);
        if (typeAction === TypeAction.NOTHING) return;
        getLichSuMuaHang();
        onDaThayDoi?.();
        if (typeAction === TypeAction.DELETE) {
            enqueueSnackbar('Hủy hóa đơn thành công', { variant: 'success' });
        }
    };
    const handlePageChange = async (event: any, newPage: number) => {
        setCurrentPage(newPage);
    };
    const handlePerPageChange = async (event: SelectChangeEvent<number>) => {
        setCurrentPage(1);
        setMaxResultCount(parseInt(event.target.value.toString(), 10));
    };
    const onSort = async (sortType: string, sortBy: string) => {
        setSortType(sortType);
        setSortBy(sortBy);
    };
    const columns: GridColDef[] = [
        {
            field: 'maHoaDon',
            headerName: nhomChungTu === 2 ? 'Mã phiếu' : 'Mã hóa đơn',
            width: 100,
            renderHeader: (params) => <Box>{params.colDef.headerName}</Box>,
            renderCell: (params) => (
                <MaChungTuLink ma={params.value} id={params.row.id} idLoaiChungTu={params.row.idLoaiChungTu} />
            )
        },
        {
            field: 'ngayLapHoaDon',
            headerName: 'Ngày',
            headerAlign: 'center',
            align: 'center',
            flex: 1.2,
            renderHeader: (params) => <Box>{params.colDef.headerName}</Box>,
            renderCell: (params) => (
                <Box title={params.value}>{formatDate(new Date(params.value), 'dd/MM/yyyy HH:mm')}</Box>
            )
        },
        {
            field: 'loaiChungTu',
            headerName: 'Loại',
            flex: 1,
            minWidth: 100,
            renderHeader: (params) => <Box>{params.colDef.headerName}</Box>,
            renderCell: (params) => <Box title={params.value}>{params.value}</Box>
        },
        {
            // mua gì: điện thoại (tên - màu - IMEI), hàng hóa x SL, hóa đơn sửa: máy sửa + dịch vụ
            field: 'noiDung',
            headerName: 'Nội dung',
            flex: 3,
            minWidth: 220,
            renderHeader: (params) => <Box>{params.colDef.headerName}</Box>,
            renderCell: (params) => (
                <Box title={params.value} sx={{ whiteSpace: 'normal', lineHeight: 1.4, py: 0.5 }}>
                    {params.value}
                </Box>
            )
        },
        {
            field: 'tongTienHang',
            headerName: 'Tổng tiền hàng',
            headerAlign: 'right',
            align: 'right',
            flex: 1,
            renderHeader: (params) => <Box>{params.colDef.headerName}</Box>,
            renderCell: (params) => (
                <Box title={params.value}>{new Intl.NumberFormat('vi-VN').format(params.value)}</Box>
            )
        },

        {
            field: 'khachDaTra',
            headerName: 'Đã thanh toán',
            headerAlign: 'right',
            align: 'right',
            flex: 1,
            renderHeader: (params) => <Box title={params.colDef.headerName}>{params.colDef.headerName}</Box>,
            renderCell: (params) => (
                <Box title={params.value}>{new Intl.NumberFormat('vi-VN').format(params.value)}</Box>
            )
        },
        {
            field: 'conNo',
            headerName: 'Còn nợ',
            headerAlign: 'right',
            align: 'right',
            flex: 1,

            renderHeader: (params) => <Box title={params.colDef.headerName}>{params.colDef.headerName}</Box>,
            renderCell: (params) => (
                <Box title={params.value} sx={{ color: 'red' }}>
                    {new Intl.NumberFormat('vi-VN').format(params.value)}
                </Box>
            )
        },
        {
            field: 'txtTrangThai',
            headerName: 'Trạng thái',
            headerAlign: 'center',
            align: 'center',
            flex: 1,
            renderHeader: (params) => <Box title={params.colDef.headerName}>{params.colDef.headerName}</Box>,
            renderCell: (params) => (
                <Box
                    title={params.value}
                    className={
                        // API trả trạng thái dạng chuỗi ("3")
                        Number(params.row.trangThai) === 3
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
            headerAlign: 'center',
            align: 'center',
            width: 60,
            sortable: false,
            disableColumnMenu: true,
            renderCell: (params) =>
                coXemChiTiet(params.row.idLoaiChungTu) ? (
                    <VisibilityOutlinedIcon
                        titleAccess="Xem chi tiết"
                        onClick={() => xemChiTiet(params.row)}
                        sx={{
                            fontSize: '18px',
                            cursor: 'pointer',
                            color: '#9e9e9e',
                            '&:hover': { color: '#757575' }
                        }}
                    />
                ) : null
        }
    ];

    return (
        <>
            {hoaDonXem && (
                <ThongTinHoaDon open idHoaDon={hoaDonXem.id} hoadon={hoaDonXem} handleGotoBack={dongHoaDon} />
            )}
            <Box mt="24px" className="page-box-right">
                <DataGrid
                    disableRowSelectionOnClick
                    hideFooter
                    autoHeight
                    className="data-grid-row-full"
                    columns={columns}
                    rows={khachHangStore.lichSuGiaoDich === undefined ? [] : khachHangStore.lichSuGiaoDich.items}
                    getRowId={(row) => row.id ?? row.maHoaDon}
                    getRowHeight={() => 'auto'}
                    initialState={{
                        pagination: {
                            paginationModel: { page: 0, pageSize: 10 }
                        }
                    }}
                    pageSizeOptions={[10, 20, 50, 100]}
                    sortingOrder={['desc', 'asc']}
                    onSortModelChange={(newSortModel) => {
                        if (newSortModel.length > 0) {
                            onSort(newSortModel[0].sort?.toString() ?? 'creationTime', newSortModel[0].field ?? 'desc');
                        }
                    }}
                    localeText={TextTranslate}
                />
                <CustomTablePagination
                    currentPage={curentPage}
                    rowPerPage={maxResultCount}
                    totalRecord={
                        khachHangStore.lichSuGiaoDich === undefined ? 0 : khachHangStore.lichSuGiaoDich.totalCount
                    }
                    totalPage={
                        khachHangStore.lichSuGiaoDich === undefined
                            ? 0
                            : Math.ceil(khachHangStore.lichSuGiaoDich.totalCount / maxResultCount)
                    }
                    handlePerPageChange={handlePerPageChange}
                    handlePageChange={handlePageChange}
                />
            </Box>
        </>
    );
};
export default observer(TabMuaHang);
