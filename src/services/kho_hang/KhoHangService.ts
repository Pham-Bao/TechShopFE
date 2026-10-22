import http from '../httpService';
import HoaDonDto from '../ban_hang/HoaDonDto';
import { FileUpload } from '../dto/FileUpload';
import { BangBaoLoiFileimportDto } from '../dto/BangBaoLoiFileimportDto';
import { IFileDto } from '../dto/FileDto';

// đọc file Excel chi tiết phiếu nhập: có lỗi thì không có dòng nào
export interface ImportPhieuNhapResultDto {
    chiTiet: PhieuKhoViewChiTietDto[];
    errors: BangBaoLoiFileimportDto[];
}

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
    // chỉ phiếu nhập: dòng là 1 máy điện thoại mới (idDonViQuyDoi = Guid rỗng), Backend tạo máy khi lưu
    dienThoai?: PhieuNhapDienThoaiDto;
}

export interface PhieuNhapDienThoaiDto {
    tenHangHoa: string;
    tenHangHoa_KhongDau?: string;
    idNhomHangHoa?: string | null;
    imel: string;
    mau?: string;
    dungLuong?: number | null;
    pin?: number | null;
    tinhTrang?: string;
    giaBan?: number;
    matKhau?: string;
    loi?: string;
    ghiChu?: string;
    daGiaoDich?: boolean; // xem / sửa phiếu nhập đã hoàn thành: máy đã bán / đã giao dịch -> khóa
    mayCoSan?: boolean; // gắn máy có sẵn (chưa thuộc phiếu nhập nào) vào phiếu: không tạo máy mới
}

// điện thoại chưa thuộc phiếu nhập nào (để gắn vào phiếu nhập)
export interface DienThoaiChuaCoPhieuNhapDto {
    idDonViQuyDoi: string;
    idHangHoa: string;
    maHangHoa: string;
    tenHangHoa: string;
    idNhomHangHoa?: string | null;
    mau?: string;
    dungLuong?: number | null;
    pin?: number | null;
    imel?: string;
    tinhTrang?: string;
    matKhau?: string;
    loi?: string;
    ghiChu?: string;
    giaVon: number;
    giaBan: number;
    trangThai: number;
    daGiaoDich: boolean;
}

// danh sách phiếu nhập
export interface PhieuNhapListRequestDto {
    textSearch?: string; // mã phiếu, mã / tên nhà cung cấp
    loaiHang: number; // 0.Tất cả, 1.Hàng hóa, 4.Điện thoại
    fromDate?: string | null;
    toDate?: string | null;
    idChiNhanhs?: string[];
    trangThais?: number[]; // trống: tất cả trừ đã hủy
    currentPage: number;
    pageSize: number;
}

export interface PhieuNhapListItemDto {
    id: string;
    maHoaDon: string;
    ngayLapHoaDon: string;
    idKhachHang?: string | null;
    maKhachHang: string;
    tenKhachHang: string;
    loaiHang: string;
    ghiChuHD?: string;
    soLuong: number;
    tongThanhToan: number;
    daThanhToan: number;
    conNo: number;
    trangThai: number;
    txtTrangThai: string;
    soLanKiemKe: number; // số phiếu kiểm kê đã lập theo phiếu nhập này
}

export interface PhieuNhapListResultDto {
    totalCount: number;
    items: PhieuNhapListItemDto[];
    sumSoLuong: number;
    sumTongThanhToan: number;
    sumDaThanhToan: number;
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
    // thanh toán phiếu nhập (khi hoàn thành): 0.Nợ, 1.Tiền mặt, 2.Chuyển khoản; trả một phần được
    hinhThucThanhToan?: number;
    soTienThanhToan?: number;
    idTaiKhoanNganHang?: string | null;
    // sửa phiếu nhập đã hoàn thành: tổng mới thấp hơn số đã trả -> nhà cung cấp hoàn lại (phiếu thu)
    soTienNhanLai?: number;
    chiTiet: PhieuKhoChiTietDto[];
}

export interface PhieuKhoViewChiTietDto {
    stt: number;
    idDonViQuyDoi: string;
    idHangHoa: string;
    idLoaiHangHoa: number;
    maHangHoa: string;
    tenHangHoa: string;
    soLuong: number;
    donGiaTruocCK: number;
    tienChietKhau: number; // trên 1 đơn vị
    donGiaSauCK: number;
    thanhTienSauCK: number;
    ghiChu?: string;
    dienThoai?: PhieuNhapDienThoaiDto | null;
}

