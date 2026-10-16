import * as React from 'react';
import { useEffect, useState, useContext } from 'react';
import { NumericFormat } from 'react-number-format';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import CircularProgress from '@mui/material/CircularProgress';
import {
    Dialog,
    DialogTitle,
    DialogActions,
    DialogContent,
    Grid,
    Stack,
    Typography,
    Button,
    Box,
    TextField,
    Autocomplete,
    Link,
    FormGroup,
    FormControlLabel,
    Checkbox,
    Avatar,
    IconButton,
    useMediaQuery,
    useTheme
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { ReactComponent as CloseIcon } from '../../images/close-square.svg';
import { Add } from '@mui/icons-material';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import { ModelNhomHangHoa, ModelHangHoaDto, ModelHangHoaDienThoaiDto } from '../../services/product/dto';
import { PropConfirmOKCancel, PropModal } from '../../utils/PropParentToChild';
import ConfirmDelete from '../../components/AlertDialog/ConfirmDelete';

import ProductService from '../../services/product/ProductService';
import './style.css';

import { Guid } from 'guid-typescript';
import utils from '../../utils/utils';
import Cookies from 'js-cookie';
import uploadFileService from '../../services/uploadFileService';
import abpCustom from '../../components/abp-custom';
import SnackbarAlert from '../../components/AlertDialog/SnackbarAlert';
import ModalNhomHangHoa from './ModalGroupProduct';
import { observer } from 'mobx-react';
import nhomHangHoaStore from '../../stores/nhomHangHoaStore';
import { LoaiNhatKyThaoTac, TypeAction } from '../../lib/appconst';
import ImgurAPI from '../../services/ImgurAPI/ImgurAPI';
import { util } from 'prettier';
import DialogButtonClose from '../../components/Dialog/ButtonClose';
import { AppContext } from '../../services/chi_nhanh/ChiNhanhContext';
import { CreateNhatKyThaoTacDto } from '../../services/nhat_ky_hoat_dong/dto/CreateNhatKyThaoTacDto';
import nhatKyHoatDongService from '../../services/nhat_ky_hoat_dong/nhatKyHoatDongService';
import MenuWithDataFromDB from '../../components/Menu/MenuWithData_fromDB';

import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import { CreateOrEditKhachHangDto } from '../../services/khach-hang/dto/CreateOrEditKhachHangDto';
import { IList } from '../../services/dto/IList';
import { TypeSearchfromDB } from '../../enum/TypeSearch_fromDB';
import khachHangService from '../../services/khach-hang/khachHangService';
import CreateOrEditCustomerDialog from '../customer/components/create-or-edit-customer-modal';
import { KhachHangDto } from '../../services/khach-hang/dto/KhachHangDto';
import { PHONE_SUGGEST } from '../../lib/phoneSuggest';
import { COLOR_SUGGEST } from '../../lib/mauSacSuggest';
import { STORAGE_SUGGEST } from '../../lib/dungLuongSugget';

const ModalHangHoaDienThoaiSua = ({ handleSave, trigger }: any) => {
    const appContext = useContext(AppContext);
    const chiNhanhCurrent = appContext.chinhanhCurrent;
    const idChiNhanh = utils.checkNull(chiNhanhCurrent?.id) ? Cookies.get('IdChiNhanh') : chiNhanhCurrent?.id;
    const [open, setOpen] = useState(false);
    const [isNew, setIsNew] = useState(false);
    const [productPhone, setProductPhone] = useState(new ModelHangHoaDienThoaiDto());
    const [inforOldProduct, setInforOldProduct] = useState(new ModelHangHoaDto());
    const [wasClickSave, setWasClickSave] = useState(false);
    const [actionProduct, setActionProduct] = useState(TypeAction.INSEART);
    const tenantName = Cookies.get('TenantName') ?? 'HOST';
    const [productImage, setProductImage] = useState(''); // url of imge
    const [fileImage, setFileImage] = useState<File>({} as File); // file image
    const [isShowModalAddCus, setIsShowModalAddCus] = useState(false);
    const [newCus, setNewCus] = useState<CreateOrEditKhachHangDto>({} as CreateOrEditKhachHangDto);

    const [errTenHangHoa, setErrTenHangHoa] = useState(false);
    const [errChuSoHuu, setErrChuSoHuu] = useState(false);

    const [errMaHangHoa, setErrMaHangHoa] = useState(false);

    const [imgur_imageId, setImgur_imageId] = useState('');
    const [imgur_albumId, setImgur_albumId] = useState('');

    const [nhomChosed, setNhomChosed] = useState<ModelNhomHangHoa | null>(null);
    const [inforDeleteProduct, setInforDeleteProduct] = useState<PropConfirmOKCancel>(
        new PropConfirmOKCancel({ show: false })
    );
    const [triggerModalNhomHang, setTriggerModalNhomHang] = useState<PropModal>(new PropModal({ isShow: false }));
    const [objAlert, setObjAlert] = useState({ show: false, type: 1, mes: '' });
    const [customerChosed, setCustomerChosed] = useState<CreateOrEditKhachHangDto>({} as CreateOrEditKhachHangDto);
    const [anchorDropdownCustomer, setAnchorDropdownCustomer] = useState<null | HTMLElement>(null);
    const expandSearchCus = Boolean(anchorDropdownCustomer);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const showModal = async (id: string) => {
        if (id) {
            const obj = await ProductService.GetDetailProductPhone(id);
            setProductPhone(obj);
            setInforOldProduct(obj);

            setProductPhone((old: ModelHangHoaDienThoaiDto) => {
                return {
                    ...old,
                    laHangHoa: old.idLoaiHangHoa === 1
                };
            });

            // find nhomhang
            const nhom = nhomHangHoaStore.listAllNhomHang?.filter((x) => x.id == obj.idNhomHangHoa);
            if (nhom.length > 0) {
                setNhomChosed(nhom[0]);
            } else {
                setNhomChosed(null);
            }

            // get image (from imgur)
            const imgur_image = ImgurAPI.GetInforImage_fromDataImage(obj.image ?? '');
            setImgur_imageId(imgur_image?.id);

            const imgData = await ImgurAPI.GetFile_fromId(imgur_image?.id ?? '');
            setProductImage(imgData?.link ?? '');
            //get inford CuttommerCuttommer
            const data = await khachHangService.getDetailCustomerById(obj.idChuSoHuu ?? '');
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
        } else {
            setProductPhone(new ModelHangHoaDienThoaiDto());
            setProductImage('');

            // Thêm mới máy sửa: mặc định chủ máy là "Khách lẻ" (khách hàng thật dùng chung,
            // không phải id rỗng) để không cần bắt buộc chọn khách mới lưu/tạo check-in được.
            const khachLe = await khachHangService.GetOrCreate_KhachLe();
            setCustomerChosed({
                id: khachLe?.id ?? Guid.EMPTY,
                maKhachHang: khachLe?.maKhachHang ?? 'KL',
                tenKhachHang: khachLe?.tenKhachHang ?? 'Khách lẻ',
                soDienThoai: '',
                conNo: 0,
                tenNhomKhach: '',
                isShow: false
            } as CreateOrEditKhachHangDto);

            if (trigger.item.idNhomHangHoa !== undefined) {
                const nhom = nhomHangHoaStore.listAllNhomHang?.filter((x) => x.id == trigger.item.idNhomHangHoa);
                if (nhom.length > 0) {
                    setNhomChosed(nhom[0]);
                    setProductPhone((old: ModelHangHoaDienThoaiDto) => {
                        return {
                            ...old,
                            idNhomHangHoa: nhom[0].id,
                            tenNhomHang: nhom[0].tenNhomHang
                        };
                    });
                } else {
                    setNhomChosed(null);
                }
            } else {
                setNhomChosed(null);
            }
        }
    };

    useEffect(() => {
        GetInforAlbum();
        InitData();

        if (trigger.isShow) {
            setOpen(true);
            showModal(trigger.id);
        }
        setIsNew(trigger.isNew);
    }, [trigger]);

    const InitData = () => {
        setFileImage({} as File);
        setWasClickSave(false);
        setErrMaHangHoa(false);
        setErrTenHangHoa(false);
        setErrChuSoHuu(false);
        setImgur_imageId('');
        setImgur_albumId('');
    };

    const GetInforAlbum = async () => {
        const dataImage = await ProductService.GetInforImage_OfAnyHangHoa();
        const dataSubAlbum = ImgurAPI.GetInforSubAlbum_fromDataImage(dataImage);
        setImgur_albumId(dataSubAlbum?.id);

        if (utils.checkNull(dataSubAlbum?.id)) {
            // trường hợp đã có album treen Imgur, nhưng ảnh trong DM hàng hóa đã bị xóa hết
            const allAlbums = await ImgurAPI.GetAllAlbum_WithAccount();
            if (allAlbums !== undefined && allAlbums?.length > 0) {
                const albumItem = allAlbums?.filter((x) => x.title === `${tenantName}_HangHoa`);
                if (albumItem?.length > 0) {
                    setImgur_albumId(albumItem[0]?.id);
                }
            }
        }
    };

    const editGiaBan = (event: any) => {
        setProductPhone((itemOlds) => {
            return {
                ...itemOlds,
                giaBan: utils.formatNumberToFloat(event.target.value)
            };
        });
    };
    const editGiaVon = (event: any) => {
        setProductPhone((itemOlds) => {
            return {
                ...itemOlds,
                giaVon: utils.formatNumberToFloat(event.target.value)
            };
        });
    };
    const handleChangeNhom = (item: any) => {
        setProductPhone((itemOlds) => {
            return {
                ...itemOlds,
                idNhomHangHoa: item?.id ?? null,
                tenNhomHang: item?.tenNhomHang,
                laHangHoa: item?.laNhomHangHoa ?? false,
                idLoaiHangHoa: item?.laNhomHangHoa ? 1 : 2,
                tenLoaiHangHoa: item?.laNhomHangHoa ? 'hàng hóa' : 'điện thoại'
            };
        });

        if (item == null) setNhomChosed(null);
        else setNhomChosed(new ModelNhomHangHoa({ id: item?.id ?? null, tenNhomHang: item?.tenNhomHang }));
        setWasClickSave(false);
    };

    const handleClickOKComfirm = () => {
        setOpen(false);
        setInforDeleteProduct({ ...inforDeleteProduct, show: false });
        handleSave(productPhone, actionProduct);
    };

    const CheckSave = async () => {
        if (utils.checkNull(productPhone.tenHangHoa ?? '')) {
            setErrTenHangHoa(true);
            return false;
        }
        // máy sửa bắt buộc chọn khách (chủ máy), khách được chọn nằm ở customerChosed (gửi lên làm idChuSoHuu)
        if (utils.checkNull_OrEmpty(customerChosed?.id)) {
            setObjAlert({
                show: true,
                type: 2,
                mes: 'Vui lòng chọn khách hàng. Nếu không có thông tin khách, hãy chọn "Khách lẻ"'
            });
            setWasClickSave(false);
            return false;
        }
        if (!utils.checkNull(productPhone.maHangHoa ?? '')) {
            const exists = await ProductService.CheckExistsMaHangHoa(
                productPhone.maHangHoa ?? '',
                productPhone.idDonViQuyDoi ?? Guid.EMPTY
            );
            if (exists) {
                setErrMaHangHoa(true);
                return false;
            }
        }
        return true;
    };

    const choseImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file: File = e.target.files[0];
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                setProductImage(reader.result?.toString() ?? '');
            };
            setFileImage(file);
        } else {
            setProductImage('');
            setFileImage({} as File);
        }

        await closeImage();
    };
    const closeImage = async () => {
        setProductImage('');
        if (!utils.checkNull(imgur_imageId)) {
            await ImgurAPI.RemoveImage(imgur_imageId ?? '');
        }
    };

    const saveDiaryProduct = async (product: ModelHangHoaDto) => {
        const sLoai = isNew ? 'Thêm mới' : 'Cập nhật';
        let sOld = '';
        if (!isNew) {
            sOld = `<br /> <b> Thông tin cũ: </b> <br /> Mã điện thoại: ${
                inforOldProduct?.maHangHoa
            }  <br /> Tên điện thoại: ${inforOldProduct?.tenHangHoa} <br /> Thuộc nhóm: ${
                inforOldProduct?.tenNhomHang ?? ''
            }  <br /> Giá bán:  ${Intl.NumberFormat('vi-VN').format(inforOldProduct?.giaBan as unknown as number)}`;
        }
        const diary = {
            idChiNhanh: idChiNhanh,
            chucNang: `Danh mục khu vực`,
            noiDung: `${sLoai} điện thoại ${product?.tenHangHoa} (${product?.maHangHoa})  `,
            noiDungChiTiet: `Mã điện thoại: ${product?.maHangHoa}  <br /> Tên điện thoại: ${
                product?.tenHangHoa
            } <br /> Thuộc nhóm: ${product?.tenNhomHang ?? ''}  <br /> Giá bán:  ${Intl.NumberFormat('vi-VN').format(
                product?.giaBan as unknown as number
            )} ${sOld}`,
            loaiNhatKy: isNew ? LoaiNhatKyThaoTac.INSEART : LoaiNhatKyThaoTac.UPDATE
        } as CreateNhatKyThaoTacDto;
        await nhatKyHoatDongService.createNhatKyThaoTac(diary);
    };

    async function saveProduct() {
        setWasClickSave(true);

        if (wasClickSave) {
            return;
        }
        const check = await CheckSave();
        if (!check) {
            return;
        }

        // imageData: tennantName_HangHoa/image (albumId/imageId)
        let imgur_PathImage = '';
        if ((fileImage?.size ?? 0) > 0) {
            let subAlbumId = imgur_albumId;
            if (utils.checkNull(imgur_albumId)) {
                // create subAlbum
                const subAlbum = await ImgurAPI.CreateNewAlbum(`${tenantName}_HangHoa`);
                if (subAlbum != null && subAlbum?.id !== undefined) {
                    imgur_PathImage = `${subAlbum?.id}/`;
                    subAlbumId = subAlbum?.id;
                }
            } else {
                imgur_PathImage = `${imgur_albumId}/`;
            }

            // add image to subAlbum
            const dataImage = await ImgurAPI.UploadImage(fileImage);
            if (dataImage != null && dataImage?.id !== undefined) {
                imgur_PathImage += `${dataImage?.id}`;
                await ImgurAPI.AddImageToAlbum_WithImageId(subAlbumId, dataImage?.id ?? '');
            }
        }

        // if update: imageId != null
        if (!utils.checkNull(imgur_imageId) && utils.checkNull(productImage)) {
            imgur_PathImage = '';
        } else {
            imgur_PathImage = productPhone?.image ?? ''; // keep
        }

        const objNew = { ...productPhone };
        objNew.giaBan = utils.formatNumberToFloat(productPhone.giaBan);
        objNew.giaVon = utils.formatNumberToFloat(productPhone.giaVon);
        objNew.tenHangHoa_KhongDau = utils.strToEnglish(objNew.tenHangHoa ?? '');
        objNew.tenLoaiHangHoa = objNew.idLoaiHangHoa == 1 ? 'Hàng hóa' : 'điện thoại';
        objNew.txtTrangThaiHang = objNew.trangThai == 1 ? 'Đang kinh doanh' : 'Ngừng kinh doanh';
        objNew.image = imgur_PathImage;
        objNew.dungLuong = productPhone.dungLuong;
        objNew.mau = productPhone.mau;
        objNew.noiDung = productPhone.noiDung;
        // Backend lưu Pin dạng số (int?) - nếu bỏ trống/không phải số thì gửi 0 thay vì chuỗi rỗng
        // (chuỗi rỗng khiến Backend lưu lỗi, không thêm được máy).
        const pinNumber = parseInt(productPhone.pin ?? '', 10);
        objNew.pin = (isNaN(pinNumber) ? 0 : pinNumber) as unknown as string;
        objNew.imel = productPhone.imel;
        objNew.loi = productPhone.loi;
        objNew.matKhau = productPhone.matKhau;
        objNew.idChuSoHuu = customerChosed.id;
        objNew.idLoaiHangHoa = 5;

        objNew.donViQuiDois = [
            {
                id: objNew.idDonViQuyDoi,
                maHangHoa: objNew.maHangHoa,
                tenDonViTinh: '',
                tyLeChuyenDoi: objNew.tyLeChuyenDoi,
                giaBan: objNew.giaBan,
                giaVon: objNew.giaVon,
                laDonViTinhChuan: objNew.laDonViTinhChuan
            }
        ];
        let data;
        try {
            data = await ProductService.CreateOrEditProductPhone(objNew);
        } catch {
            // lỗi từ BE (vd: trùng IMEI) đã được hiển thị qua http interceptor
            setWasClickSave(false);
            return;
        }

        objNew.id = data.id;
        objNew.idHangHoa = data.id;
        objNew.donViQuiDois = [...data.donViQuiDois];
        objNew.maHangHoa = data.donViQuiDois.filter((x: any) => x.laDonViTinhChuan === 1)[0]?.maHangHoa;
        objNew.idDonViQuyDoi = data.donViQuiDois.filter((x: any) => x.laDonViTinhChuan === 1)[0]?.id;

        // save diary
        await saveDiaryProduct(objNew);

        handleSave(objNew, isNew ? TypeAction.INSEART : TypeAction.UPDATE);
        setOpen(false);
    }

    function showModalAddNhomHang(id = '') {
        setTriggerModalNhomHang({
            isShow: true,
            isNew: utils.checkNull(id),
            id: id
        });
    }

    const saveNhomHang = (objNhomHang: ModelNhomHangHoa) => {
        setTriggerModalNhomHang({ ...triggerModalNhomHang, isShow: false });
        setNhomChosed(objNhomHang);
        setProductPhone({ ...productPhone, idNhomHangHoa: objNhomHang.id, tenNhomHang: objNhomHang.tenNhomHang });

        setObjAlert({
            show: true,
            type: 1,
            mes: 'Thêm nhóm ' + (productPhone?.tenLoaiHangHoa ?? '').toLocaleLowerCase() + ' thành công'
        });
        // todgo get again treeNhomHang
    };

    const changeCustomer = async (item: IList) => {
        setAnchorDropdownCustomer(null);
        setCustomerChosed({
            ...customerChosed,
            id: item?.id,
            maKhachHang: item?.maKhachHang ?? '',
            tenKhachHang: item?.text ?? 'Khách lẻ',
            soDienThoai: item?.text2 ?? '',
            conNo: item?.conNo,
            tenNhomKhach: item.nhomKhach,
            isShow: true
        });
    };

    const RemoveCustomer = async () => {
        // const check = CheckDangSuDungGDV(1);
        // if (!check) {
        //     return;
        // }
        await AgreeRemoveCustomer();
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
    const AgreeRemoveCustomer = async () => {
        // const idCheckinDelete = hoadon?.idCheckIn ?? Guid.EMPTY;
        // await CheckinService.UpdateTrangThaiCheckin(idCheckinDelete, TrangThaiCheckin.DELETED);
        // await CheckinService.UpdateTrangThaiBooking_byIdCheckIn(idCheckinDelete, TrangThaiBooking.Confirm);
        // setCustomerHasGDV(false);
        // setConfirmDialog({ ...confirmDialog, show: false });
        // setHoaDon({ ...hoadon, idKhachHang: null });

        // Dùng chung 1 khách hàng "Khách lẻ" thật trong DB (không phải id rỗng) cho mọi trường hợp
        // không có thông tin khách - để vẫn lưu được máy và vẫn tạo được check-in bình thường.
        const khachLe = await khachHangService.GetOrCreate_KhachLe();
        setCustomerChosed({
            ...customerChosed,
            id: khachLe?.id ?? Guid.EMPTY,
            maKhachHang: khachLe?.maKhachHang ?? 'KL',
            tenKhachHang: khachLe?.tenKhachHang ?? 'Khách lẻ',
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
    const [loading, setLoading] = useState(false);

    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'empty' | 'error'>('idle');

    const handleGetIphone = async () => {
        try {
            setLoading(true);
            setStatus('loading');

            const data = await ProductService.GetIphoneConnectPC();

            if (!data) {
                setStatus('empty');
                return;
            }

            setProductPhone((prev) => ({
                ...prev,
                tenHangHoa: data.dongMay ?? prev.tenHangHoa,
                dungLuong: data.dungLuong?.replace('GB', '') ?? prev.dungLuong,
                mau: data.mau ?? prev.mau,
                imel: data.imei ?? prev.imel,
                pin: data.batteryHealth ?? prev.pin
            }));

            setStatus('success');
        } catch (err) {
            setStatus('error');
        } finally {
            setLoading(false);
        }
    };
    const changeCustomer_fromModalAdd = async (customer?: KhachHangDto) => {
        setIsShowModalAddCus(false);
        if (customer) {
            setCustomerChosed({
                ...customerChosed,
                id: customer?.id?.toString(),
                maKhachHang: customer?.maKhachHang,
                tenKhachHang: customer?.tenKhachHang ?? 'Chưa chọn khách',
                soDienThoai: customer?.soDienThoai ?? '',
                isShow: true
            });
            // lấy lại đầy đủ thông tin (nhóm khách, tổng nợ) để hiển thị sau khi thêm/sửa khách
            const data = await khachHangService.getDetailCustomerById(customer?.id?.toString() ?? '');
            if (!utils.checkNull(data?.id?.toString())) {
                setCustomerChosed((old) => ({
                    ...old,
                    id: data?.id?.toString() ?? old.id,
                    maKhachHang: data?.maKhachHang ?? old.maKhachHang,
                    tenKhachHang: data?.tenKhachHang ?? old.tenKhachHang,
                    soDienThoai: data?.soDienThoai ?? '',
                    conNo: data?.conNo,
                    tenNhomKhach: data?.tenNhomKhach,
                    isShow: true
                }));
            }
        }
    };

    // Khách lẻ dùng chung cho cả cửa hàng -> không cho sửa
    const isKhachLe = !customerChosed?.isShow || customerChosed?.maKhachHang === 'KL';

    // Bấm vào thông tin khách: mở popup khách hàng ở chế độ sửa (popup đã có kiểm tra trùng SĐT)
    const showModalEditCustomer = async () => {
        if (isKhachLe || utils.checkNull_OrEmpty(customerChosed?.id)) return;
        const data = await khachHangService.getKhachHang(customerChosed.id);
        if (utils.checkNull(data?.id)) return;
        setNewCus(data);
        setIsShowModalAddCus(true);
    };

    return (
        <>
            <CreateOrEditCustomerDialog
                visible={isShowModalAddCus}
                onCancel={() => setIsShowModalAddCus(false)}
                onOk={changeCustomer_fromModalAdd}
                title={utils.checkNull_OrEmpty(newCus?.id) ? 'Thêm mới khách hàng' : 'Cập nhật khách hàng'}
                formRef={newCus}
            />
            <ConfirmDelete
                isShow={inforDeleteProduct.show}
                title={inforDeleteProduct.title}
                mes={inforDeleteProduct.mes}
                onOk={handleClickOKComfirm}
                onCancel={() => setInforDeleteProduct({ ...inforDeleteProduct, show: false })}></ConfirmDelete>
            <SnackbarAlert
                showAlert={objAlert.show}
                type={objAlert.type}
                title={objAlert.mes}
                handleClose={() => setObjAlert({ show: false, mes: '', type: 1 })}></SnackbarAlert>
            <ModalNhomHangHoa trigger={triggerModalNhomHang} handleSave={saveNhomHang} />
            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md" fullScreen={isMobile}>
                <DialogButtonClose onClose={() => setOpen(false)} />
                <DialogTitle className="modal-title">
                    {isNew ? 'Thêm ' : 'Cập nhật '}
                    {productPhone.tenLoaiHangHoa?.toLocaleLowerCase()}
                </DialogTitle>

                <DialogContent>
                    <Grid container spacing={2} paddingTop={1}>
                        {/* Cột trái: khách hàng (chọn khách có sẵn / thêm mới, bên dưới là thông tin khách) */}
                        <Grid item xs={12} sm={4}>
                            <Stack
                                spacing={1.5}
                                sx={{
                                    border: '1px solid rgb(224, 228, 235)',
                                    borderRadius: 2,
                                    p: 1.5,
                                    height: '100%'
                                }}>
                                <Typography variant="body2" fontWeight={600}>
                                    Khách hàng
                                </Typography>
                                <Stack direction="row" spacing={1}>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        fullWidth
                                        startIcon={<SearchIcon />}
                                        sx={{ textTransform: 'none' }}
                                        onClick={(event) => setAnchorDropdownCustomer(event.currentTarget)}>
                                        Chọn khách có sẵn
                                    </Button>
                                    <IconButton
                                        size="small"
                                        color="primary"
                                        aria-label="add-customer"
                                        title="Thêm khách hàng mới"
                                        sx={{ border: '1px solid', borderRadius: 1, flexShrink: 0 }}
                                        onClick={showModalAddCustomer}>
                                        <AddOutlinedIcon fontSize="small" />
                                    </IconButton>
                                </Stack>

                                <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="flex-start"
                                    title={isKhachLe ? '' : 'Bấm để sửa thông tin khách hàng'}
                                    onClick={showModalEditCustomer}
                                    sx={{
                                        p: 1,
                                        borderRadius: 1,
                                        backgroundColor: '#f7f8fa',
                                        cursor: isKhachLe ? 'default' : 'pointer',
                                        '&:hover': isKhachLe ? {} : { backgroundColor: '#eef3fb' }
                                    }}>
                                    <Avatar sx={{ width: 36, height: 36 }} />
                                    <Stack spacing={0.25} flex={1} minWidth={0}>
                                        <Stack
                                            direction="row"
                                            alignItems="center"
                                            justifyContent="space-between"
                                            spacing={0.5}>
                                            <Typography variant="body2" fontWeight={600} noWrap>
                                                {customerChosed?.tenKhachHang || 'Khách lẻ'}
                                            </Typography>
                                            {!isKhachLe && (
                                                <CloseOutlinedIcon
                                                    color="error"
                                                    titleAccess="Bỏ chọn khách hàng"
                                                    sx={{ width: 18, height: 18, flexShrink: 0, cursor: 'pointer' }}
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        RemoveCustomer();
                                                    }}
                                                />
                                            )}
                                        </Stack>
                                        {!isKhachLe && (
                                            <>
                                                <Typography variant="caption" noWrap>
                                                    SĐT: {customerChosed?.soDienThoai || '---'}
                                                </Typography>
                                                <Typography variant="caption" noWrap>
                                                    Nhóm: {customerChosed?.tenNhomKhach || '---'}
                                                </Typography>
                                                <Typography
                                                    variant="caption"
                                                    fontWeight={(customerChosed?.conNo ?? 0) !== 0 ? 600 : 400}
                                                    color={(customerChosed?.conNo ?? 0) > 0 ? 'error.main' : 'inherit'}>
                                                    Tổng nợ:{' '}
                                                    {new Intl.NumberFormat('vi-VN').format(customerChosed?.conNo ?? 0)}đ
                                                </Typography>
                                            </>
                                        )}
                                    </Stack>
                                </Stack>
                                {!isKhachLe && (
                                    <Typography variant="caption" color="text.secondary" fontStyle="italic">
                                        Bấm vào thông tin khách để sửa
                                    </Typography>
                                )}

                                <MenuWithDataFromDB
                                    typeSearch={TypeSearchfromDB.CUSTOMER}
                                    open={expandSearchCus}
                                    anchorEl={anchorDropdownCustomer}
                                    handleClose={() => setAnchorDropdownCustomer(null)}
                                    handleChoseItem={changeCustomer}
                                />
                            </Stack>
                        </Grid>
                        {/* Cột phải: thông tin điện thoại */}
                        <Grid item xs={12} sm={8} md={8} lg={8}>
                            <Stack spacing={2}>
                                {/* Tên máy co giãn (vừa "iPhone 18 Pro Max"), Dung lượng/Màu đủ hiện nhãn.
                                    Mobile: tên 1 dòng riêng, Dung lượng | Màu chia đôi dòng dưới */}
                                <Box
                                    sx={{
                                        display: 'grid',
                                        gap: { xs: 1.5, sm: 2 },
                                        gridTemplateColumns: { xs: '1fr 1fr', sm: 'minmax(0, 1fr) 130px 120px' },
                                        alignItems: 'start'
                                    }}>
                                    <Autocomplete
                                        freeSolo
                                        sx={{ gridColumn: { xs: '1 / -1', sm: 'auto' }, minWidth: 0 }}
                                        options={PHONE_SUGGEST}
                                        value={productPhone.tenHangHoa || ''}
                                        filterOptions={(options, state) => {
                                            const keyword = state.inputValue.toLowerCase().replace(/\s/g, '');

                                            return options.filter((x) =>
                                                x.toLowerCase().replace(/\s/g, '').includes(keyword)
                                            );
                                        }}
                                        onInputChange={(event, newValue) => {
                                            setProductPhone((itemOlds) => ({
                                                ...itemOlds,
                                                tenHangHoa: newValue
                                            }));

                                            setErrTenHangHoa(false);
                                            setWasClickSave(false);
                                        }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                variant="outlined"
                                                size="small"
                                                autoFocus
                                                error={wasClickSave && errTenHangHoa}
                                                helperText={
                                                    wasClickSave && errTenHangHoa
                                                        ? `Vui lòng nhập tên ${productPhone.tenLoaiHangHoa?.toLocaleLowerCase()}`
                                                        : ''
                                                }
                                                label={
                                                    <Typography variant="body2">
                                                        Tên {productPhone.tenLoaiHangHoa?.toLocaleLowerCase()}
                                                        <span className="text-danger"> *</span>
                                                    </Typography>
                                                }
                                            />
                                        )}
                                    />

                                    <Autocomplete
                                        sx={{ minWidth: 0 }}
                                        options={STORAGE_SUGGEST}
                                        value={STORAGE_SUGGEST.find((x) => x.value === productPhone.dungLuong) || null}
                                        getOptionLabel={(option) => option.label}
                                        onChange={(event, newValue) => {
                                            setProductPhone((prev) => ({
                                                ...prev,
                                                dungLuong: newValue?.value || 0
                                            }));
                                        }}
                                        renderInput={(params) => (
                                            <TextField {...params} variant="outlined" size="small" label="Dung lượng" />
                                        )}
                                    />
                                    <Autocomplete
                                        freeSolo
                                        sx={{ minWidth: 0 }}
                                        options={COLOR_SUGGEST}
                                        getOptionLabel={(option: any) =>
                                            typeof option === 'string' ? option : option.label
                                        }
                                        filterOptions={(options, state) => {
                                            const keyword = state.inputValue.toLowerCase().replace(/\s/g, '');

                                            return options.filter((item) =>
                                                item.search.some((x: string) => x.includes(keyword))
                                            );
                                        }}
                                        value={productPhone.mau || ''}
                                        onInputChange={(event, newValue) => {
                                            setProductPhone((prev) => ({
                                                ...prev,
                                                mau: newValue
                                            }));
                                        }}
                                        renderInput={(params) => (
                                            <TextField {...params} variant="outlined" size="small" label="Màu sắc" />
                                        )}
                                    />
                                </Box>
                                <TextField
                                    variant="outlined"
                                    size="small"
                                    sx={{ flex: 1 }}
                                    label="Nội dung cần sửa"
                                    value={productPhone.noiDung || ''}
                                    onChange={(e) =>
                                        setProductPhone((prev) => ({
                                            ...prev,
                                            noiDung: e.target.value
                                        }))
                                    }
                                />
                                <Stack direction={'row'} spacing={1}>
                                    <Autocomplete
                                        size="small"
                                        fullWidth
                                        disablePortal
                                        value={nhomChosed}
                                        isOptionEqualToValue={(option, value) => option.id === value.id}
                                        options={nhomHangHoaStore?.listAllNhomHang?.filter(
                                            (x) => x.id !== null && x.id !== ''
                                        )}
                                        onChange={(event, newValue) => handleChangeNhom(newValue)}
                                        getOptionLabel={(option: any) => (option.tenNhomHang ? option.tenNhomHang : '')}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label={`Nhóm ${productPhone.tenLoaiHangHoa?.toLocaleLowerCase()}`}
                                            />
                                        )}
                                        renderOption={(props, item) => (
                                            <Box component={'li'} {...props} className="autocomplete-option">
                                                {item.tenNhomHang}
                                            </Box>
                                        )}
                                    />
                                    <Add
                                        titleAccess="Thêm nhóm"
                                        sx={{
                                            width: 36,
                                            display: abpCustom.isGrandPermission('Pages.DM_NhomHangHoa.Create')
                                                ? ''
                                                : 'none',
                                            height: 36,
                                            padding: 0.5,
                                            border: '1px solid #ccc',
                                            borderRadius: '4px'
                                        }}
                                        onClick={() => showModalAddNhomHang()}
                                    />
                                </Stack>
                                {/* Pin tối đa 3 số, Mật khẩu ~6 ký tự -> thu gọn, phần còn lại dành cho IMEI */}
                                <Box
                                    sx={{
                                        display: 'grid',
                                        gap: { xs: 1.5, sm: 2 },
                                        gridTemplateColumns: '72px minmax(0, 1fr) 105px'
                                    }}>
                                    <TextField
                                        variant="outlined"
                                        size="small"
                                        label="Pin"
                                        inputProps={{ inputMode: 'numeric', maxLength: 3 }}
                                        value={productPhone.pin || ''}
                                        onChange={(e) =>
                                            setProductPhone((prev) => ({
                                                ...prev,
                                                pin: e.target.value
                                            }))
                                        }
                                    />
                                    <TextField
                                        variant="outlined"
                                        size="small"
                                        label="IMEL"
                                        value={productPhone.imel || ''}
                                        onChange={(e) =>
                                            setProductPhone((prev) => ({
                                                ...prev,
                                                imel: e.target.value
                                            }))
                                        }
                                    />
                                    <TextField
                                        variant="outlined"
                                        size="small"
                                        label="Mật khẩu"
                                        value={productPhone.matKhau || ''}
                                        onChange={(e) =>
                                            setProductPhone((prev) => ({
                                                ...prev,
                                                matKhau: e.target.value
                                            }))
                                        }
                                    />
                                </Box>
                                {/* <Stack direction="row" spacing={2}>
                                    <NumericFormat
                                        size="small"
                                        fullWidth
                                        label="Giá bán"
                                        value={productPhone.giaBan}
                                        thousandSeparator="."
                                        decimalSeparator=","
                                        customInput={TextField}
                                        onChange={(event) => editGiaBan(event)}
                                    />
                                    <NumericFormat
                                        size="small"
                                        fullWidth
                                        label="Giá vốn"
                                        value={productPhone.giaVon}
                                        thousandSeparator="."
                                        decimalSeparator=","
                                        customInput={TextField}
                                        onChange={(event) => editGiaVon(event)}
                                    />
                                </Stack> */}
                                <TextField
                                    variant="outlined"
                                    size="small"
                                    fullWidth
                                    label="Lỗi cần báo khách trước khi sửa chữa"
                                    placeholder="Nhập mô tả lỗi"
                                    value={productPhone.loi || ''}
                                    onChange={(event) =>
                                        setProductPhone((prev) => ({
                                            ...prev,
                                            loi: event.target.value
                                        }))
                                    }
                                />
                                <TextField
                                    variant="outlined"
                                    fullWidth
                                    multiline
                                    rows="2"
                                    label="Ghi chú"
                                    value={productPhone?.moTa ?? ''}
                                    onChange={(event) =>
                                        setProductPhone((itemOlds) => {
                                            return {
                                                ...itemOlds,
                                                moTa: event.target.value
                                            };
                                        })
                                    }
                                />
                            </Stack>
                        </Grid>
                    </Grid>
                    <Grid container>
                        <Grid item xs={12}>
                            <Grid item xs={12} sm={12} md={12} lg={12} style={{ display: 'none' }}>
                                <FormGroup>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                size="small"
                                                checked={productPhone.laHangHoa}
                                                onChange={(event) => {
                                                    setProductPhone((olds: ModelHangHoaDienThoaiDto) => {
                                                        return {
                                                            ...olds,
                                                            laHangHoa: event.target.checked,
                                                            idLoaiHangHoa: event.target.checked ? 2 : 1,
                                                            tenLoaiHangHoa: event.target.checked
                                                                ? 'hàng hóa'
                                                                : 'điện thoại'
                                                        };
                                                    });
                                                }}
                                                sx={{
                                                    color: 'var(--color-main)',
                                                    '&.Mui-checked': {
                                                        color: 'var(--color-main)'
                                                    }
                                                }}
                                            />
                                        }
                                        label="Là hàng hóa"
                                    />
                                </FormGroup>
                            </Grid>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions style={{ paddingBottom: '20px' }} sx={{ px: 3, flexWrap: 'wrap', rowGap: 1 }}>
                    {/* Lấy nhanh thông tin iPhone đang kết nối máy tính - đặt cạnh Hủy/Lưu */}
                    <Stack direction="row" alignItems="center" spacing={1} minWidth={0} sx={{ mr: 'auto' }}>
                        <Button
                            variant="contained"
                            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <PhoneIphoneIcon />}
                            onClick={handleGetIphone}
                            disabled={loading}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                flexShrink: 0,
                                background: 'linear-gradient(135deg, var(--color-main), var(--color-main-light))',
                                '&:hover': {
                                    background:
                                        'linear-gradient(135deg, var(--color-main-dark), var(--color-main-light))'
                                }
                            }}>
                            {loading ? 'Đang lấy dữ liệu...' : 'Lấy nhanh'}
                        </Button>
                        {status !== 'idle' && status !== 'loading' && (
                            <Typography
                                variant="caption"
                                sx={{
                                    color: status === 'success' ? 'green' : 'red'
                                }}>
                                {status === 'success' && '✅ Lấy thông tin thành công'}
                                {status === 'empty' && '⚠️ Không có thông tin thiết bị'}
                                {status === 'error' && '❌ Không phát hiện iPhone'}
                            </Typography>
                        )}
                    </Stack>
                    <Button
                        variant="outlined"
                        sx={{ color: 'var(--color-main)' }}
                        onClick={() => setOpen(false)}
                        className="btn-outline-hover">
                        Hủy
                    </Button>
                    <Button
                        variant="contained"
                        sx={{
                            bgcolor: '#633434',
                            display:
                                !abpCustom.isGrandPermission('Pages.DM_HangHoa.Restore') || productPhone.trangThai === 1
                                    ? 'none'
                                    : ''
                        }}
                        onClick={() => {
                            setInforDeleteProduct(
                                new PropConfirmOKCancel({
                                    show: true,
                                    title: 'Khôi phục ' + productPhone?.tenLoaiHangHoa?.toLocaleLowerCase(),
                                    mes: `Bạn có chắc chắn muốn khôi phục ${productPhone?.tenLoaiHangHoa?.toLocaleLowerCase()} ${
                                        productPhone.tenHangHoa
                                    }   không?`
                                })
                            );
                            setActionProduct(TypeAction.RESTORE);
                        }}>
                        Khôi phục
                    </Button>
                    {!(productPhone.trangThai === 0 || isNew) && !wasClickSave && (
                        <Button
                            variant="outlined"
                            sx={{ display: abpCustom.isGrandPermission('Pages.DM_HangHoa.Delete') ? '' : 'none' }}
                            color="error"
                            onClick={() => {
                                setInforDeleteProduct(
                                    new PropConfirmOKCancel({
                                        show: true,
                                        title: 'Xác nhận xóa',
                                        mes: `Bạn có chắc chắn muốn xóa ${productPhone.tenHangHoa}  ${
                                            productPhone?.tenLoaiHangHoa ?? ' '
                                        } không?`
                                    })
                                );
                                setActionProduct(TypeAction.DELETE);
                            }}>
                            Xóa
                        </Button>
                    )}

                    {productPhone.trangThai !== 0 && (
                        <>
                            {!wasClickSave && (
                                <Button
                                    variant="contained"
                                    sx={{ bgcolor: 'var(--color-main)' }}
                                    onClick={saveProduct}
                                    className="btn-container-hover">
                                    Lưu
                                </Button>
                            )}
                            {wasClickSave && (
                                <Button
                                    variant="contained"
                                    sx={{ bgcolor: 'var(--color-main)' }}
                                    className="btn-container-hover">
                                    Đang lưu
                                </Button>
                            )}
                        </>
                    )}
                </DialogActions>
            </Dialog>
        </>
    );
};
export default observer(ModalHangHoaDienThoaiSua);
