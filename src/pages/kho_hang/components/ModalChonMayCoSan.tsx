import React, { useEffect, useState } from 'react';
import {
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    InputAdornment,
    TextField,
    Typography
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import DialogButtonClose from '../../../components/Dialog/ButtonClose';
import KhoHangService, { DienThoaiChuaCoPhieuNhapDto } from '../../../services/kho_hang/KhoHangService';

type Props = {
    open: boolean;
    onClose: () => void;
    onChon: (may: DienThoaiChuaCoPhieuNhapDto) => void;
    idPhieuNhap?: string | null; // phiếu đang sửa
    idDaChon: string[]; // đơn vị quy đổi đã có trên phiếu
};

const formatMoney = (value: number) => new Intl.NumberFormat('vi-VN').format(value ?? 0);

/**
 * Chọn điện thoại có sẵn chưa thuộc phiếu nhập nào (kể cả máy đã bán trước khi kịp nhập phiếu) để gắn vào phiếu nhập
 */
const ModalChonMayCoSan = ({ open, onClose, onChon, idPhieuNhap, idDaChon }: Props) => {
    const [txtSearch, setTxtSearch] = useState('');
    const [data, setData] = useState<DienThoaiChuaCoPhieuNhapDto[]>([]);
    const [loading, setLoading] = useState(false);

    const timKiem = async (txt: string) => {
        setLoading(true);
        try {
            setData(await KhoHangService.GetDienThoaiChuaCoPhieuNhap(txt, idPhieuNhap));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            setTxtSearch('');
            timKiem('');
        }
    }, [open]);

    const rows = data.filter((x) => !idDaChon.includes(x.idDonViQuyDoi));

    const columns: GridColDef[] = [
        { field: 'maHangHoa', headerName: 'Mã', width: 90, sortable: false },
        {
            field: 'tenHangHoa',
            headerName: 'Tên máy',
            flex: 1,
            minWidth: 180,
            sortable: false,
            renderCell: (p) => (
                <Typography noWrap sx={{ fontSize: 14, fontWeight: 700 }} title={p.value}>
                    {p.value}
                </Typography>
            )
        },
        { field: 'mau', headerName: 'Màu', width: 110, sortable: false },
        {
            field: 'dungLuong',
            headerName: 'GB',
            width: 70,
            sortable: false,
            valueGetter: (p) => (p.row.dungLuong ? `${p.row.dungLuong}GB` : '')
        },
        { field: 'imel', headerName: 'IMEI', width: 150, sortable: false },
        {
            field: 'giaVon',
            headerName: 'Giá vốn',
            width: 110,
            sortable: false,
            align: 'right',
            headerAlign: 'right',
            valueFormatter: (p) => formatMoney(p.value)
        },
        {
            field: 'daGiaoDich',
            headerName: 'Trạng thái',
            width: 110,
            sortable: false,
            renderCell: (p) =>
                p.value ? (
                    <Chip size="small" color="warning" variant="outlined" label="Đã bán" />
                ) : (
                    <Chip size="small" color="success" variant="outlined" label="Chưa bán" />
                )
        },
        {
            field: 'action',
            headerName: '',
            width: 80,
            sortable: false,
            renderCell: (p) => (
                <Button
                    size="small"
                    variant="contained"
                    sx={{ boxShadow: 'none', textTransform: 'none' }}
                    onClick={() => onChon(p.row)}>
                    Thêm
                </Button>
            )
        }
    ];

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
            <DialogButtonClose onClose={onClose} />
            <DialogTitle className="modal-title">Thêm máy có sẵn vào phiếu nhập</DialogTitle>
            <DialogContent>
                <Typography sx={{ fontSize: 13, color: '#6b7280', mb: 1.5 }}>
                    Các máy đã có trong danh mục nhưng chưa thuộc phiếu nhập nào (kể cả máy đã bán trước khi kịp nhập
                    phiếu).
                </Typography>
                <TextField
                    size="small"
                    fullWidth
                    placeholder="Tìm theo tên máy, mã hoặc IMEI rồi nhấn Enter"
                    value={txtSearch}
                    onChange={(e) => setTxtSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && timKiem(txtSearch)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        )
                    }}
                    sx={{ mb: 1.5 }}
                />
                <DataGrid
                    autoHeight
                    rows={rows}
                    getRowId={(r) => r.idDonViQuyDoi}
                    columns={columns}
                    loading={loading}
                    hideFooter
                    disableRowSelectionOnClick
                    rowHeight={48}
                    localeText={{ noRowsLabel: 'Không có máy nào chưa thuộc phiếu nhập' }}
                    sx={{ '& .MuiDataGrid-cell': { outline: 'none !important' } }}
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
    );
};

export default ModalChonMayCoSan;
