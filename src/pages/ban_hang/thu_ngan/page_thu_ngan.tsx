import {
    Stack,
    Typography,
    Avatar,
    Grid,
    debounce,
    RadioGroup,
    FormControlLabel,
    Radio,
    TextField,
    IconButton,
    CircularProgress,
    Chip,
    Button,
    useMediaQuery,
    useTheme,
    Tooltip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MoreOutlinedIcon from '@mui/icons-material/MoreOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import CloseIcon from '@mui/icons-material/Close';
import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined';
import { useEffect, useRef, useState } from 'react';
import GroupProductService from '../../../services/product/GroupProductService';
import {
    IHangHoaGroupTheoNhomDto,
    ModelHangHoaDienThoaiDto,
    ModelHangHoaDto,
    ModelNhomHangHoa,
    PagedProductSearchDto
} from '../../../services/product/dto';
import { IList } from '../../../services/dto/IList';
import ProductService from '../../../services/product/ProductService';
import khachHangService from '../../../services/khach-hang/khachHangService';
import { Guid } from 'guid-typescript';
import { CreateOrEditKhachHangDto } from '../../../services/khach-hang/dto/CreateOrEditKhachHangDto';
import PageHoaDonChiTietDto from '../../../services/ban_hang/PageHoaDonChiTietDto';
import HoaDonChiTietDto from '../../../services/ban_hang/HoaDonChiTietDto';
import { NumericFormat } from 'react-number-format';
import PageHoaDonDto from '../../../services/ban_hang/PageHoaDonDto';
import DatePickerCustom from '../../../components/DatetimePicker/DatePickerCustom';
import PaymentsForm from './PaymentsForm';
import ConfirmDelete from '../../../components/AlertDialog/ConfirmDelete';
import SnackbarAlert from '../../../components/AlertDialog/SnackbarAlert';
import CreateOrEditCustomerDialog from '../../customer/components/create-or-edit-customer-modal';

import utils from '../../../utils/utils';
import { PropConfirmOKCancel, PropModal } from '../../../utils/PropParentToChild';
import SoQuyServices from '../../../services/so_quy/SoQuyServices';
import HoaDonService from '../../../services/ban_hang/HoaDonService';
import AppConsts, { LoaiChungTu, LoaiHangHoa, TrangThaiCheckin } from '../../../lib/appconst';
import nhatKyHoatDongService from '../../../services/nhat_ky_hoat_dong/nhatKyHoatDongService';
import { CreateNhatKyThaoTacDto } from '../../../services/nhat_ky_hoat_dong/dto/CreateNhatKyThaoTacDto';
import { format } from 'date-fns';
import MenuWithDataFromDB from '../../../components/Menu/MenuWithData_fromDB';
import { TypeSearchfromDB } from '../../../enum/TypeSearch_fromDB';
import { KhachHangDto } from '../../../services/khach-hang/dto/KhachHangDto';
import { dbDexie } from '../../../lib/dexie/dexieDB';
import CheckinService from '../../../services/check_in/CheckinService';
import { KHCheckInDto } from '../../../services/check_in/CheckinDto';
import TrangThaiBooking from '../../../enum/TrangThaiBooking';
import ModalSuDungGDV from '../../goi_dich_vu/modal_sudung_gdv';
import ChiTietSuDungGDVDto from '../../../services/ban_hang/ChiTietSuDungGDVDto';
import Loading from '../../../components/Loading';
import ModalEditChiTietGioHang from './modal_edit_chitiet';
import HoaHongNhanVienDichVu from '../../nhan_vien_thuc_hien/hoa_hong_nhan_vien_dich_vu';
import NhanVienThucHienDto from '../../../services/nhan_vien_thuc_hien/NhanVienThucHienDto';
import MauInServices from '../../../services/mau_in/MauInServices';
import cuaHangService from '../../../services/cua_hang/cuaHangService';
import { PagedRequestDto } from '../../../services/dto/pagedRequestDto';
import { CuaHangDto } from '../../../services/cua_hang/Dto/CuaHangDto';
import DataMauIn from '../../admin/settings/mau_in/DataMauIn';
import chiNhanhService from '../../../services/chi_nhanh/chiNhanhService';
import QuyHoaDonDto from '../../../services/so_quy/QuyHoaDonDto';
import uploadFileService from '../../../services/uploadFileService';
import { KhachHangItemDto } from '../../../services/khach-hang/dto/KhachHangItemDto';
import PopoverGiamGiaHD from '../../../components/Popover/GiamGiaHD';
import QuyChiTietDto from '../../../services/so_quy/QuyChiTietDto';
// import CreateOrEditSoQuyDialog from '../../thu_chi/so_quy/components/CreateOrEditSoQuyDialog';
import { HINH_THUC_THANH_TOAN, TypeAction, TrangThaiActive } from '../../../lib/appconst';
import { IPagedResultSoQuyDto } from '../../../services/so_quy/Dto/IPagedResultSoQuyDto';
import { ParamSearchSoQuyDto } from '../../../services/so_quy/Dto/ParamSearchSoQuyDto';
import Cookies from 'js-cookie';
import { lastDayOfMonth } from 'date-fns';
import customer from '../../customer';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { Box } from '@mui/system';
import MenuWithDataFromPhone from '../../../components/Menu/MenuWithData_formPhone';
import { IListPhone } from '../../../services/dto/IListPhone';
import Utils from '../../../utils/utils';
import { PagedResultDto } from '../../../services/dto/pagedResultDto';
import ModalHangHoaDienThoai from '../../dien_thoai/ModalPhone';
import ModalHangHoaDienThoaiSua from '../../dien_thoai/ModalDienThoaiSua';

import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import HandymanOutlinedIcon from '@mui/icons-material/HandymanOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import khachHangStore from '../../../stores/khachHangStore';

// icon loại hàng hóa hiển thị ở góc trên bên phải ô sản phẩm
const getIconLoaiHangHoa = (idLoaiHangHoa?: number) => {
    const sxIcon = { fontSize: 15 };
    switch (idLoaiHangHoa) {
        case LoaiHangHoa.HANG_HOA:
            return { title: 'Hàng hóa', icon: <Inventory2OutlinedIcon sx={sxIcon} /> };
        case LoaiHangHoa.DICH_VU:
            return { title: 'Dịch vụ', icon: <HandymanOutlinedIcon sx={sxIcon} /> };
        case LoaiHangHoa.COMBO:
            return { title: 'Combo', icon: <CategoryOutlinedIcon sx={sxIcon} /> };
        case LoaiHangHoa.DIEN_THOAI:
        case LoaiHangHoa.DIEN_THOAI_SUA:
            return { title: 'Điện thoại', icon: <PhoneIphoneIcon sx={sxIcon} /> };
        default:
            return null;
    }
};

export type IPropsPageThuNgan = {
    txtSearch: string;
    loaiHoaDon: number;
    customerIdChosed: string;
    phoneIdChosed: string;
    idChiNhanhChosed: string;
    onChangeSoLuongCheckIn: (value: number) => void;
    idInvoiceWaiting?: string;
    idCheckIn?: string;
    // Tăng dần MỖI KHI người dùng bấm tay đổi tab Hóa đơn bán/Hóa đơn sửa (không tăng khi
    // loaiHoaDon tự đổi theo do mở hóa đơn có sẵn từ check-in/hóa đơn chờ) - dùng để trigger reset.
    resetTrigger?: number;
    arrIdNhomHangFilter?: string[];
    onSetActiveTabLoaiHoaDon: (idLoaiChungTu: number) => void;
    onAddHoaDon_toCache: () => void;
    onRemoveHoaDon_toCache: () => void;
};

export default function PageThuNgan(props: IPropsPageThuNgan) {
    const {
        txtSearch,
        loaiHoaDon,
        onChangeSoLuongCheckIn,
        customerIdChosed,
        phoneIdChosed,
        idChiNhanhChosed,
        idInvoiceWaiting,
        idCheckIn,
        resetTrigger,
        arrIdNhomHangFilter,
        onSetActiveTabLoaiHoaDon,
        onAddHoaDon_toCache,
        onRemoveHoaDon_toCache
    } = props;
    const firstLoad = useRef(true);
    const firstLoad_changeLoaiHD = useRef(true);
    const firstLoad_resetTab = useRef(true);
    const firstLoad_changeIdInvoiceWaiting = useRef(true);
    // debounce tìm hàng hóa được hẹn giờ trước khi loaiHoaDon kịp đổi (cấu hình/hóa đơn chờ),
    // nên phải đọc giá trị mới nhất lúc chạy thay vì giá trị lúc hẹn.
    const loaiHoaDonRef = useRef(loaiHoaDon);
    loaiHoaDonRef.current = loaiHoaDon;
    const requestIdListHangHoa = useRef(0);
    const [anchorDropdownCustomer, setAnchorDropdownCustomer] = useState<null | HTMLElement>(null);
    const [anchorDropdownPhone, setAnchorDropdownPhone] = useState<null | HTMLElement>(null);
    const expandSearchCus = Boolean(anchorDropdownCustomer);
    const expandSearchCusPhone = Boolean(anchorDropdownPhone);

    const [anchorGiamGiaHD, setAnchorGiamGiaHD] = useState<null | HTMLElement | SVGElement>(null);
    const isShowPopoverGiamGia = Boolean(anchorGiamGiaHD);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    // Mobile: tách 2 màn hình - 'browse' (chọn dịch vụ/máy) và 'cart' (xem giỏ hàng + thanh toán).
    // Desktop vẫn hiển thị cả 2 phần cùng lúc như cũ, không phụ thuộc state này.
    const [mobileStep, setMobileStep] = useState<'browse' | 'cart'>('browse');

    const [isLoadingData, setIsLoadingData] = useState(false);
    const [isSavingHoaDon, setIsSavingHoaDon] = useState(false);
    const [customerHasGDV, setCustomerHasGDV] = useState(false);
    const [isThanhToanTienMat, setIsThanhToanTienMat] = useState(true);
    const [isShowModalSuDungGDV, setIsShowModalSuDungGDV] = useState(false);
    const [isShowEditGioHang, setIsShowEditGioHang] = useState(false);
    const [sumTienKhachTra, setSumTienKhachTra] = useState(0);
    //const [tienThuaTraKhach, setTienThuaTraKhach] = useState(0);
    const [objAlert, setObjAlert] = useState({ show: false, type: 1, mes: '' });
    const [propNVThucHien, setPropNVThucHien] = useState<PropModal>(new PropModal({ isShow: false, isNew: true }));

    const [arrIdNhomHangChosed, setArrIdNhomHangChosed] = useState<string[]>([]);
    const [nhomHangHoaChosed, setNhomHangHoaChosed] = useState<ModelNhomHangHoa[]>([]);
    const [listProduct, setListProduct] = useState<IHangHoaGroupTheoNhomDto[]>([]);
    const [isShowModalAddCus, setIsShowModalAddCus] = useState(false);
    const [newCus, setNewCus] = useState<CreateOrEditKhachHangDto>({} as CreateOrEditKhachHangDto);
    const [customerChosed, setCustomerChosed] = useState<CreateOrEditKhachHangDto>({} as CreateOrEditKhachHangDto);
    const [phoneChosed, setPhoneChosed] = useState<ModelHangHoaDienThoaiDto | null>(null);
    // sửa nhanh Nội dung / Lỗi trước sửa / Mật khẩu của máy sửa ngay trên thẻ máy
    const [phoneEditField, setPhoneEditField] = useState<'noiDung' | 'loi' | 'matKhau' | null>(null);
    const [phoneEditValue, setPhoneEditValue] = useState('');
    const cancelPhoneEdit = useRef(false);
    const [triggerModalProduct, setTriggerModalProduct] = useState<PropModal>(new PropModal({ isShow: false }));
    const [pageDataProduct, setPageDataProduct] = useState<PagedResultDto<ModelHangHoaDto>>({
        totalCount: 0,
        totalPage: 0,
        items: []
    });

    const [filterPageProduct, setFilterPageProduct] = useState<PagedProductSearchDto>({
        idNhomHangHoas: [],
        idLoaiHangHoa: 5,
        textSearch: '',
        currentPage: 1,
        pageSize: AppConsts.pageOption[0].value,
        columnSort: '',
        typeSort: ''
    });
    const [hoaDonChiTiet, setHoaDonChiTiet] = useState<PageHoaDonChiTietDto[]>([]);
    const [idCTHDChosing, setIdCTHDChosing] = useState('');
    const [hoadon, setHoaDon] = useState<PageHoaDonDto>(
        new PageHoaDonDto({
            idKhachHang: null,
            idLoaiChungTu: loaiHoaDon,
            tenKhachHang: 'Chưa chọn khách',
            idHangHoa: null,
            idChiNhanh: idChiNhanhChosed
        })
    );
    const [confirmDialog, setConfirmDialog] = useState<PropConfirmOKCancel>({
        show: false,
        title: '',
        type: 1,
        mes: ''
    });

    const GetListNhomHangHoa_byId = async (arrIdNhomHang: string[]) => {
        const list = await GroupProductService.GetListNhomHangHoa_byId(arrIdNhomHang);
        setNhomHangHoaChosed(list);
    };

    const BoChon1NhomHang = (idNhomHang: string) => {
        setArrIdNhomHangChosed(arrIdNhomHangChosed?.filter((x) => x !== idNhomHang));
        const arrIdNhom = arrIdNhomHangChosed?.filter((x) => x !== idNhomHang);
        GetListNhomHangHoa_byId(arrIdNhom ?? []);
        getListHangHoa_groupbyNhom(txtSearch, arrIdNhom ?? [], loaiHoaDon);
    };
    const BoChonAllNhomHang = () => {
        setArrIdNhomHangChosed([]);
        GetListNhomHangHoa_byId([]);
        getListHangHoa_groupbyNhom(txtSearch, [], loaiHoaDon);
    };

    const getListHangHoa_groupbyNhom = async (txtSearch: string, arrIdNhomHang: string[] = [], loaiHoaDon?: number) => {
        const requestId = ++requestIdListHangHoa.current;
        setIsLoadingData(true);
        const input = {
            IdNhomHangHoas: arrIdNhomHang,
            TextSearch: txtSearch,
            IdLoaiHangHoa: 0, // all
            CurrentPage: 0,
            idLoaiChungTu: loaiHoaDon,
            PageSize: 50
        } as PagedProductSearchDto;
        const data = await ProductService.GetDMHangHoa_groupByNhom(input);
        // Bỏ kết quả của request cũ về muộn, tránh ghi đè danh sách của request mới hơn.
        if (requestId !== requestIdListHangHoa.current) return;

        // Hóa đơn sửa: chỉ hiển thị hàng hóa/dịch vụ, không hiển thị Điện thoại (điện thoại để bán,
        // khác với máy sửa của khách - máy sửa chọn riêng ở khu vực thông tin khách/máy phía trên).
        const filteredData =
            loaiHoaDon === LoaiChungTu.HOA_DON_SUA_CHUA
                ? (data ?? [])
                      .map((nhom: IHangHoaGroupTheoNhomDto) => ({
                          ...nhom,
                          hangHoas: nhom.hangHoas?.filter(
                              (item) =>
                                  item.idLoaiHangHoa !== LoaiHangHoa.DIEN_THOAI &&
                                  item.idLoaiHangHoa !== LoaiHangHoa.DIEN_THOAI_SUA
                          )
                      }))
                      .filter((nhom: IHangHoaGroupTheoNhomDto) => (nhom.hangHoas?.length ?? 0) > 0)
                : data;
        setListProduct(filteredData);

        setIsLoadingData(false);
    };

    useEffect(() => {
        setArrIdNhomHangChosed(arrIdNhomHangFilter ?? []);

        if ((arrIdNhomHangFilter?.length ?? 0) > 0) {
            getListHangHoa_groupbyNhom(txtSearch, arrIdNhomHangFilter ?? [], loaiHoaDon);
            GetListNhomHangHoa_byId(arrIdNhomHangFilter ?? []);
        }
    }, [arrIdNhomHangFilter]);

    const GetInforCustomer_byId = async (cusId: string) => {
        const customer = await khachHangService.getDetailCustomerById(cusId);

        setCustomerChosed({
            ...customerChosed,
            id: customer?.id?.toString() ?? '',
            maKhachHang: customer?.maKhachHang ?? '',
            tenKhachHang: customer?.tenKhachHang ?? 'Khách lẻ',
            soDienThoai: customer?.soDienThoai ?? '',
            conNo: customer?.conNo,
            tenNhomKhach: customer?.tenNhomKhach,
            isShow: true
        });
    };

    const GetInforPhone_byId = async (cusId: string) => {
        const item = await ProductService.GetDetailProductPhone_byId(cusId);

        setPhoneChosed({
            ...phoneChosed,
            id: item?.id,
            idDonViQuyDoi: item?.idDonViQuyDoi,
            tenHangHoa: item?.tenHangHoa ?? '',
            tenNhomHang: item?.tenNhomHang ?? '',
            dungLuong: item?.dungLuong ?? 0,
            mau: item?.mau ?? '',
            matKhau: item?.matKhau ?? '',
            tenChu: item?.tenChu ?? '',
            noiDung: item?.noiDung ?? '',
            loi: item?.loi ?? '',
            pin: item?.pin ?? '',
            imel: item?.imel ?? '',
            idChuSoHuu: item?.idChuSoHuu ?? '',
            isShow: true
        });
    };

    const SetDataHoaDon_byIdWaiting = async () => {
        console.log('có chạy ở đây không');
        const hdCache = await dbDexie.hoaDon
            .where('id')
            .equals(idInvoiceWaiting ?? '')
            .toArray();
        if ((hdCache?.length ?? 0) > 0) {
            setHoaDon({
                ...hdCache[0]
            });
            setHoaDonChiTiet([...(hdCache[0]?.hoaDonChiTiet ?? [])]);
            setPhoneChosed(null);
            await GetInforCustomer_byId(hdCache[0]?.idKhachHang ?? Guid.EMPTY);

            onSetActiveTabLoaiHoaDon(hdCache[0]?.idLoaiChungTu ?? loaiHoaDon);
        } else {
            // Không có hóa đơn chờ: giữ loại hóa đơn (tab) đang chọn, không ép về Hóa đơn bán
            // (shop có thể đã tắt Hóa đơn bán).
            setHoaDon({
                ...hoadon,
                idKhachHang: '',
                idChiNhanh: idChiNhanhChosed,
                idLoaiChungTu: loaiHoaDon
            });
            setHoaDonChiTiet([]);
        }
    };

    const InitData_forHoaDon = async () => {
        const idCheckInNew = idCheckIn ?? Guid.EMPTY;

        // idCheckIn = Guid.EMPTY nghĩa là "chưa gắn với lần check-in cụ thể nào" - có thể có
        // nhiều hóa đơn nháp khác nhau cùng mang giá trị này trong cache (Dexie), nên KHÔNG được
        // dùng nó để tra hóa đơn (nếu không sẽ lấy nhầm hóa đơn của khách khác - "nhảy hóa đơn linh tinh").
        // Chỉ tra theo idCheckIn khi đó là 1 lần check-in thực sự (id cụ thể, luôn ứng với đúng 1 hóa đơn).
        if (idCheckInNew !== Guid.EMPTY) {
            const hdCache = await dbDexie.hoaDon
                .where('idCheckIn')
                .equals(idCheckInNew)
                .and((x) => x.idChiNhanh === idChiNhanhChosed)
                .toArray();
            if (hdCache?.length > 0) {
                setHoaDon({
                    ...hdCache[0],
                    idHangHoa: phoneIdChosed ?? hdCache[0]?.idHangHoa
                });
                setHoaDonChiTiet([...(hdCache[0]?.hoaDonChiTiet ?? [])]);
                onSetActiveTabLoaiHoaDon(hdCache[0]?.idLoaiChungTu ?? LoaiChungTu.HOA_DON_BAN_LE);
                return;
            }
        }

        // Không có hóa đơn nháp nào cho lần check-in này - giữ nguyên loại hóa đơn (tab) đang chọn,
        // KHÔNG ép về Hóa đơn bán (trước đây ép cứng về đây, sai khi shop chỉ bật Hóa đơn sửa).
        onSetActiveTabLoaiHoaDon(loaiHoaDon);

        setHoaDon({
            ...hoadon,
            idKhachHang: customerIdChosed,
            idHangHoa: phoneIdChosed,
            idChiNhanh: idChiNhanhChosed,
            idLoaiChungTu: loaiHoaDon,
            idCheckIn: idCheckInNew
        });
    };

    const AddHD_toCache_IfNotExists = async () => {
        // add to cache if not exists
        const hdExist = await dbDexie.hoaDon.where('id').equals(hoadon?.id).toArray();
        if (hdExist?.length == 0) {
            const dataHD: PageHoaDonDto = {
                ...hoadon,
                idKhachHang: hoadon?.idKhachHang ?? Guid.EMPTY,
                idChiNhanh: hoadon?.idChiNhanh ?? idChiNhanhChosed,
                idLoaiChungTu: hoadon.idLoaiChungTu,
                idCheckIn: hoadon?.idCheckIn ?? Guid.EMPTY
            };
            await dbDexie.hoaDon.add(dataHD);
            onAddHoaDon_toCache();
        }
    };

    const AgreeChangeLoaiHoaDon = async () => {
        setHoaDon({ ...hoadon, idLoaiChungTu: loaiHoaDon });

        await dbDexie.hoaDon
            .where('id')
            .equals(hoadon?.id)
            .modify((o: PageHoaDonDto) => (o.idLoaiChungTu = loaiHoaDon));
    };

    const ChangeLoaiHoaDon = async () => {
        if (loaiHoaDon !== LoaiChungTu.HOA_DON_BAN_LE) {
            const check = CheckDangSuDungGDV(2);
            if (!check) {
                return;
            }
        }

        // await AgreeChangeLoaiHoaDon();
    };

    const ResetHoaDon_forNewTab = () => {
        setHoaDon(
            new PageHoaDonDto({
                idLoaiChungTu: loaiHoaDon,
                idChiNhanh: idChiNhanhChosed,
                maKhachHang: 'KL',
                tenKhachHang: 'Chưa chọn khách',
                tenHangHoa: 'chưa chọn hàng hóa'
            })
        );
        setHoaDonChiTiet([]);
        setCustomerChosed({} as CreateOrEditKhachHangDto);
        setPhoneChosed(null);
    };

    useEffect(() => {
        InitData_forHoaDon();
    }, [idChiNhanhChosed, idCheckIn, customerIdChosed, phoneIdChosed]);

    useEffect(() => {
        // Mobile: chỉ quay về màn hình chọn dịch vụ khi chuyển sang 1 hóa đơn khác (hóa đơn đang chờ),
        // KHÔNG reset khi chỉ đổi tab Hóa đơn bán/Hóa đơn sửa (đang xem hóa đơn hiện tại) - tránh mất
        // luồng đang xem (giỏ hàng/thanh toán) một cách bất ngờ.
        setMobileStep('browse');
    }, [idInvoiceWaiting]);

    useEffect(() => {
        // update loaiHoaDon if change tab
        if (firstLoad_changeLoaiHD.current) {
            firstLoad_changeLoaiHD.current = false;
            return;
        }
        // Loại hóa đơn có thể tự đổi sau lần load đầu (cấu hình chỉ bật Hóa đơn sửa, mở hóa đơn chờ/check-in)
        // -> hóa đơn đang tạo phải mang đúng loại đó, không giữ loại mặc định (Hóa đơn bán) lúc khởi tạo.
        setHoaDon((prev) => ({ ...prev, idLoaiChungTu: loaiHoaDon }));
        ChangeLoaiHoaDon();
        getListHangHoa_groupbyNhom(txtSearch, arrIdNhomHangFilter, loaiHoaDon);
    }, [loaiHoaDon]);

    useEffect(() => {
        // Chỉ reset khi người dùng bấm tay đổi tab Hóa đơn bán/Hóa đơn sửa (resetTrigger tăng).
        // KHÔNG reset khi loaiHoaDon tự đổi theo do mở 1 hóa đơn có sẵn (từ check-in/hóa đơn chờ),
        // nếu không sẽ xóa mất thông tin khách/máy/giỏ hàng vừa được load lên.
        if (firstLoad_resetTab.current) {
            firstLoad_resetTab.current = false;
            return;
        }
        ResetHoaDon_forNewTab();
    }, [resetTrigger]);

    useEffect(() => {
        // get & set HD by IdInvoiceWaiting
        if (firstLoad_changeIdInvoiceWaiting.current) {
            firstLoad_changeIdInvoiceWaiting.current = false;
            return;
        }
        SetDataHoaDon_byIdWaiting();
    }, [idInvoiceWaiting]);

    useEffect(() => {
        if (customerIdChosed && phoneIdChosed) {
            GetInforCustomer_byId(customerIdChosed);
            GetInforPhone_byId(phoneIdChosed);
        } else if (customerIdChosed) {
            GetInforCustomer_byId(customerIdChosed);
        }
    }, [customerIdChosed, phoneIdChosed]);

    const PageLoad = () => {
        //
    };

    // Mobile: tóm tắt trực quan tối đa 3 dịch vụ đầu (tên + giá), dư thì gộp "+N dịch vụ khác"
    const MAX_MOBILE_SUMMARY_ITEMS = 3;
    const mobileSummaryItems = (hoaDonChiTiet ?? []).slice(0, MAX_MOBILE_SUMMARY_ITEMS);
    const mobileSummaryExtraCount = Math.max((hoaDonChiTiet?.length ?? 0) - MAX_MOBILE_SUMMARY_ITEMS, 0);
    const mobileSummaryText = mobileSummaryItems
        .map((item) => {
            const gia = Intl.NumberFormat('vi-VN').format(item?.thanhTienSauCK ?? item?.donGiaSauCK ?? 0);
            const soLuong = item?.soLuong && item.soLuong > 1 ? ` x${item.soLuong}` : '';
            return `${item?.tenHangHoa ?? ''}${soLuong} ${gia}đ`;
        })
        .join(', ')
        .concat(mobileSummaryExtraCount > 0 ? ` +${mobileSummaryExtraCount} dịch vụ khác` : '');

    const cthd_SumThanhTienTruocCK = hoaDonChiTiet?.reduce((prevValue: number, item: PageHoaDonChiTietDto) => {
        return (item?.thanhTienTruocCK ?? 0) + prevValue;
    }, 0);

    const cthd_SumTienChietKhau = hoaDonChiTiet?.reduce((prevValue: number, item: PageHoaDonChiTietDto) => {
        return (
            //  sudung gdv: chietkhau = 0
            (utils.checkNull_OrEmpty(item?.idChiTietHoaDon) ? item?.tienChietKhau ?? 0 : 0) * item.soLuong + prevValue
        );
    }, 0);
    const cthd_SumTienThue = hoaDonChiTiet?.reduce((prevValue: number, item: PageHoaDonChiTietDto) => {
        return (item?.tienThue ?? 0) * item.soLuong + prevValue;
    }, 0);

    const openPopoverGiamGia = (event: React.MouseEvent<HTMLElement | SVGElement>) => {
        setAnchorGiamGiaHD(event.currentTarget);
    };

    const closePopoverGiamGia = () => {
        setAnchorGiamGiaHD(null);
    };

    const changeGiamGiaHoaDon = async (ptGiamGia: number, tongGiamGia: number) => {
        const tongPhaiTra = (hoadon?.tongTienHDSauVAT ?? 0) - tongGiamGia;
        setSumTienKhachTra(tongPhaiTra);

        setHoaDon({
            ...hoadon,
            pTGiamGiaHD: ptGiamGia,
            tongGiamGiaHD: tongGiamGia,
            tongThanhToan: tongPhaiTra
        });

        dbDexie.hoaDon
            .where('id')
            .equals(hoadon?.id)
            .modify((o: PageHoaDonDto) => {
                o.pTGiamGiaHD = ptGiamGia;
                o.tongGiamGiaHD = tongGiamGia;
                o.tongThanhToan = tongPhaiTra;
            });
    };

    const showModalSuDungGDV = async () => {
        setIsShowModalSuDungGDV(true);
    };

    const GDV_CheckSuDungQuaBuoi = (lstChosed: ChiTietSuDungGDVDto[]) => {
        let tenDV = '';
        for (let index = 0; index < lstChosed.length; index++) {
            const element = lstChosed[index];
            // check exist cthd
            const itemCTHD = hoaDonChiTiet?.filter(
                (x) => x.idDonViQuyDoi === element?.idDonViQuyDoi && x.idChiTietHoaDon === element?.idChiTietHoaDon
            );
            if (itemCTHD?.length > 0) {
                if (itemCTHD[0]?.soLuong + 1 > element?.soLuongConLai) {
                    tenDV += element?.tenHangHoa + ', ';
                }
            }
        }
        if (!utils.checkNull(tenDV)) {
            setObjAlert({
                ...objAlert,
                show: true,
                type: 2,
                mes: `Dịch vụ ${utils.Remove_LastComma(tenDV)} vượt quá số buổi còn lại`
            });
            return false;
        }
        return true;
    };

    useEffect(() => {
        if (firstLoad.current) {
            firstLoad.current = false;
            return;
        }
        // change cthd --> update hoadon
        const sumThanhTienSauCK = cthd_SumThanhTienTruocCK - cthd_SumTienChietKhau;
        const sumThanhTienSauVAT = sumThanhTienSauCK - cthd_SumTienThue;
        const ptGiamGiaHD = sumThanhTienSauCK > 0 ? hoadon?.pTGiamGiaHD ?? 0 : 0;
        let tongGiamHD = sumThanhTienSauCK > 0 ? hoadon?.tongGiamGiaHD ?? 0 : 0;

        if (ptGiamGiaHD > 0) {
            tongGiamHD = (ptGiamGiaHD * sumThanhTienSauVAT) / 100;
        }
        const tongPhaiTra = sumThanhTienSauVAT - tongGiamHD;

        setSumTienKhachTra(tongPhaiTra);
        //setTienThuaTraKhach(0);
        setHoaDon({
            ...hoadon,
            pTGiamGiaHD: ptGiamGiaHD,
            tongGiamGiaHD: tongGiamHD,
            tongTienHangChuaChietKhau: cthd_SumThanhTienTruocCK,
            tongChietKhauHangHoa: cthd_SumTienChietKhau,
            tongTienHang: sumThanhTienSauCK,
            tongTienHDSauVAT: sumThanhTienSauVAT,
            tongThanhToan: tongPhaiTra
        });
        dbDexie.hoaDon
            .where('id')
            .equals(hoadon?.id)
            .modify((o: PageHoaDonDto) => {
                o.pTGiamGiaHD = ptGiamGiaHD;
                o.tongGiamGiaHD = tongGiamHD;
                o.tongTienHangChuaChietKhau = cthd_SumThanhTienTruocCK;
                o.tongChietKhauHangHoa = cthd_SumTienChietKhau;
                o.tongTienHang = sumThanhTienSauCK;
                o.tongTienHDSauVAT = sumThanhTienSauVAT;
                o.tongThanhToan = tongPhaiTra;
            });
    }, [cthd_SumThanhTienTruocCK, cthd_SumTienChietKhau, cthd_SumTienThue]);

    useEffect(() => {
        PageLoad();
    }, []);

    // only used when change textsearch
    const debounceSearchHangHoa = useRef(
        debounce(async (txtSearch: string) => {
            getListHangHoa_groupbyNhom(txtSearch, arrIdNhomHangChosed, loaiHoaDonRef.current);
        }, 500)
    ).current;

    useEffect(() => {
        debounceSearchHangHoa(txtSearch);
    }, [txtSearch]);

    const removeCTHD = async (item: HoaDonChiTietDto) => {
        setHoaDonChiTiet(hoaDonChiTiet?.filter((x) => x?.idDonViQuyDoi !== item?.idDonViQuyDoi));
        const cthd = hoaDonChiTiet?.filter((x) => x?.idDonViQuyDoi !== item?.idDonViQuyDoi);
        await UpdateCTHD_toCache([...cthd]);
    };

    const choseProduct = async (item: ModelHangHoaDto) => {
        await AddHD_toCache_IfNotExists();

        let cthdLast: PageHoaDonChiTietDto[] = [];
        const newCT = new PageHoaDonChiTietDto({
            idDonViQuyDoi: item?.idDonViQuyDoi as unknown as undefined,
            maHangHoa: item?.maHangHoa,
            tenHangHoa: item?.tenHangHoa,
            giaBan: item?.giaBan as undefined,
            idNhomHangHoa: item?.idNhomHangHoa as undefined,
            idHangHoa: item?.id as undefined,
            soLuong: 1,
            imel: item?.imel,
            mau: item?.mau,
            expanded: false,
            idLoaiHangHoa: item?.idLoaiHangHoa as unknown as undefined
        });
        const itemCTHD = hoaDonChiTiet?.filter(
            (x) => x.idDonViQuyDoi === item.idDonViQuyDoi && utils.checkNull_OrEmpty(x.idChiTietHoaDon)
        );
        if (itemCTHD?.length > 0) {
            const slNew = itemCTHD[0].soLuong + 1;
            newCT.id = itemCTHD[0].id;
            newCT.soLuong = slNew;
            newCT.giaBan = itemCTHD[0]?.giaBan ?? 0;
            newCT.ptChietKhau = itemCTHD[0]?.ptChietKhau ?? 0;
            newCT.ptThue = itemCTHD[0]?.ptThue ?? 0;
            if (newCT.ptChietKhau > 0) {
                newCT.tienChietKhau = (newCT.ptChietKhau * newCT.giaBan) / 100;
            } else {
                newCT.tienChietKhau = itemCTHD[0]?.tienChietKhau ?? 0;
            }
            if (newCT.ptThue > 0) {
                newCT.tienThue = (newCT.ptThue * (newCT?.donGiaSauCK ?? 0)) / 100;
            } else {
                newCT.tienThue = itemCTHD[0]?.tienChietKhau ?? 0;
            }

            newCT.nhanVienThucHien = newCT.nhanVienThucHien?.map((nv) => {
                if (nv.ptChietKhau > 0) {
                    return {
                        ...nv,
                        tienChietKhau: (nv.ptChietKhau * (newCT?.thanhTienSauCK ?? 0)) / 100
                    };
                } else {
                    return {
                        ...nv,
                        // tienCK/soluongOld * slNew
                        tienChietKhau: (nv.tienChietKhau / itemCTHD[0].soLuong) * newCT.soLuong
                    };
                }
            });

            // remove & add again
            const arrConLai = hoaDonChiTiet?.filter(
                (x) =>
                    (x.idDonViQuyDoi === item.idDonViQuyDoi && !utils.checkNull_OrEmpty(x.idChiTietHoaDon)) ||
                    x.idDonViQuyDoi !== item.idDonViQuyDoi
            );
            setHoaDonChiTiet([newCT, ...arrConLai]);

            cthdLast = [newCT, ...arrConLai];
        } else {
            setHoaDonChiTiet([newCT, ...hoaDonChiTiet]);
            cthdLast = [newCT, ...hoaDonChiTiet];
        }

        await UpdateCTHD_toCache(cthdLast);
    };

    const UpdateCTHD_toCache = async (cthdNew: PageHoaDonChiTietDto[]) => {
        await dbDexie.hoaDon
            .where('id')
            .equals(hoadon?.id)
            .modify((o: PageHoaDonDto) => (o.hoaDonChiTiet = cthdNew));
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

            const idCheckin = await InsertCustomer_toCheckIn(customer?.id?.toString());
            setHoaDon({ ...hoadon, idKhachHang: customer?.id?.toString(), idCheckIn: idCheckin });

            await AddHD_toCache_IfNotExists();
            await dbDexie.hoaDon.update(hoadon?.id, {
                //idCheckIn: idCheckin,
                idKhachHang: customer?.id?.toString(),
                tenKhachHang: customer?.tenKhachHang,
                maKhachHang: customer?.maKhachHang,
                soDienThoai: customer?.soDienThoai
            });
            //setCustomerHasGDV(false);
        }
    };

    const InsertCustomer_toCheckIn = async (customerId: string, idHangHoa?: string): Promise<string> => {
        // Chỉ tạo check-in cho hóa đơn sửa chữa, hóa đơn bán thường không cần check-in
        if (loaiHoaDon !== LoaiChungTu.HOA_DON_SUA_CHUA) {
            return Guid.EMPTY;
        }

        // Chưa có khách hàng thật (cột IdKhachHang bắt buộc, có khóa ngoại) -> chưa tạo check-in được,
        // để tránh lỗi 500. Sẽ tạo lại khi khách hàng được gán (chọn/khách thêm mới).
        if (utils.checkNull_OrEmpty(customerId)) {
            return Guid.EMPTY;
        }

        const objCheckInNew: Partial<KHCheckInDto> = {
            idKhachHang: customerId,
            idHangHoa: idHangHoa ?? null,
            dateTimeCheckIn: hoadon?.ngayLapHoaDon,
            idChiNhanh: idChiNhanhChosed,
            trangThai: TrangThaiCheckin.DOING,
            ghiChu: ''
        };
        const dataCheckIn = await CheckinService.InsertCustomerCheckIn(objCheckInNew as KHCheckInDto);
        const input = { keyword: '', skipCount: 0, maxResultCount: 50, idChiNhanh: Cookies.get('IdChiNhanh') };
        const list = await CheckinService.GetListCustomerChecking(input);
        props.onChangeSoLuongCheckIn(list.length);

        return dataCheckIn.id;
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
        const idCheckin = await InsertCustomer_toCheckIn(item?.id ?? Guid.EMPTY);
        setHoaDon({ ...hoadon, idKhachHang: item?.id, idCheckIn: idCheckin });

        await AddHD_toCache_IfNotExists();
        await dbDexie.hoaDon.update(hoadon?.id, {
            idCheckIn: idCheckin,
            idKhachHang: item?.id,
            tenKhachHang: item?.text,
            maKhachHang: item?.maKhachHang, // todo maKhachHang
            soDienThoai: item?.text2
            //idHangHoa: 'iwhgfuiwheiuhdqsi'
        });

        //await CheckCustomer_hasGDV(item?.id ?? '');
    };

    const startEditPhoneField = (field: 'noiDung' | 'loi' | 'matKhau') => {
        if (Utils.checkNull(phoneChosed?.id) || phoneChosed?.id === Guid.EMPTY) return;
        cancelPhoneEdit.current = false;
        setPhoneEditValue(phoneChosed?.[field] ?? '');
        setPhoneEditField(field);
    };

    const savePhoneField = async () => {
        const field = phoneEditField;
        setPhoneEditField(null);
        if (!field || !phoneChosed || cancelPhoneEdit.current) return;

        const value = phoneEditValue.trim();
        if (value === (phoneChosed[field] ?? '')) return;

        const phoneNew = { ...phoneChosed, [field]: value };
        try {
            const ok = await ProductService.UpdateThongTinNhanhDienThoai({
                id: phoneNew.id ?? '',
                noiDung: phoneNew.noiDung ?? '',
                loi: phoneNew.loi ?? '',
                matKhau: phoneNew.matKhau ?? ''
            });
            if (ok) {
                setPhoneChosed(phoneNew);
                setObjAlert({ show: true, type: 1, mes: 'Cập nhật thông tin máy thành công' });
            } else {
                setObjAlert({ show: true, type: 2, mes: 'Không tìm thấy máy để cập nhật' });
            }
        } catch {
            // lỗi từ BE đã được hiển thị qua http interceptor
        }
    };

    const renderPhoneQuickField = (label: string, field: 'noiDung' | 'loi' | 'matKhau') => (
        <Stack
            direction="row"
            spacing={0.5}
            alignItems="center"
            onClick={(e) => {
                // không mở dropdown chọn máy khi bấm vào dòng sửa nhanh
                e.stopPropagation();
                if (phoneEditField !== field) startEditPhoneField(field);
            }}>
            <Typography variant="caption" fontWeight={700} sx={{ whiteSpace: 'nowrap' }}>
                {label}:
            </Typography>
            {phoneEditField === field ? (
                <TextField
                    variant="standard"
                    size="small"
                    autoFocus
                    fullWidth
                    value={phoneEditValue}
                    onChange={(e) => setPhoneEditValue(e.target.value)}
                    onBlur={savePhoneField}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            (e.target as HTMLInputElement).blur();
                        } else if (e.key === 'Escape') {
                            cancelPhoneEdit.current = true;
                            (e.target as HTMLInputElement).blur();
                        }
                    }}
                    inputProps={{ style: { fontSize: 12, padding: 0 } }}
                />
            ) : (
                <Typography
                    variant="caption"
                    title="Nhấn để sửa"
                    sx={{
                        flex: 1,
                        cursor: 'text',
                        borderRadius: 0.5,
                        px: 0.5,
                        color: phoneChosed?.[field] ? 'inherit' : 'text.disabled',
                        '&:hover': { bgcolor: 'action.hover', textDecoration: 'underline dotted' }
                    }}>
                    {phoneChosed?.[field] || 'Nhấn để nhập'}
                </Typography>
            )}
        </Stack>
    );

    const changePhone = async (item: IListPhone) => {
        setAnchorDropdownPhone(null);

        setPhoneChosed({
            ...phoneChosed,
            id: item?.id,
            idDonViQuyDoi: item?.idDonViQuyDoi,
            tenHangHoa: item?.tenMay ?? '',
            tenNhomHang: item?.tenNhomHang ?? '',
            dungLuong: item?.dungLuong ? Number(item.dungLuong) : undefined,
            mau: item?.mau ?? '',
            tenChu: item?.chuMay ?? '',
            noiDung: item?.noiDung ?? '',
            loi: item?.loi ?? '',
            matKhau: item?.matKhau ?? '',
            pin: item?.pin ?? '',
            imel: item?.imel ?? '',
            idChuSoHuu: item?.idChuSoHuu ?? '',
            isShow: true
        });
        const data = await khachHangService.getDetailCustomerById(item.idChuSoHuu ?? '');

        setCustomerChosed({
            ...customerChosed,
            id: data?.id?.toString() ?? '',
            maKhachHang: data?.maKhachHang ?? '',
            tenKhachHang: data?.tenKhachHang ?? 'Khách lẻ',
            soDienThoai: data?.soDienThoai ?? '',
            conNo: data?.conNo,
            tenNhomKhach: data.tenNhomKhach,
            isShow: true
        });

        const idCheckin = await InsertCustomer_toCheckIn(data?.id?.toString() ?? item?.id ?? Guid.EMPTY);
        setHoaDon({
            ...hoadon,
            idKhachHang: data?.id?.toString() ?? '',
            idCheckIn: idCheckin?.toString() ?? '',
            idHangHoa: item?.id?.toString() ?? ''
        });

        // await AddHD_toCache_IfNotExists();
        // await dbDexie.hoaDon.update(hoadon?.id, {
        //     idCheckIn: idCheckin,
        //     idKhachHang: item?.id,
        //     tenKhachHang: item?.text,
        //     maKhachHang: item?.text, // todo maKhachHang
        //     soDienThoai: item?.text2
        // });

        // await CheckCustomer_hasGDV(item?.id ?? '');
    };

    // const CheckCustomer_hasGDV = async (customerId: string) => {
    //     const existGDV = await HoaDonService.CheckCustomer_hasGDV(customerId);
    //     setCustomerHasGDV(existGDV);
    // };

    const ResetCTHD_ifUsingGDV = async () => {
        // reset cthd (if using GDV)
        setHoaDonChiTiet(
            hoaDonChiTiet?.map((x) => {
                return {
                    ...x,
                    idChiTietHoaDon: null,
                    soLuongConLai: 0,
                    thanhTienTruocCK: x.soLuong * (x?.donGiaTruocCK ?? 0),
                    thanhTienSauCK: x.soLuong * (x?.donGiaSauCK ?? 0),
                    thanhTienSauVAT: x.soLuong * (x?.donGiaSauVAT ?? 0)
                };
            })
        );

        const arrCT = hoaDonChiTiet?.map((x) => {
            return {
                ...x,
                idChiTietHoaDon: null,
                soLuongConLai: 0,
                thanhTienTruocCK: x.soLuong * (x?.donGiaTruocCK ?? 0),
                thanhTienSauCK: x.soLuong * (x?.donGiaSauCK ?? 0),
                thanhTienSauVAT: x.soLuong * (x?.donGiaSauVAT ?? 0)
            };
        });

        await UpdateCTHD_toCache([...arrCT]);
    };

    const AgreeRemoveCustomer = async () => {
        const idCheckinDelete = hoadon?.idCheckIn ?? Guid.EMPTY;
        await CheckinService.UpdateTrangThaiCheckin(idCheckinDelete, TrangThaiCheckin.DELETED);
        await CheckinService.UpdateTrangThaiBooking_byIdCheckIn(idCheckinDelete, TrangThaiBooking.Confirm);
        setCustomerHasGDV(false);
        setConfirmDialog({ ...confirmDialog, show: false });
        setHoaDon({ ...hoadon, idKhachHang: null });
        setCustomerChosed({
            ...customerChosed,
            id: Guid.EMPTY,
            maKhachHang: 'KL', // todo makhachhang
            tenKhachHang: 'Chưa chọn khách',
            soDienThoai: '',
            conNo: 0,
            tenNhomKhach: '',
            isShow: false
        });
        await dbDexie.hoaDon
            .where('id')
            .equals(hoadon?.id)
            .modify((o: PageHoaDonDto) => (o.idKhachHang = null));
    };

    const AgreeRemovePhone = async () => {
        // const idCheckinDelete = hoadon?.idCheckIn ?? Guid.EMPTY;
        // await CheckinService.UpdateTrangThaiCheckin(idCheckinDelete, TrangThaiCheckin.DELETED);
        // await CheckinService.UpdateTrangThaiBooking_byIdCheckIn(idCheckinDelete, TrangThaiBooking.Confirm);
        // setCustomerHasGDV(false);
        // setConfirmDialog({ ...confirmDialog, show: false });
        // setHoaDon({ ...hoadon, idKhachHang: null });
        setPhoneChosed({
            ...phoneChosed,
            id: Guid.EMPTY,
            idDonViQuyDoi: Guid.EMPTY,

            tenHangHoa: 'Chưa chọn máy',
            dungLuong: undefined,
            mau: '',
            tenChu: '',
            noiDung: '',
            loi: '',
            matKhau: '',
            imel: '',
            isShow: false
        });

        setCustomerChosed({
            ...customerChosed,
            id: Guid.EMPTY,
            maKhachHang: 'KL', // todo makhachhang
            tenKhachHang: 'Chưa chọn khách',
            soDienThoai: '',
            conNo: 0,
            tenNhomKhach: '',
            isShow: false
        });
        // await dbDexie.hoaDon
        //     .where('id')
        //     .equals(hoadon?.id)
        //     .modify((o: PageHoaDonDto) => (o.idKhachHang = null));
    };

    const CheckDangSuDungGDV = (type: number) => {
        const ctSuDung = hoaDonChiTiet?.filter((x) => !utils.checkNull_OrEmpty(x.idChiTietHoaDon));
        if (ctSuDung?.length > 0) {
            setConfirmDialog({
                ...confirmDialog,
                show: true,
                type: type,
                mes: 'Đang sử dụng Gói dịch vụ. Bạn có muốn chuyển sang mua mới không?',
                title: 'Xác nhận chuyển đổi'
            });
            return false;
        }
        return true;
    };

    const RemoveCustomer = async () => {
        const check = CheckDangSuDungGDV(1);
        if (!check) {
            return;
        }
        await AgreeRemoveCustomer();
    };

    const RemovePhone = async () => {
        const check = CheckDangSuDungGDV(1);
        if (!check) {
            return;
        }
        await AgreeRemovePhone();
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

    const onClickOKConfirm = async () => {
        switch (confirmDialog.type) {
            case 1:
                {
                    await AgreeRemoveCustomer();
                }
                break;
            case 2:
                {
                    await AgreeChangeLoaiHoaDon();
                }
                break;
        }
        await ResetCTHD_ifUsingGDV();
    };

    const showPopNhanVienThucHien = (item: HoaDonChiTietDto) => {
        setPropNVThucHien((old) => {
            return { ...old, isShow: true, isNew: true, item: item, id: item.id };
        });
    };

    const AgreeNVThucHien = async (lstNVChosed: NhanVienThucHienDto[]) => {
        setPropNVThucHien({ ...propNVThucHien, isShow: false });
        // update cthd + save to cache
        setHoaDonChiTiet(
            hoaDonChiTiet.map((x) => {
                if (propNVThucHien.item.id === x.id) {
                    return { ...x, nhanVienThucHien: lstNVChosed };
                } else {
                    return x;
                }
            })
        );

        const arrCT = hoaDonChiTiet.map((x) => {
            if (propNVThucHien.item.id === x.id) {
                return { ...x, nhanVienThucHien: lstNVChosed };
            } else {
                return x;
            }
        });
        await UpdateCTHD_toCache(arrCT);
    };

    const RemoveNVThucHien = async (cthd: PageHoaDonChiTietDto, nv: NhanVienThucHienDto) => {
        setHoaDonChiTiet(
            hoaDonChiTiet.map((x) => {
                if (x.id === cthd.id) {
                    return {
                        ...x,
                        nhanVienThucHien: x.nhanVienThucHien?.filter((nvth) => nvth.idNhanVien !== nv.idNhanVien)
                    };
                } else {
                    return x;
                }
            })
        );
        const arrCT = hoaDonChiTiet.map((x) => {
            if (x.id === cthd.id) {
                return {
                    ...x,
                    nhanVienThucHien: x.nhanVienThucHien?.filter((nvth) => nvth.idNhanVien !== nv.idNhanVien)
                };
            } else {
                return x;
            }
        });
        await UpdateCTHD_toCache(arrCT);
    };

    // modal chitiet giohang
    const showPopChiTietGioHang = (idChiTiet: string) => {
        setIsShowEditGioHang(true);
        setIdCTHDChosing(idChiTiet);
    };

    const AgreeGioHang = async (lstCTAfter: PageHoaDonChiTietDto[]) => {
        setIsShowEditGioHang(false);

        if (lstCTAfter?.length > 0) {
            const ctUpdate = lstCTAfter[0];
            // update cthd + save to cache
            setHoaDonChiTiet(
                hoaDonChiTiet.map((item) => {
                    if (item.id === ctUpdate.id) {
                        const isSuDungDV = !utils.checkNull_OrEmpty(item?.idChiTietHoaDon ?? '');
                        return {
                            ...item,
                            soLuong: ctUpdate.soLuong,
                            donGiaTruocCK: ctUpdate.donGiaTruocCK,
                            laPTChietKhau: ctUpdate.laPTChietKhau,
                            ptChietKhau: ctUpdate.ptChietKhau,
                            tienChietKhau: ctUpdate.tienChietKhau,
                            donGiaSauCK: ctUpdate.donGiaSauCK,
                            donGiaSauVAT: ctUpdate.donGiaSauVAT,
                            thanhTienTruocCK: isSuDungDV ? 0 : ctUpdate.thanhTienTruocCK,
                            thanhTienSauCK: isSuDungDV ? 0 : ctUpdate.thanhTienSauCK,
                            thanhTienSauVAT: isSuDungDV ? 0 : ctUpdate.thanhTienSauVAT,
                            soThangBaoHanh: ctUpdate.soThangBaoHanh,
                            nhanVienThucHien: item?.nhanVienThucHien?.map((nv) => {
                                if (nv.ptChietKhau > 0) {
                                    return {
                                        ...nv,
                                        // soluong * dongia (tránh trường hợp sử dụng GDV: thanhtien = 0)
                                        tienChietKhau:
                                            (nv.ptChietKhau * ctUpdate.soLuong * (ctUpdate?.donGiaSauCK ?? 0)) / 100
                                    };
                                } else {
                                    return {
                                        ...nv,
                                        // (tienchietkhau/soLuongCu) * slNew
                                        tienChietKhau: (nv.tienChietKhau / item.soLuong) * ctUpdate.soLuong
                                    };
                                }
                            })
                        };
                    } else {
                        return item;
                    }
                })
            );

            const arrCT = hoaDonChiTiet.map((item) => {
                if (item.id === ctUpdate.id) {
                    const isSuDungDV = !utils.checkNull_OrEmpty(item?.idChiTietHoaDon ?? '');
                    return {
                        ...item,
                        soLuong: ctUpdate.soLuong,
                        donGiaTruocCK: ctUpdate.donGiaTruocCK,
                        laPTChietKhau: ctUpdate.laPTChietKhau,
                        ptChietKhau: ctUpdate.ptChietKhau,
                        tienChietKhau: ctUpdate.tienChietKhau,
                        donGiaSauCK: ctUpdate.donGiaSauCK,
                        donGiaSauVAT: ctUpdate.donGiaSauVAT,
                        thanhTienTruocCK: isSuDungDV ? 0 : ctUpdate.thanhTienTruocCK,
                        thanhTienSauCK: isSuDungDV ? 0 : ctUpdate.thanhTienSauCK,
                        thanhTienSauVAT: isSuDungDV ? 0 : ctUpdate.thanhTienSauVAT,
                        soThangBaoHanh: ctUpdate.soThangBaoHanh,
                        nhanVienThucHien: item?.nhanVienThucHien?.map((nv) => {
                            if (nv.ptChietKhau > 0) {
                                return {
                                    ...nv,
                                    tienChietKhau:
                                        (nv.ptChietKhau * ctUpdate.soLuong * (ctUpdate?.donGiaSauCK ?? 0)) / 100
                                };
                            } else {
                                return {
                                    ...nv,
                                    tienChietKhau: (nv.tienChietKhau / item.soLuong) * ctUpdate.soLuong
                                };
                            }
                        })
                    };
                } else {
                    return item;
                }
            });

            await UpdateCTHD_toCache(arrCT);
        }
    };

    // end modal chi tiet

    const checkSaveInvoice = async () => {
        if (hoaDonChiTiet.length === 0) {
            setObjAlert({
                show: true,
                type: 2,
                mes: 'Vui lòng nhập chi tiết hóa đơn '
            });
            return false;
        }
        if (utils.checkNull_OrEmpty(hoadon?.idKhachHang)) {
            if (sumTienKhachTra < hoadon?.tongThanhToan) {
                setObjAlert({
                    show: true,
                    type: 2,
                    mes: 'Là khách lẻ. Không cho phép nợ'
                });
                return false;
            }
        }
        if (hoadon?.idLoaiChungTu === LoaiChungTu.GOI_DICH_VU) {
            if (utils.checkNull_OrEmpty(hoadon?.idKhachHang)) {
                setObjAlert({
                    show: true,
                    type: 2,
                    mes: 'Vui lòng chọn khách hàng khi mua gói dịch vụ'
                });
                return false;
            }
        }

        return true;
    };

    const ResetState_AfterSave = async () => {
        setIsSavingHoaDon(false);
        setIsThanhToanTienMat(true);
        setCustomerHasGDV(false);

        setHoaDonChiTiet([]);
        const newHD = new PageHoaDonDto({
            id: Guid.create().toString(),
            idLoaiChungTu: hoadon.idLoaiChungTu,
            idKhachHang: customerIdChosed as unknown as undefined,
            idHangHoa: phoneIdChosed as unknown as undefined,

            idChiNhanh: idChiNhanhChosed,
            tenKhachHang: 'Chưa chọn khách'
        });
        setPhoneChosed(null);
        setHoaDon({ ...newHD });
        setCustomerChosed({
            ...customerChosed,
            id: '',
            maKhachHang: 'KL',
            tenKhachHang: 'Chưa chọn khách',
            soDienThoai: '',
            tongTichDiem: 0,
            avatar: '',
            conNo: 0
        } as CreateOrEditKhachHangDto);

        onSetActiveTabLoaiHoaDon(hoadon.idLoaiChungTu);
    };

    const saveDiaryHoaDon = async (maHoaDon: string, ngaylapHoaDonDB: string) => {
        let sDetails = '';
        for (let i = 0; i < hoaDonChiTiet?.length; i++) {
            const itFor = hoaDonChiTiet[i];
            sDetails += ` <br /> ${i + 1}. ${itFor?.tenHangHoa} (${itFor?.maHangHoa}): ${
                itFor?.soLuong
            } x  ${Intl.NumberFormat('vi-VN').format(itFor?.donGiaTruocCK)}  =  ${Intl.NumberFormat('vi-VN').format(
                itFor?.thanhTienSauCK ?? 0
            )}`;
        }

        let txtKhachHang = '';
        if (utils.checkNull(customerChosed?.soDienThoai)) {
            txtKhachHang = `${customerChosed?.tenKhachHang}`;
        } else {
            txtKhachHang = ` ${customerChosed?.tenKhachHang} (${customerChosed?.soDienThoai})`;
        }

        const diary = {
            idChiNhanh: idChiNhanhChosed,
            noiDung: `Thêm mới hóa đơn ${maHoaDon}, khách hàng: ${txtKhachHang}`,
            chucNang: 'Thêm mới hóa đơn',
            noiDungChiTiet: `<b> Thông tin hóa đơn: </b> <br /> Mã hóa đơn: ${maHoaDon}  <br />Ngày lập: ${format(
                new Date(ngaylapHoaDonDB),
                'dd/MM/yyyy HH:mm'
            )} <br /> Khách hàng: ${txtKhachHang}  <br /> Tổng tiền:  ${Intl.NumberFormat('vi-VN').format(
                hoadon?.tongTienHangChuaChietKhau
            )} <br /> Chiết khấu hàng:  ${Intl.NumberFormat('vi-VN').format(hoadon?.tongChietKhauHangHoa)}
            <br /> Giảm giá hóa đơn:  ${Intl.NumberFormat('vi-VN').format(
                hoadon?.tongGiamGiaHD
            )}  <br /> <b> Thông tin chi tiết: </b> ${sDetails}`,
            loaiNhatKy: 1
        } as CreateNhatKyThaoTacDto;
        nhatKyHoatDongService.createNhatKyThaoTac(diary);
    };

    const thanhToanAtPaymentForm = async (
        tienTheGiaTri: number,
        tienMat: number,
        tienCK: number,
        tienPOS: number,
        idTaiKhoanCK: string | null,
        idTaiKHoanPos: string | null,
        noiDungThu: string
    ) => {
        const hoadonDB = await saveHoaDon();
        if (hoadonDB) {
            const dataQuyHD = await SoQuyServices.savePhieuThu_forHoaDon({
                idChiNhanh: idChiNhanhChosed,
                phaiTT: hoadon?.tongThanhToan ?? 0,
                thegiatri: tienTheGiaTri,
                tienmat: tienMat,
                tienCK: tienCK,
                tienPOS: tienPOS,
                idTaiKhoanChuyenKhoan: idTaiKhoanCK as null,
                idTaiKhoanPOS: idTaiKHoanPos as null,
                ngayLapHoaDon: hoadonDB?.ngayLapHoaDon,
                noiDungThu: noiDungThu,
                hoadon: {
                    maHoaDon: hoadonDB?.maHoaDon,
                    id: (hoadonDB?.id ?? null) as unknown as null,
                    idKhachHang: customerChosed?.id as unknown as null,
                    tenKhachHang: customerChosed?.tenKhachHang
                }
            });
            if (dataQuyHD != null) {
                // used to print content in QRCode
                dataQuyHD?.quyHoaDon_ChiTiet?.map((x: QuyChiTietDto) => {
                    x.maHoaDonLienQuan = hoadonDB?.maHoaDon;
                });
                await InHoaDon(hoadonDB?.maHoaDon, hoadonDB?.ngayLapHoaDon, dataQuyHD);
            }
        }
    };

    const saveHoaDon = async () => {
        if (isSavingHoaDon) return;
        setIsSavingHoaDon(true);

        try {
            const checkSave = await checkSaveInvoice();
            if (!checkSave) {
                setIsSavingHoaDon(false);
                return;
            }

            const dataSave = { ...hoadon };
            dataSave.hoaDonChiTiet = hoaDonChiTiet;

            dataSave.hoaDonChiTiet?.forEach((x: PageHoaDonChiTietDto, index: number) => {
                x.stt = index + 1;
            });

            const hoadonDB = await HoaDonService.CreateHoaDon(dataSave);

            if (!hoadonDB) {
                setIsSavingHoaDon(false);
                return;
            }
            setObjAlert({
                show: true,
                type: 1,
                mes: 'Thanh toán hóa đơn thành công'
            });
            // Phiếu xuất kho cho hàng hóa / điện thoại do Backend tự tạo khi lưu hóa đơn (CreateHoaDon)
            try {
                // Chỉ đánh dấu "Đã bán" cho Điện thoại (hàng tồn theo từng máy).
                // Hàng hóa (phụ kiện) và Dịch vụ không có khái niệm "hết" theo kiểu này.
                const list = hoaDonChiTiet.filter(
                    (x) =>
                        x?.idHangHoa &&
                        (x.idLoaiHangHoa === LoaiHangHoa.DIEN_THOAI || x.idLoaiHangHoa === LoaiHangHoa.DIEN_THOAI_SUA)
                );

                for (const item of list) {
                    await ProductService.UpdateTrangThaiDienThoai(item.idHangHoa!, 2);
                }
            } catch (err) {
                console.error('Lỗi update trạng thái sản phẩm', err);
            }

            await saveDiaryHoaDon(hoadonDB?.maHoaDon, hoadonDB?.ngayLapHoaDon);
            await CheckinService.UpdateTrangThaiCheckin(hoadon?.idCheckIn, TrangThaiCheckin.COMPLETED);

            await CheckinService.Update_IdHoaDon_toCheckInHoaDon(hoadon?.idCheckIn, hoadonDB.id);
            if (isThanhToanTienMat) {
                const dataQuyHD = await SoQuyServices.savePhieuThu_forHoaDon({
                    idChiNhanh: idChiNhanhChosed,
                    phaiTT: hoadon?.tongThanhToan ?? 0,
                    tienmat: sumTienKhachTra,
                    ngayLapHoaDon: hoadon?.ngayLapHoaDon,
                    hoadon: {
                        maHoaDon: hoadonDB?.maHoaDon,
                        id: hoadonDB?.id as any,
                        idKhachHang: customerChosed?.id as any,
                        tenKhachHang: customerChosed?.tenKhachHang
                    }
                });

                if (dataQuyHD) {
                    await InHoaDon(hoadonDB?.maHoaDon, hoadonDB?.ngayLapHoaDon, dataQuyHD);
                }
            }

            await dbDexie.hoaDon.where('id').equals(hoadon?.id).delete();

            ResetState_AfterSave();
            onRemoveHoaDon_toCache();

            return hoadonDB;
        } catch (error) {
            console.error('Lỗi save hóa đơn:', error);
        } finally {
            setIsSavingHoaDon(false);
        }
    };
    const handleBaoGia = async () => {
        try {
            if (!hoadon || !hoaDonChiTiet || hoaDonChiTiet.length === 0) {
                setObjAlert({
                    show: true,
                    type: 2,
                    mes: 'Không có thông tin để in báo giá'
                });
                return;
            }

            // Tạo mã báo giá giả lập
            const fakeMaHoaDon = 'BG-' + new Date().getTime();
            const ngayLap = format(new Date(), 'yyyy-MM-dd HH:mm:ss.SSS');

            // Tạo đối tượng QuyHoaDonDto tạm để in báo giá
            const dataQuyHD = new QuyHoaDonDto({
                idChiNhanh: idChiNhanhChosed,
                idNhanVien: null,
                idLoaiChungTu: LoaiChungTu.KHAC,
                maHoaDon: fakeMaHoaDon,
                ngayLapHoaDon: ngayLap,
                tongTienThu: hoadon?.tongThanhToan ?? 0,
                noiDungThu: 'Báo giá dịch vụ',
                //idDoiTuongNopTien: 'ok nhá',
                //tenNguoiNop: customerChosed?.tenKhachHang ?? '',
                hinhThucThanhToan: 1
            });

            // Gọi hàm in
            await InBaoGia(fakeMaHoaDon, ngayLap, dataQuyHD);
        } catch (error) {
            console.error('Lỗi khi in báo giá:', error);
            setObjAlert({
                show: true,
                type: 3,
                mes: 'Đã xảy ra lỗi khi in báo giá'
            });
        }
    };

    const InBaoGia = async (mahoadon = '', ngayLapHD = '', quyHD: QuyHoaDonDto) => {
        const chinhanhPrint = await getInforChiNhanh_byID(idChiNhanhChosed ?? '');
        const tempMauIn = await MauInServices.GetContentMauInMacDinh(1, 17);

        const allCongTy = await cuaHangService.GetAllCongTy({} as PagedRequestDto);
        let congty = {} as CuaHangDto;
        if (allCongTy.length > 0) {
            congty = allCongTy[0];
        }
        DataMauIn.chinhanh = chinhanhPrint;
        DataMauIn.congty = congty;
        DataMauIn.congty.logo = uploadFileService.GoogleApi_NewLink(congty?.logo);
        DataMauIn.hoadon = hoadon;
        DataMauIn.hoadon.maHoaDon = mahoadon;

        DataMauIn.maySua.tenHangHoa = phoneChosed?.tenHangHoa;
        DataMauIn.maySua.imel = phoneChosed?.imel;
        DataMauIn.maySua.noiDung = phoneChosed?.noiDung;
        DataMauIn.maySua.loi = phoneChosed?.loi;

        DataMauIn.hoadon.ngayLapHoaDon = ngayLapHD; // get ngaylapHD from DB (after add hours/minutes/seconds)
        DataMauIn.hoadon.daThanhToan = quyHD?.tongTienThu;
        //DataMauIn.hoadon.conNo = hoadon?.tongThanhToan ?? 0 - quyHD?.tongTienThu ?? 0;
        DataMauIn.hoadonChiTiet = hoaDonChiTiet;

        DataMauIn.khachhang = {
            maKhachHang: customerChosed?.maKhachHang,
            tenKhachHang: customerChosed?.tenKhachHang,
            soDienThoai: customerChosed?.soDienThoai
        } as KhachHangItemDto;
        DataMauIn.phieuthu = quyHD;

        let newHtml = DataMauIn.replaceChiTietHoaDon(tempMauIn);
        newHtml = DataMauIn.replaceChiNhanh(newHtml);
        newHtml = DataMauIn.replaceHoaDon(newHtml);
        newHtml = await DataMauIn.replacePhieuThuChi(newHtml);
        DataMauIn.Print(newHtml);
    };

    const getInforChiNhanh_byID = async (idChiNhanh: string) => {
        const data = await chiNhanhService.GetDetail(idChiNhanh ?? '');
        return data;
    };

    const InHoaDon = async (mahoadon = '', ngayLapHD = '', quyHD: QuyHoaDonDto) => {
        const chinhanhPrint = await getInforChiNhanh_byID(idChiNhanhChosed ?? '');
        const tempMauIn = await MauInServices.GetContentMauInMacDinh(1, 1);
        const allCongTy = await cuaHangService.GetAllCongTy({} as PagedRequestDto);
        let congty = {} as CuaHangDto;
        if (allCongTy.length > 0) {
            congty = allCongTy[0];
        }
        DataMauIn.chinhanh = chinhanhPrint;
        DataMauIn.congty = congty;
        DataMauIn.congty.logo = uploadFileService.GoogleApi_NewLink(congty?.logo);
        DataMauIn.hoadon = hoadon;
        DataMauIn.hoadon.maHoaDon = mahoadon;

        DataMauIn.hoadon.ngayLapHoaDon = ngayLapHD; // get ngaylapHD from DB (after add hours/minutes/seconds)
        DataMauIn.hoadon.daThanhToan = quyHD?.tongTienThu;
        //DataMauIn.hoadon.conNo = hoadon?.tongThanhToan ?? 0 - quyHD?.tongTienThu ?? 0;
        DataMauIn.hoadonChiTiet = hoaDonChiTiet;

        DataMauIn.khachhang = {
            maKhachHang: customerChosed?.maKhachHang,
            tenKhachHang: customerChosed?.tenKhachHang,
            soDienThoai: customerChosed?.soDienThoai
        } as KhachHangItemDto;
        DataMauIn.phieuthu = quyHD;

        let newHtml = DataMauIn.replaceChiTietHoaDon(tempMauIn);
        newHtml = DataMauIn.replaceChiNhanh(newHtml);
        newHtml = DataMauIn.replaceHoaDon(newHtml);
        newHtml = await DataMauIn.replacePhieuThuChi(newHtml);
        DataMauIn.Print(newHtml);
    };

    // if (isLoadingData) {
    //     return <Loading />;
    // }
    const today = new Date();
    const [thuTrongKy, setThuTrongKy] = useState(0);
    const [chiTrongKy, setChiTrongKy] = useState(0);
    const [quyHDOld, setQuyHDOld] = useState<QuyHoaDonDto>({} as QuyHoaDonDto);
    const [isShowModal, setisShowModal] = useState(false);
    const [isShowThanhToanHD, setIsShowThanhToanHD] = useState(false);
    const [pageDataSoQuy, setPageDataSoQuy] = useState<IPagedResultSoQuyDto<QuyHoaDonDto>>({
        totalCount: 0,
        totalPage: 0,
        items: []
    });
    const idChiNhanhCookies = Cookies.get('IdChiNhanh') ?? '';

    const [paramSearch, setParamSearch] = useState<ParamSearchSoQuyDto>({
        textSearch: '',
        currentPage: 1,
        columnSort: 'ngayLapHoaDon',
        typeSort: 'desc',
        idChiNhanhs: [idChiNhanhCookies],
        fromDate: format(today, 'yyyy-MM-01'),
        toDate: format(lastDayOfMonth(today), 'yyyy-MM-dd'),
        idLoaiChungTus: [LoaiChungTu.PHIEU_THU, LoaiChungTu.PHIEU_CHI],
        idLoaiChungTuLienQuan: LoaiChungTu.ALL,
        trangThais: [TrangThaiActive.ACTIVE]
    });
    const [selectedRowId, setSelectedRowId] = useState('');

    const saveSoQuy = async (dataSave: QuyHoaDonDto, type: number) => {
        setisShowModal(false);
        setIsShowThanhToanHD(false);

        // get thông tin các hình thức thanh toán để bind lại phần Tổng
        const quyCT = dataSave?.quyHoaDon_ChiTiet;
        let tienMat = 0,
            tienCK = 0,
            tienPos = 0,
            tongThu = dataSave?.tongTienThu;
        if (quyCT != undefined && quyCT.length > 0) {
            tienMat = quyCT
                ?.filter((x) => x.hinhThucThanhToan === HINH_THUC_THANH_TOAN.TIEN_MAT)
                .reduce((currentValue: number, item: QuyChiTietDto) => {
                    return item.tienThu + currentValue;
                }, 0);
            tienCK = quyCT
                ?.filter((x) => x.hinhThucThanhToan === HINH_THUC_THANH_TOAN.CHUYEN_KHOAN)
                .reduce((currentValue: number, item: QuyChiTietDto) => {
                    return item.tienThu + currentValue;
                }, 0);
            tienPos = quyCT
                ?.filter((x) => x.hinhThucThanhToan === HINH_THUC_THANH_TOAN.QUYET_THE)
                .reduce((currentValue: number, item: QuyChiTietDto) => {
                    return item.tienThu + currentValue;
                }, 0);
        }
        if (dataSave?.idLoaiChungTu == LoaiChungTu.PHIEU_CHI) {
            tienMat = tienMat > 0 ? -tienMat : 0;
            tienCK = tienCK > 0 ? -tienCK : 0;
            tienPos = tienPos > 0 ? -tienPos : 0;
            tongThu = tongThu > 0 ? -tongThu : 0;

            if (type === TypeAction.INSEART) {
                setChiTrongKy(() => chiTrongKy - tongThu);
            } else {
                setChiTrongKy(() => chiTrongKy + (quyHDOld?.tongTienThu ?? 0) - tongThu);
            }
        } else {
            if (type === TypeAction.INSEART) {
                setThuTrongKy(() => thuTrongKy + tongThu);
            } else {
                setChiTrongKy(() => thuTrongKy - (quyHDOld?.tongTienThu ?? 0) + tongThu);
            }
        }

        dataSave.tienMat = tienMat;
        dataSave.tienChuyenKhoan = tienCK;
        dataSave.tienQuyetThe = tienPos;
        dataSave.tongTienThu = tongThu;

        switch (type) {
            case TypeAction.INSEART: // insert
                {
                    // phải gán lại ngày lập: để chèn dc dòng mới thêm lên trên cùng
                    // dataSave.ngayLapHoaDon = new Date(dataSave.ngayLapHoaDon);
                    setPageDataSoQuy({
                        ...pageDataSoQuy,
                        items: [dataSave, ...pageDataSoQuy.items],
                        totalCount: pageDataSoQuy.totalCount + 1,
                        totalPage: utils.getTotalPage(pageDataSoQuy.totalCount + 1, paramSearch.pageSize),
                        sumTienMat: (pageDataSoQuy?.sumTienMat ?? 0) + tienMat,
                        sumTienChuyenKhoan: (pageDataSoQuy?.sumTienChuyenKhoan ?? 0) + tienCK,
                        sumTienQuyetThe: (pageDataSoQuy?.sumTienQuyetThe ?? 0) + tienPos,
                        sumTongThuChi: (pageDataSoQuy?.sumTongThuChi ?? 0) + tongThu
                    });
                    setObjAlert({
                        show: true,
                        type: 1,
                        mes: 'Thêm ' + dataSave.loaiPhieu + ' thành công'
                    });
                }
                break;
            case TypeAction.UPDATE:
                setPageDataSoQuy({
                    ...pageDataSoQuy,
                    sumTienMat: (pageDataSoQuy?.sumTienMat ?? 0) + tienMat - (quyHDOld?.tienMat ?? 0),
                    sumTienChuyenKhoan:
                        (pageDataSoQuy?.sumTienChuyenKhoan ?? 0) + tienCK - (quyHDOld?.tienChuyenKhoan ?? 0),
                    sumTienQuyetThe: (pageDataSoQuy?.sumTienQuyetThe ?? 0) + tienPos - (quyHDOld?.tienQuyetThe ?? 0),
                    sumTongThuChi: (pageDataSoQuy?.sumTongThuChi ?? 0) + tongThu - (quyHDOld?.tongTienThu ?? 0),
                    items: pageDataSoQuy.items.map((item) => {
                        if (item.id === selectedRowId) {
                            return {
                                ...item,
                                maHoaDon: dataSave.maHoaDon,
                                ngayLapHoaDon: dataSave.ngayLapHoaDon,
                                idLoaiChungTu: dataSave.idLoaiChungTu,
                                loaiPhieu: dataSave.loaiPhieu,
                                hinhThucThanhToan: dataSave.hinhThucThanhToan,
                                sHinhThucThanhToan: dataSave.sHinhThucThanhToan,
                                tongTienThu: dataSave.tongTienThu,
                                maNguoiNop: dataSave.maNguoiNop,
                                tenNguoiNop: dataSave.tenNguoiNop,
                                idKhoanThuChi: dataSave.idKhoanThuChi,
                                tenKhoanThuChi: dataSave.tenKhoanThuChi,
                                txtTrangThai: dataSave.txtTrangThai,
                                trangThai: dataSave.trangThai,
                                noiDungThu: dataSave?.noiDungThu ?? '',
                                tienMat: dataSave.tienMat,
                                tienChuyenKhoan: dataSave.tienChuyenKhoan,
                                tienQuyetThe: dataSave.tienQuyetThe
                            };
                        } else {
                            return item;
                        }
                    })
                });
                setObjAlert({
                    show: true,
                    type: 1,
                    mes: 'Cập nhật ' + dataSave.loaiPhieu + ' thành công'
                });
                break;
            case TypeAction.DELETE:
                break;
            case TypeAction.RESTORE:
                {
                    setPageDataSoQuy({
                        ...pageDataSoQuy,
                        sumTienMat: (pageDataSoQuy?.sumTienMat ?? 0) + tienMat,
                        sumTienChuyenKhoan: (pageDataSoQuy?.sumTienChuyenKhoan ?? 0) + tienCK,
                        sumTienQuyetThe: (pageDataSoQuy?.sumTienQuyetThe ?? 0) + tienPos,
                        sumTongThuChi: (pageDataSoQuy?.sumTongThuChi ?? 0) + tongThu,
                        items: pageDataSoQuy.items.map((item) => {
                            if (item.id === selectedRowId) {
                                return {
                                    ...item,
                                    txtTrangThai: dataSave.txtTrangThai,
                                    trangThai: dataSave.trangThai
                                };
                            } else {
                                return item;
                            }
                        })
                    });
                }
                break;
        }
    };

    const [dialogVisible, setDialogVisible] = useState(false);
    const [currentId, setCurrentId] = useState<string | null>(null);

    const handleOpenDialog = (id: string | null = null) => {
        setCurrentId(id);
        setDialogVisible(true);
    };

    const handleCloseDialog = () => {
        setDialogVisible(false);
    };

    const handleDialogSubmit = (dataSave: any, type: number) => {
        handleCloseDialog();
    };
    function showModalAddProduct(action?: number, id = '') {
        setTriggerModalProduct((old) => {
            return {
                ...old,
                isShow: true,
                isNew: Utils.checkNull(id),
                id: id
            };
        });
    }
    async function saveProduct(objNew: ModelHangHoaDienThoaiDto, type = 1) {
        // 1.insert, 2.update, 3.delete, 4.khoiphuc
        const sLoai = objNew.tenLoaiHangHoa?.toLocaleLowerCase();
        switch (type) {
            case 1: {
                setPhoneChosed({
                    ...phoneChosed,
                    id: objNew?.id,
                    tenHangHoa: objNew?.tenHangHoa ?? '',
                    tenNhomHang: objNew?.tenNhomHang ?? '',
                    dungLuong: objNew?.dungLuong ?? 0,
                    mau: objNew?.mau ?? '',
                    tenChu: objNew?.idChuSoHuu ?? '',
                    noiDung: objNew?.noiDung ?? '',
                    loi: objNew?.loi ?? '',
                    matKhau: objNew?.matKhau ?? '',
                    pin: objNew?.pin ?? '',
                    imel: objNew?.imel ?? '',
                    idChuSoHuu: objNew?.idChuSoHuu ?? '',
                    isShow: true
                });

                const data = await khachHangService.getDetailCustomerById(objNew.idChuSoHuu ?? '');

                setCustomerChosed({
                    ...customerChosed,
                    id: data?.id?.toString() ?? '',
                    maKhachHang: data?.maKhachHang ?? '',
                    tenKhachHang: data?.tenKhachHang ?? 'Khách lẻ',
                    soDienThoai: data?.soDienThoai ?? '',
                    conNo: data?.conNo,
                    tenNhomKhach: data.tenNhomKhach,
                    isShow: true
                });

                const idCheckin = await InsertCustomer_toCheckIn(data?.id?.toString() ?? '', objNew?.id ?? Guid.EMPTY);
                setHoaDon({
                    ...hoadon,
                    idKhachHang: data?.id?.toString() ?? '',
                    idCheckIn: idCheckin?.toString() ?? '',
                    idHangHoa: objNew?.id?.toString() ?? ''
                });

                await AddHD_toCache_IfNotExists();
                await dbDexie.hoaDon.update(hoadon?.id, {
                    idCheckIn: idCheckin,
                    idKhachHang: data?.id?.toString(),
                    tenKhachHang: data?.tenKhachHang,
                    maKhachHang: data?.maKhachHang,
                    soDienThoai: data?.soDienThoai,
                    idLoaiChungTu: LoaiChungTu.HOA_DON_SUA_CHUA
                });
                setObjAlert({ show: true, type: 1, mes: 'Thêm ' + sLoai + ' thành công' });
                break;
            }
            case 2: {
                GetListHangHoa();
                setObjAlert({ show: true, type: 1, mes: 'Sửa ' + sLoai + ' thành công' });
                break;
            }
        }
    }

    const GetListHangHoa = async () => {
        const list = await ProductService.Get_DMHangHoaDienThoai(filterPageProduct);
        setPageDataProduct({
            totalCount: list.totalCount,
            totalPage: Utils.getTotalPage(list.totalCount, filterPageProduct.pageSize),
            items: list.items
        });
    };
    const handleRemovePhone = () => {
        setCustomerChosed({
            ...customerChosed,
            id: Guid.EMPTY,
            maKhachHang: 'KL', // todo makhachhang
            tenKhachHang: 'Chưa chọn khách',
            soDienThoai: '',
            conNo: 0,
            tenNhomKhach: '',
            isShow: false
        });
        setPhoneChosed(null);
        setHoaDonChiTiet([]);

        setHoaDon((prev) => ({
            ...prev,
            idHangHoa: '',
            idKhachHang: ''
        }));
    };
    const handleRemoveCustomer = () => {
        setCustomerChosed({
            ...customerChosed,
            id: Guid.EMPTY,
            maKhachHang: 'KL', // todo makhachhang
            tenKhachHang: 'Chưa chọn khách',
            soDienThoai: '',
            conNo: 0,
            tenNhomKhach: '',
            isShow: false
        });
        setPhoneChosed(null);
        setHoaDonChiTiet([]);

        setHoaDon((prev) => ({
            ...prev,
            idHangHoa: '',
            idKhachHang: ''
        }));
    };
    return (
        <>
            <ModalHangHoaDienThoaiSua trigger={triggerModalProduct} handleSave={saveProduct}></ModalHangHoaDienThoaiSua>
            <ConfirmDelete
                isShow={confirmDialog.show}
                title={confirmDialog.title}
                mes={confirmDialog.mes}
                onOk={onClickOKConfirm}
                onCancel={() => setConfirmDialog({ ...confirmDialog, show: false })}></ConfirmDelete>
            <SnackbarAlert
                showAlert={objAlert.show}
                type={objAlert.type}
                title={objAlert.mes}
                handleClose={() => setObjAlert({ show: false, mes: '', type: 1 })}></SnackbarAlert>
            <CreateOrEditCustomerDialog
                visible={isShowModalAddCus}
                onCancel={() => setIsShowModalAddCus(false)}
                onOk={changeCustomer_fromModalAdd}
                title="Thêm mới khách hàng"
                formRef={newCus}
            />

            <ModalEditChiTietGioHang
                formType={1}
                isShow={isShowEditGioHang}
                hoadonChiTiet={hoaDonChiTiet.filter((x) => x.id === idCTHDChosing)}
                handleSave={AgreeGioHang}
                handleClose={() => setIsShowEditGioHang(false)}
            />
            <HoaHongNhanVienDichVu
                isNew={true}
                idChiNhanh={idChiNhanhChosed}
                iShow={propNVThucHien.isShow}
                itemHoaDonChiTiet={propNVThucHien.item}
                onSaveOK={AgreeNVThucHien}
                onClose={() => setPropNVThucHien({ ...propNVThucHien, isShow: false })}
            />
            <PopoverGiamGiaHD
                tongTienHang={hoadon?.tongTienHang}
                ptGiamGia={hoadon?.pTGiamGiaHD ?? 0}
                tongGiamGia={hoadon?.tongGiamGiaHD ?? 0}
                open={isShowPopoverGiamGia}
                anchorEl={anchorGiamGiaHD}
                onClosePopover={closePopoverGiamGia}
                onUpdateGiamGia={changeGiamGiaHoaDon}
            />
            {/* <CreateOrEditSoQuyDialog
                visiable={dialogVisible}
                idQuyHD={currentId}
                onClose={handleCloseDialog}
                onOk={handleDialogSubmit}
            /> */}
            <Grid
                container
                minHeight={'86vh'}
                maxHeight={'86vh'}
                // Mobile: chiếm đúng phần còn lại của màn hình, chỉ danh sách bên trong mới cuộn
                sx={isMobile ? { height: '100%', minHeight: 0, maxHeight: 'none', flexWrap: 'nowrap' } : undefined}>
                {!isThanhToanTienMat
                    ? (!isMobile || mobileStep === 'cart') && (
                          <Grid
                              item
                              lg={7}
                              md={6}
                              xs={12}
                              zIndex={5}
                              sx={isMobile ? { height: '100%', overflowY: 'auto' } : undefined}>
                              <PaymentsForm
                                  tongPhaiTra={hoadon?.tongThanhToan ?? 0}
                                  onClose={() => setIsThanhToanTienMat(true)}
                                  onSaveHoaDon={thanhToanAtPaymentForm}
                                  inforHD={{
                                      maHoaDon: '',
                                      idKhachHang: hoadon?.idKhachHang ?? '',
                                      id: hoadon?.id ?? '',
                                      idChiNhanh: hoadon?.idChiNhanh ?? '',
                                      tenKhachHang: customerChosed?.tenKhachHang ?? ''
                                  }}
                              />
                          </Grid>
                      )
                    : (!isMobile || mobileStep === 'browse') && (
                          <Grid
                              item
                              lg={7}
                              md={6}
                              xs={12}
                              sm={5}
                              borderRight={'1px solid rgb(224, 228, 235)'}
                              marginTop={{ md: '-64px', sm: '-64px', lg: 0 }}
                              sx={isMobile ? { height: '100%', display: 'flex', flexDirection: 'column' } : undefined}>
                              <Stack
                                  spacing={isMobile ? 1.5 : 2}
                                  overflow={'auto'}
                                  maxHeight={isMobile ? 'none' : '84vh'}
                                  flex={isMobile ? 1 : undefined}
                                  minHeight={isMobile ? 0 : undefined}>
                                  {(nhomHangHoaChosed?.length ?? 0) > 0 && (
                                      <Stack spacing={2}>
                                          <Stack direction={'row'} spacing={2} alignItems={'center'}>
                                              <Typography fontWeight={500}>Nhóm hàng đã chọn</Typography>
                                              <Stack
                                                  direction={'row'}
                                                  spacing={1}
                                                  alignItems={'center'}
                                                  color={'brown'}
                                                  sx={{ cursor: 'pointer' }}>
                                                  <Typography fontSize={13} onClick={() => BoChonAllNhomHang()}>
                                                      Bỏ chọn tất cả
                                                  </Typography>
                                                  <CloseOutlinedIcon sx={{ width: 15, height: 15 }} />
                                              </Stack>
                                          </Stack>
                                          <Stack direction={'row'} spacing={1} sx={{ overflowX: 'auto' }}>
                                              {nhomHangHoaChosed?.map((x, index) => (
                                                  <Stack key={index} padding={1} bgcolor={'#f0e0da'} borderRadius={4}>
                                                      <Stack direction={'row'} spacing={1} alignItems={'center'}>
                                                          <Typography
                                                              fontWeight={500}
                                                              className="lableOverflow"
                                                              maxWidth={300}
                                                              title={x?.tenNhomHang ?? ''}>
                                                              {x?.tenNhomHang}
                                                          </Typography>
                                                          <CloseOutlinedIcon
                                                              sx={{ width: 20, height: 20, cursor: 'pointer' }}
                                                              onClick={() => BoChon1NhomHang(x?.id ?? '')}
                                                          />
                                                      </Stack>
                                                  </Stack>
                                              ))}
                                          </Stack>
                                      </Stack>
                                  )}
                                  {isLoadingData ? (
                                      <Loading />
                                  ) : (
                                      <>
                                          {listProduct.map((nhom: IHangHoaGroupTheoNhomDto, index: number) => (
                                              <Stack key={index}>
                                                  <Typography fontSize={16} fontWeight={500} marginBottom={0.5}>
                                                      {nhom?.tenNhomHang}
                                                  </Typography>
                                                  <Grid
                                                      container
                                                      spacing={isMobile ? 1 : 2}
                                                      paddingRight={isMobile ? 1 : 2}>
                                                      {nhom?.hangHoas.map((item, index2) => (
                                                          <Grid key={index2} item lg={4} md={6} xs={12} sm={12}>
                                                              <Stack
                                                                  padding={isMobile ? 1.25 : 2}
                                                                  title={item.tenHangHoa}
                                                                  sx={{
                                                                      position: 'relative',
                                                                      backgroundColor: 'var(--color-bg)',
                                                                      border: '1px solid transparent',
                                                                      '&:hover': {
                                                                          borderColor: 'var(--color-main)',
                                                                          cursor: 'pointer'
                                                                      }
                                                                  }}>
                                                                  {getIconLoaiHangHoa(item?.idLoaiHangHoa) && (
                                                                      <Tooltip
                                                                          title={
                                                                              getIconLoaiHangHoa(item?.idLoaiHangHoa)
                                                                                  ?.title
                                                                          }>
                                                                          <Stack
                                                                              alignItems="center"
                                                                              justifyContent="center"
                                                                              onClick={() => choseProduct(item)}
                                                                              sx={{
                                                                                  position: 'absolute',
                                                                                  top: 6,
                                                                                  right: 6,
                                                                                  width: 24,
                                                                                  height: 24,
                                                                                  borderRadius: '50%',
                                                                                  bgcolor: '#fff',
                                                                                  border: '1px solid #E5E7EB',
                                                                                  color: '#6B7280'
                                                                              }}>
                                                                              {
                                                                                  getIconLoaiHangHoa(
                                                                                      item?.idLoaiHangHoa
                                                                                  )?.icon
                                                                              }
                                                                          </Stack>
                                                                      </Tooltip>
                                                                  )}
                                                                  <Stack
                                                                      spacing={0.5}
                                                                      onClick={() => choseProduct(item)}>
                                                                      <Typography
                                                                          fontWeight={500}
                                                                          variant="body2"
                                                                          sx={{
                                                                              overflow: 'hidden',
                                                                              textOverflow: 'ellipsis',
                                                                              whiteSpace: 'nowrap',
                                                                              width: '100%',
                                                                              paddingRight: '24px'
                                                                          }}>
                                                                          {item?.tenHangHoa}
                                                                      </Typography>

                                                                      {item?.idLoaiHangHoa ===
                                                                          LoaiHangHoa.DIEN_THOAI && (
                                                                          <>
                                                                              <Typography
                                                                                  variant="caption"
                                                                                  sx={{ lineHeight: 1 }}>
                                                                                  {item?.mau}
                                                                                  {item?.dungLuong
                                                                                      ? ` - ${item.dungLuong}GB`
                                                                                      : ''}
                                                                              </Typography>
                                                                              <Typography
                                                                                  variant="caption"
                                                                                  sx={{ lineHeight: 1 }}>
                                                                                  IMEI: {item?.imel}
                                                                              </Typography>
                                                                          </>
                                                                      )}

                                                                      <Typography variant="caption">
                                                                          {Intl.NumberFormat('vi-VN').format(
                                                                              item?.giaBan as number
                                                                          )}
                                                                      </Typography>
                                                                  </Stack>
                                                              </Stack>
                                                          </Grid>
                                                      ))}
                                                  </Grid>
                                              </Stack>
                                          ))}
                                      </>
                                  )}
                              </Stack>

                              {isMobile && (
                                  <Stack
                                      direction="row"
                                      alignItems="center"
                                      justifyContent="space-between"
                                      spacing={1.5}
                                      sx={{
                                          flexShrink: 0,
                                          mt: 1,
                                          px: 1.5,
                                          py: 1,
                                          backgroundColor: 'rgb(245 241 241)',
                                          borderTop: '1px solid rgb(224, 228, 235)',
                                          boxSizing: 'border-box'
                                      }}>
                                      {/* Trái: mỗi dịch vụ 1 dòng (tên - thành tiền) */}
                                      <Stack minWidth={0} flex={1} title={mobileSummaryText}>
                                          {phoneChosed?.tenHangHoa && (
                                              <Typography variant="caption" fontWeight={600} noWrap lineHeight={1.4}>
                                                  {[phoneChosed.tenHangHoa, phoneChosed.dungLuong, phoneChosed.mau]
                                                      .filter(Boolean)
                                                      .join(', ')}
                                              </Typography>
                                          )}
                                          {(hoaDonChiTiet?.length ?? 0) > 0 ? (
                                              <>
                                                  {mobileSummaryItems.map((item, index) => (
                                                      <Stack
                                                          key={index}
                                                          direction="row"
                                                          spacing={1}
                                                          justifyContent="space-between">
                                                          <Typography
                                                              variant="caption"
                                                              color="text.secondary"
                                                              noWrap
                                                              lineHeight={1.4}
                                                              minWidth={0}>
                                                              {item?.tenHangHoa ?? ''}
                                                              {item?.soLuong && item.soLuong > 1
                                                                  ? ` x${item.soLuong}`
                                                                  : ''}
                                                          </Typography>
                                                          <Typography
                                                              variant="caption"
                                                              color="text.secondary"
                                                              noWrap
                                                              lineHeight={1.4}
                                                              flexShrink={0}>
                                                              {Intl.NumberFormat('vi-VN').format(
                                                                  item?.thanhTienSauCK ?? item?.donGiaSauCK ?? 0
                                                              )}
                                                              đ
                                                          </Typography>
                                                      </Stack>
                                                  ))}
                                                  {mobileSummaryExtraCount > 0 && (
                                                      <Typography
                                                          variant="caption"
                                                          color="text.secondary"
                                                          fontStyle="italic"
                                                          lineHeight={1.4}>
                                                          +{mobileSummaryExtraCount} dịch vụ khác
                                                      </Typography>
                                                  )}
                                              </>
                                          ) : (
                                              <Typography variant="caption" color="text.secondary">
                                                  Chưa chọn dịch vụ nào
                                              </Typography>
                                          )}
                                      </Stack>
                                      {/* Phải: tổng tiền + nút Tiếp tục xếp chồng để tiết kiệm chiều cao */}
                                      <Stack alignItems="flex-end" spacing={0.5} flexShrink={0}>
                                          <Typography variant="body2" fontWeight={600} noWrap>
                                              {Intl.NumberFormat('vi-VN').format(hoadon?.tongThanhToan ?? 0)}đ
                                          </Typography>
                                          <Button
                                              variant="contained"
                                              size="small"
                                              disabled={(hoaDonChiTiet?.length ?? 0) === 0}
                                              onClick={() => setMobileStep('cart')}>
                                              Tiếp tục
                                          </Button>
                                      </Stack>
                                  </Stack>
                              )}
                          </Grid>
                      )}

                {(!isMobile || mobileStep === 'cart') && (
                    <Grid item lg={5} md={6} xs={12} sm={7} sx={isMobile ? { height: '100%' } : undefined}>
                        <Stack marginLeft={isMobile ? 0 : 2} height={'100%'}>
                            {isMobile && (
                                <Stack
                                    direction="row"
                                    alignItems="center"
                                    spacing={1}
                                    sx={{ cursor: 'pointer', pb: 1 }}
                                    onClick={() => setMobileStep('browse')}>
                                    <ArrowBackIcon fontSize="small" />
                                    <Typography variant="body2" fontWeight={500}>
                                        Quay lại chọn dịch vụ
                                    </Typography>
                                </Stack>
                            )}
                            <Stack flex={1} minHeight={0}>
                                {loaiHoaDon === LoaiChungTu.HOA_DON_BAN_LE ? (
                                    // UI hóa đơn bán lẻ
                                    <Stack
                                        direction="row"
                                        alignItems="center"
                                        justifyContent="space-between"
                                        paddingBottom={2}
                                        sx={{
                                            borderBottom: '1px solid #eee'
                                        }}>
                                        {/* LEFT: Thông tin khách */}
                                        <Stack
                                            direction="row"
                                            spacing={1.5}
                                            alignItems="center"
                                            sx={{ cursor: 'pointer', flex: 1 }}
                                            onClick={(event) => setAnchorDropdownCustomer(event.currentTarget)}>
                                            <Avatar sx={{ width: 36, height: 36 }} />

                                            <Stack spacing={0.3} minWidth={0}>
                                                {/* Tên + nhóm */}
                                                <Typography variant="body2" fontWeight={500} noWrap>
                                                    {customerChosed?.tenKhachHang ?? 'Chưa chọn khách hàng'}
                                                </Typography>

                                                {customerChosed?.isShow && (
                                                    <Typography variant="caption" color="text.secondary" noWrap>
                                                        Nhóm: {customerChosed?.tenNhomKhach}
                                                    </Typography>
                                                )}

                                                {/* Công nợ + SĐT */}
                                                {customerChosed?.isShow && (
                                                    <Stack direction="row" spacing={2}>
                                                        {customerChosed?.conNo !== 0 && (
                                                            <Typography variant="caption" fontWeight={500}>
                                                                Nợ:{' '}
                                                                {Intl.NumberFormat('vi-VN').format(
                                                                    customerChosed?.conNo ?? 0
                                                                )}
                                                                đ
                                                            </Typography>
                                                        )}

                                                        <Typography variant="caption" color="text.secondary">
                                                            {customerChosed?.soDienThoai}
                                                        </Typography>
                                                    </Stack>
                                                )}
                                            </Stack>
                                        </Stack>

                                        <Button
                                            variant="contained"
                                            size="small"
                                            color={
                                                customerChosed?.id && customerChosed?.id !== Guid.EMPTY
                                                    ? 'error'
                                                    : 'primary'
                                            }
                                            onClick={() => {
                                                if (customerChosed?.id && customerChosed?.id !== Guid.EMPTY) {
                                                    handleRemoveCustomer();
                                                } else {
                                                    showModalAddCustomer();
                                                }
                                            }}>
                                            {customerChosed?.id && customerChosed?.id !== Guid.EMPTY
                                                ? '✕'
                                                : 'Thêm khách hàng'}
                                        </Button>
                                        {/* Dropdown */}
                                        <MenuWithDataFromDB
                                            open={expandSearchCus}
                                            anchorEl={anchorDropdownCustomer}
                                            handleClose={() => setAnchorDropdownCustomer(null)}
                                            typeSearch={TypeSearchfromDB.CUSTOMER}
                                            handleChoseItem={changeCustomer}
                                        />
                                    </Stack>
                                ) : (
                                    <Stack
                                        direction="row"
                                        alignItems="center"
                                        justifyContent="space-between"
                                        sx={{
                                            borderBottom: '1px solid #eee',
                                            pb: 2
                                        }}>
                                        <Stack
                                            direction="row"
                                            spacing={1.5}
                                            alignItems="flex-start"
                                            sx={{ cursor: 'pointer', flex: 1, minWidth: 0 }}
                                            onClick={(event) => {
                                                setAnchorDropdownPhone(event.currentTarget);
                                            }}>
                                            <Avatar sx={{ width: 36, height: 36 }} />

                                            <Stack spacing={1} flex={1} minWidth={0}>
                                                {/* 2 cột */}
                                                <Stack
                                                    direction="row"
                                                    spacing={3}
                                                    justifyContent="space-between"
                                                    alignItems="flex-start">
                                                    <Stack spacing={0.3} minWidth={140}>
                                                        <Typography variant="caption" fontWeight={600}>
                                                            {customerChosed?.tenKhachHang || 'Khách lẻ'}
                                                        </Typography>

                                                        <Typography variant="caption">
                                                            {customerChosed?.soDienThoai || '---'}
                                                        </Typography>

                                                        {!phoneChosed && (
                                                            <Typography
                                                                variant="caption"
                                                                color="text.secondary"
                                                                fontStyle="italic">
                                                                Chưa chọn máy
                                                            </Typography>
                                                        )}
                                                    </Stack>

                                                    <Stack spacing={0.3} flex={1} minWidth={0}>
                                                        {phoneChosed?.tenHangHoa && (
                                                            <Typography variant="body2" fontWeight={500} noWrap>
                                                                {[
                                                                    phoneChosed.tenHangHoa,
                                                                    phoneChosed.dungLuong,
                                                                    phoneChosed.mau
                                                                ]
                                                                    .filter(Boolean)
                                                                    .join(', ')}
                                                            </Typography>
                                                        )}

                                                        {phoneChosed?.imel && (
                                                            <Typography variant="caption" color="text.secondary" noWrap>
                                                                IMEI: {phoneChosed?.imel}
                                                            </Typography>
                                                        )}
                                                    </Stack>
                                                </Stack>

                                                {/* Nội dung + lỗi */}
                                                {phoneChosed && (
                                                    <Stack spacing={0.5}>
                                                        {renderPhoneQuickField('Nội dung', 'noiDung')}
                                                        {renderPhoneQuickField('Lỗi trước sửa', 'loi')}
                                                        {renderPhoneQuickField('Mật khẩu', 'matKhau')}
                                                    </Stack>
                                                )}
                                            </Stack>
                                        </Stack>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            sx={{ flexShrink: 0 }}
                                            color={phoneChosed ? 'error' : 'primary'}
                                            onClick={() => {
                                                if (phoneChosed) {
                                                    handleRemovePhone();
                                                } else {
                                                    showModalAddProduct(1);
                                                }
                                            }}>
                                            {phoneChosed ? '✕' : 'Thêm máy sửa chữa'}
                                        </Button>
                                        <MenuWithDataFromPhone
                                            open={expandSearchCusPhone}
                                            anchorEl={anchorDropdownPhone}
                                            handleClose={() => setAnchorDropdownPhone(null)}
                                            typeSearch={TypeSearchfromDB.CUSTOMER}
                                            handleChoseItem={changePhone}
                                        />
                                    </Stack>
                                )}

                                <Stack overflow={'auto'} flex={1} minHeight={0}>
                                    {hoaDonChiTiet
                                        ?.sort((x, y) => {
                                            const a = x.stt;
                                            const b = y.stt;
                                            return a > b ? -1 : a < b ? 1 : 0;
                                        })
                                        .map((cthd, index) => (
                                            <Grid
                                                container
                                                key={index}
                                                borderBottom={'1px solid #cccc'}
                                                alignItems={'center'}
                                                padding={'8px 0px'}>
                                                <Grid item xs={12} lg={6} md={5}>
                                                    <Grid item xs={12} lg={6} md={5}>
                                                        <Stack direction="row" spacing={1} alignItems="flex-start">
                                                            <PersonAddOutlinedIcon
                                                                titleAccess="Chọn nhân viên thực hiện"
                                                                sx={{ cursor: 'pointer', mt: '2px' }}
                                                                onClick={() => showPopNhanVienThucHien(cthd)}
                                                            />

                                                            <Stack spacing={0}>
                                                                <Typography
                                                                    className="lableOverflow"
                                                                    title={cthd?.tenHangHoa}>
                                                                    {cthd?.tenHangHoa}, {cthd?.mau}
                                                                </Typography>

                                                                <Typography
                                                                    variant="caption"
                                                                    className="lableOverflow"
                                                                    title={cthd?.imel}>
                                                                    {cthd?.imel}
                                                                </Typography>

                                                                <Typography
                                                                    variant="caption"
                                                                    color="var(--color-text-secondary)">
                                                                    BH: {cthd?.soThangBaoHanh ?? 0} tháng
                                                                </Typography>
                                                            </Stack>
                                                        </Stack>
                                                    </Grid>
                                                </Grid>
                                                <Grid item xs={12} lg={6} md={7}>
                                                    <Grid container alignItems={'center'}>
                                                        <Grid item xs={6}>
                                                            <Stack
                                                                spacing={1}
                                                                direction={'row'}
                                                                justifyContent={'end'}
                                                                title="Cập nhật giỏ hàng"
                                                                onClick={() => showPopChiTietGioHang(cthd?.id ?? '')}>
                                                                <Stack
                                                                    direction={'row'}
                                                                    spacing={1}
                                                                    flex={1}
                                                                    justifyContent={'end'}
                                                                    alignItems={'center'}>
                                                                    <Typography
                                                                        fontWeight={500}
                                                                        className="text-cursor">
                                                                        {cthd?.soLuong}
                                                                    </Typography>

                                                                    <Typography>x</Typography>
                                                                </Stack>
                                                                <Stack flex={3}>
                                                                    <Typography
                                                                        className="text-cursor"
                                                                        textAlign={'left'}>
                                                                        {Intl.NumberFormat('vi-VN').format(
                                                                            cthd?.donGiaTruocCK ?? 0
                                                                        )}
                                                                    </Typography>
                                                                </Stack>
                                                            </Stack>
                                                        </Grid>
                                                        <Grid item xs={6}>
                                                            <Stack
                                                                spacing={0.5}
                                                                direction={'row'}
                                                                textAlign={'right'}
                                                                justifyContent={'end'}
                                                                alignItems={'center'}>
                                                                <Typography fontWeight={500}>
                                                                    {Intl.NumberFormat('vi-VN').format(
                                                                        cthd?.thanhTienSauCK ?? 0
                                                                    )}
                                                                </Typography>
                                                                <IconButton
                                                                    aria-label="Xóa chi tiết hóa đơn"
                                                                    title="Xóa chi tiết hóa đơn"
                                                                    onClick={() => removeCTHD(cthd)}>
                                                                    <DeleteOutlinedIcon color="error" />
                                                                </IconButton>
                                                            </Stack>
                                                        </Grid>
                                                    </Grid>
                                                </Grid>

                                                <Grid item xs={12} lg={6} md={5}>
                                                    {(cthd?.nhanVienThucHien?.length ?? 0) > 0 && (
                                                        <Stack direction={'row'} spacing={1}>
                                                            {cthd?.nhanVienThucHien
                                                                ?.filter((x, index) => index < 2)
                                                                ?.map((nv, indexNV) => (
                                                                    <Chip
                                                                        key={indexNV}
                                                                        sx={{
                                                                            backgroundColor: 'var(--color-bg)',
                                                                            '& .MuiChip-deleteIcon:hover': {
                                                                                color: 'red'
                                                                            }
                                                                        }}
                                                                        label={nv?.tenNhanVien}
                                                                        deleteIcon={<CloseIcon sx={{ width: 20 }} />}
                                                                        onDelete={() => RemoveNVThucHien(cthd, nv)}
                                                                    />
                                                                ))}
                                                            {(cthd?.nhanVienThucHien?.length ?? 0) > 2 && (
                                                                <Chip
                                                                    sx={{ backgroundColor: 'var(--color-bg)' }}
                                                                    label={`${
                                                                        (cthd?.nhanVienThucHien?.length ?? 0) - 2
                                                                    } +`}
                                                                />
                                                            )}
                                                        </Stack>
                                                    )}
                                                </Grid>

                                                <Grid item xs={12} lg={6} md={7}>
                                                    <Grid container>
                                                        <Grid item lg={12} width={'100%'}>
                                                            <Stack
                                                                spacing={1}
                                                                direction={'row'}
                                                                alignItems={'center'}
                                                                marginTop={'-12px'}>
                                                                <Stack flex={1} textAlign={'center'} component={'span'}>
                                                                    {(cthd?.soLuongConLai ?? 0) > 0 && (
                                                                        <Typography
                                                                            fontWeight={500}
                                                                            variant="body2"
                                                                            component={'span'}>
                                                                            <span>{'/'}</span>
                                                                            <span>{cthd?.soLuongConLai}</span>
                                                                        </Typography>
                                                                    )}
                                                                </Stack>
                                                                <Stack flex={6}>
                                                                    {(cthd?.tienChietKhau ?? 0) > 0 && (
                                                                        <Typography
                                                                            variant="caption"
                                                                            fontStyle={'italic'}
                                                                            color={'var( --color-text-secondary)'}
                                                                            component={'span'}>
                                                                            Giảm{' '}
                                                                            <Typography
                                                                                component={'span'}
                                                                                variant="caption">
                                                                                {Intl.NumberFormat('vi-VN').format(
                                                                                    cthd?.tienChietKhau ?? 0
                                                                                )}
                                                                            </Typography>
                                                                        </Typography>
                                                                    )}
                                                                </Stack>
                                                            </Stack>
                                                        </Grid>
                                                    </Grid>
                                                </Grid>
                                            </Grid>
                                        ))}
                                </Stack>
                            </Stack>
                            <Stack
                                flexShrink={0}
                                sx={{
                                    backgroundColor: 'rgb(245 241 241)',
                                    height: 'auto',
                                    padding: '16px',
                                    boxSizing: 'border-box'
                                }}>
                                <Stack spacing={2}>
                                    <Stack direction={'row'} justifyContent={'space-between'} alignItems={'center'}>
                                        <Stack direction={'row'} spacing={1} alignItems={'center'}>
                                            <Typography sx={{ fontSize: '18px', fontWeight: 500 }}>
                                                Tổng thanh toán
                                            </Typography>
                                            <MoreOutlinedIcon
                                                titleAccess="Nhập giảm giá hóa đơn"
                                                sx={{ color: 'var(--color-text-secondary)' }}
                                                onClick={(e) => openPopoverGiamGia(e)}
                                            />

                                            {(hoadon?.tongGiamGiaHD ?? 0) > 0 && (
                                                <Typography variant="body2" color={'var(--color-text-secondary)'}>
                                                    - {Intl.NumberFormat('vi-VN').format(hoadon?.tongGiamGiaHD ?? 0)}
                                                </Typography>
                                            )}
                                        </Stack>
                                        <Stack spacing={1} alignItems={'center'}>
                                            <Typography sx={{ fontSize: '18px', fontWeight: 500 }}>
                                                {Intl.NumberFormat('vi-VN').format(hoadon?.tongThanhToan ?? 0)}
                                            </Typography>
                                        </Stack>
                                    </Stack>
                                    <Stack direction={'row'} justifyContent={'space-between'} alignItems={'center'}>
                                        <Typography fontWeight={500}>Tiền khách đưa</Typography>
                                        <RadioGroup
                                            sx={{ display: 'flex', flexDirection: 'row' }}
                                            onChange={(event) => {
                                                const newVal = (event.target as HTMLInputElement).value;
                                                const isTienMat = newVal?.toLocaleLowerCase() === 'true';
                                                setIsThanhToanTienMat(isTienMat);
                                            }}>
                                            <FormControlLabel
                                                value={true}
                                                label={'Tiền mặt'}
                                                checked={isThanhToanTienMat}
                                                control={<Radio size="small" />}
                                            />
                                            <FormControlLabel
                                                sx={{
                                                    marginRight: 0
                                                }}
                                                value={false}
                                                label={'Hình thức khác'}
                                                checked={!isThanhToanTienMat}
                                                control={<Radio size="small" />}
                                            />
                                        </RadioGroup>
                                    </Stack>
                                    <NumericFormat
                                        size="small"
                                        fullWidth
                                        value={sumTienKhachTra}
                                        decimalSeparator=","
                                        thousandSeparator="."
                                        sx={{
                                            '& input': {
                                                textAlign: 'right',
                                                fontWeight: '700',
                                                color: '#3D475C',
                                                fontSize: '18px',
                                                padding: '12px'
                                            }
                                        }}
                                        customInput={TextField}
                                        onChange={(event) => {
                                            setSumTienKhachTra(utils.formatNumberToFloat(event.target.value));
                                        }}
                                    />

                                    <Stack direction="row" spacing={2}>
                                        {/* Nút In Báo Giá - nhỏ gọn */}
                                        <Stack
                                            sx={{
                                                backgroundColor: '#6c757d',
                                                borderRadius: '8px',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                color: 'white',
                                                px: 2,
                                                py: 1,
                                                cursor: 'pointer',
                                                whiteSpace: 'nowrap'
                                            }}
                                            direction="row"
                                            onClick={handleBaoGia}
                                            spacing={1}>
                                            <PrintOutlinedIcon fontSize="small" />
                                            <Typography fontSize="14px" fontWeight={500}>
                                                IN BÁO GIÁ
                                            </Typography>
                                        </Stack>

                                        {isSavingHoaDon ? (
                                            <Stack
                                                sx={{
                                                    backgroundColor: isThanhToanTienMat
                                                        ? 'var(--color-main)'
                                                        : '#e5ebed',
                                                    borderRadius: '8px',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    color: 'white',
                                                    px: 2,
                                                    py: 1,
                                                    flex: 1
                                                }}
                                                direction="row"
                                                spacing={1}>
                                                <CircularProgress size={20} color="inherit" />
                                                <Typography fontSize="16px" padding={1}>
                                                    ĐANG LƯU
                                                </Typography>
                                            </Stack>
                                        ) : (
                                            <Stack
                                                sx={{
                                                    backgroundColor: isThanhToanTienMat
                                                        ? 'var(--color-main)'
                                                        : '#e5ebed',
                                                    borderRadius: '8px',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    color: 'white',
                                                    px: 2,
                                                    py: 1,
                                                    cursor: 'pointer',
                                                    flex: 1
                                                }}
                                                direction="row"
                                                spacing={1}
                                                onClick={saveHoaDon}>
                                                <CheckOutlinedIcon />
                                                <Typography fontSize="16px" padding={1} fontWeight={500}>
                                                    THANH TOÁN
                                                </Typography>
                                            </Stack>
                                        )}
                                    </Stack>
                                </Stack>
                            </Stack>
                        </Stack>
                    </Grid>
                )}
            </Grid>
        </>
    );
}
