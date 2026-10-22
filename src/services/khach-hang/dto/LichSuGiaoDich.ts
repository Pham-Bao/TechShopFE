export interface LichSuGiaoDich {
    maHoaDon: string;
    ngayLapHoaDon: string;
    tongTienHang: number;
    tongGiamGia: number;
    tongPhaiTra: number;
    khachDaTra: number;
    conNo: number;
    txtTrangThai: string;
    trangThai: number;
    id?: string;
    idLoaiChungTu?: number;
    loaiChungTu?: string; // Hóa đơn bán / Hóa đơn sửa / Trả hàng / Nhập hàng...
    noiDung?: string; // mua gì: tên máy - màu - IMEI, hàng x SL, máy sửa + dịch vụ
}
