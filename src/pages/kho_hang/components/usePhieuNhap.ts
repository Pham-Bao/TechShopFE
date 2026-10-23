import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { UNSAFE_NavigationContext, useNavigate, useSearchParams } from 'react-router-dom';
import { enqueueSnackbar } from 'notistack';
import { Guid } from 'guid-typescript';
import Cookies from 'js-cookie';
import { format } from 'date-fns';
import KhoHangService, { PhieuKhoViewChiTietDto, PhieuKhoViewDto } from '../../../services/kho_hang/KhoHangService';
import TaiKhoanNganHangServices from '../../../services/so_quy/TaiKhoanNganHangServices';
import { TaiKhoanNganHangDto } from '../../../services/so_quy/Dto/TaiKhoanNganHangDto';
import { CreateOrEditKhachHangDto } from '../../../services/khach-hang/dto/CreateOrEditKhachHangDto';
import { AppContext } from '../../../services/chi_nhanh/ChiNhanhContext';
import { HINH_THUC_THANH_TOAN, LoaiChungTu } from '../../../lib/appconst';
import utils from '../../../utils/utils';
import { IDienThoaiNhap } from './ModalNhapDienThoai';
import { inPhieuNhap } from './inPhieuNhap';

// hình thức thanh toán phiếu nhập: Nợ = không trả tiền, toàn bộ là nợ nhà cung cấp
export const HINH_THUC_NO = 0;

export type LoaiPhieuNhap = 'hang-hoa' | 'dien-thoai';

// 1 dòng trên phiếu nhập: hàng hóa (theo đơn vị quy đổi) hoặc 1 máy điện thoại mới
export interface IDongPhieuNhap {
    id: string;
    idDonViQuyDoi?: string;
    maHang: string;
    tenHang: string;
    soLuong: number;
    donGia: number;
    giamGia: number;
    ghiChu?: string;
    dienThoai?: IDienThoaiNhap;
}

// dữ liệu lưu tạm trên trình duyệt (localStorage)
export interface IPhieuNhapTam {
    thoiGian: string;
    khachHang: CreateOrEditKhachHangDto;
    ghiChu: string;
    lstDong: IDongPhieuNhap[];
    hinhThucThanhToan: number;
    soTienThanhToan: number;
    idTaiKhoanNganHang: string | null;
}

const draftKey = (loai: LoaiPhieuNhap) =>
    `TechShop_PhieuNhapTam_${loai}_${Cookies.get('Abp.TenantId') ?? '1'}_${Cookies.get('IdChiNhanh') ?? ''}`;
// danh sách phiếu nhập cũng đọc để hiện phiếu tạm (trạng thái "Chưa hoàn thành")
export const docPhieuTam = (loai: LoaiPhieuNhap): IPhieuNhapTam | null => {
    try {
        const raw = localStorage.getItem(draftKey(loai));
        return raw ? (JSON.parse(raw) as IPhieuNhapTam) : null;
    } catch {
        return null;
    }
};
const ghiPhieuTam = (loai: LoaiPhieuNhap, data: IPhieuNhapTam | null) => {
    try {
        if (data) {
            localStorage.setItem(draftKey(loai), JSON.stringify(data));
        } else {
            localStorage.removeItem(draftKey(loai));
        }
        return true;
    } catch {
        return false;
    }
};

