// Hóa đơn bán / hóa đơn sửa (đã hoàn thành) của 1 khách hàng
export interface HoaDonCuaKhachHangRequestDto {
    idKhachHang: string;
    loaiHoaDon: number; // 0.Tất cả, 1.Hóa đơn bán, 19.Hóa đơn sửa
    currentPage: number;
    pageSize: number;
}

export interface HoaDonCuaKhachHangDto {
    id: string;
    maHoaDon: string;
    ngayLapHoaDon: string;
    idLoaiChungTu: number;
    loaiHoaDon: string;
    tongThanhToan: number;
    daThanhToan: number;
    conNo: number;
    trangThai: number;
    txtTrangThai: string;
}

export interface HoaDonCuaKhachHangResultDto {
    totalCount: number;
    soHoaDonBan: number;
    soHoaDonSua: number;
    items: HoaDonCuaKhachHangDto[];
}
