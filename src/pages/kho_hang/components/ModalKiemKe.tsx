import React, { useMemo, useState } from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    InputAdornment,
    Stack,
    TextField,
    Typography
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DialogButtonClose from '../../../components/Dialog/ButtonClose';

// 1 hàng hóa cần kiểm (theo đơn vị quy đổi của phiếu nhập)
export interface IDongKiemKe {
    id: string; // idDonViQuyDoi
    idHangHoa: string;
    maHang: string;
    tenHang: string;
    soLuongNhap: number | null; // SL trên phiếu nhập (null: phiếu kiểm kê cũ không gắn phiếu nhập)
    soLuongTon: number; // tồn phần mềm hiện tại
    soLuongThucTe: number; // cửa hàng đếm được
    ghiChu?: string;
}

type PropsModalKiemKe = {
    open: boolean;
    tieuDe: string;
    lstDong: IDongKiemKe[];
    setLstDong: React.Dispatch<React.SetStateAction<IDongKiemKe[]>>;
    isSaving: boolean;
    onClose: () => void;
    onTamLuu: () => void;
    onXacNhan: () => void;
};

/**
 * Dialog kiểm kê (gần toàn màn hình): nhập số lượng thực tế đếm được cho từng hàng của phiếu nhập
 */
const ModalKiemKe = ({
    open,
    tieuDe,
    lstDong,
    setLstDong,
    isSaving,
    onClose,
    onTamLuu,
    onXacNhan
}: PropsModalKiemKe) => {
    const [txtSearch, setTxtSearch] = useState('');

    const updateDong = (id: string, change: Partial<IDongKiemKe>) =>
        setLstDong((prev) => prev.map((x) => (x.id === id ? { ...x, ...change } : x)));

    const rows = useMemo(() => {
        const txt = txtSearch.trim().toLowerCase();
        return txt
            ? lstDong.filter((x) => x.maHang?.toLowerCase().includes(txt) || x.tenHang?.toLowerCase().includes(txt))
            : lstDong;
    }, [lstDong, txtSearch]);

    const tongThucTe = lstDong.reduce((s, x) => s + x.soLuongThucTe, 0);
    const soLech = lstDong.filter((x) => x.soLuongThucTe !== x.soLuongTon).length;
    const soThieu = lstDong.filter((x) => x.soLuongThucTe < x.soLuongTon).length;
    const soThua = lstDong.filter((x) => x.soLuongThucTe > x.soLuongTon).length;

    const columns: GridColDef[] = [
        { field: 'stt', headerName: 'STT', width: 60, sortable: false, valueGetter: (p) => lstDong.indexOf(p.row) + 1 },
        {
            field: 'maHang',
            headerName: 'Mã hàng',
            width: 140,
            sortable: false,
            renderCell: (p) => (
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'var(--color-main)' }}>
                    {p.row.maHang}
                </Typography>
            )
        },
        {
            field: 'tenHang',
            headerName: 'Tên hàng',
            flex: 1,
            minWidth: 240,
            sortable: false,
            renderCell: (p) => (
                <Typography noWrap sx={{ fontSize: 14, fontWeight: 700 }} title={p.row.tenHang}>
                    {p.row.tenHang}
                </Typography>
            )
        },
        {
            field: 'soLuongNhap',
            headerName: 'SL nhập',
            width: 100,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            valueGetter: (p) => p.row.soLuongNhap ?? '-'
        },
        {
            field: 'soLuongTon',
            headerName: 'Tồn phần mềm',
            width: 130,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (p) => <Typography sx={{ fontWeight: 700 }}>{p.row.soLuongTon}</Typography>
        },
        {
            field: 'soLuongThucTe',
            headerName: 'SL thực tế',
            width: 170,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (p) => (
                <Stack
                    direction="row"
                    alignItems="center"
                    sx={{ border: '1px solid #dbe2ea', borderRadius: 1.5, overflow: 'hidden', height: 38 }}>
                    <IconButton
                        size="small"
                        onClick={() => updateDong(p.row.id, { soLuongThucTe: Math.max(p.row.soLuongThucTe - 1, 0) })}>
                        <RemoveIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <TextField
                        variant="standard"
                        value={p.row.soLuongThucTe}
                        onChange={(e) => {
                            const so = Number(e.target.value.replace(/[^\d.]/g, ''));
                            updateDong(p.row.id, { soLuongThucTe: Number.isNaN(so) ? 0 : so });
                        }}
                        onKeyDown={(e) => e.stopPropagation()}
                        InputProps={{ disableUnderline: true }}
                        sx={{ width: 64, '& input': { textAlign: 'center', fontWeight: 800, fontSize: 15 } }}
                    />
                    <IconButton
                        size="small"
                        onClick={() => updateDong(p.row.id, { soLuongThucTe: p.row.soLuongThucTe + 1 })}>
                        <AddIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                </Stack>
            )
        },
        {
            field: 'soLuongLech',
            headerName: 'SL lệch',
            width: 100,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (p) => {
                const lech = p.row.soLuongThucTe - p.row.soLuongTon;
                return (
                    <Typography
                        sx={{ fontWeight: 800, color: lech > 0 ? '#16a34a' : lech < 0 ? '#dc2626' : '#111827' }}>
                        {lech > 0 ? `+${lech}` : lech}
                    </Typography>
                );
            }
        },
        {
            field: 'ghiChu',
            headerName: 'Ghi chú',
            width: 220,
            sortable: false,
            renderCell: (p) => (
                <TextField
                    size="small"
                    fullWidth
                    placeholder="Ghi chú"
                    value={p.row.ghiChu ?? ''}
                    onChange={(e) => updateDong(p.row.id, { ghiChu: e.target.value })}
                    onKeyDown={(e) => e.stopPropagation()}
                    sx={{ '& .MuiInputBase-root': { height: 36, fontSize: 13 } }}
                />
            )
        }
    ];

    const thongKe = (label: string, value: number, color?: string) => (
        <Stack alignItems="center" sx={{ px: 2 }}>
            <Typography sx={{ fontSize: 12, color: '#6b7280' }}>{label}</Typography>
            <Typography sx={{ fontSize: 18, fontWeight: 800, color: color ?? '#111827' }}>{value}</Typography>
        </Stack>
    );

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xl" PaperProps={{ sx: { height: '92vh' } }}>
            <DialogButtonClose onClose={onClose} />
            <DialogTitle className="modal-title">{tieuDe}</DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={1}
                    justifyContent="space-between"
                    alignItems="center">
                    <TextField
                        size="small"
                        placeholder="Tìm theo mã hoặc tên hàng"
                        value={txtSearch}
                        onChange={(e) => setTxtSearch(e.target.value)}
                        sx={{ width: { xs: '100%', md: 360 } }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            )
                        }}
                    />
                    <Stack direction="row" divider={<Box sx={{ borderLeft: '1px solid #e5e7eb' }} />}>
                        {thongKe('Mặt hàng', lstDong.length)}
                        {thongKe('Tổng SL thực tế', tongThucTe, 'var(--color-main)')}
                        {thongKe('Lệch', soLech)}
                        {thongKe('Thiếu', soThieu, '#dc2626')}
                        {thongKe('Thừa', soThua, '#16a34a')}
                    </Stack>
                </Stack>
                <Box sx={{ flex: 1, minHeight: 0 }}>
                    <DataGrid
                        rows={rows}
                        columns={columns}
                        hideFooter
                        disableRowSelectionOnClick
                        rowHeight={56}
                        localeText={{ noRowsLabel: 'Phiếu nhập không có hàng hóa cần kiểm kê' }}
                        sx={{
                            '& .MuiDataGrid-columnHeaders': { background: '#f8fafc' },
                            '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 800, fontSize: 13, color: '#4b5563' },
                            '& .MuiDataGrid-cell': { outline: 'none !important' }
                        }}
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button
                    variant="outlined"
                    sx={{ color: 'var(--color-main)' }}
                    onClick={onClose}
                    className="btn-outline-hover">
                    Đóng
                </Button>
                <Button
                    variant="contained"
                    disabled={isSaving}
                    onClick={onTamLuu}
                    sx={{ backgroundColor: '#9e9e9e', boxShadow: 'none', '&:hover': { backgroundColor: '#757575' } }}>
                    Tạm lưu
                </Button>
                <Button
                    variant="contained"
                    disabled={isSaving}
                    onClick={onXacNhan}
                    sx={{ bgcolor: 'var(--color-main)', boxShadow: 'none', fontWeight: 800 }}>
                    {isSaving ? 'Đang lưu...' : 'Xác nhận'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ModalKiemKe;
