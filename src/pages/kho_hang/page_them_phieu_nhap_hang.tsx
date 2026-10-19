import React, { useMemo, useState, useEffect, useContext } from 'react';
import {
    Autocomplete,
    Box,
    Button,
    Divider,
    Grid,
    IconButton,
    InputAdornment,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    Tooltip,
    Typography
} from '@mui/material';

import { DataGrid, GridColDef } from '@mui/x-data-grid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RemoveIcon from '@mui/icons-material/Remove';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import PrintIcon from '@mui/icons-material/Print';
import SaveIcon from '@mui/icons-material/Save';

import ProductService from '../../services/product/ProductService';
import { ModelHangHoaDto, PagedProductSearchDto } from '../../services/product/dto';
import { CreateOrEditKhachHangDto } from '../../services/khach-hang/dto/CreateOrEditKhachHangDto';
import { Guid } from 'guid-typescript';
import CreateOrEditCustomerDialog from '../customer/components/create-or-edit-customer-modal';
import { KhachHangDto } from '../../services/khach-hang/dto/KhachHangDto';
import MenuWithDataFromDB from '../../components/Menu/MenuWithData_fromDB';
import { TypeSearchfromDB } from '../../enum/TypeSearch_fromDB';
import { IList } from '../../services/dto/IList';
import SoQuyServices from '../../services/so_quy/SoQuyServices';
import { HINH_THUC_THANH_TOAN, LoaiChungTu } from '../../lib/appconst';
import HoaDonDto from '../../services/ban_hang/HoaDonDto';
import HoaDonChiTietDto from '../../services/ban_hang/HoaDonChiTietDto';
import KhoHangService, { PhieuKhoViewChiTietDto, PhieuKhoViewDto } from '../../services/kho_hang/KhoHangService';
import ImportExcel from '../../components/ImportComponent/ImportExcel';
import BangBaoLoiFileImport from '../../components/ImportComponent/BangBaoLoiFileImport';
import { BangBaoLoiFileimportDto } from '../../services/dto/BangBaoLoiFileimportDto';
import { FileUpload } from '../../services/dto/FileUpload';
import uploadFileService from '../../services/uploadFileService';
import fileDowloadService from '../../services/file-dowload.service';
import { inPhieuNhap } from './components/inPhieuNhap';
import { AppContext } from '../../services/chi_nhanh/ChiNhanhContext';
import TaiKhoanNganHangServices from '../../services/so_quy/TaiKhoanNganHangServices';
import { TaiKhoanNganHangDto } from '../../services/so_quy/Dto/TaiKhoanNganHangDto';
import AutocompleteAccountBank from '../../components/Autocomplete/AccountBank';
import ModalNhapDienThoai, { IDienThoaiNhap } from './components/ModalNhapDienThoai';
import utils from '../../utils/utils';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { enqueueSnackbar } from 'notistack';

// hình thức thanh toán phiếu nhập: Nợ = không trả tiền, toàn bộ là nợ nhà cung cấp
const HINH_THUC_NO = 0;

interface IHangHoa {
    id: string;

    idDonViQuyDoi?: string;

    maHang: string;

    tenHang: string;

    soLuong: number;

    donGia: number;

    giamGia: number;

    ghiChu?: string;

    // dòng là 1 máy điện thoại mới (số lượng luôn = 1, Backend tạo máy khi lưu phiếu)
    dienThoai?: IDienThoaiNhap;
}

