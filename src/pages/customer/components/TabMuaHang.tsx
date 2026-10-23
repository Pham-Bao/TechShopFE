import React, { useEffect, useState } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box, SelectChangeEvent } from '@mui/material';
import { TextTranslate } from '../../../components/TableLanguage';
import khachHangStore from '../../../stores/khachHangStore';
import { observer } from 'mobx-react';
import CustomTablePagination from '../../../components/Pagination/CustomTablePagination';
import { format as formatDate } from 'date-fns';
import AppConsts from '../../../lib/appconst';
import MaChungTuLink from '../../../components/MaChungTu/MaChungTuLink';

const TabMuaHang = ({ khachHangId }: any) => {
    //  const { khachHangId } = useParams();
    const [curentPage, setCurrentPage] = useState<number>(1);
    const [maxResultCount, setMaxResultCount] = useState<number>(10);
    const [sortBy, setSortBy] = useState('creationTime');
    const [sortType, setSortType] = useState('desc');
    useEffect(() => {
        getLichSuMuaHang();
    }, [maxResultCount, curentPage, sortBy, sortType]);
    const getLichSuMuaHang = async () => {
        await khachHangStore.getLichSuGiaoDich(khachHangId ?? AppConsts.guidEmpty, {
            keyword: '',
            maxResultCount: maxResultCount,
            skipCount: curentPage,
            sortBy: sortBy,
            sortType: sortType
        });
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
            headerName: 'Mã hóa đơn',
            minWidth: 70,
            flex: 1.2,
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
                        params.row.trangThai === 3
                            ? 'data-grid-cell-trangthai-active'
                            : 'data-grid-cell-trangthai-notActive'
                    }>
                    {params.value}
                </Box>
            )
        }
    ];

    return (
        <>
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
