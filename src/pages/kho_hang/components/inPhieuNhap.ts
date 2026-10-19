import DataMauIn from '../../admin/settings/mau_in/DataMauIn';
import MauInServices from '../../../services/mau_in/MauInServices';
import uploadFileService from '../../../services/uploadFileService';
import { LoaiChungTu, LoaiMauIn } from '../../../lib/appconst';
import PageHoaDonDto from '../../../services/ban_hang/PageHoaDonDto';
import PageHoaDonChiTietDto from '../../../services/ban_hang/PageHoaDonChiTietDto';
import { KhachHangItemDto } from '../../../services/khach-hang/dto/KhachHangItemDto';
import { ChiNhanhDto } from '../../../services/chi_nhanh/Dto/chiNhanhDto';
import { CuaHangDto } from '../../../services/cua_hang/Dto/CuaHangDto';
import { ModelHangHoaDienThoaiDto } from '../../../services/product/dto';
import { PhieuKhoViewDto } from '../../../services/kho_hang/KhoHangService';

// tên dòng khi in: điện thoại kèm IMEI để đối chiếu từng máy
const tenDongIn = (ct: PhieuKhoViewDto['chiTiet'][number]) =>
    ct.dienThoai?.imel ? `${ct.tenHangHoa} - IMEI: ${ct.dienThoai.imel}` : ct.tenHangHoa;

const buildHtml = async (phieu: PhieuKhoViewDto, congty: CuaHangDto, tempMauIn: string) => {
    DataMauIn.hoadon = {
        maHoaDon: phieu.maHoaDon || '(chưa lưu)',
        ngayLapHoaDon: phieu.ngayLapHoaDon,
        ghiChuHD: phieu.ghiChuHD ?? '',
        tenNhanVien: '',
        tongTienHangChuaChietKhau: phieu.tongTienHangChuaChietKhau,
        tongChietKhauHangHoa: phieu.tongChietKhauHangHoa,
        tongTienHang: phieu.tongTienHang,
        tongGiamGiaHD: 0,
        tongTienHDSauVAT: phieu.tongThanhToan,
        tongThanhToan: phieu.tongThanhToan,
        daThanhToan: phieu.daThanhToan,
        conNo: phieu.conNo
    } as unknown as PageHoaDonDto;
    DataMauIn.hoadonChiTiet = phieu.chiTiet.map((ct, index) => ({
        stt: index + 1,
        tenHangHoa: tenDongIn(ct),
        soLuong: ct.soLuong,
        donGiaSauCK: ct.donGiaSauCK,
        thanhTienSauCK: ct.thanhTienSauCK,
        soThangBaoHanh: 0
    })) as unknown as PageHoaDonChiTietDto[];
    DataMauIn.khachhang = {
        maKhachHang: phieu.maKhachHang ?? '',
        tenKhachHang: phieu.tenKhachHang ?? '',
        soDienThoai: phieu.soDienThoai ?? ''
    } as KhachHangItemDto;
    DataMauIn.maySua = {} as ModelHangHoaDienThoaiDto;
    DataMauIn.chinhanh = {
        tenChiNhanh: phieu.tenChiNhanh ?? '',
        diaChi: phieu.diaChiChiNhanh ?? '',
        soDienThoai: phieu.dienThoaiChiNhanh ?? ''
    } as unknown as ChiNhanhDto;
    DataMauIn.congty = { ...congty, logo: uploadFileService.GoogleApi_NewLink(congty?.logo) };

    // thứ tự thay: chi tiết, chi nhánh, phiếu
    let html = DataMauIn.replaceChiTietHoaDon(tempMauIn);
    html = DataMauIn.replaceChiNhanh(html);
    html = DataMauIn.replaceHoaDon(html);
    return html;
};

/**
 * In 1 hoặc nhiều phiếu nhập theo mẫu in mặc định của loại chứng từ Phiếu nhập hàng
 * (Cài đặt > Mẫu in; chưa cài thì dùng mẫu K80_PhieuNhapKho của hệ thống)
 */
export const inPhieuNhap = async (lstPhieu: PhieuKhoViewDto[], congty: CuaHangDto) => {
    if (lstPhieu.length === 0) {
        return;
    }
    const tempMauIn: string = await MauInServices.GetContentMauInMacDinh(LoaiMauIn.K80, LoaiChungTu.NHAP_HANG);
    let htmlPrint = '';
    for (let i = 0; i < lstPhieu.length; i++) {
        const html = await buildHtml(lstPhieu[i], congty, tempMauIn);
        htmlPrint = htmlPrint.concat(html, i < lstPhieu.length - 1 ? `<p style="page-break-before:always;"></p>` : '');
    }
    DataMauIn.Print(htmlPrint);
};
