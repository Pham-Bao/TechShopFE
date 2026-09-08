import { Dialog, DialogContent, Typography, Box, IconButton } from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';

import { DataGrid, GridColDef } from '@mui/x-data-grid';

import { useEffect, useState } from 'react';
import ProductService from '../../services/product/ProductService';
type Props = {
    open: boolean;
    onClose: () => void;
    data?: any;
};

export default function ModalTheKho({ open, onClose, data }: Props) {
    const [loading, setLoading] = useState(false);

    const [rows, setRows] = useState<any[]>([]);
    const loadData = async () => {
        const list = await ProductService.Get_DMHangHoaTheKho(data.idHangHoa);
    };

    useEffect(() => {
        if (open) {
            loadData();
        }
    }, [open, data?.idHangHoa]);

    const columns: GridColDef[] = [
        {
            field: 'maPhieu',
            headerName: 'Mã phiếu',
            flex: 1,
            minWidth: 120
        },
        {
            field: 'thoiGian',
            headerName: 'Thời gian',
            flex: 1.5,
            minWidth: 180,
            valueFormatter: (params) => {
                if (!params.value) return '';

                return new Date(params.value).toLocaleString('vi-VN');
            }
        },
        {
            field: 'loaiChungTu',
            headerName: 'Loại chứng từ',
            flex: 1.5,
            minWidth: 180
        },
        {
            field: 'giaVon',
            headerName: 'Giá vốn',
            flex: 1,
            minWidth: 120,
            align: 'right',
            headerAlign: 'right',
            valueFormatter: (params) => Number(params.value || 0).toLocaleString('vi-VN')
        },
        {
            field: 'nhap',
            headerName: 'Nhập',
            flex: 0.7,
            minWidth: 90,
            align: 'center',
            headerAlign: 'center'
        },
        {
            field: 'xuat',
            headerName: 'Xuất',
            flex: 0.7,
            minWidth: 90,
            align: 'center',
            headerAlign: 'center'
        },
        {
            field: 'ton',
            headerName: 'Tồn',
            flex: 0.7,
            minWidth: 90,
            align: 'center',
            headerAlign: 'center',

            renderCell: (params) => (
                <Typography fontWeight={700} color={Number(params.value) < 0 ? 'error.main' : 'primary.main'}>
                    {params.value}
                </Typography>
            )
        }
    ];

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            {/* HEADER */}
            <Box display="flex" justifyContent="space-between" alignItems="start" px={3} pt={2}>
                <Box>
                    <Typography fontSize={30} fontWeight={700}>
                        Thẻ kho
                    </Typography>

                    <Typography mt={1}>
                        <strong>{data?.tenHangHoa}</strong>

                        {data?.maHangHoa && <span style={{ color: '#666' }}> ({data.maHangHoa})</span>}
                    </Typography>
                </Box>

                <IconButton onClick={onClose}>
                    <CloseIcon />
                </IconButton>
            </Box>

            {/* BODY */}
            <DialogContent>
                <Box height={560}>
                    <DataGrid
                        rows={rows}
                        columns={columns}
                        loading={loading}
                        disableRowSelectionOnClick
                        pageSizeOptions={[10, 20, 50]}
                        initialState={{
                            pagination: {
                                paginationModel: {
                                    pageSize: 10
                                }
                            }
                        }}
                        sx={{
                            border: '1px solid #e0e0e0',

                            '& .MuiDataGrid-columnHeaders': {
                                backgroundColor: '#f5f5f5',
                                fontWeight: 700
                            },

                            '& .MuiDataGrid-cell': {
                                borderBottom: '1px solid rgba(224,224,224,0.7)'
                            }
                        }}
                    />
                </Box>
            </DialogContent>
        </Dialog>
    );
}
