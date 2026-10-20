import React, { useState } from 'react';
import { Box, Button, Grid, IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import ThongTinPhieuNhap from './components/ThongTinPhieuNhap';
import ModalNhapDienThoai, { IDienThoaiNhap } from './components/ModalNhapDienThoai';
import { IDongPhieuNhap, usePhieuNhap } from './components/usePhieuNhap';

const formatMoney = (value: number) => Number(value || 0).toLocaleString('vi-VN');

// 1 máy điện thoại -> 1 dòng phiếu nhập (số lượng 1, đơn giá = giá nhập)
const dienThoaiToDong = (dt: IDienThoaiNhap, id?: string): IDongPhieuNhap => ({
    id: id ?? `dt_${Date.now()}_${dt.imel}`,
    maHang: 'Máy mới',
    tenHang: dt.tenHangHoa,
    soLuong: 1,
    donGia: dt.giaNhap,
    giamGia: 0,
    ghiChu: dt.ghiChu ?? '',
    dienThoai: dt
});

/**
 * Lập phiếu nhập điện thoại: danh sách máy bên trái, thông tin phiếu bên phải.
 * Máy chỉ được tạo trong danh mục khi hoàn thành phiếu.
 */
const Page_Them_Phieu_Nhap_Dien_Thoai = () => {
    const navigate = useNavigate();
    const p = usePhieuNhap('dien-thoai');
    const { lstDong, setLstDong } = p;
    const ngayNhap = format(new Date(), 'dd/MM/yyyy');

    const [isShowModal, setIsShowModal] = useState(false);
    // dòng đang sửa (null: thêm mới)
    const [dongSua, setDongSua] = useState<IDongPhieuNhap | null>(null);

    const moThem = () => {
        setDongSua(null);
        setIsShowModal(true);
    };
    const moSua = (dong: IDongPhieuNhap) => {
        setDongSua(dong);
        setIsShowModal(true);
    };
    const luuMay = (dt: IDienThoaiNhap) => {
        if (dongSua) {
            setLstDong((prev) => prev.map((x) => (x.id === dongSua.id ? dienThoaiToDong(dt, dongSua.id) : x)));
            return;
        }
        setLstDong((prev) => [...prev, dienThoaiToDong(dt)]);
    };
    const imeiDaCo = lstDong.filter((x) => x.dienThoai && x.id !== dongSua?.id).map((x) => x.dienThoai?.imel ?? '');

    const columns: GridColDef[] = [
        {
            field: 'tenHang',
            headerName: 'Tên điện thoại',
            flex: 1,
            minWidth: 200,
            sortable: false,
            renderCell: (params) => (
                <Typography noWrap sx={{ fontSize: 14, fontWeight: 700 }}>
                    {params.row.dienThoai?.tenHangHoa ?? params.row.tenHang}
                </Typography>
            )
        },
        {
            field: 'mau',
            headerName: 'Màu',
            width: 100,
            sortable: false,
            valueGetter: (params) => params.row.dienThoai?.mau ?? ''
        },
        {
            field: 'pin',
            headerName: 'Pin',
            width: 70,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            valueGetter: (params) => (params.row.dienThoai?.pin != null ? `${params.row.dienThoai.pin}%` : '')
        },
        {
            field: 'dungLuong',
            headerName: 'GB',
            width: 80,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            valueGetter: (params) => (params.row.dienThoai?.dungLuong ? `${params.row.dienThoai.dungLuong}GB` : '')
        },
        {
            field: 'imel',
            headerName: 'IMEI',
            width: 160,
            sortable: false,
            renderCell: (params) => (
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'var(--color-main)' }}>
                    {params.row.dienThoai?.imel}
                </Typography>
            )
        },
        {
            field: 'donGia',
            headerName: 'Giá nhập',
            width: 130,
            sortable: false,
            align: 'right',
            headerAlign: 'right',
            renderCell: (params) => (
                <Typography sx={{ fontSize: 14, fontWeight: 800 }}>{formatMoney(params.row.donGia)}</Typography>
            )
        },
        {
            field: 'ngayNhap',
            headerName: 'Ngày nhập',
            width: 110,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            valueGetter: () => ngayNhap
        },
        {
            field: 'ghiChu',
            headerName: 'Ghi chú',
            width: 160,
            sortable: false,
            renderCell: (params) => (
                <Typography noWrap sx={{ fontSize: 13 }} title={params.row.dienThoai?.ghiChu}>
                    {params.row.dienThoai?.ghiChu}
                </Typography>
            )
        },
        {
            field: 'action',
            headerName: '',
            width: 90,
            sortable: false,
            renderCell: (params) => (
                <Stack direction="row">
                    <Tooltip title="Sửa">
                        <IconButton size="small" onClick={() => moSua(params.row)}>
                            <EditOutlinedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Xóa">
                        <IconButton
                            size="small"
                            onClick={() => setLstDong((prev) => prev.filter((x) => x.id !== params.row.id))}
                            sx={{ color: '#9ca3af', '&:hover': { backgroundColor: '#fee2e2', color: '#dc2626' } }}>
                            <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>
                </Stack>
            )
        }
    ];

    return (
        <>
            <ModalNhapDienThoai
                open={isShowModal}
                onClose={() => setIsShowModal(false)}
                onAdd={luuMay}
                imeiDaCo={imeiDaCo}
                duLieu={dongSua?.dienThoai ?? null}
            />
            <Box sx={{ background: '#f5f6fa', minHeight: '100vh', p: 2 }}>
                <Paper elevation={0} sx={{ p: 1, borderRadius: 2, mb: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <IconButton onClick={() => navigate('/nhap-hangs')}>
                            <ArrowBackIcon />
                        </IconButton>
                        <Typography sx={{ fontWeight: 800, fontSize: 18 }}>Lập phiếu nhập điện thoại</Typography>
                    </Stack>
                </Paper>

                <Grid container spacing={2}>
                    <Grid item xs={12} md={4} lg={3.5} sx={{ order: 2 }}>
                        <ThongTinPhieuNhap p={p} />
                    </Grid>

                    <Grid item xs={12} md={8} lg={8.5} sx={{ order: 1 }}>
                        <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                            <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                                sx={{ p: 1.5, borderBottom: '1px solid #edf0f5' }}>
                                <Typography sx={{ fontWeight: 800 }}>Danh sách máy ({lstDong.length})</Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={moThem}
                                    sx={{ height: 40, textTransform: 'none', fontWeight: 800, boxShadow: 'none' }}>
                                    Thêm điện thoại
                                </Button>
                            </Stack>
                            <DataGrid
                                autoHeight
                                rows={lstDong}
                                columns={columns}
                                hideFooter
                                disableRowSelectionOnClick
                                rowHeight={56}
                                localeText={{
                                    noRowsLabel: 'Chưa có máy. Bấm "Thêm điện thoại" để nhập máy vào phiếu.'
                                }}
                                sx={{
                                    border: 0,
                                    '& .MuiDataGrid-columnHeaders': {
                                        background: '#f8fafc',
                                        borderBottom: '1px solid #edf0f5'
                                    },
                                    '& .MuiDataGrid-columnHeaderTitle': {
                                        fontWeight: 800,
                                        fontSize: 13,
                                        color: '#4b5563'
                                    },
                                    '& .MuiDataGrid-cell': {
                                        borderBottom: '1px solid #edf0f5',
                                        outline: 'none !important'
                                    }
                                }}
                            />
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </>
    );
};

export default Page_Them_Phieu_Nhap_Dien_Thoai;
