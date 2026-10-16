import { Box, Dialog, DialogContent, IconButton, Stack, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import HoaDonService from '../../../services/ban_hang/HoaDonService';
import { LoaiChungTu } from '../../../lib/appconst';

type Props = {
    open: boolean;
    onClose: () => void;
    phieu?: any; // 1 dòng của danh sách phiếu (spGetListHoaDon)
};

const formatNumber = (value: number) => new Intl.NumberFormat('vi-VN').format(value || 0);

export default function ModalChiTietPhieuKho({ open, onClose, phieu }: Props) {
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const laKiemKe = phieu?.idLoaiChungTu === LoaiChungTu.PHIEU_KIEM_KE;

    useEffect(() => {
        if (!open || !phieu?.id) return;
        (async () => {
            setLoading(true);
            try {
                const data = await HoaDonService.GetChiTietHoaDon_byIdHoaDon(phieu.id);
                setRows(data ?? []);
            } finally {
                setLoading(false);
            }
        })();
    }, [open, phieu?.id]);

    const columns: GridColDef[] = [
        { field: 'maHangHoa', headerName: 'Mã hàng', width: 130, sortable: false },
        { field: 'tenHangHoa', headerName: 'Tên hàng', flex: 1, minWidth: 220, sortable: false },
        ...((laKiemKe
            ? [
                  {
                      field: 'tonLuyKe',
                      headerName: 'SL phần mềm',
                      width: 130,
                      align: 'center',
                      headerAlign: 'center',
                      sortable: false
                  },
                  {
                      field: 'soLuong',
                      headerName: 'SL thực tế',
                      width: 120,
                      align: 'center',
                      headerAlign: 'center',
                      sortable: false
                  },
                  {
                      field: 'soLuongLech',
                      headerName: 'SL lệch',
                      width: 110,
                      align: 'center',
                      headerAlign: 'center',
                      sortable: false,
                      valueGetter: (params: any) => (params.row.soLuong ?? 0) - (params.row.tonLuyKe ?? 0),
                      renderCell: (params: any) => (
                          <Typography
                              fontWeight={700}
                              color={params.value > 0 ? '#16a34a' : params.value < 0 ? '#dc2626' : 'inherit'}>
                              {params.value > 0 ? `+${params.value}` : params.value}
                          </Typography>
                      )
                  }
              ]
            : [
                  {
                      field: 'soLuong',
                      headerName: 'Số lượng',
                      width: 110,
                      align: 'center',
                      headerAlign: 'center',
                      sortable: false
                  },
                  {
                      field: 'donGiaSauCK',
                      headerName: 'Đơn giá',
                      width: 130,
                      align: 'right',
                      headerAlign: 'right',
                      sortable: false,
                      valueFormatter: (params: any) => formatNumber(params.value)
                  },
                  {
                      field: 'giaVon',
                      headerName: 'Giá vốn',
                      width: 130,
                      align: 'right',
                      headerAlign: 'right',
                      sortable: false,
                      valueFormatter: (params: any) => formatNumber(params.value)
                  }
              ]) as GridColDef[])
    ];

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <Box display="flex" justifyContent="space-between" alignItems="start" px={3} pt={2}>
                <Box>
                    <Typography fontSize={22} fontWeight={700}>
                        {phieu?.maHoaDon}
                    </Typography>
                    <Stack direction="row" spacing={2} mt={0.5} color="#6b7280" fontSize={13}>
                        <span>
                            {phieu?.ngayLapHoaDon ? format(new Date(phieu.ngayLapHoaDon), 'dd/MM/yyyy HH:mm') : ''}
                        </span>
                        <span>{phieu?.txtTrangThaiHD}</span>
                        {phieu?.tenChiNhanh && <span>{phieu.tenChiNhanh}</span>}
                    </Stack>
                    {phieu?.ghiChuHD && (
                        <Typography mt={1} fontSize={13}>
                            {phieu.ghiChuHD}
                        </Typography>
                    )}
                </Box>
                <IconButton onClick={onClose}>
                    <CloseIcon />
                </IconButton>
            </Box>
            <DialogContent>
                <DataGrid
                    autoHeight
                    rows={rows}
                    columns={columns}
                    loading={loading}
                    hideFooter
                    disableRowSelectionOnClick
                    getRowId={(row) => row.id}
                    sx={{ '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f5f5f5' } }}
                />
            </DialogContent>
        </Dialog>
    );
}
