import { Guid } from 'guid-typescript';

export interface KhachHangItemDto {
    id: Guid;
    maKhachHang: string;
    tenKhachHang: string;
    ngaySinh: Date;
    avatar: string;
    soDienThoai: string;
    diaChi: string;
    tenNhomKhach?: string;
    gioiTinh?: string;
    tongChiTieu?: number;
    conNo?: number;
    theGiaTri?: number;
    cuocHenGanNhat: Date;
    tongTichDiem: number;
    soLanCheckIn?: number;
    trangThaiCheckIn?: number;
    zoaUserId?: string;
    soHoaDonBan?: number; // hóa đơn bán đã hoàn thành
    soHoaDonSua?: number; // hóa đơn sửa đã hoàn thành
}
