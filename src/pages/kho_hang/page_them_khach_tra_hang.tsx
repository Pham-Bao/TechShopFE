import React, { useState } from 'react';
import { Alert, Autocomplete, Box, Button, Grid, IconButton, Paper, Stack, TextField, Typography } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import Cookies from 'js-cookie';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { enqueueSnackbar } from 'notistack';
import HoaDonService from '../../services/ban_hang/HoaDonService';
import PageHoaDonDto from '../../services/ban_hang/PageHoaDonDto';
import KhoHangService from '../../services/kho_hang/KhoHangService';
import { LoaiChungTu, LoaiHangHoa } from '../../lib/appconst';
import AppConsts from '../../lib/appconst';

interface IDongTra {
    id: string; // idDonViQuyDoi
    maHangHoa: string;
    tenHangHoa: string;
    idLoaiHangHoa: number;
    soLuongMua: number;
    soLuongDaTra: number;
    soLuongTra: number;
    donGia: number;
}

const formatMoney = (value: number) => Number(value || 0).toLocaleString('vi-VN');

// Khách trả hàng theo hóa đơn bán: hàng hóa nhập lại kho, điện thoại về trạng thái "Chưa bán".
// Chỉ xử lý kho, chưa hoàn tiền cho khách.
const PageThemKhachTraHang: React.FC = () => {
    const navigate = useNavigate();
    const idChiNhanh = Cookies.get('IdChiNhanh') ?? '';
    const [listHoaDon, setListHoaDon] = useState<PageHoaDonDto[]>([]);
    const [hoaDon, setHoaDon] = useState<PageHoaDonDto | null>(null);
    const [rows, setRows] = useState<IDongTra[]>([]);
    const [ngayLap, setNgayLap] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    const [ghiChu, setGhiChu] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const searchHoaDon = async (txt: string) => {
        const data = await HoaDonService.GetListHoaDon({
            idChiNhanhs: idChiNhanh ? [idChiNhanh] : [],
            idLoaiChungTus: [LoaiChungTu.HOA_DON_BAN_LE],
            textSearch: txt,
            currentPage: 1,
            pageSize: AppConsts.pageOption[0].value,
            columnSort: 'NgayLapHoaDon',
            typeSort: 'DESC',
            trangThais: [3]
        });
        setListHoaDon(data?.items ?? []);
    };

    const choseHoaDon = async (hd: PageHoaDonDto | null) => {
        setHoaDon(hd);
        if (!hd) {
            setRows([]);
            return;
        }
        const data = await KhoHangService.GetChiTietCoTheTra(hd.id);
        setRows(
            data.map((x) => ({
                id: x.idDonViQuyDoi,
                maHangHoa: x.maHangHoa,
                tenHangHoa: x.tenHangHoa,
                idLoaiHangHoa: x.idLoaiHangHoa,
                soLuongMua: x.soLuongMua,
                soLuongDaTra: x.soLuongDaTra,
                soLuongTra: 0,
                donGia: x.donGia
            }))
        );
    };

    const changeSoLuongTra = (id: string, value: number) => {
        setRows((prev) =>
            prev.map((x) => {
                if (x.id !== id) return x;
                const toiDa = Math.max(x.soLuongMua - x.soLuongDaTra, 0);
                return { ...x, soLuongTra: Math.min(Math.max(value, 0), toiDa) };
            })
        );
    };

    const save = async () => {
        if (isSaving || !hoaDon) return;
        const lstTra = rows.filter((x) => x.soLuongTra > 0);
        if (lstTra.length === 0) {
            enqueueSnackbar('Chưa nhập số lượng trả', { variant: 'warning' });
            return;
        }
        setIsSaving(true);
        try {
            const data = await KhoHangService.SavePhieuKho({
                idLoaiChungTu: LoaiChungTu.KHACH_TRA_HANG,
                idChiNhanh: idChiNhanh || null,
                idKhachHang: hoaDon.idKhachHang ?? null,
                idHoaDon: hoaDon.id,
                ngayLapHoaDon: ngayLap ? new Date(ngayLap).toISOString() : new Date().toISOString(),
                ghiChuHD: ghiChu || `Khách trả hàng theo hóa đơn ${hoaDon.maHoaDon}`,
                trangThai: 3,
                chiTiet: lstTra.map((x) => ({
                    idDonViQuyDoi: x.id,
                    soLuong: x.soLuongTra,
                    donGiaTruocCK: x.donGia,
                    donGiaSauCK: x.donGia,
                    thanhTienTruocCK: x.soLuongTra * x.donGia,
                    thanhTienSauCK: x.soLuongTra * x.donGia
                }))
            });
            if (data) {
                enqueueSnackbar(`Lưu phiếu trả hàng ${data.maHoaDon ?? ''} thành công`, { variant: 'success' });
                navigate('/khach-tra-hangs');
            }
        } finally {
            setIsSaving(false);
        }
    };

    const columns: GridColDef[] = [
        { field: 'maHangHoa', headerName: 'Mã hàng', width: 130, sortable: false },
        {
            field: 'tenHangHoa',
            headerName: 'Tên hàng',
            flex: 1,
            minWidth: 240,
            sortable: false,
            renderCell: (params) => (
                <span>
                    {params.value}
                    {params.row.idLoaiHangHoa === LoaiHangHoa.DIEN_THOAI && (
                        <span style={{ color: '#6b7280' }}> (điện thoại)</span>
                    )}
                </span>
            )
        },
        {
            field: 'soLuongMua',
            headerName: 'SL mua',
            width: 90,
            align: 'center',
            headerAlign: 'center',
            sortable: false
        },
        {
            field: 'soLuongDaTra',
            headerName: 'Đã trả',
            width: 90,
            align: 'center',
            headerAlign: 'center',
            sortable: false
        },
        {
            field: 'soLuongTra',
            headerName: 'SL trả',
            width: 130,
            align: 'center',
            headerAlign: 'center',
            sortable: false,
            renderCell: (params) => (
                <TextField
                    type="number"
                    size="small"
                    value={params.row.soLuongTra}
                    disabled={params.row.soLuongMua - params.row.soLuongDaTra <= 0}
                    onChange={(e) => changeSoLuongTra(params.row.id, Number(e.target.value || 0))}
                    sx={{ width: 100, '& input': { textAlign: 'center', fontWeight: 700 } }}
                />
            )
        },
        {
            field: 'donGia',
            headerName: 'Giá bán',
            width: 130,
            align: 'right',
            headerAlign: 'right',
            sortable: false,
            valueFormatter: (params) => formatMoney(params.value)
        }
    ];

    return (
        <Box sx={{ background: '#f5f6fa', minHeight: '100vh', p: 2 }}>
            <Paper elevation={0} sx={{ p: 1, borderRadius: 2, mb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <IconButton onClick={() => navigate('/khach-tra-hangs')}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography sx={{ fontWeight: 800, fontSize: 18 }}>Khách trả hàng</Typography>
                </Stack>
            </Paper>
            <Grid container spacing={2}>
                <Grid item xs={12} md={9}>
                    <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                        <Box sx={{ p: 1, borderBottom: '1px solid #edf0f5' }}>
                            <Autocomplete
                                options={listHoaDon}
                                value={hoaDon}
                                filterOptions={(x) => x}
                                isOptionEqualToValue={(a, b) => a.id === b.id}
                                getOptionLabel={(x) => `${x.maHoaDon ?? ''} - ${x.tenKhachHang ?? ''}`}
                                onOpen={() => searchHoaDon('')}
                                onInputChange={(_, value, reason) => reason === 'input' && searchHoaDon(value)}
                                onChange={(_, value) => choseHoaDon(value)}
                                renderOption={(props, x) => (
                                    <li {...props} key={x.id}>
                                        <Stack direction="row" justifyContent="space-between" width="100%">
                                            <span>
                                                <b>{x.maHoaDon}</b> - {x.tenKhachHang}{' '}
                                                {x.soDienThoai ? `(${x.soDienThoai})` : ''}
                                            </span>
                                            <span style={{ color: '#6b7280' }}>
                                                {x.ngayLapHoaDon
                                                    ? format(new Date(x.ngayLapHoaDon), 'dd/MM/yyyy HH:mm')
                                                    : ''}
                                            </span>
                                        </Stack>
                                    </li>
                                )}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        size="small"
                                        placeholder="Tìm hóa đơn bán theo mã, tên / SĐT khách"
                                    />
                                )}
                            />
                        </Box>
                        <DataGrid
                            autoHeight
                            rows={rows}
                            columns={columns}
                            hideFooter
                            disableRowSelectionOnClick
                            rowHeight={56}
                            localeText={{
                                noRowsLabel: hoaDon ? 'Hóa đơn không có hàng hóa để trả' : 'Chọn hóa đơn cần trả hàng'
                            }}
                            sx={{ border: 0, '& .MuiDataGrid-columnHeaders': { background: '#f8fafc' } }}
                        />
                    </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Paper elevation={0} sx={{ borderRadius: 2, p: 2, position: 'sticky', top: 16 }}>
                        <Typography sx={{ fontWeight: 800, mb: 2 }}>Thông tin phiếu</Typography>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                            <Typography>Khách hàng</Typography>
                            <Typography fontWeight={700}>{hoaDon?.tenKhachHang ?? ''}</Typography>
                        </Stack>
                        <TextField
                            fullWidth
                            type="datetime-local"
                            size="small"
                            label="Ngày trả"
                            InputLabelProps={{ shrink: true }}
                            value={ngayLap}
                            onChange={(e) => setNgayLap(e.target.value)}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Ghi chú"
                            value={ghiChu}
                            onChange={(e) => setGhiChu(e.target.value)}
                            sx={{ mb: 2 }}
                        />
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                            <Typography>Giá trị hàng trả</Typography>
                            <Typography fontWeight={800}>
                                {formatMoney(rows.reduce((s, x) => s + x.soLuongTra * x.donGia, 0))}
                            </Typography>
                        </Stack>
                        <Alert severity="info" sx={{ mb: 2, fontSize: 12 }}>
                            Phiếu này chỉ nhập lại hàng vào kho. Nếu hoàn tiền cho khách, hãy lập phiếu chi ở Sổ quỹ.
                        </Alert>
                        <Button
                            fullWidth
                            variant="contained"
                            startIcon={<SaveIcon />}
                            onClick={save}
                            disabled={isSaving || !hoaDon}
                            sx={{
                                backgroundColor: 'var(--color-main)',
                                textTransform: 'none',
                                fontWeight: 800,
                                boxShadow: 'none',
                                py: 1.2
                            }}>
                            {isSaving ? 'Đang lưu...' : 'Hoàn thành'}
                        </Button>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default PageThemKhachTraHang;
