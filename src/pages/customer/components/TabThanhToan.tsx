import React, { useEffect, useState } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box, SelectChangeEvent } from '@mui/material';
import { observer } from 'mobx-react';
import { format as formatDate } from 'date-fns';
import Cookies from 'js-cookie';

import { TextTranslate } from '../../../components/TableLanguage';
import CustomTablePagination from '../../../components/Pagination/CustomTablePagination';

import { LoaiChungTu, TrangThaiActive } from '../../../lib/appconst';

import SoQuyServices from '../../../services/so_quy/SoQuyServices';
import { ParamSearchSoQuyDto } from '../../../services/so_quy/Dto/ParamSearchSoQuyDto';
import khachHangService from '../../../services/khach-hang/khachHangService';
import { DanhSachMaChungTu } from '../../../components/MaChungTu/MaChungTuLink';

const TabThanhToan = ({ khachHangId }: any) => {
    const [curentPage, setCurrentPage] = useState<number>(1);
    const [maxResultCount, setMaxResultCount] = useState<number>(10);

    const [sortBy, setSortBy] = useState<string>('ngayLapHoaDon');
    const [sortType, setSortType] = useState<string>('desc');

    const idChiNhanhCookies = Cookies.get('IdChiNhanh') ?? '';

    const [listSoQuy, setListSoQuy] = useState<any>({
        totalCount: 0,
        items: []
    });

    const [paramSearch, setParamSearch] = useState<ParamSearchSoQuyDto>({
        textSearch: '',
        currentPage: 1,
        pageSize: 10,
        typeSort: 'desc',
        idChiNhanhs: [idChiNhanhCookies],
        idLoaiChungTus: [LoaiChungTu.PHIEU_THU, LoaiChungTu.PHIEU_CHI],
        idLoaiChungTuLienQuan: LoaiChungTu.ALL,
        trangThais: [TrangThaiActive.ACTIVE]
    });

    useEffect(() => {
        if (khachHangId) {
            GetListSoQuy();
        }
    }, [khachHangId, curentPage, maxResultCount, sortBy, sortType]);

    const GetListSoQuy = async () => {
        try {
            const ifKhachHang = await khachHangService.getDetailCustomerById(khachHangId);

            const newParam = {
                ...paramSearch,
                textSearch: ifKhachHang?.maKhachHang || '',
                currentPage: curentPage,
                pageSize: maxResultCount,
                sortBy: sortBy,
                typeSort: sortType
            };

            setParamSearch(newParam);

            const response = await SoQuyServices.getAll(newParam);

            setListSoQuy(
                response || {
                    totalCount: 0,
                    items: []
                }
            );
        } catch (error) {
            console.log('GetListSoQuy error', error);

            setListSoQuy({
                totalCount: 0,
                items: []
            });
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
            headerName: 'Mã phiếu',
            minWidth: 130,
            flex: 1,
            renderCell: (params) => (
                <Box fontWeight={600} title={params.value}>
                    {params.value}
                </Box>
            )
        },
        {
            field: 'loaiPhieu',
            headerName: 'Loại phiếu',
            headerAlign: 'center',
            align: 'center',
            minWidth: 130,
            flex: 1,
            renderCell: (params) => (
                <Box
                    sx={{
                        fontWeight: 700,
                        color: params.row.idLoaiChungTu === LoaiChungTu.PHIEU_THU ? 'success.main' : 'error.main'
                    }}>
                    {params.value}
                </Box>
            )
        },
        {
            field: 'maHoaDonLienQuans',
            headerName: 'Hóa đơn liên quan',
            minWidth: 220,
            flex: 1.5,
            renderCell: (params) => (
                <Box title={params.value}>
                    <DanhSachMaChungTu ma={params.value} />
                </Box>
            )
        },
        {
            field: 'tenNguoiNop',
            headerName: 'Người nộp',
            minWidth: 180,
            flex: 1.2,
            renderCell: (params) => <Box title={params.value}>{params.value}</Box>
        },
        {
            field: 'ngayLapHoaDon',
            headerName: 'Ngày lập',
            headerAlign: 'center',
            align: 'center',
            minWidth: 180,
            flex: 1.2,
            renderCell: (params) => (
                <Box title={params.value}>
                    {params.value ? formatDate(new Date(params.value), 'dd/MM/yyyy HH:mm') : ''}
                </Box>
            )
        },
        {
            field: 'tienMat',
            headerName: 'Tiền mặt',
            headerAlign: 'right',
            align: 'right',
            minWidth: 150,
            flex: 1,
            renderCell: (params) => <Box width="100%">{new Intl.NumberFormat('vi-VN').format(params.value || 0)}</Box>
        },
        {
            field: 'tienChuyenKhoan',
            headerName: 'Chuyển khoản',
            headerAlign: 'right',
            align: 'right',
            minWidth: 160,
            flex: 1,
            renderCell: (params) => <Box width="100%">{new Intl.NumberFormat('vi-VN').format(params.value || 0)}</Box>
        },
        {
            field: 'tongTienThu',
            headerName: 'Tổng tiền',
            headerAlign: 'right',
            align: 'right',
            minWidth: 160,
            flex: 1,
            renderCell: (params) => (
                <Box
                    width="100%"
                    sx={{
                        fontWeight: 700,
                        color: params.row.idLoaiChungTu === LoaiChungTu.PHIEU_THU ? 'success.main' : 'error.main'
                    }}>
                    {new Intl.NumberFormat('vi-VN').format(params.value || 0)}
                </Box>
            )
        },
        {
            field: 'txtTrangThai',
            headerName: 'Trạng thái',
            headerAlign: 'center',
            align: 'center',
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Box
                    className={
                        params.row.trangThai === 1
                            ? 'data-grid-cell-trangthai-active'
                            : 'data-grid-cell-trangthai-notActive'
                    }>
                    {params.value}
                </Box>
            )
        }
    ];

    return (
        <Box mt="24px" className="page-box-right">
            <DataGrid
                disableRowSelectionOnClick
                hideFooter
                autoHeight
                className="data-grid-row-full"
                columns={columns}
                rows={listSoQuy?.items || []}
                getRowId={(row) => row.id}
                pageSizeOptions={[5, 10, 20, 50, 100]}
                sortingOrder={['desc', 'asc']}
                localeText={TextTranslate}
                onSortModelChange={(newSortModel) => {
                    if (newSortModel.length > 0) {
                        onSort(newSortModel[0].sort?.toString() ?? 'desc', newSortModel[0].field ?? 'ngayLapHoaDon');
                    }
                }}
            />

            <CustomTablePagination
                currentPage={curentPage}
                rowPerPage={maxResultCount}
                totalRecord={listSoQuy?.totalCount || 0}
                totalPage={Math.ceil((listSoQuy?.totalCount || 0) / maxResultCount)}
                handlePerPageChange={handlePerPageChange}
                handlePageChange={handlePageChange}
            />
        </Box>
    );
};

export default observer(TabThanhToan);