// 1 dòng chi tiết (từ phiếu đã lưu hoặc từ file Excel) -> 1 dòng trên phiếu
export const chiTietToDong = (ct: PhieuKhoViewChiTietDto): IDongPhieuNhap => {
    const giamGia = (ct.tienChietKhau ?? 0) * ct.soLuong;
    if (ct.dienThoai) {
        return {
            id: `dt_${Date.now()}_${ct.stt}_${ct.dienThoai.imel}`,
            // máy đã có (mở lại phiếu đã lưu): giữ đơn vị quy đổi của máy để sửa phiếu đã hoàn thành cập nhật đúng máy
            idDonViQuyDoi: ct.idDonViQuyDoi,
            maHang: ct.maHangHoa || 'Máy mới',
            tenHang: ct.tenHangHoa,
            soLuong: 1,
            donGia: ct.donGiaTruocCK,
            giamGia: giamGia,
            ghiChu: ct.ghiChu ?? '',
            dienThoai: {
                tenHangHoa: ct.dienThoai.tenHangHoa,
                idNhomHangHoa: ct.dienThoai.idNhomHangHoa,
                imel: ct.dienThoai.imel,
                mau: ct.dienThoai.mau,
                dungLuong: ct.dienThoai.dungLuong,
                pin: ct.dienThoai.pin,
                tinhTrang: ct.dienThoai.tinhTrang,
                matKhau: ct.dienThoai.matKhau,
                loi: ct.dienThoai.loi,
                ghiChu: ct.dienThoai.ghiChu,
                giaNhap: ct.donGiaTruocCK,
                giaBan: ct.dienThoai.giaBan ?? 0,
                daGiaoDich: ct.dienThoai.daGiaoDich ?? false
            }
        };
    }
    return {
        id: ct.idHangHoa,
        idDonViQuyDoi: ct.idDonViQuyDoi,
        maHang: ct.maHangHoa,
        tenHang: ct.tenHangHoa,
        soLuong: ct.soLuong,
        donGia: ct.donGiaTruocCK,
        giamGia: giamGia,
        ghiChu: ct.ghiChu ?? ''
    };
};

/**
 * Nghiệp vụ dùng chung của màn lập phiếu nhập hàng hóa / điện thoại:
 * nhà cung cấp, ghi chú, danh sách dòng, thanh toán, lưu tạm (trình duyệt), hoàn thành, in nháp.
 */