const Page_Them_Phieu_Nhap_Hang = () => {
    const [loading, setLoading] = useState(false);
    const [isSavingHoaDon, setIsSavingHoaDon] = useState(false);
    const [listSearch, setListSearch] = useState<ModelHangHoaDto[]>([]);
    const [listHangHoa, setListHangHoa] = useState<IHangHoa[]>([]);
    const [newCus, setNewCus] = useState<CreateOrEditKhachHangDto>({} as CreateOrEditKhachHangDto);
    const [isShowModalAddCus, setIsShowModalAddCus] = useState(false);
    const [customerChosed, setCustomerChosed] = useState<CreateOrEditKhachHangDto>({} as CreateOrEditKhachHangDto);
    const [anchorDropdownCustomer, setAnchorDropdownCustomer] = useState<HTMLElement | null>(null);
    const [expandSearchCus, setExpandSearchCus] = useState(false);
    const [ghiChu, setGhiChu] = useState('');
    const [isShowModalDienThoai, setIsShowModalDienThoai] = useState(false);
    const navigate = useNavigate();
    const appContext = useContext(AppContext);
    const [searchParams, setSearchParams] = useSearchParams();
    // phiếu tạm lưu đang sửa (lưu lại sẽ cập nhật đúng phiếu này)
    const [idPhieu, setIdPhieu] = useState<string | null>(null);
    const [maPhieu, setMaPhieu] = useState('');
    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);

        if (parts.length === 2) {
            return parts.pop()?.split(';').shift();
        }

        return undefined;
    };

    const idChiNhanhChosed = getCookie('IdChiNhanh');
    const formatMoney = (value: number) => {
        return Number(value || 0).toLocaleString('vi-VN');
    };
    const tongTienHang = useMemo(() => {
        return listHangHoa.reduce((prev, item) => {
            return prev + item.soLuong * item.donGia - item.giamGia;
        }, 0);
    }, [listHangHoa]);
    const [hinhThucThanhToan, setHinhThucThanhToan] = useState<number>(HINH_THUC_THANH_TOAN.TIEN_MAT);
    const [idTaiKhoanNganHang, setIdTaiKhoanNganHang] = useState<string | null>(null);
    const [allBankAccount, setAllBankAccount] = useState<TaiKhoanNganHangDto[]>([]);
    const [soTienThanhToan, setSoTienThanhToan] = useState<number>(tongTienHang);
    const conNo = Math.max(tongTienHang - soTienThanhToan, 0);
    useEffect(() => {
        // mặc định trả đủ; chọn "Nợ" thì không trả
        setSoTienThanhToan(hinhThucThanhToan === HINH_THUC_NO ? 0 : tongTienHang);
    }, [tongTienHang]);
    useEffect(() => {
        const getAllBankAccount = async () => {
            const data = await TaiKhoanNganHangServices.GetAllBankAccount(idChiNhanhChosed ?? Guid.EMPTY);
            setAllBankAccount(data ?? []);
        };
        getAllBankAccount();
    }, []);
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
            // chọn sẵn tài khoản mặc định nếu có
            setIdTaiKhoanNganHang(allBankAccount.find((x) => x.isDefault)?.id ?? null);
        }
    };
    const getListHangHoa = async (value: string) => {
        if (!value?.trim()) {
            setListSearch([]);
            return;
        }

        setLoading(true);

        try {
            const input = {
                idNhomHangHoas: [],
                textSearch: value,
                idLoaiHangHoa: 1,
                idChiNhanhs: idChiNhanhChosed ? [idChiNhanhChosed] : [],
                currentPage: 0,
                pageSize: 20
            } as PagedProductSearchDto;
            const data = await ProductService.Get_DMHangHoa(input);

            setListSearch(data?.items ?? data ?? []);
        } finally {
            setLoading(false);
        }
    };

    const addHangHoa = (item: any) => {
        const exist = listHangHoa.find((x) => x.id === item.id);

        if (exist) {
            setListHangHoa((prev) =>
                prev.map((x) =>
                    x.id === item.id
                        ? {
                              ...x,
                              soLuong: x.soLuong + 1
                          }
                        : x
                )
            );

            return;
        }

        setListHangHoa((prev) => [
            ...prev,
            {
                id: item.id,
                maHang: item.maHangHoa,
                tenHang: item.tenHangHoa,
                soLuong: 1,
                // đơn giá nhập mặc định = giá vốn hiện tại (vẫn sửa được)
                donGia: item.giaVon || 0,
                giamGia: 0,
                idDonViQuyDoi: item.idDonViQuyDoi,
                ghiChu: ''
            }
        ]);
    };

    const addDienThoai = (dt: IDienThoaiNhap) => {
        setListHangHoa((prev) => [
            ...prev,
            {
                id: `dt_${Date.now()}_${dt.imel}`,
                maHang: 'Máy mới',
                tenHang: dt.tenHangHoa,
                soLuong: 1,
                donGia: dt.giaNhap,
                giamGia: 0,
                ghiChu: '',
                dienThoai: dt
            }
        ]);
    };

    const updateSoLuong = (id: string, value: number) => {
        setListHangHoa((prev) =>
            prev.map((x) => {
                if (x.id === id && !x.dienThoai) {
                    return {
                        ...x,
                        soLuong: value < 1 ? 1 : value
                    };
                }

                return x;
            })
        );
    };

    const updateDonGia = (id: string, value: number) => {
        setListHangHoa((prev) =>
            prev.map((x) => {
                if (x.id === id) {
                    return {
                        ...x,
                        donGia: value
                    };
                }

                return x;
            })
        );
    };

    const updateGiamGia = (id: string, value: number) => {
        setListHangHoa((prev) =>
            prev.map((x) => {
                if (x.id === id) {
                    return {
                        ...x,
                        giamGia: value
                    };
                }

                return x;
            })
        );
    };
    const changeCustomer_fromModalAdd = async (customer?: KhachHangDto) => {
        setIsShowModalAddCus(false);
        if (customer) {
            setCustomerChosed({
                ...customerChosed,
                id: customer?.id?.toString(),
                maKhachHang: customer?.maKhachHang,
                tenKhachHang: customer?.tenKhachHang ?? 'Chưa chọn khách',
                soDienThoai: customer?.soDienThoai ?? ''
            });
            //setHoaDon({ ...hoadon, idKhachHang: item?.id, idCheckIn: idCheckin });
        }
    };
    const changeCustomer = async (item: IList) => {
        setAnchorDropdownCustomer(null);
        setCustomerChosed({
            ...customerChosed,
            id: item?.id,
            maKhachHang: item?.maKhachHang ?? '',
            tenKhachHang: item?.text ?? 'Chưa chọn khách',
            soDienThoai: item?.text2 ?? '',
            conNo: item?.conNo,
            tenNhomKhach: item.nhomKhach,
            isShow: true
        });
        //setHoaDon({ ...hoadon, idKhachHang: item?.id, idCheckIn: idCheckin });
    };

    const removeItem = (id: string) => {
        setListHangHoa((prev) => prev.filter((x) => x.id !== id));
    };
    const showModalAddCustomer = () => {
        setIsShowModalAddCus(true);
        setNewCus({
            ...newCus,
            id: Guid.EMPTY,
            maKhachHang: '',
            tenKhachHang: '',
            soDienThoai: '',
            diaChi: '',
            idNhomKhach: '',
            idNguonKhach: '',
            gioiTinhNam: false,
            moTa: '',
            idLoaiKhach: 1
        });
    };
    // mở lại phiếu đang tạm lưu: /nhap-hang/tao-moi?id=...
    useEffect(() => {
        const id = searchParams.get('id');
        if (id) {
            loadPhieuTamLuu(id);
        }
    }, []);
    const loadPhieuTamLuu = async (id: string) => {
        const phieu = await KhoHangService.GetPhieuKho(id);
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
        setCustomerChosed(
            phieu.idKhachHang
                ? ({
                      id: phieu.idKhachHang,
                      maKhachHang: phieu.maKhachHang ?? '',
                      tenKhachHang: phieu.tenKhachHang ?? '',
                      soDienThoai: phieu.soDienThoai ?? ''
                  } as CreateOrEditKhachHangDto)
                : ({} as CreateOrEditKhachHangDto)
        );
        setListHangHoa(phieu.chiTiet.map((ct) => toDongHang(ct)));
    };

    // 1 dòng chi tiết (từ phiếu đã lưu hoặc từ file Excel) -> 1 dòng trên lưới
    const toDongHang = (ct: PhieuKhoViewChiTietDto): IHangHoa => {
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

    // nhập Excel: file sai mẫu / có lỗi thì hiện bảng lỗi, không thêm dòng nào
    const [isShowImport, setIsShowImport] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [lstErrImport, setLstErrImport] = useState<BangBaoLoiFileimportDto[]>([]);
    const downloadImportTemplate = async () => {
        const result = await uploadFileService.downloadImportTemplate('PhieuNhapHang_ImportTemplate.xlsx');
        fileDowloadService.downloadExportFile(result);
    };
    const importExcel = async (input: FileUpload) => {
        setIsImporting(true);
        try {
            const data = await KhoHangService.ImportChiTietPhieuNhap(input);
            if (data?.errors?.length > 0) {
                setLstErrImport(data.errors);
                return;
            }
            // gộp vào phiếu: hàng hóa đã có thì cộng số lượng; máy trùng IMEI với dòng đang có thì bỏ qua
            let soMayTrung = 0;
            const next = [...listHangHoa];
            for (const ct of data?.chiTiet ?? []) {
                const dong = toDongHang(ct);
                if (dong.dienThoai) {
                    if (next.some((x) => x.dienThoai?.imel === dong.dienThoai?.imel)) {
                        soMayTrung++;
                        continue;
                    }
                    next.push(dong);
                    continue;
                }
                const idx = next.findIndex((x) => !x.dienThoai && x.id === dong.id);
                if (idx > -1) {
                    next[idx] = { ...next[idx], soLuong: next[idx].soLuong + dong.soLuong, donGia: dong.donGia };
                } else {
                    next.push(dong);
                }
            }
            setListHangHoa(next);
            setIsShowImport(false);
            enqueueSnackbar(
                `Đã thêm ${data?.chiTiet?.length ?? 0} dòng từ file Excel` +
                    (soMayTrung > 0 ? `, bỏ qua ${soMayTrung} máy trùng IMEI trên phiếu` : ''),
                { variant: 'success' }
            );
        } finally {
            setIsImporting(false);
        }
    };

    // in theo dữ liệu đang nhập trên màn hình (chưa cần lưu)
    const inNhap = async () => {
        if (listHangHoa.length === 0) {
            enqueueSnackbar('Phiếu nhập chưa có hàng hóa', { variant: 'warning' });
            return;
        }
        const tongTienChuaCK = listHangHoa.reduce((prev, item) => prev + item.soLuong * item.donGia, 0);
        const phieu: PhieuKhoViewDto = {
            id: idPhieu ?? '',
            idLoaiChungTu: LoaiChungTu.NHAP_HANG,
            maHoaDon: maPhieu,
            ngayLapHoaDon: new Date().toISOString(),
            trangThai: 1,
            tenChiNhanh: appContext?.chinhanhCurrent?.tenChiNhanh ?? '',
            tenKhachHang: customerChosed?.tenKhachHang ?? '',
            soDienThoai: customerChosed?.soDienThoai ?? '',
            ghiChuHD: ghiChu,
            tongTienHangChuaChietKhau: tongTienChuaCK,
            tongChietKhauHangHoa: tongTienChuaCK - tongTienHang,
            tongTienHang: tongTienHang,
            tongThanhToan: tongTienHang,
            daThanhToan: soTienThanhToan,
            conNo: conNo,
            chiTiet: listHangHoa.map((item, index) => ({
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
                dienThoai: item.dienThoai ? { tenHangHoa: item.dienThoai.tenHangHoa, imel: item.dienThoai.imel } : null
            }))
        };
        await inPhieuNhap([phieu], appContext.congty);
    };

    // trangThai: 1.Lưu tạm (chưa nhập kho, chưa chi tiền), 3.Hoàn thành
    const savePhieuNhap = async (trangThai: number) => {
        if (isSavingHoaDon) return;

        setIsSavingHoaDon(true);
        try {
            if (listHangHoa.length === 0) {
                enqueueSnackbar('Phiếu nhập chưa có hàng hóa', { variant: 'warning' });
                return;
            }
            const laHoanThanh = trangThai === 3;
            if (laHoanThanh && (soTienThanhToan < 0 || soTienThanhToan > tongTienHang)) {
                enqueueSnackbar('Số tiền thanh toán phải từ 0 đến số tiền cần trả', { variant: 'warning' });
                return;
            }
            if (
                laHoanThanh &&
                hinhThucThanhToan === HINH_THUC_THANH_TOAN.CHUYEN_KHOAN &&
                soTienThanhToan > 0 &&
                !idTaiKhoanNganHang
            ) {
                enqueueSnackbar('Vui lòng chọn tài khoản ngân hàng', { variant: 'warning' });
                return;
            }
            const tongTienChuaCK = listHangHoa.reduce((prev, item) => prev + item.soLuong * item.donGia, 0);

            // tồn kho, giá vốn bình quân, phiếu chi trả nhà cung cấp do Backend tạo khi phiếu hoàn thành
            const hoadonDB = await KhoHangService.SavePhieuKho({
                id: idPhieu,
                idLoaiChungTu: LoaiChungTu.NHAP_HANG,
                idChiNhanh: idChiNhanhChosed ?? null,
                idKhachHang: customerChosed?.id ?? null,
                ngayLapHoaDon: new Date().toISOString(),
                ghiChuHD: ghiChu,
                trangThai: trangThai,
                tongTienHangChuaChietKhau: tongTienChuaCK,
                tongChietKhauHangHoa: tongTienChuaCK - tongTienHang,
                tongTienHang: tongTienHang,
                tongThanhToan: tongTienHang,
                hinhThucThanhToan: soTienThanhToan > 0 ? hinhThucThanhToan : HINH_THUC_NO,
                soTienThanhToan: soTienThanhToan,
                idTaiKhoanNganHang: idTaiKhoanNganHang,
                chiTiet: listHangHoa.map((item) => {
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

            if (hoadonDB != null && !laHoanThanh) {
                // lưu tạm: giữ nguyên màn hình để nhập tiếp, các lần lưu sau cập nhật đúng phiếu này
                setIdPhieu(hoadonDB.id);
                setMaPhieu(hoadonDB.maHoaDon ?? '');
                setSearchParams({ id: hoadonDB.id });
                enqueueSnackbar(`Đã lưu tạm phiếu nhập ${hoadonDB.maHoaDon ?? ''}`, { variant: 'success' });
                return hoadonDB;
            }
            if (hoadonDB != null) {
                enqueueSnackbar(`Hoàn thành phiếu nhập ${hoadonDB.maHoaDon ?? ''}`, { variant: 'success' });

                setIdPhieu(null);
                setMaPhieu('');
                setSearchParams({});
                setListHangHoa([]);

                setSoTienThanhToan(0);
                setHinhThucThanhToan(HINH_THUC_THANH_TOAN.TIEN_MAT);
                setIdTaiKhoanNganHang(null);

                setCustomerChosed({} as CreateOrEditKhachHangDto);
                setGhiChu('');

                return hoadonDB;
            }
        } catch (error: any) {
            console.log(error);

            const message =
                error?.response?.data?.error?.details || error?.response?.data?.error?.message || error?.message;

            console.error('Lỗi lưu phiếu nhập:', message);
            // lỗi từ Backend đã được httpService hiển thị; chỉ báo khi không có phản hồi (mất mạng, timeout)
            if (!error?.response) {
                enqueueSnackbar(message || 'Lưu phiếu nhập thất bại', { variant: 'error' });
            }
        } finally {
            setIsSavingHoaDon(false);
        }
    };
    const columns: GridColDef[] = [
        {
            field: 'maHang',
            headerName: 'Mã hàng',
            width: 140,
            sortable: false,
            renderCell: (params) => (
                <Typography
                    sx={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: 'var(--color-main)'
                    }}>
                    {params.row.maHang}
                </Typography>
            )
        },

        {
            field: 'tenHang',
            headerName: 'Tên hàng',
            flex: 1,
            minWidth: 260,
            sortable: false,
            renderCell: (params) => (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        height: '100%'
                    }}>
                    <Typography
                        noWrap
                        sx={{
                            fontSize: 14,
                            fontWeight: 700
                        }}>
                        {params.row.tenHang}
                    </Typography>

                    {params.row.dienThoai ? (
                        <Typography noWrap sx={{ fontSize: 11, color: '#6b7280' }}>
                            IMEI: {params.row.dienThoai.imel}
                            {params.row.dienThoai.mau ? ` · ${params.row.dienThoai.mau}` : ''}
                            {params.row.dienThoai.dungLuong ? ` · ${params.row.dienThoai.dungLuong}GB` : ''}
                            {params.row.dienThoai.pin ? ` · Pin ${params.row.dienThoai.pin}%` : ''}
                        </Typography>
                    ) : (
                        <Typography
                            sx={{
                                fontSize: 11,
                                color: '#9ca3af'
                            }}>
                            {params.row.ghiChu || '✎ Ghi chú'}
                        </Typography>
                    )}
                </Box>
            )
        },

        {
            field: 'soLuong',
            headerName: 'Số lượng',
            width: 150,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) =>
                params.row.dienThoai ? (
                    // điện thoại: mỗi dòng 1 máy
                    <Typography sx={{ fontWeight: 700, fontSize: 13 }}>1</Typography>
                ) : (
                    <Stack
                        direction="row"
                        alignItems="center"
                        sx={{
                            border: '1px solid #dbe2ea',
                            borderRadius: 1.5,
                            overflow: 'hidden',
                            height: 36
                        }}>
                        <IconButton size="small" onClick={() => updateSoLuong(params.row.id, params.row.soLuong - 1)}>
                            <RemoveIcon sx={{ fontSize: 16 }} />
                        </IconButton>

                        <Box
                            sx={{
                                width: 40,
                                textAlign: 'center',
                                fontWeight: 700,
                                fontSize: 13
                            }}>
                            {params.row.soLuong}
                        </Box>

                        <IconButton size="small" onClick={() => updateSoLuong(params.row.id, params.row.soLuong + 1)}>
                            <AddIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    </Stack>
                )
        },

        {
            field: 'donGia',
            headerName: 'Đơn giá',
            width: 150,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <TextField
                    size="small"
                    value={formatMoney(params.row.donGia)}
                    onChange={(e) => {
                        const rawValue = e.target.value.replace(/\./g, '').replace(/,/g, '');

                        updateDonGia(params.row.id, Number(rawValue || 0));
                    }}
                    sx={{
                        width: 120,
                        '& .MuiInputBase-root': {
                            height: 36,
                            fontSize: 13
                        },
                        '& input': {
                            textAlign: 'right',
                            fontWeight: 600
                        }
                    }}
                />
            )
        },

        {
            field: 'giamGia',
            headerName: 'Giảm giá',
            width: 140,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <TextField
                    size="small"
                    value={formatMoney(params.row.giamGia)}
                    onChange={(e) => {
                        const rawValue = e.target.value.replace(/\./g, '').replace(/,/g, '');

                        updateGiamGia(params.row.id, Number(rawValue || 0));
                    }}
                    sx={{
                        width: 110,
                        '& .MuiInputBase-root': {
                            height: 36,
                            fontSize: 13
                        },
                        '& input': {
                            textAlign: 'right',
                            fontWeight: 600
                        }
                    }}
                />
            )
        },

        {
            field: 'thanhTien',
            headerName: 'Thành tiền',
            width: 170,
            sortable: false,
            align: 'right',
            headerAlign: 'right',
            renderCell: (params) => {
                const thanhTien = params.row.soLuong * params.row.donGia - params.row.giamGia;

                return (
                    <Typography
                        sx={{
                            width: '100%',
                            textAlign: 'right',
                            fontSize: 14,
                            fontWeight: 800
                        }}>
                        {formatMoney(thanhTien)}
                    </Typography>
                );
            }
        },

        {
            field: 'action',
            headerName: '',
            width: 60,
            sortable: false,
            renderCell: (params) => (
                <IconButton
                    size="small"
                    onClick={() => removeItem(params.row.id)}
                    sx={{
                        color: '#9ca3af',
                        '&:hover': {
                            backgroundColor: '#fee2e2',
                            color: '#dc2626'
                        }
                    }}>
                    <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                </IconButton>
            )
        }
    ];

    return (
        <>
            <CreateOrEditCustomerDialog
                visible={isShowModalAddCus}
                onCancel={() => setIsShowModalAddCus(false)}
                onOk={changeCustomer_fromModalAdd}
                title="Thêm mới khách hàng"
                formRef={newCus}
            />
            <ImportExcel
                tieude={'Nhập chi tiết phiếu nhập từ Excel'}
                isOpen={isShowImport}
                isImporting={isImporting}
                onClose={() => setIsShowImport(false)}
                downloadImportTemplate={downloadImportTemplate}
                importFile={importExcel}
            />
            <BangBaoLoiFileImport
                isOpen={lstErrImport.length > 0}
                lstError={lstErrImport}
                onClose={() => setLstErrImport([])}
                clickImport={() => setLstErrImport([])}
            />
            <ModalNhapDienThoai
                open={isShowModalDienThoai}
                onClose={() => setIsShowModalDienThoai(false)}
                onAdd={addDienThoai}
                imeiDaCo={listHangHoa.filter((x) => x.dienThoai).map((x) => x.dienThoai?.imel ?? '')}
            />
            <MenuWithDataFromDB
                open={expandSearchCus}
                anchorEl={anchorDropdownCustomer}
                handleClose={() => {
                    setAnchorDropdownCustomer(null);
                    setExpandSearchCus(false);
                }}
                typeSearch={TypeSearchfromDB.CUSTOMER}
                handleChoseItem={changeCustomer}
            />
            <Box
                sx={{
                    background: '#f5f6fa',
                    minHeight: '100vh',
                    p: 2
                }}>
                {/* HEADER */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 1,
                        borderRadius: 2,
                        mb: 2
                    }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <IconButton onClick={() => navigate('/nhap-hangs')}>
                            <ArrowBackIcon />
                        </IconButton>

                        <Typography
                            sx={{
                                fontWeight: 800,
                                fontSize: 18
                            }}>
                            {maPhieu ? `Phiếu nhập hàng ${maPhieu} (tạm lưu)` : 'Phiếu nhập hàng'}
                        </Typography>
                    </Stack>
                </Paper>

                <Grid container spacing={2}>
                    {/* LEFT */}
                    <Grid item xs={12} md={9}>
                        <Paper
                            elevation={0}
                            sx={{
                                borderRadius: 2,
                                overflow: 'hidden'
                            }}>
                            {/* SEARCH */}
                            <Box
                                sx={{
                                    p: 1,
                                    borderBottom: '1px solid #edf0f5'
                                }}>
                                <Stack direction="row" spacing={1}>
                                    <Autocomplete
                                        fullWidth
                                        options={listSearch}
                                        loading={loading}
                                        filterOptions={(x) => x}
                                        getOptionLabel={(option) =>
                                            `${option.maHangHoa ?? ''} - ${option.tenHangHoa ?? ''}`
                                        }
                                        onInputChange={(_, value) => {
                                            getListHangHoa(value);
                                        }}
                                        onChange={(_, value) => {
                                            if (value) {
                                                addHangHoa(value);
                                            }
                                        }}
                                        renderOption={(props, option) => (
                                            <li {...props}>
                                                <Box
                                                    sx={{
                                                        width: '100%',
                                                        py: 0.5
                                                    }}>
                                                    <Typography
                                                        sx={{
                                                            fontSize: 14,
                                                            fontWeight: 700,
                                                            color: '#111827'
                                                        }}>
                                                        {option.tenHangHoa}
                                                    </Typography>

                                                    <Stack
                                                        direction="row"
                                                        spacing={1.5}
                                                        sx={{
                                                            mt: 0.5,
                                                            flexWrap: 'wrap'
                                                        }}>
                                                        <Typography
                                                            sx={{
                                                                fontSize: 12,
                                                                color: '#6b7280'
                                                            }}>
                                                            Mã: {option.maHangHoa}
                                                        </Typography>

                                                        <Typography
                                                            sx={{
                                                                fontSize: 12,
                                                                color: '#16a34a',
                                                                fontWeight: 700
                                                            }}>
                                                            Giá: {formatMoney(option.giaBan || 0)}
                                                        </Typography>

                                                        <Typography
                                                            sx={{
                                                                fontSize: 12,
                                                                color: '#2563eb'
                                                            }}>
                                                            Tồn:{option.soLuongTon}
                                                        </Typography>
                                                    </Stack>
                                                </Box>
                                            </li>
                                        )}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                size="small"
                                                placeholder="Tìm hàng hóa theo mã hoặc tên"
                                                InputProps={{
                                                    ...params.InputProps,
                                                    startAdornment: (
                                                        <>
                                                            <InputAdornment position="start">
                                                                <SearchIcon
                                                                    sx={{
                                                                        fontSize: 20
                                                                    }}
                                                                />
                                                            </InputAdornment>

                                                            {params.InputProps.startAdornment}
                                                        </>
                                                    )
                                                }}
                                                sx={{
                                                    '& .MuiInputBase-root': {
                                                        height: 42,
                                                        fontSize: 14,
                                                        fontWeight: 600
                                                    }
                                                }}
                                            />
                                        )}
                                    />

                                    <Button
                                        variant="outlined"
                                        startIcon={<UploadFileIcon sx={{ fontSize: 20 }} />}
                                        onClick={() => setIsShowImport(true)}
                                        sx={{
                                            height: 42,
                                            px: 2,
                                            whiteSpace: 'nowrap',
                                            textTransform: 'none',
                                            fontWeight: 700,
                                            fontSize: 14,
                                            borderWidth: '1.5px',
                                            borderColor: '#dbe2ea',
                                            color: '#374151'
                                        }}>
                                        Nhập Excel
                                    </Button>

                                    <Button
                                        variant="contained"
                                        startIcon={<AddIcon sx={{ fontSize: 20 }} />}
                                        sx={{
                                            height: 42,
                                            px: 2.5,
                                            whiteSpace: 'nowrap',
                                            textTransform: 'none',
                                            fontWeight: 800,
                                            fontSize: 14,
                                            boxShadow: 'none',
                                            '&:hover': {
                                                boxShadow: 'none'
                                            }
                                        }}>
                                        Hàng hóa
                                    </Button>

                                    <Button
                                        variant="contained"
                                        startIcon={<PhoneIphoneIcon sx={{ fontSize: 20 }} />}
                                        onClick={() => setIsShowModalDienThoai(true)}
                                        sx={{
                                            height: 42,
                                            px: 2.5,
                                            whiteSpace: 'nowrap',
                                            textTransform: 'none',
                                            fontWeight: 800,
                                            fontSize: 14,
                                            boxShadow: 'none',
                                            '&:hover': {
                                                boxShadow: 'none'
                                            }
                                        }}>
                                        Điện thoại
                                    </Button>
                                </Stack>
                            </Box>

                            {/* GRID */}
                            <DataGrid
                                autoHeight
                                rows={listHangHoa}
                                columns={columns}
                                hideFooter
                                disableRowSelectionOnClick
                                rowHeight={64}
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
                                    },
                                    '& .MuiDataGrid-row:hover': {
                                        backgroundColor: '#fafafa'
                                    }
                                }}
                            />
                        </Paper>
                    </Grid>

                    {/* RIGHT */}
                    <Grid item xs={12} md={3}>
                        <Paper
                            elevation={0}
                            sx={{
                                borderRadius: 2,
                                p: 2,
                                position: 'sticky',
                                top: 16
                            }}>
                            <Typography
                                sx={{
                                    fontWeight: 800,
                                    mb: 2
                                }}>
                                Thông tin phiếu nhập
                            </Typography>

                            <Stack direction="row" spacing={1} sx={{ mb: 3, alignItems: 'center' }}>
                                <TextField
                                    fullWidth
                                    placeholder="Tìm nhà cung cấp"
                                    size="small"
                                    value={customerChosed?.tenKhachHang ?? ''}
                                    InputProps={{ readOnly: true }}
                                    onClick={(e) => {
                                        setAnchorDropdownCustomer(e.currentTarget);
                                        setExpandSearchCus(true);
                                    }}
                                    sx={{
                                        '& .MuiInputBase-root': {
                                            height: 40,
                                            fontSize: 13
                                        }
                                    }}
                                />

                                <Tooltip title="Thêm nhà cung cấp">
                                    <IconButton
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            backgroundColor: 'var(--color-main)',
                                            color: '#fff',
                                            borderRadius: 1,
                                            '&:hover': {
                                                backgroundColor: 'var(--color-main-dark)'
                                            }
                                        }}
                                        onClick={showModalAddCustomer}>
                                        <AddIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                                <Typography>Ngày tạo</Typography>

                                <Typography fontWeight={700}>{new Date().toLocaleString('vi-VN')}</Typography>
                            </Stack>

                            <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                                <Typography>Tổng tiền hàng</Typography>

                                <Typography fontWeight={800}>{formatMoney(tongTienHang)}</Typography>
                            </Stack>

                            <Divider sx={{ my: 2 }} />

                            <Stack direction="row" justifyContent="space-between" sx={{ mb: 3 }}>
                                <Typography
                                    sx={{
                                        fontWeight: 800,
                                        fontSize: 16
                                    }}>
                                    Cần trả nhà cung cấp
                                </Typography>

                                <Typography
                                    sx={{
                                        fontWeight: 800,
                                        color: 'var(--color-main)',
                                        fontSize: 24
                                    }}>
                                    {formatMoney(tongTienHang)}
                                </Typography>
                            </Stack>
                            <Box sx={{ mb: 2 }}>
                                <Typography
                                    sx={{
                                        mb: 1,
                                        fontWeight: 600
                                    }}>
                                    Hình thức thanh toán
                                </Typography>

                                <Select
                                    fullWidth
                                    size="small"
                                    value={hinhThucThanhToan}
                                    onChange={(e) => changeHinhThucThanhToan(Number(e.target.value))}>
                                    <MenuItem value={HINH_THUC_THANH_TOAN.TIEN_MAT}>Tiền mặt</MenuItem>
                                    <MenuItem value={HINH_THUC_THANH_TOAN.CHUYEN_KHOAN}>Chuyển khoản</MenuItem>
                                    <MenuItem value={HINH_THUC_NO}>Nợ</MenuItem>
                                </Select>
                            </Box>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                <Typography
                                    sx={{
                                        fontWeight: 500,
                                        fontSize: 13
                                    }}>
                                    Số tiền thanh toán
                                </Typography>

                                <TextField
                                    value={formatMoney(soTienThanhToan)}
                                    disabled={hinhThucThanhToan === HINH_THUC_NO}
                                    onChange={(e) => {
                                        const raw = e.target.value.replace(/\./g, '').replace(/,/g, '');
                                        const value = Number(raw || 0);
                                        // không trả quá số cần trả; phần còn lại là nợ nhà cung cấp
                                        setSoTienThanhToan(Number.isNaN(value) ? 0 : Math.min(value, tongTienHang));
                                    }}
                                    size="small"
                                    sx={{
                                        width: 160,
                                        '& input': {
                                            textAlign: 'right',
                                            fontSize: 13,
                                            fontWeight: 500
                                        }
                                    }}
                                />
                            </Stack>
                            {hinhThucThanhToan === HINH_THUC_THANH_TOAN.CHUYEN_KHOAN && (
                                <Box sx={{ mb: 2 }}>
                                    <AutocompleteAccountBank
                                        handleChoseItem={(item: TaiKhoanNganHangDto | null) =>
                                            setIdTaiKhoanNganHang(item?.id || null)
                                        }
                                        idChosed={idTaiKhoanNganHang}
                                        listOption={allBankAccount}
                                    />
                                </Box>
                            )}
                            <Stack direction="row" justifyContent="space-between" sx={{ mb: 3 }}>
                                <Typography sx={{ fontWeight: 500, fontSize: 13 }}>Còn nợ nhà cung cấp</Typography>
                                <Typography
                                    sx={{
                                        fontWeight: 700,
                                        fontSize: 13,
                                        color: conNo > 0 ? '#d32f2f' : 'inherit'
                                    }}>
                                    {formatMoney(conNo)}
                                </Typography>
                            </Stack>

                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                placeholder="Ghi chú nhập hàng..."
                                value={ghiChu}
                                onChange={(e) => setGhiChu(e.target.value)}
                            />

                            {/* BUTTON */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    gap: 1,
                                    mt: 2
                                }}>
                                <Button
                                    variant="contained"
                                    startIcon={<PrintIcon />}
                                    onClick={inNhap}
                                    sx={{
                                        flex: 3,
                                        backgroundColor: '#9e9e9e',
                                        color: '#fff',
                                        textTransform: 'none',
                                        fontWeight: 700,
                                        boxShadow: 'none',
                                        py: 1.2,
                                        '&:hover': {
                                            backgroundColor: '#757575',
                                            boxShadow: 'none'
                                        }
                                    }}>
                                    In nháp
                                </Button>

                                <Button
                                    variant="outlined"
                                    onClick={() => savePhieuNhap(1)}
                                    disabled={isSavingHoaDon}
                                    sx={{
                                        flex: 3,
                                        textTransform: 'none',
                                        fontWeight: 700,
                                        py: 1.2
                                    }}>
                                    Lưu tạm
                                </Button>

                                <Button
                                    variant="contained"
                                    startIcon={<SaveIcon />}
                                    onClick={() => savePhieuNhap(3)}
                                    disabled={isSavingHoaDon}
                                    sx={{
                                        flex: 5,
                                        backgroundColor: 'var(--color-main)',
                                        color: '#fff',
                                        textTransform: 'none',
                                        fontWeight: 800,
                                        boxShadow: 'none',
                                        py: 1.2,
                                        opacity: isSavingHoaDon ? 0.7 : 1,
                                        '&:hover': {
                                            backgroundColor: 'var(--color-main-dark)',
                                            boxShadow: 'none'
                                        }
                                    }}>
                                    {isSavingHoaDon ? 'Đang lưu...' : 'Hoàn thành'}
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </>
    );
};

export default Page_Them_Phieu_Nhap_Hang;
