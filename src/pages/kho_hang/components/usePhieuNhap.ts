import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
interface IPhieuNhapTam {
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
const docPhieuTam = (loai: LoaiPhieuNhap): IPhieuNhapTam | null => {
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
            maHang: 'Máy mới',
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
                giaBan: ct.dienThoai.giaBan ?? 0
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

    const tongTienHangChuaCK = useMemo(() => lstDong.reduce((s, x) => s + x.soLuong * x.donGia, 0), [lstDong]);
    const tongTienHang = useMemo(() => lstDong.reduce((s, x) => s + x.soLuong * x.donGia - x.giamGia, 0), [lstDong]);
    const conNo = Math.max(tongTienHang - soTienThanhToan, 0);

    // số tiền trả lấy từ phiếu lưu tạm: áp dụng 1 lần sau khi tổng tiền tính lại từ danh sách dòng
    const soTienKhoiPhuc = useRef<number | null>(null);
    useEffect(() => {
        if (soTienKhoiPhuc.current !== null) {
            setSoTienThanhToan(soTienKhoiPhuc.current);
            soTienKhoiPhuc.current = null;
            return;
        }
        // mặc định trả đủ; chọn "Nợ" thì không trả
        setSoTienThanhToan(hinhThucThanhToan === HINH_THUC_NO ? 0 : tongTienHang);
    }, [tongTienHang]);

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
    };

    // phiếu tạm lưu cũ trên server (trước khi chuyển sang lưu tạm trên trình duyệt)
    const moPhieuServer = async (id: string) => {
        const phieu: PhieuKhoViewDto = await KhoHangService.GetPhieuKho(id);
        if (!phieu) {
            return;
        }
        if (phieu.idLoaiChungTu !== LoaiChungTu.NHAP_HANG || phieu.trangThai !== 1) {
            enqueueSnackbar('Chỉ mở lại được phiếu nhập đang tạm lưu', { variant: 'warning' });
            navigate('/nhap-hangs');
            return;
        }
        setIdPhieu(phieu.id);
        setMaPhieu(phieu.maHoaDon);
        setGhiChu(phieu.ghiChuHD ?? '');
        setKhachHang(
            phieu.idKhachHang
                ? ({
                      id: phieu.idKhachHang,
                      maKhachHang: phieu.maKhachHang ?? '',
                      tenKhachHang: phieu.tenKhachHang ?? '',
                      soDienThoai: phieu.soDienThoai ?? ''
                  } as CreateOrEditKhachHangDto)
                : ({} as CreateOrEditKhachHangDto)
        );
        setLstDong(phieu.chiTiet.map((ct) => chiTietToDong(ct)));
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
        if (value === HINH_THUC_NO) {
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
    const luuTam = async () => {
        if (lstDong.length === 0) {
            enqueueSnackbar('Phiếu nhập chưa có hàng hóa', { variant: 'warning' });
            return;
        }
        if (idPhieu) {
            // phiếu tạm lưu cũ trên server: cập nhật lại chính phiếu đó
            await guiLenServer(1);
            return;
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
            enqueueSnackbar('Đã lưu tạm phiếu nhập trên trình duyệt này', { variant: 'success' });
        } else {
            enqueueSnackbar('Trình duyệt không cho lưu tạm (bộ nhớ bị chặn hoặc đầy)', { variant: 'error' });
        }
    };

    // bỏ phiếu đang lưu tạm trên trình duyệt và làm trống màn hình
    const boPhieuTam = () => {
        ghiPhieuTam(loai, null);
        lamMoi();
        enqueueSnackbar('Đã bỏ phiếu tạm', { variant: 'info' });
    };

    const hoanThanh = async () => {
        if (lstDong.length === 0) {
            enqueueSnackbar('Phiếu nhập chưa có hàng hóa', { variant: 'warning' });
            return null;
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

    // trangThai: 3.Hoàn thành; 1.Tạm lưu (chỉ dùng cho phiếu tạm lưu cũ trên server)
    const guiLenServer = async (trangThai: number) => {
        if (isSaving) return null;
        setIsSaving(true);
        try {
            const result = await KhoHangService.SavePhieuKho({
                id: idPhieu,
                idLoaiChungTu: LoaiChungTu.NHAP_HANG,
                idChiNhanh: idChiNhanh,
                idKhachHang: khachHang?.id ?? null,
                ngayLapHoaDon: new Date().toISOString(),
                ghiChuHD: ghiChu,
                trangThai: trangThai,
                tongTienHangChuaChietKhau: tongTienHangChuaCK,
                tongChietKhauHangHoa: tongTienHangChuaCK - tongTienHang,
                tongTienHang: tongTienHang,
                tongThanhToan: tongTienHang,
                hinhThucThanhToan: soTienThanhToan > 0 ? hinhThucThanhToan : HINH_THUC_NO,
                soTienThanhToan: soTienThanhToan,
                idTaiKhoanNganHang: idTaiKhoanNganHang,
                chiTiet: lstDong.map((item) => {
                    const giamGia1Sp = item.soLuong > 0 ? item.giamGia / item.soLuong : 0;
                    const dt = item.dienThoai;
                    return {
                        idDonViQuyDoi: dt ? Guid.EMPTY : item.idDonViQuyDoi ?? '',
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
                                  giaBan: dt.giaBan
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
                enqueueSnackbar(`Đã lưu tạm phiếu nhập ${result.maHoaDon ?? ''}`, { variant: 'success' });
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
                    daThanhToan: soTienThanhToan,
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

    return {
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
        inNhap
    };
};

export type PhieuNhapState = ReturnType<typeof usePhieuNhap>;
