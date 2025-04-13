import {
    Grid,
    Box,
    SelectChangeEvent,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    TableFooter
} from '@mui/material';
import CustomTablePagination from '../../../components/Pagination/CustomTablePagination';
import { FC, useContext, useEffect, useState } from 'react';
import { PagedResultDto } from '../../../services/dto/pagedResultDto';
import { LoaiBaoCao } from '../../../lib/appconst';
import { format } from 'date-fns';
import { IHeaderTable, MyHeaderTable } from '../../../components/Table/MyHeaderTable';
import BaoCaoTGTService from '../../../services/bao_cao/bao_cao_the_gia_tri/BaoCaoTGTService';
import { IBaocaoNhatKySuDungTGT } from '../../../services/bao_cao/bao_cao_the_gia_tri/BaoCaoTGTDto';
import { BaoCaoTGT_DataContextFilter } from '../../../services/bao_cao/bao_cao_the_gia_tri/BaoCaoTGT_DataContextFilter';
import { useMemo } from 'react'; // Import thêm useMemo
const PageBCNhatKySuDungTGTTGT: FC<{
    onChangePage: (currentPage: number) => void;
    onChangePageSize: (pageSize: number) => void;
    maKhachHang?: string;
    onUpdateBalance?: (balance: number) => void;
}> = ({ onChangePage, onChangePageSize, maKhachHang, onUpdateBalance }) => {
    const dataFilterContext = useContext(BaoCaoTGT_DataContextFilter);
    const [pageDataBCNhatKySuDungTGT, setPageDataBCNhatKySuDungTGT] = useState<PagedResultDto<IBaocaoNhatKySuDungTGT>>({
        items: [],
        totalCount: 0,
        totalPage: 0
    });

    const totals = useMemo(() => {
        const initialTotals = { giaTriDieuChinh: 0, phatSinhTang: 0, phatSinhGiam: 0 };
        const calculatedTotals = pageDataBCNhatKySuDungTGT.items.reduce((acc, item) => {
            acc.giaTriDieuChinh += item.gtriDieuChinh ?? 0;
            acc.phatSinhTang += item.phatSinhTang ?? 0;
            acc.phatSinhGiam += item.phatSinhGiam ?? 0;
            return acc;
        }, initialTotals);
        return {
            ...calculatedTotals,
            soDu: calculatedTotals.phatSinhTang - calculatedTotals.phatSinhGiam // Tính số dư
        };
    }, [pageDataBCNhatKySuDungTGT.items]);
    useEffect(() => {
        if (onUpdateBalance) {
            onUpdateBalance(totals.soDu);
        }
    }, [totals.soDu, onUpdateBalance]);

    useEffect(() => {
        if (dataFilterContext.loaiBaoCao === parseInt(LoaiBaoCao.CHI_TIET)) {
            GetNhatKySuDungTGT();
        }
    }, [
        dataFilterContext?.countClick,
        dataFilterContext?.filter?.currentPage,
        dataFilterContext?.filter?.pageSize,
        dataFilterContext?.filter?.fromDate,
        dataFilterContext?.filter?.toDate,
        dataFilterContext?.filter?.idChiNhanhs,
        dataFilterContext?.filter?.idLoaiChungTus,
        dataFilterContext?.filter?.textSearch
    ]);

    const GetNhatKySuDungTGT = async () => {
        const updatedFilter = {
            ...dataFilterContext.filter,
            textSearch: maKhachHang || dataFilterContext.filter.textSearch
        };

        const data = await BaoCaoTGTService.GetNhatKySuDungTGT(updatedFilter);

        if (data !== null) {
            setPageDataBCNhatKySuDungTGT({
                ...pageDataBCNhatKySuDungTGT,
                items: data.items,
                totalCount: data.totalCount,
                totalPage: Math.ceil(data.totalCount / (updatedFilter.pageSize ?? 10))
            });
        } else {
            setPageDataBCNhatKySuDungTGT({
                ...pageDataBCNhatKySuDungTGT,
                items: [],
                totalCount: 0,
                totalPage: 0
            });
        }
    };

    const handlePageChange = async (event: any, value: number) => {
        onChangePage(value);
    };
    const changePageSize = async (event: SelectChangeEvent<number>) => {
        const pageSizeNew = parseInt(event.target.value.toString());
        onChangePageSize(pageSizeNew);
    };

    const onSortTable = () => {
        //
    };

    const listColumnHeader: IHeaderTable[] = [
        { columnId: 'sLoaiChungTu', columnText: 'Loại chứng từ' },
        { columnId: 'maHoaDon', columnText: 'Mã chứng từ' },
        { columnId: 'ngayLapHoaDon', columnText: 'Ngày lập' },
        { columnId: 'maKhachHang', columnText: 'Mã khách hàng' },
        { columnId: 'tenKhachHang', columnText: 'Tên khách hàng' },
        { columnId: 'soDienThoai', columnText: 'Số điện thoại' },
        { columnId: 'giaTriDieuChinh', columnText: 'Giá trị điều chỉnh', align: 'right' },
        { columnId: 'phatSinhTang', columnText: 'Phát sinh tăng', align: 'right' },
        { columnId: 'phatSinhGiam', columnText: 'Phát sinh giảm', align: 'right' }
    ];

    return (
        <>
            <Grid container paddingTop={2}>
                <Grid item xs={12} sm={12} md={12} lg={12}>
                    <Box className="page-box-right">
                        <Box>
                            <TableContainer className="data-grid-row">
                                <Table>
                                    <TableHead className="table-head-has-colspan">
                                        <MyHeaderTable
                                            showAction={false}
                                            isCheckAll={false}
                                            isShowCheck={false}
                                            sortBy={dataFilterContext?.filter?.columnSort ?? ''}
                                            sortType={dataFilterContext?.filter?.typeSort ?? 'desc'}
                                            onRequestSort={onSortTable}
                                            listColumnHeader={listColumnHeader}
                                        />
                                    </TableHead>
                                    {pageDataBCNhatKySuDungTGT?.items?.map((row, index) => (
                                        <TableBody key={index}>
                                            <TableRow>
                                                <TableCell>{row?.sLoaiChungTu}</TableCell>
                                                <TableCell sx={{ fontWeight: 500 }}>{row?.maHoaDon}</TableCell>
                                                <TableCell>
                                                    {format(new Date(row?.ngayLapHoaDon), 'dd/MM/yyyy')}
                                                </TableCell>
                                                <TableCell>{row?.maKhachHang}</TableCell>
                                                <TableCell
                                                    sx={{ maxWidth: 150 }}
                                                    title={row?.tenKhachHang}
                                                    className="lableOverflow">
                                                    {row?.tenKhachHang}
                                                </TableCell>
                                                <TableCell>{row?.soDienThoai}</TableCell>
                                                <TableCell align="right">
                                                    {new Intl.NumberFormat('vi-VN').format(row?.gtriDieuChinh ?? 0)}
                                                </TableCell>
                                                <TableCell align="right">
                                                    {new Intl.NumberFormat('vi-VN').format(row?.phatSinhTang ?? 0)}
                                                </TableCell>
                                                <TableCell align="right">
                                                    {new Intl.NumberFormat('vi-VN').format(row?.phatSinhGiam ?? 0)}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    ))}
                                    <TableFooter>
                                        <TableRow>
                                            <TableCell colSpan={6} align="left" style={{ fontWeight: 700 }}>
                                                Tổng cộng:
                                            </TableCell>
                                            <TableCell align="right">
                                                {new Intl.NumberFormat('vi-VN').format(totals.giaTriDieuChinh)}
                                            </TableCell>
                                            <TableCell align="right">
                                                {new Intl.NumberFormat('vi-VN').format(totals.phatSinhTang)}
                                            </TableCell>
                                            <TableCell align="right">
                                                {new Intl.NumberFormat('vi-VN').format(totals.phatSinhGiam)}
                                            </TableCell>
                                        </TableRow>
                                        {pageDataBCNhatKySuDungTGT?.totalCount === 0 && (
                                            <TableRow className="table-empty">
                                                <TableCell colSpan={20} align="center">
                                                    Báo cáo không có dữ liệu
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableFooter>
                                </Table>
                            </TableContainer>
                        </Box>
                        <CustomTablePagination
                            currentPage={dataFilterContext?.filter?.currentPage ?? 1}
                            rowPerPage={dataFilterContext?.filter?.pageSize ?? 10}
                            totalPage={pageDataBCNhatKySuDungTGT?.totalPage}
                            totalRecord={pageDataBCNhatKySuDungTGT?.totalCount}
                            handlePerPageChange={changePageSize}
                            handlePageChange={handlePageChange}
                        />
                    </Box>
                </Grid>
            </Grid>
        </>
    );
};

export default PageBCNhatKySuDungTGTTGT;