export interface PhieuKhoViewDto {
    id: string;
    idLoaiChungTu: number;
    maHoaDon: string;
    ngayLapHoaDon: string;
    trangThai: number; // 1.Tạm lưu, 3.Hoàn thành, 0.Đã hủy
    idChiNhanh?: string | null;
    tenChiNhanh?: string;
    diaChiChiNhanh?: string;
    dienThoaiChiNhanh?: string;
    idKhachHang?: string | null;
    maKhachHang?: string;
    tenKhachHang?: string;
    soDienThoai?: string;
    ghiChuHD?: string;
    // phiếu kiểm kê: phiếu nhập được kiểm
    idHoaDon?: string | null;
    maHoaDonLienQuan?: string | null;
    tongTienHangChuaChietKhau: number;
    tongChietKhauHangHoa: number;
    tongTienHang: number;
    tongThanhToan: number;
    daThanhToan: number; // phiếu nhập: đã chi trả nhà cung cấp
    conNo: number;
    chiTiet: PhieuKhoViewChiTietDto[];
}

export interface TonKhoItemDto {
    idHangHoa: string;
    soLuongTon: number;
}

export interface KiemKeGanNhatDto {
    idHangHoa: string;
    ngayKiemKe: string;
    maPhieu: string;
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
    // điện thoại: thông tin máy (tình trạng hiện tại = tình trạng trước khi trả)
    imel?: string;
    mau?: string;
    dungLuong?: number | null;
    pin?: number | null;
    tinhTrang?: string;
    trangThaiMay: number; // 1.Đang kinh doanh, 2.Đã bán
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
    // mở lại phiếu tạm lưu / in phiếu
    GetPhieuKho = async (id: string): Promise<PhieuKhoViewDto> => {
        const result = await http.get(`api/services/app/KhoHang/GetPhieuKho?id=${id}`);
        return result.data.result;
    };
    // đọc file Excel chi tiết phiếu nhập (không lưu, chỉ trả về dòng để thêm vào phiếu)
    ImportChiTietPhieuNhap = async (input: FileUpload): Promise<ImportPhieuNhapResultDto> => {
        const result = await http.post('api/services/app/KhoHang/ImportChiTietPhieuNhap', input);
        return result.data.result;
    };
    GetListPhieuNhap = async (input: PhieuNhapListRequestDto): Promise<PhieuNhapListResultDto> => {
        const result = await http.post('api/services/app/KhoHang/GetListPhieuNhap', input);
        return result.data.result;
    };
    ExportListPhieuNhap = async (input: PhieuNhapListRequestDto): Promise<IFileDto> => {
        const result = await http.post('api/services/app/KhoHang/ExportListPhieuNhap', input);
        return result.data.result;
    };
    // điện thoại chưa thuộc phiếu nhập nào (kể cả đã bán) để gắn vào phiếu nhập
    GetDienThoaiChuaCoPhieuNhap = async (
        textSearch: string,
        idPhieuNhap?: string | null
    ): Promise<DienThoaiChuaCoPhieuNhapDto[]> => {
        const query = idPhieuNhap ? `&idPhieuNhap=${idPhieuNhap}` : '';
        const result = await http.get(
            `api/services/app/KhoHang/GetDienThoaiChuaCoPhieuNhap?textSearch=${encodeURIComponent(
                textSearch ?? ''
            )}${query}`
        );
        return result.data.result ?? [];
    };
    // xuất 1 phiếu ra Excel
    ExportPhieuKho = async (id: string): Promise<IFileDto> => {
        const result = await http.get(`api/services/app/KhoHang/ExportPhieuKho?id=${id}`);
        return result.data.result;
    };
    GetTonKho = async (idHangHoas: string[], idChiNhanh?: string | null): Promise<TonKhoItemDto[]> => {
        const result = await http.post('api/services/app/KhoHang/GetTonKho', {
            idHangHoas,
            idChiNhanh: idChiNhanh || null
        });
        return result.data.result ?? [];
    };
    // lần kiểm kê gần nhất (đã hoàn thành) của từng hàng hóa
    GetKiemKeGanNhat = async (idHangHoas: string[], idChiNhanh?: string | null): Promise<KiemKeGanNhatDto[]> => {
        const result = await http.post('api/services/app/KhoHang/GetKiemKeGanNhat', {
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
