import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Chip, Divider, Grid, Stack, Typography } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { Guid } from 'guid-typescript';
import ProductService from '../../services/product/ProductService';
import { ModelHangHoaDienThoaiDto } from '../../services/product/dto';
import KhoHangService, { NhatKyDienThoaiDto } from '../../services/kho_hang/KhoHangService';
import { PropModal } from '../../utils/PropParentToChild';
import abpCustom from '../../components/abp-custom';
import ModalHangHoaDienThoai from './ModalPhone';
import MaChungTuLink from '../../components/MaChungTu/MaChungTuLink';

const formatMoney = (value?: number | null) => new Intl.NumberFormat('vi-VN').format(value ?? 0);
const formatNgay = (value?: string | null) => (value ? format(new Date(value), 'dd/MM/yyyy HH:mm') : '');
// nội dung chi tiết nhật ký lưu dạng HTML đơn giản (<br />, <b>): hiển thị dạng chữ thường
const htmlToText = (html?: string) =>
    (html ?? '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim();

// màu chip theo loại chứng từ
const mauLoaiChungTu = (idLoaiChungTu: number): 'success' | 'primary' | 'warning' | 'error' | 'info' | 'default' => {
    switch (idLoaiChungTu) {
        case 4: // nhập hàng
            return 'success';
        case 1: // bán hàng
            return 'primary';
        case 6: // khách trả hàng
            return 'warning';
        case 7: // trả hàng NCC
            return 'error';
        case 19: // sửa máy
            return 'info';
        default:
            return 'default';
    }
};

/**
 * Chi tiết 1 máy điện thoại (máy cửa hàng hoặc máy khách gửi sửa):
 * trái - thông tin máy (sửa được) + nhật ký sửa thông tin; phải - nhật ký chứng từ (nhập, bán, trả, sửa...)
 */
const ChiTietDienThoai = () => {
    const navigate = useNavigate();
    const { idDonViQuyDoi } = useParams();
    const [may, setMay] = useState<ModelHangHoaDienThoaiDto | null>(null);
    const [nhatKy, setNhatKy] = useState<NhatKyDienThoaiDto>({ chungTus: [], thaoTacs: [] });
    const [triggerModal, setTriggerModal] = useState<PropModal>(new PropModal({ isShow: false }));
    const [moRongThaoTac, setMoRongThaoTac] = useState<number | null>(null);

    const taiDuLieu = async () => {
        if (!idDonViQuyDoi) return;
        const [thongTin, nk] = await Promise.all([
            ProductService.GetDetailProductPhone(idDonViQuyDoi),
            KhoHangService.GetNhatKy_DienThoai(idDonViQuyDoi)
        ]);
        setMay(thongTin ?? null);
        setNhatKy(nk);
    };
    useEffect(() => {
        taiDuLieu();
    }, [idDonViQuyDoi]);

    const laMayKhach = may?.idLoaiHangHoa === 5;
    const quyenSua = abpCustom.isGrandPermission('Pages.DM_HangHoa.Edit');
    // phiếu nhập gần nhất của máy (lấy từ nhật ký chứng từ)
    const phieuNhap = nhatKy.chungTus.find((x) => x.idLoaiChungTu === 4)?.maHoaDon ?? '';
    const thongKe = useMemo(
        () => ({
            soBan: nhatKy.chungTus.filter((x) => x.idLoaiChungTu === 1).length,
            soTra: nhatKy.chungTus.filter((x) => x.idLoaiChungTu === 6).length,
            soSua: nhatKy.chungTus.filter((x) => x.idLoaiChungTu === 19).length
        }),
        [nhatKy]
    );

    const dongThongTin = (label: string, value?: React.ReactNode) => (
        <>
            <Grid item xs={5}>
                <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{label}</Typography>
            </Grid>
            <Grid item xs={7}>
                <Typography sx={{ fontSize: 14, wordBreak: 'break-word' }}>{value || '-'}</Typography>
            </Grid>
        </>
    );

    const columns: GridColDef[] = [
        {
            field: 'ngayLapHoaDon',
            headerName: 'Thời gian',
            width: 140,
            sortable: false,
            renderCell: (p) => formatNgay(p.value)
        },
        {
            field: 'loaiChungTu',
            headerName: 'Loại',
            width: 160,
            sortable: false,
            renderCell: (p) => (
                <Chip
                    size="small"
                    variant="outlined"
                    color={mauLoaiChungTu(p.row.idLoaiChungTu)}
                    label={p.value}
                    sx={{ fontWeight: 600 }}
                />
            )
        },
        {
            field: 'maHoaDon',
            headerName: 'Mã chứng từ',
            width: 120,
            sortable: false,
            renderCell: (p) => (
                <MaChungTuLink
                    ma={p.value}
                    id={p.row.idHoaDon}
                    idLoaiChungTu={p.row.idLoaiChungTu}
                    sx={{ fontSize: 13, fontWeight: 700 }}
                />
            )
        },
        {
            field: 'tenKhachHang',
            headerName: 'Khách hàng / NCC',
            flex: 1,
            minWidth: 170,
            sortable: false,
            renderCell: (p) =>
                p.row.idKhachHang && p.row.idKhachHang !== Guid.EMPTY ? (
                    <Typography
                        noWrap
                        title={`${p.row.maKhachHang} - ${p.value}`}
                        onClick={() => navigate(`/khach-hang-chi-tiet/${p.row.idKhachHang}`)}
                        sx={{ fontSize: 13, color: 'var(--color-main)', cursor: 'pointer' }}>
                        {p.value}
                    </Typography>
                ) : (
                    <Typography sx={{ fontSize: 13, color: '#9ca3af' }}>Khách lẻ</Typography>
                )
        },
        {
            field: 'soTien',
            headerName: 'Số tiền',
            width: 120,
            sortable: false,
            align: 'right',
            headerAlign: 'right',
            renderCell: (p) => formatMoney(p.value)
        },
        {
            field: 'nguoiTao',
            headerName: 'Người thực hiện',
            width: 130,
            sortable: false
        },
        {
            field: 'ghiChu',
            headerName: 'Ghi chú',
            flex: 1,
            minWidth: 150,
            sortable: false,
            renderCell: (p) => (
                <Typography noWrap sx={{ fontSize: 13 }} title={p.value}>
                    {p.value}
                </Typography>
            )
        }
    ];

    return (
        <>
            <ModalHangHoaDienThoai trigger={triggerModal} handleSave={() => taiDuLieu()} />
            <Grid container paddingTop={2} spacing={1}>
                {/* TRÁI: thông tin máy + nhật ký sửa thông tin */}
                <Grid item xs={12} md={3.5} lg={3}>
                    <Stack
                        padding={2}
                        spacing={2}
                        className="page-full"
                        sx={{ border: '1px solid #cccc', borderRadius: '4px', backgroundColor: '#fff' }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box
                                sx={{
                                    width: 52,
                                    height: 52,
                                    borderRadius: '50%',
                                    backgroundColor: '#f1f5f9',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700,
                                    color: '#475569'
                                }}>
                                {laMayKhach ? 'SC' : 'DT'}
                            </Box>
                            <Box sx={{ minWidth: 0 }}>
                                <Typography sx={{ fontSize: 16, fontWeight: 700 }}>{may?.tenHangHoa}</Typography>
                                <Typography sx={{ fontSize: 12, color: '#9ca3af' }}>
                                    {may?.maHangHoa}
                                    {laMayKhach ? ' · Máy khách gửi sửa' : ''}
                                </Typography>
                            </Box>
                        </Stack>

                        <Grid container rowSpacing={1}>
                            {dongThongTin('IMEI', may?.imel)}
                            {dongThongTin('Màu sắc', may?.mau)}
                            {dongThongTin('Dung lượng', may?.dungLuong ? `${may.dungLuong}GB` : '')}
                            {dongThongTin('Pin', may?.pin != null ? `${may.pin}%` : '')}
                            {dongThongTin('Tình trạng', may?.tinhTrang)}
                            {dongThongTin('Dòng máy', may?.tenNhomHang)}
                            {dongThongTin('Trạng thái', may?.txtTrangThaiHang)}
                            {laMayKhach && dongThongTin('Chủ máy', may?.tenChu)}
                            {!laMayKhach && dongThongTin('Giá nhập', formatMoney(may?.giaVon))}
                            {!laMayKhach && dongThongTin('Giá bán', formatMoney(may?.giaBan))}
                            {!laMayKhach && dongThongTin('Phiếu nhập', phieuNhap || 'Chưa có phiếu nhập')}
                            {dongThongTin('Mật khẩu', may?.matKhau)}
                            {dongThongTin('Lỗi', may?.loi)}
                            {dongThongTin('Ghi chú', may?.ghiChu)}
                        </Grid>
                        {quyenSua && (
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() =>
                                    setTriggerModal(
                                        new PropModal({ isShow: true, isNew: false, id: idDonViQuyDoi ?? '' })
                                    )
                                }
                                sx={{ textTransform: 'none', borderRadius: 4 }}>
                                Thay đổi thông tin
                            </Button>
                        )}

                        <Divider />
                        <Stack direction="row" justifyContent="space-between">
                            {[
                                { label: 'Lần bán', value: thongKe.soBan },
                                { label: 'Lần trả', value: thongKe.soTra },
                                { label: 'Lần sửa', value: thongKe.soSua }
                            ].map((x) => (
                                <Box key={x.label} sx={{ textAlign: 'center' }}>
                                    <Typography sx={{ fontSize: 18, fontWeight: 700 }}>{x.value}</Typography>
                                    <Typography sx={{ fontSize: 12 }}>{x.label}</Typography>
                                </Box>
                            ))}
                        </Stack>
                        <Divider />

                        {/* nhật ký sửa thông tin máy (góc dưới bên trái) */}
                        <Typography sx={{ fontWeight: 700, textAlign: 'center' }}>Nhật ký thao tác</Typography>
                        <Box sx={{ maxHeight: 320, overflowY: 'auto' }}>
                            {nhatKy.thaoTacs.length === 0 && (
                                <Typography sx={{ fontSize: 13, color: '#9ca3af', textAlign: 'center' }}>
                                    Chưa có thao tác
                                </Typography>
                            )}
                            {nhatKy.thaoTacs.map((x, i) => (
                                <Box
                                    key={i}
                                    onClick={() => setMoRongThaoTac(moRongThaoTac === i ? null : i)}
                                    sx={{ mb: 1.5, cursor: x.noiDungChiTiet ? 'pointer' : 'default' }}>
                                    <Typography sx={{ fontSize: 13 }}>{x.noiDung}</Typography>
                                    <Typography sx={{ fontSize: 11, color: '#d97706' }}>
                                        {formatNgay(x.thoiGian)}
                                        {x.nguoiTao ? ` · ${x.nguoiTao}` : ''}
                                    </Typography>
                                    {moRongThaoTac === i && x.noiDungChiTiet && (
                                        <Typography
                                            sx={{
                                                fontSize: 12,
                                                color: '#4b5563',
                                                whiteSpace: 'pre-line',
                                                mt: 0.5,
                                                p: 1,
                                                backgroundColor: '#f8fafc',
                                                borderRadius: 1
                                            }}>
                                            {htmlToText(x.noiDungChiTiet)}
                                        </Typography>
                                    )}
                                </Box>
                            ))}
                        </Box>
                    </Stack>
                </Grid>

                {/* PHẢI: nhật ký chứng từ */}
                <Grid item xs={12} md={8.5} lg={9}>
                    <Box
                        className="page-full"
                        sx={{ border: '1px solid #cccc', borderRadius: '4px', backgroundColor: '#fff', p: 2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
                                Nhật ký máy ({nhatKy.chungTus.length} chứng từ)
                            </Typography>
                            <Button
                                variant="outlined"
                                startIcon={<ArrowBackIcon />}
                                onClick={() => navigate('/dien-thoai')}
                                sx={{ textTransform: 'none', borderColor: '#e5e7eb', color: '#374151' }}>
                                Quay lại
                            </Button>
                        </Stack>
                        <DataGrid
                            autoHeight
                            rows={nhatKy.chungTus}
                            getRowId={(r) => r.idHoaDon}
                            columns={columns}
                            disableColumnMenu
                            disableRowSelectionOnClick
                            hideFooter={nhatKy.chungTus.length <= 25}
                            initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
                            pageSizeOptions={[25]}
                            rowHeight={44}
                            localeText={{ noRowsLabel: 'Máy chưa có chứng từ nào' }}
                            sx={{
                                border: '1px solid #edf0f5',
                                '& .MuiDataGrid-columnHeaders': { background: '#f8fafc' },
                                '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700, fontSize: 13 },
                                '& .MuiDataGrid-cell': { outline: 'none !important', fontSize: 13 }
                            }}
                        />
                    </Box>
                </Grid>
            </Grid>
        </>
    );
};

export default ChiTietDienThoai;