export const usePhieuNhap = (loai: LoaiPhieuNhap) => {
    const navigate = useNavigate();
    const appContext = useContext(AppContext);
    const [searchParams, setSearchParams] = useSearchParams();
    const idChiNhanh = Cookies.get('IdChiNhanh') ?? null;

    const [lstDong, setLstDong] = useState<IDongPhieuNhap[]>([]);
    const [khachHang, setKhachHang] = useState<CreateOrEditKhachHangDto>({} as CreateOrEditKhachHangDto);
    const [ghiChu, setGhiChu] = useState('');
    const [hinhThucThanhToan, setHinhThucThanhToan] = useState<number>(HINH_THUC_THANH_TOAN.TIEN_MAT);
    const [soTienThanhToan, setSoTienThanhToan] = useState(0);
    const [idTaiKhoanNganHang, setIdTaiKhoanNganHang] = useState<string | null>(null);
    const [allBankAccount, setAllBankAccount] = useState<TaiKhoanNganHangDto[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    // phiếu tạm lưu cũ trên server (mở qua ?id=): hoàn thành sẽ cập nhật đúng phiếu này
    const [idPhieu, setIdPhieu] = useState<string | null>(null);
    const [maPhieu, setMaPhieu] = useState('');
    // thời điểm lưu tạm trên trình duyệt đang được mở lại (null: không có)
    const [thoiGianLuuTam, setThoiGianLuuTam] = useState<string | null>(null);
    // sửa phiếu nhập đã hoàn thành: không thanh toán thêm ở đây, giữ số đã trả nhà cung cấp
    const [laSua, setLaSua] = useState(false);
    const [daThanhToanCu, setDaThanhToanCu] = useState(0);
    const [idChiNhanhPhieu, setIdChiNhanhPhieu] = useState<string | null>(null);
    // sửa phiếu: Cập nhật không thu / chi tiền (tăng: nợ NCC, thanh toán thêm bằng nút "Thanh toán";
    // giảm dưới số đã trả: NCC nợ lại cửa hàng) -> luôn 0
    const [soTienNhanLai, setSoTienNhanLai] = useState(0);
    // sửa phiếu: trạng thái lúc mở phiếu, so sánh để bật nút "Cập nhật" khi có thay đổi
    const trangThaiGoc = useRef<string | null>(null);

    const tongTienHangChuaCK = useMemo(() => lstDong.reduce((s, x) => s + x.soLuong * x.donGia, 0), [lstDong]);
    const tongTienHang = useMemo(() => lstDong.reduce((s, x) => s + x.soLuong * x.donGia - x.giamGia, 0), [lstDong]);
    // sửa phiếu: âm = nhà cung cấp nợ lại cửa hàng
    const conNo = laSua ? tongTienHang - daThanhToanCu : Math.max(tongTienHang - soTienThanhToan, 0);

    // số tiền trả lấy từ phiếu lưu tạm: áp dụng 1 lần sau khi tổng tiền tính lại từ danh sách dòng
    const soTienKhoiPhuc = useRef<number | null>(null);
    useEffect(() => {
        if (soTienKhoiPhuc.current !== null) {
            setSoTienThanhToan(soTienKhoiPhuc.current);
            soTienKhoiPhuc.current = null;
            return;
        }
        if (laSua) {
            setSoTienThanhToan(0);
            setSoTienNhanLai(0);
            return;
        }
        // mặc định trả đủ; chọn "Nợ" thì không trả
        setSoTienThanhToan(hinhThucThanhToan === HINH_THUC_NO ? 0 : tongTienHang);
    }, [tongTienHang, laSua, daThanhToanCu]);

    // so sánh nội dung phiếu (bỏ id dòng sinh ngẫu nhiên)
    const chupPhieu = (kh: CreateOrEditKhachHangDto, gc: string, dong: IDongPhieuNhap[]) =>
        JSON.stringify({
            kh: kh?.id ?? null,
            gc: gc ?? '',
            dong: dong.map((x) => ({
                q: x.idDonViQuyDoi ?? null,
                sl: x.soLuong,
                dg: x.donGia,
                gg: x.giamGia,
                gc: x.ghiChu ?? '',
                dt: x.dienThoai ?? null
            }))
        });
    const coThayDoi =
        !laSua || trangThaiGoc.current === null || trangThaiGoc.current !== chupPhieu(khachHang, ghiChu, lstDong);

    // nội dung lần lưu gần nhất (lưu tạm / mở phiếu): khác nội dung đang nhập = còn thay đổi chưa lưu
    const mocDaLuu = useRef<string | null>(null);
    const chuaLuu =
        lstDong.length > 0 && (laSua ? coThayDoi : chupPhieu(khachHang, ghiChu, lstDong) !== mocDaLuu.current);
    const chuaLuuRef = useRef(false);
    chuaLuuRef.current = chuaLuu;
    // lưu xong / bỏ phiếu: cho rời trang không hỏi
    const boQuaHoiRoi = useRef(false);

    useEffect(() => {
        TaiKhoanNganHangServices.GetAllBankAccount(idChiNhanh ?? Guid.EMPTY).then((data) =>
            setAllBankAccount(data ?? [])
        );
        const id = searchParams.get('id');
        if (id) {
            moPhieuServer(id);
        } else {
            const tam = docPhieuTam(loai);
            if (tam && tam.lstDong?.length > 0) {
                apDungPhieuTam(tam);
            }
        }
    }, []);

    const apDungPhieuTam = (tam: IPhieuNhapTam) => {
        setKhachHang(tam.khachHang ?? ({} as CreateOrEditKhachHangDto));
        setGhiChu(tam.ghiChu ?? '');
        setLstDong(tam.lstDong ?? []);
        setHinhThucThanhToan(tam.hinhThucThanhToan ?? HINH_THUC_THANH_TOAN.TIEN_MAT);
        setIdTaiKhoanNganHang(tam.idTaiKhoanNganHang ?? null);
        soTienKhoiPhuc.current = tam.soTienThanhToan ?? 0;
        setThoiGianLuuTam(tam.thoiGian);
        mocDaLuu.current = chupPhieu(
            tam.khachHang ?? ({} as CreateOrEditKhachHangDto),
            tam.ghiChu ?? '',
            tam.lstDong ?? []
        );
    };

    // mở phiếu trên server: phiếu tạm lưu cũ (sửa tiếp) hoặc phiếu đã hoàn thành (sửa phiếu nhập)
    const moPhieuServer = async (id: string) => {
        const phieu: PhieuKhoViewDto = await KhoHangService.GetPhieuKho(id);
        if (!phieu) {
            return;
        }
        if (phieu.idLoaiChungTu !== LoaiChungTu.NHAP_HANG || (phieu.trangThai !== 1 && phieu.trangThai !== 3)) {
            enqueueSnackbar('Chỉ mở được phiếu nhập đang tạm lưu hoặc đã hoàn thành', { variant: 'warning' });
            navigate('/nhap-hangs');
            return;
        }
        setLaSua(phieu.trangThai === 3);
        setDaThanhToanCu(phieu.trangThai === 3 ? phieu.daThanhToan ?? 0 : 0);
        setIdChiNhanhPhieu(phieu.idChiNhanh ?? idChiNhanh);
        setIdPhieu(phieu.id);
        setMaPhieu(phieu.maHoaDon);
        const kh = phieu.idKhachHang
            ? ({
                  id: phieu.idKhachHang,
                  maKhachHang: phieu.maKhachHang ?? '',
                  tenKhachHang: phieu.tenKhachHang ?? '',
                  soDienThoai: phieu.soDienThoai ?? ''
              } as CreateOrEditKhachHangDto)
            : ({} as CreateOrEditKhachHangDto);
        const dong = phieu.chiTiet.map((ct) => chiTietToDong(ct));
        setGhiChu(phieu.ghiChuHD ?? '');
        setKhachHang(kh);
        setLstDong(dong);
        trangThaiGoc.current = phieu.trangThai === 3 ? chupPhieu(kh, phieu.ghiChuHD ?? '', dong) : null;
        mocDaLuu.current = chupPhieu(kh, phieu.ghiChuHD ?? '', dong);
    };

    const lamMoi = () => {
        setLstDong([]);
        setKhachHang({} as CreateOrEditKhachHangDto);
        setGhiChu('');
        setHinhThucThanhToan(HINH_THUC_THANH_TOAN.TIEN_MAT);
        setSoTienThanhToan(0);
        setIdTaiKhoanNganHang(null);
        setIdPhieu(null);
        setMaPhieu('');
        setThoiGianLuuTam(null);
        setSearchParams({});
    };

    const changeHinhThucThanhToan = (value: number) => {
        setHinhThucThanhToan(value);
        if (laSua) {
            // sửa phiếu: không thu / chi khi cập nhật
            setSoTienThanhToan(0);
            setSoTienNhanLai(0);
        } else if (value === HINH_THUC_NO) {
            setSoTienThanhToan(0);
        } else if (soTienThanhToan === 0) {
            setSoTienThanhToan(tongTienHang);
        }
        if (value !== HINH_THUC_THANH_TOAN.CHUYEN_KHOAN) {
            setIdTaiKhoanNganHang(null);
        } else if (!idTaiKhoanNganHang) {
            setIdTaiKhoanNganHang(allBankAccount.find((x) => x.isDefault)?.id ?? null);
        }
    };

    // lưu tạm: ghi toàn bộ phiếu đang lập vào bộ nhớ trình duyệt (chưa nhập kho, chưa chi tiền)
    // trả về true nếu lưu được
    const luuTam = async (): Promise<boolean> => {
        if (lstDong.length === 0) {
            enqueueSnackbar('Phiếu nhập chưa có hàng hóa', { variant: 'warning' });
            return false;
        }
        if (idPhieu) {
            // phiếu tạm lưu cũ trên server: cập nhật lại chính phiếu đó
            return (await guiLenServer(1)) != null;
        }
        const thoiGian = new Date().toISOString();
        const ok = ghiPhieuTam(loai, {
            thoiGian,
            khachHang,
            ghiChu,
            lstDong,
            hinhThucThanhToan,
            soTienThanhToan,
            idTaiKhoanNganHang
        });
        if (ok) {
            setThoiGianLuuTam(thoiGian);
            mocDaLuu.current = chupPhieu(khachHang, ghiChu, lstDong);
            enqueueSnackbar('Đã lưu tạm phiếu nhập trên trình duyệt này', { variant: 'success' });
        } else {
            enqueueSnackbar('Trình duyệt không cho lưu tạm (bộ nhớ bị chặn hoặc đầy)', { variant: 'error' });
        }
        return ok;
    };

    // bỏ phiếu đang lưu tạm trên trình duyệt và làm trống màn hình
    const boPhieuTam = () => {
        ghiPhieuTam(loai, null);
        lamMoi();
        enqueueSnackbar('Đã bỏ phiếu tạm', { variant: 'info' });
    };

    // Hoàn thành / Cập nhật: bắt buộc nhà cung cấp. Điện thoại chỉ bắt buộc tên và IMEI (đã kiểm tra lúc thêm máy),
    // màu, dung lượng, pin, tình trạng không bắt buộc.
    const kiemTraDuThongTin = () => {
        if (!khachHang?.id || khachHang.id === Guid.EMPTY) {
            enqueueSnackbar('Vui lòng chọn nhà cung cấp', { variant: 'warning' });
            return false;
        }
        return true;
    };

    const hoanThanh = async () => {
        if (lstDong.length === 0) {
            enqueueSnackbar('Phiếu nhập chưa có hàng hóa', { variant: 'warning' });
            return null;
        }
        if (!kiemTraDuThongTin()) {
            return null;
        }
        if (laSua) {
            if (!coThayDoi) {
                return null;
            }
            // sửa phiếu đã hoàn thành: chỉ lưu phiếu, tiền chênh lệch ghi công nợ nhà cung cấp
            return await guiLenServer(3);
        }
        if (soTienThanhToan < 0 || soTienThanhToan > tongTienHang) {
            enqueueSnackbar('Số tiền thanh toán phải từ 0 đến số tiền cần trả', { variant: 'warning' });
            return null;
        }
        if (hinhThucThanhToan === HINH_THUC_THANH_TOAN.CHUYEN_KHOAN && soTienThanhToan > 0 && !idTaiKhoanNganHang) {
            enqueueSnackbar('Vui lòng chọn tài khoản ngân hàng', { variant: 'warning' });
            return null;
        }
        return await guiLenServer(3);
    };

    // sửa phiếu: bấm "Thanh toán" khi còn thay đổi chưa lưu -> cập nhật phiếu trước (ở lại màn sửa), true nếu sẵn sàng
    const capNhatTruocThanhToan = async () => {
        if (!laSua) return false;
        if (!coThayDoi) return true;
        if (lstDong.length === 0 || !kiemTraDuThongTin()) return false;
        return (await guiLenServer(3, true)) != null;
    };
    // đã thanh toán thêm cho nhà cung cấp (phiếu chi tạo ở dialog thanh toán)
    const daThanhToanThem = (soTien: number) => setDaThanhToanCu((x) => x + soTien);

    // trangThai: 3.Hoàn thành; 1.Tạm lưu (chỉ dùng cho phiếu tạm lưu cũ trên server)
    // giuTrang: sửa phiếu xong ở lại màn sửa (nạp lại phiếu) thay vì về danh sách
    const guiLenServer = async (trangThai: number, giuTrang = false) => {
        if (isSaving) return null;
        setIsSaving(true);
        try {
            const result = await KhoHangService.SavePhieuKho({
                id: idPhieu,
                idLoaiChungTu: LoaiChungTu.NHAP_HANG,
                // sửa phiếu đã hoàn thành: giữ chi nhánh và ngày lập của phiếu
                idChiNhanh: laSua ? idChiNhanhPhieu : idChiNhanh,
                idKhachHang: khachHang?.id ?? null,
                ngayLapHoaDon: laSua ? undefined : new Date().toISOString(),
                ghiChuHD: ghiChu,
                trangThai: trangThai,
                tongTienHangChuaChietKhau: tongTienHangChuaCK,
                tongChietKhauHangHoa: tongTienHangChuaCK - tongTienHang,
                tongTienHang: tongTienHang,
                tongThanhToan: tongTienHang,
                // sửa phiếu: không thu / chi (chênh lệch ghi công nợ nhà cung cấp)
                hinhThucThanhToan: !laSua && soTienThanhToan > 0 ? hinhThucThanhToan : HINH_THUC_NO,
                soTienThanhToan: laSua ? 0 : soTienThanhToan,
                soTienNhanLai: 0,
                idTaiKhoanNganHang: idTaiKhoanNganHang,
                chiTiet: lstDong.map((item) => {
                    const giamGia1Sp = item.soLuong > 0 ? item.giamGia / item.soLuong : 0;
                    const dt = item.dienThoai;
                    return {
                        // điện thoại: máy mới gửi Guid rỗng (Backend tạo máy); sửa phiếu đã hoàn thành: máy cũ gửi
                        // đơn vị quy đổi của máy để cập nhật đúng máy đó
                        // (máy có sẵn gắn vào phiếu: luôn gửi đơn vị quy đổi của máy đó)
                        idDonViQuyDoi: dt
                            ? laSua || dt.mayCoSan
                                ? item.idDonViQuyDoi ?? Guid.EMPTY
                                : Guid.EMPTY
                            : item.idDonViQuyDoi ?? '',
                        dienThoai: dt
                            ? {
                                  tenHangHoa: dt.tenHangHoa,
                                  tenHangHoa_KhongDau: utils.strToEnglish(dt.tenHangHoa),
                                  idNhomHangHoa: dt.idNhomHangHoa,
                                  imel: dt.imel,
                                  mau: dt.mau,
                                  dungLuong: dt.dungLuong,
                                  pin: dt.pin,
                                  tinhTrang: dt.tinhTrang,
                                  matKhau: dt.matKhau,
                                  loi: dt.loi,
                                  ghiChu: dt.ghiChu,
                                  giaBan: dt.giaBan,
                                  mayCoSan: dt.mayCoSan ?? false
                              }
                            : undefined,
                        soLuong: item.soLuong,
                        donGiaTruocCK: item.donGia,
                        tienChietKhau: giamGia1Sp,
                        donGiaSauCK: item.donGia - giamGia1Sp,
                        thanhTienTruocCK: item.soLuong * item.donGia,
                        thanhTienSauCK: item.soLuong * item.donGia - item.giamGia,
                        ghiChu: item.ghiChu
                    };
                })
            });
            if (result == null) {
                return null;
            }
            if (trangThai === 1) {
                mocDaLuu.current = chupPhieu(khachHang, ghiChu, lstDong);
                enqueueSnackbar(`Đã lưu tạm phiếu nhập ${result.maHoaDon ?? ''}`, { variant: 'success' });
                return result;
            }
            if (laSua) {
                enqueueSnackbar(`Đã cập nhật phiếu nhập ${result.maHoaDon ?? ''}`, { variant: 'success' });
                if (giuTrang && idPhieu) {
                    await moPhieuServer(idPhieu);
                    return result;
                }
                boQuaHoiRoi.current = true;
                navigate('/nhap-hangs');
                return result;
            }
            enqueueSnackbar(`Hoàn thành phiếu nhập ${result.maHoaDon ?? ''}`, { variant: 'success' });
            ghiPhieuTam(loai, null);
            lamMoi();
            return result;
        } catch (error: any) {
            // lỗi từ Backend đã được httpService hiển thị; chỉ báo khi không có phản hồi (mất mạng, timeout)
            if (!error?.response) {
                enqueueSnackbar(error?.message || 'Lưu phiếu nhập thất bại', { variant: 'error' });
            }
            return null;
        } finally {
            setIsSaving(false);
        }
    };

    // in theo dữ liệu đang nhập trên màn hình (chưa cần lưu)
    const inNhap = async () => {
        if (lstDong.length === 0) {
            enqueueSnackbar('Phiếu nhập chưa có hàng hóa', { variant: 'warning' });
            return;
        }
        await inPhieuNhap(
            [
                {
                    id: idPhieu ?? '',
                    idLoaiChungTu: LoaiChungTu.NHAP_HANG,
                    maHoaDon: maPhieu,
                    ngayLapHoaDon: new Date().toISOString(),
                    trangThai: 1,
                    tenChiNhanh: appContext?.chinhanhCurrent?.tenChiNhanh ?? '',
                    tenKhachHang: khachHang?.tenKhachHang ?? '',
                    soDienThoai: khachHang?.soDienThoai ?? '',
                    ghiChuHD: ghiChu,
                    tongTienHangChuaChietKhau: tongTienHangChuaCK,
                    tongChietKhauHangHoa: tongTienHangChuaCK - tongTienHang,
                    tongTienHang: tongTienHang,
                    tongThanhToan: tongTienHang,
                    daThanhToan: laSua ? daThanhToanCu : soTienThanhToan,
                    conNo: conNo,
                    chiTiet: lstDong.map((item, index) => ({
                        stt: index + 1,
                        idDonViQuyDoi: item.idDonViQuyDoi ?? '',
                        idHangHoa: item.id,
                        idLoaiHangHoa: item.dienThoai ? 4 : 1,
                        maHangHoa: item.maHang,
                        tenHangHoa: item.tenHang,
                        soLuong: item.soLuong,
                        donGiaTruocCK: item.donGia,
                        tienChietKhau: item.soLuong > 0 ? item.giamGia / item.soLuong : 0,
                        donGiaSauCK: item.soLuong > 0 ? item.donGia - item.giamGia / item.soLuong : item.donGia,
                        thanhTienSauCK: item.soLuong * item.donGia - item.giamGia,
                        dienThoai: item.dienThoai
                            ? { tenHangHoa: item.dienThoai.tenHangHoa, imel: item.dienThoai.imel }
                            : null
                    }))
                }
            ],
            appContext.congty
        );
    };

    // ===== Rời màn lập phiếu khi còn thay đổi chưa lưu =====
    // App dùng BrowserRouter (không có useBlocker) nên chặn chuyển trang bằng cách bọc navigator.push/replace:
    // menu, nút quay lại... đều đi qua đây -> giữ lại lần chuyển trang và hỏi người dùng.
    const [dieuHuongCho, setDieuHuongCho] = useState<(() => void) | null>(null);
    const { navigator } = useContext(UNSAFE_NavigationContext) as any;
    useEffect(() => {
        const push = navigator.push;
        const replace = navigator.replace;
        const chan =
            (fn: (...args: any[]) => void) =>
            (...args: any[]) => {
                const to = args[0];
                const path = typeof to === 'string' ? to.split(/[?#]/)[0] : to?.pathname;
                // vẫn ở màn này (chỉ đổi ?id=...) thì không hỏi
                if (!boQuaHoiRoi.current && chuaLuuRef.current && path && path !== window.location.pathname) {
                    setDieuHuongCho(() => () => fn(...args));
                    return;
                }
                fn(...args);
            };
        navigator.push = chan(push);
        navigator.replace = chan(replace);
        return () => {
            navigator.push = push;
            navigator.replace = replace;
        };
    }, [navigator]);

    // phiếu mới lập (chưa có trên server): ghi ngay vào trình duyệt, dùng khi trình duyệt tự rời trang
    const ghiTamNgay = () =>
        !laSua &&
        !idPhieu &&
        ghiPhieuTam(loai, {
            thoiGian: new Date().toISOString(),
            khachHang,
            ghiChu,
            lstDong,
            hinhThucThanhToan,
            soTienThanhToan,
            idTaiKhoanNganHang
        });
    const ghiTamNgayRef = useRef(ghiTamNgay);
    ghiTamNgayRef.current = ghiTamNgay;
    useEffect(() => {
        // đóng / tải lại tab: trình duyệt chỉ cho hiện hộp xác nhận mặc định của nó (không đặt nút riêng được)
        const truocKhiDong = (e: BeforeUnloadEvent) => {
            if (boQuaHoiRoi.current || !chuaLuuRef.current) return;
            e.preventDefault();
            e.returnValue = '';
        };
        // nút Back của trình duyệt: không chặn được, tự lưu tạm để không mất phiếu
        const khiQuayLai = () => {
            if (boQuaHoiRoi.current || !chuaLuuRef.current) return;
            if (ghiTamNgayRef.current()) {
                enqueueSnackbar('Phiếu nhập đang lập đã được lưu tạm, xem lại ở danh sách phiếu nhập', {
                    variant: 'info'
                });
            }
        };
        window.addEventListener('beforeunload', truocKhiDong);
        window.addEventListener('popstate', khiQuayLai);
        return () => {
            window.removeEventListener('beforeunload', truocKhiDong);
            window.removeEventListener('popstate', khiQuayLai);
        };
    }, []);

    // người dùng chọn trên hộp thoại rời trang
    const roiTrang = async (luuTruocKhiRoi: boolean) => {
        const diTiep = dieuHuongCho;
        if (!diTiep) return;
        if (luuTruocKhiRoi && !(await luuTam())) return;
        setDieuHuongCho(null);
        boQuaHoiRoi.current = true;
        diTiep();
    };
    const oLaiTrang = () => setDieuHuongCho(null);

    return {
        dangHoiRoiTrang: dieuHuongCho != null,
        roiTrang,
        oLaiTrang,
        lstDong,
        setLstDong,
        khachHang,
        setKhachHang,
        ghiChu,
        setGhiChu,
        hinhThucThanhToan,
        changeHinhThucThanhToan,
        soTienThanhToan,
        setSoTienThanhToan,
        idTaiKhoanNganHang,
        setIdTaiKhoanNganHang,
        allBankAccount,
        tongTienHang,
        conNo,
        isSaving,
        maPhieu,
        thoiGianLuuTam: thoiGianLuuTam ? format(new Date(thoiGianLuuTam), 'HH:mm dd/MM/yyyy') : null,
        luuTam,
        boPhieuTam,
        hoanThanh,
        inNhap,
        laSua,
        daThanhToanCu,
        soTienNhanLai,
        setSoTienNhanLai,
        coThayDoi,
        idPhieu,
        capNhatTruocThanhToan,
        daThanhToanThem
    };
};

export type PhieuNhapState = ReturnType<typeof usePhieuNhap>;
