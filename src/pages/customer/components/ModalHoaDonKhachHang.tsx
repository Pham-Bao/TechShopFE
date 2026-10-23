import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    SelectChangeEvent,
    Tab,
    Tabs
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { format } from 'date-fns';
import DialogButtonClose from '../../../components/Dialog/ButtonClose';
import CustomTablePagination from '../../../components/Pagination/CustomTablePagination';
import { TextTranslate } from '../../../components/TableLanguage';
import ThongTinHoaDon from '../../ban_hang/Hoa_don/ThongTinHoaDon';
import PageHoaDonDto from '../../../services/ban_hang/PageHoaDonDto';
import HoaDonService from '../../../services/ban_hang/HoaDonService';
import khachHangService from '../../../services/khach-hang/khachHangService';
import { HoaDonCuaKhachHangResultDto } from '../../../services/khach-hang/dto/HoaDonCuaKhachHangDto';
import { LoaiChungTu } from '../../../lib/appconst';
import utils from '../../../utils/utils';
import MaChungTuLink from '../../../components/MaChungTu/MaChungTuLink';

type Props = {
    khachHang: { id: string; tenKhachHang: string } | null; // khác null: mở dialog
    onClose: () => void;
};

const formatMoney = (value: number) => new Intl.NumberFormat('vi-VN').format(value ?? 0);
const PAGE_SIZE = 10;

/**
 * Hóa đơn bán / hóa đơn sửa (đã hoàn thành) của 1 khách hàng; bấm 1 hóa đơn để xem chi tiết hóa đơn
 */
const ModalHoaDonKhachHang = ({ khachHang, onClose }: Props) => {
    const [loai, setLoai] = useState(0); // 0.Tất cả, 1.Bán, 19.Sửa
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(PAGE_SIZE);
    const [data, setData] = useState<HoaDonCuaKhachHangResultDto>({
        totalCount: 0,
        soHoaDonBan: 0,
        soHoaDonSua: 0,
        items: []
    });
    const [loading, setLoading] = useState(false);
    // xem chi tiết hóa đơn (màn chi tiết hóa đơn có sẵn)
    const [hoaDonXem, setHoaDonXem] = useState<PageHoaDonDto | null>(null);

    useEffect(() => {
        if (khachHang) {
            setLoai(0);
            setCurrentPage(1);
        }
    }, [khachHang?.id]);

    useEffect(() => {
        if (!khachHang) return;
        setLoading(true);
        khachHangService
            .GetHoaDon_ofKhachHang({ idKhachHang: khachHang.id, loaiHoaDon: loai, currentPage, pageSize })
            .then((res) => setData(res ?? { totalCount: 0, soHoaDonBan: 0, soHoaDonSua: 0, items: [] }))
            .finally(() => setLoading(false));
    }, [khachHang?.id, loai, currentPage, pageSize]);

    const moChiTiet = async (id: string) => {
        const hd = (await HoaDonService.GetInforHoaDon_byId(id))?.[0];
        if (hd) setHoaDonXem({ ...hd, id } as PageHoaDonDto);
    };

    const columns: GridColDef[] = [
        {
            field: 'maHoaDon',
            headerName: 'Mã hóa đơn',
            minWidth: 120,
            flex: 0.9,
            renderCell: (p) => <MaChungTuLink ma={p.value} id={p.row.id} sx={{ fontWeight: 700 }} />
        },
        {
            field: 'ngayLapHoaDon',
            headerName: 'Ngày',
            minWidth: 130,
            flex: 0.9,
            align: 'center',
            headerAlign: 'center',
            renderCell: (p) => (utils.checkNull(p.value) ? '' : format(new Date(p.value), 'dd/MM/yyyy HH:mm'))
        },
        { field: 'loaiHoaDon', headerName: 'Loại', minWidth: 110, flex: 0.7 },
        {
            field: 'tongThanhToan',
            headerName: 'Tổng tiền',
            minWidth: 110,
            flex: 0.8,
            align: 'right',
            headerAlign: 'right',
            renderCell: (p) => formatMoney(p.value)
        },
        {
            field: 'daThanhToan',
            headerName: 'Đã thanh toán',
            minWidth: 120,
            flex: 0.8,
            align: 'right',
            headerAlign: 'right',
            renderCell: (p) => formatMoney(p.value)
        },
        {
            field: 'conNo',
            headerName: 'Còn nợ',
            minWidth: 100,
            flex: 0.7,
            align: 'right',
            headerAlign: 'right',
            renderCell: (p) => <Box sx={{ color: p.value > 0 ? '#dc2626' : undefined }}>{formatMoney(p.value)}</Box>
        },
        {
            field: 'txtTrangThai',
            headerName: 'Trạng thái',
            minWidth: 110,
            flex: 0.7,
            align: 'center',
            headerAlign: 'center',
            renderCell: (p) => <Box className="data-grid-cell-trangthai-active">{p.value}</Box>
        }
    ];

    return (
        <>
            {hoaDonXem && (
                <ThongTinHoaDon
                    idHoaDon={hoaDonXem.id}
                    hoadon={hoaDonXem}
                    open={!!hoaDonXem}
                    handleGotoBack={() => setHoaDonXem(null)}
                />
            )}
            <Dialog open={!!khachHang} onClose={onClose} fullWidth maxWidth="lg">
                <DialogButtonClose onClose={onClose} />
                <DialogTitle className="modal-title">
                    Hóa đơn của khách hàng {khachHang?.tenKhachHang ?? ''}
                </DialogTitle>
                <DialogContent>
                    <Tabs
                        value={loai}
                        onChange={(_, v) => {
                            setLoai(v);
                            setCurrentPage(1);
                        }}
                        sx={{ mb: 1 }}>
                        <Tab
                            value={0}
                            label={`Tất cả (${data.soHoaDonBan + data.soHoaDonSua})`}
                            sx={{ textTransform: 'none' }}
                        />
                        <Tab
                            value={LoaiChungTu.HOA_DON_BAN_LE}
                            label={`Hóa đơn bán (${data.soHoaDonBan})`}
                            sx={{ textTransform: 'none' }}
                        />
                        <Tab
                            value={LoaiChungTu.HOA_DON_SUA_CHUA}
                            label={`Hóa đơn sửa (${data.soHoaDonSua})`}
                            sx={{ textTransform: 'none' }}
                        />
                    </Tabs>
                    <DataGrid
                        autoHeight
                        rows={data.items}
                        columns={columns}
                        loading={loading}
                        hideFooter
                        disableRowSelectionOnClick
                        rowHeight={44}
                        localeText={{ ...TextTranslate, noRowsLabel: 'Khách hàng chưa có hóa đơn' }}
                        onRowClick={(p) => moChiTiet(p.id as string)}
                        sx={{
                            '& .MuiDataGrid-row': { cursor: 'pointer' },
                            '& .MuiDataGrid-cell': { outline: 'none !important' }
                        }}
                    />
                    <CustomTablePagination
                        currentPage={currentPage}
                        rowPerPage={pageSize}
                        totalRecord={data.totalCount}
                        totalPage={utils.getTotalPage(data.totalCount, pageSize)}
                        handlePerPageChange={(e: SelectChangeEvent<number>) => {
                            setCurrentPage(1);
                            setPageSize(parseInt(e.target.value.toString(), 10));
                        }}
                        handlePageChange={(e: any, value: number) => setCurrentPage(value)}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        variant="outlined"
                        onClick={onClose}
                        sx={{ color: 'var(--color-main)' }}
                        className="btn-outline-hover">
                        Đóng
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default ModalHoaDonKhachHang;
