import http from '../httpService';
import HoaDonDto from '../ban_hang/HoaDonDto';

export interface PhieuKhoChiTietDto {
    idDonViQuyDoi: string;
    soLuong: number; // kiểm kê: số lượng thực tế
    donGiaTruocCK?: number;
    tienChietKhau?: number; // trên 1 đơn vị
    donGiaSauCK?: number;
    thanhTienTruocCK?: number;
    thanhTienSauCK?: number;
    tonLuyKe?: number; // kiểm kê: tồn phần mềm lúc kiểm
    ghiChu?: string;
}

export interface PhieuKhoDto {
    id?: string | null;
    idLoaiChungTu: number;
    idChiNhanh?: string | null;
    idKhachHang?: string | null;
    idHoaDon?: string | null;
    maHoaDon?: string;
    ngayLapHoaDon?: string;
    ghiChuHD?: string;
    trangThai: number; // 1.Tạm lưu, 3.Hoàn thành
    tongTienHangChuaChietKhau?: number;
    tongChietKhauHangHoa?: number;
    tongTienHang?: number;
    tongGiamGiaHD?: number;
    tongThanhToan?: number;
    chiTiet: PhieuKhoChiTietDto[];
}

export interface TonKhoItemDto {
    idHangHoa: string;
    soLuongTon: number;
}

export interface TheKhoItemDto {
    idHoaDon: string;
    maPhieu: string;
    thoiGian: string;
    idLoaiChungTu: number;
    loaiChungTu: string;
    giaVon: number;
    nhap: number;
    xuat: number;
    ton: number;
}

export interface ChiTietTraHangDto {
    idDonViQuyDoi: string;
    idHangHoa: string;
    maHangHoa: string;
    tenHangHoa: string;
    idLoaiHangHoa: number;
    soLuongMua: number;
    soLuongDaTra: number;
    donGia: number;
}

class KhoHangService {
    SavePhieuKho = async (input: PhieuKhoDto): Promise<HoaDonDto | null> => {
        if (!input.idKhachHang) input.idKhachHang = null;
        if (!input.idChiNhanh) input.idChiNhanh = null;
        const result = await http.post('api/services/app/KhoHang/SavePhieuKho', input);
        return result.data.result;
    };
    HuyPhieuKho = async (lstId: string[]) => {
        const result = await http.post('api/services/app/KhoHang/HuyPhieuKho', lstId);
        return result.data.result;
    };
    GetTonKho = async (idHangHoas: string[], idChiNhanh?: string | null): Promise<TonKhoItemDto[]> => {
        const result = await http.post('api/services/app/KhoHang/GetTonKho', {
            idHangHoas,
            idChiNhanh: idChiNhanh || null
        });
        return result.data.result ?? [];
    };
    GetTheKho = async (idHangHoa: string, idChiNhanh?: string | null): Promise<TheKhoItemDto[]> => {
        const query = idChiNhanh ? `&idChiNhanh=${idChiNhanh}` : '';
        const result = await http.get(`api/services/app/KhoHang/GetTheKho?idHangHoa=${idHangHoa}${query}`);
        return result.data.result ?? [];
    };
    GetChiTietCoTheTra = async (idHoaDon: string): Promise<ChiTietTraHangDto[]> => {
        const result = await http.get(`api/services/app/KhoHang/GetChiTietCoTheTra?idHoaDon=${idHoaDon}`);
        return result.data.result ?? [];
    };
    GetCauHinhKho = async (): Promise<{ choPhepXuatAm: boolean }> => {
        const result = await http.get('api/services/app/KhoHang/GetCauHinhKho');
        return result.data.result;
    };
    UpdateCauHinhKho = async (choPhepXuatAm: boolean) => {
        const result = await http.post('api/services/app/KhoHang/UpdateCauHinhKho', { choPhepXuatAm });
        return result.data.result;
    };
}

export default new KhoHangService();
