import React, { useEffect, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Stack, Typography } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { format } from 'date-fns';
import DialogButtonClose from '../../../components/Dialog/ButtonClose';
import KhoHangService, { PhieuKhoViewDto } from '../../../services/kho_hang/KhoHangService';

type Props = {
    idPhieu: string | null; // khác null: mở dialog xem phiếu nhập này
    onClose: () => void;
};

const formatMoney = (value: number) => new Intl.NumberFormat('vi-VN').format(value ?? 0);
const TRANG_THAI: Record<number, string> = { 0: 'Đã hủy', 1: 'Tạm lưu', 3: 'Hoàn thành' };

/**
 * Xem phiếu nhập kho đã lập (chỉ xem, không sửa)
 */
const ModalXemPhieuNhap = ({ idPhieu, onClose }: Props) => {
    const [phieu, setPhieu] = useState<PhieuKhoViewDto | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!idPhieu) {
            setPhieu(null);
            return;
        }
        setLoading(true);
        KhoHangService.GetPhieuKho(idPhieu)
            .then((data) => setPhieu(data ?? null))
            .finally(() => setLoading(false));
    }, [idPhieu]);

    const coDienThoai = (phieu?.chiTiet ?? []).some((x) => x.dienThoai);

    const columns: GridColDef[] = [
        { field: 'stt', headerName: 'STT', width: 60, sortable: false },
        {
            field: 'maHangHoa',
            headerName: 'Mã hàng',
            width: 120,
            sortable: false,
            valueGetter: (p) => (p.row.dienThoai ? p.row.maHangHoa || 'Máy mới' : p.row.maHangHoa)
        },
        {
            field: 'tenHangHoa',
            headerName: 'Tên hàng',
            flex: 1,
            minWidth: 200,
            sortable: false,
            renderCell: (p) => (
                <Typography noWrap sx={{ fontSize: 14, fontWeight: 600 }} title={p.value}>
                    {p.value}
                </Typography>
            )
        },
        ...((coDienThoai
            ? [
                  {
                      field: 'imel',
                      headerName: 'IMEI',
                      width: 150,
                      sortable: false,
                      valueGetter: (p: any) => p.row.dienThoai?.imel ?? ''
                  },
                  {
                      field: 'mau',
                      headerName: 'Màu',
                      width: 100,
                      sortable: false,
                      valueGetter: (p: any) => p.row.dienThoai?.mau ?? ''
                  },
                  {
                      field: 'dungLuong',
                      headerName: 'GB',
                      width: 70,
                      sortable: false,
                      align: 'center',
                      headerAlign: 'center',
                      valueGetter: (p: any) => (p.row.dienThoai?.dungLuong ? `${p.row.dienThoai.dungLuong}GB` : '')
                  },
                  {
                      field: 'pin',
                      headerName: 'Pin',
                      width: 70,
                      sortable: false,
                      align: 'center',
                      headerAlign: 'center',
                      valueGetter: (p: any) => (p.row.dienThoai?.pin != null ? `${p.row.dienThoai.pin}%` : '')
                  }
              ]
            : []) as GridColDef[]),
        {
            field: 'soLuong',
            headerName: 'Số lượng',
            width: 90,
            sortable: false,
            align: 'center',
            headerAlign: 'center'
        },
        {
            field: 'donGiaTruocCK',
            headerName: 'Đơn giá',
            width: 120,
            sortable: false,
            align: 'right',
            headerAlign: 'right',
            valueFormatter: (p) => formatMoney(p.value)
        },
        {
            field: 'giamGia',
            headerName: 'Giảm giá',
            width: 110,
            sortable: false,
            align: 'right',
            headerAlign: 'right',
            valueGetter: (p) => (p.row.tienChietKhau ?? 0) * (p.row.soLuong ?? 0),
            valueFormatter: (p) => formatMoney(p.value)
        },
        {
            field: 'thanhTienSauCK',
            headerName: 'Thành tiền',
            width: 130,
            sortable: false,
            align: 'right',
            headerAlign: 'right',
            renderCell: (p) => <Typography sx={{ fontWeight: 800 }}>{formatMoney(p.value)}</Typography>
        }
    ];

    const thongTin = (label: string, value: React.ReactNode, color?: string) => (
        <Stack direction="row" justifyContent="space-between" spacing={2} sx={{ py: 0.5 }}>
            <Typography sx={{ fontSize: 14, color: '#6b7280' }}>{label}</Typography>
            <Typography sx={{ fontSize: 14, fontWeight: 700, textAlign: 'right', color }}>{value}</Typography>
        </Stack>
    );

    return (
        <Dialog open={!!idPhieu} onClose={onClose} fullWidth maxWidth="lg">
            <DialogButtonClose onClose={onClose} />
            <DialogTitle className="modal-title">Phiếu nhập kho {phieu?.maHoaDon ?? ''}</DialogTitle>
            <DialogContent>
                <Grid container spacing={3} sx={{ mb: 2 }}>
                    <Grid item xs={12} md={6}>
                        {thongTin(
                            'Ngày lập',
                            phieu?.ngayLapHoaDon ? format(new Date(phieu.ngayLapHoaDon), 'dd/MM/yyyy HH:mm') : ''
                        )}
                        {thongTin('Trạng thái', phieu ? TRANG_THAI[phieu.trangThai] ?? '' : '')}
                        {thongTin(
                            'Nhà cung cấp',
                            phieu?.tenKhachHang ? `${phieu.tenKhachHang} (${phieu.maKhachHang ?? ''})` : '-'
                        )}
                        {thongTin('Chi nhánh', phieu?.tenChiNhanh || '-')}
                    </Grid>
                    <Grid item xs={12} md={6}>
                        {thongTin('Tổng tiền hàng', formatMoney(phieu?.tongTienHang ?? 0))}
                        {thongTin('Đã thanh toán', formatMoney(phieu?.daThanhToan ?? 0), '#16a34a')}
                        {thongTin(
                            'Còn nợ',
                            formatMoney(phieu?.conNo ?? 0),
                            (phieu?.conNo ?? 0) > 0 ? '#dc2626' : undefined
                        )}
                        {thongTin('Ghi chú', phieu?.ghiChuHD || '-')}
                    </Grid>
                </Grid>
                <Box>
                    <DataGrid
                        autoHeight
                        rows={phieu?.chiTiet ?? []}
                        getRowId={(r) => `${r.stt}_${r.idDonViQuyDoi}`}
                        columns={columns}
                        loading={loading}
                        hideFooter
                        disableRowSelectionOnClick
                        localeText={{ noRowsLabel: 'Phiếu nhập không có hàng hóa' }}
                        sx={{
                            '& .MuiDataGrid-columnHeaders': { background: '#f8fafc' },
                            '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 800, fontSize: 13 },
                            '& .MuiDataGrid-cell': { outline: 'none !important' }
                        }}
                    />
                </Box>
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
    );
};

export default ModalXemPhieuNhap;
