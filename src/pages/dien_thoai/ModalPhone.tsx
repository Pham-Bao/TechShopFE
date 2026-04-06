import * as React from 'react';
import { useEffect, useState, useContext } from 'react';
import { NumericFormat } from 'react-number-format';
import axios, { AxiosError } from 'axios';
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
    IconButton
} from '@mui/material';
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
const ModalHangHoaDienThoai = ({ handleSave, trigger }: any) => {
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
    const GetIphoneConnectPC = async () => {
        try {
            console.log('trạng thái ' + isNew);
            const data = await ProductService.GetIphoneConnectPC();
            if (!data) return;

            setProductPhone((prev) => ({
                ...prev,
                tenHangHoa: data.dongMay ?? prev.tenHangHoa,
                dungLuong: data.dungLuong?.replace('GB', '') ?? prev.dungLuong,
                mau: data.mau ?? prev.mau,
                imel: data.imei ?? prev.imel,
                pin: data.batteryHealth ?? prev.pin
            }));
        } catch (err) {
            console.log('Không phát hiện iPhone');
        }
    };
    useEffect(() => {
        GetInforAlbum();
        InitData();

        setIsNew(trigger.isNew);

        if (trigger.isShow) {
            setOpen(true);
            showModal(trigger.id);

            if (trigger.isNew) {
                GetIphoneConnectPC(); // 👈 chỉ gọi khi tạo mới
            }
        }
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
        // if (utils.checkNull(productPhone.idChuSoHuu ?? '')) {
        //     setErrChuSoHuu(true);
        //     return false;
        // }
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
        if (wasClickSave) return;
        setWasClickSave(true);

        try {
            const check = await CheckSave();
            if (!check) {
                setWasClickSave(false);
                return;
            }

            let imgur_PathImage = productPhone?.image ?? '';

            // upload image
            if ((fileImage?.size ?? 0) > 0) {
                let subAlbumId = imgur_albumId;

                if (utils.checkNull(imgur_albumId)) {
                    const subAlbum = await ImgurAPI.CreateNewAlbum(`${tenantName}_HangHoa`);
                    if (subAlbum?.id) {
                        subAlbumId = subAlbum.id;
                    }
                }

                const dataImage = await ImgurAPI.UploadImage(fileImage);

                if (dataImage?.id) {
                    imgur_PathImage = `${subAlbumId}/${dataImage.id}`;
                    await ImgurAPI.AddImageToAlbum_WithImageId(subAlbumId, dataImage.id);
                }
            }

            // nếu update mà xóa ảnh
            if (!utils.checkNull(imgur_imageId) && utils.checkNull(productImage)) {
                imgur_PathImage = '';
            }

            const objNew = {
                ...productPhone,
                giaBan: utils.formatNumberToFloat(productPhone.giaBan),
                giaVon: utils.formatNumberToFloat(productPhone.giaVon),
                tenHangHoa_KhongDau: utils.strToEnglish(productPhone.tenHangHoa ?? ''),
                tenLoaiHangHoa: productPhone.idLoaiHangHoa === 1 ? 'Hàng hóa' : 'điện thoại',
                txtTrangThaiHang: productPhone.trangThai === 1 ? 'Đang kinh doanh' : 'Ngừng kinh doanh',
                image: imgur_PathImage,
                dungLuong: productPhone.dungLuong,
                mau: productPhone.mau,
                noiDung: productPhone.noiDung,
                pin: productPhone.pin,
                imel: productPhone.imel,
                loi: productPhone.loi,
                matKhau: productPhone.matKhau,
                idChuSoHuu: customerChosed?.id,
                idLoaiHangHoa: 4,
                donViQuiDois: [
                    {
                        id: productPhone.idDonViQuyDoi,
                        maHangHoa: productPhone.maHangHoa,
                        tenDonViTinh: '',
                        tyLeChuyenDoi: productPhone.tyLeChuyenDoi,
                        giaBan: utils.formatNumberToFloat(productPhone.giaBan),
                        giaVon: utils.formatNumberToFloat(productPhone.giaVon),
                        laDonViTinhChuan: productPhone.laDonViTinhChuan
                    }
                ]
            };

            const data = await ProductService.CreateOrEditProductPhone(objNew);

            objNew.id = data.id;
            objNew.idHangHoa = data.id;
            objNew.donViQuiDois = [...data.donViQuiDois];

            const dvChuan = data.donViQuiDois;

            objNew.maHangHoa = dvChuan?.maHangHoa;
            objNew.idDonViQuyDoi = dvChuan?.id;

            await saveDiaryProduct(objNew);

            handleSave(objNew, isNew ? TypeAction.INSEART : TypeAction.UPDATE);

            setOpen(false);
        } catch (error: any) {
            const message = error?.response?.data?.error?.message || 'Có lỗi xảy ra khi lưu sản phẩm';

            setObjAlert({
                show: true,
                mes: message,
                type: 2 // error
            });

            setWasClickSave(false);
        } finally {
            setWasClickSave(false);
        }
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
        //const idCheckin = await InsertCustomer_toCheckIn(item?.id ?? Guid.EMPTY);
        // setHoaDon({ ...hoadon, idKhachHang: item?.id, idCheckIn: idCheckin });

        // wait AddHD_toCache_IfNotExists();
        // await dbDexie.hoaDon.update(hoadon?.id, {
        //     idCheckIn: idCheckin,
        //     idKhachHang: item?.id,
        //     tenKhachHang: item?.text,
        //     maKhachHang: item?.maKhachHang, // todo maKhachHang
        //     soDienThoai: item?.text2,
        //     idHangHoa: 'iwhgfuiwheiuhdqsi'
        // });

        // await CheckCustomer_hasGDV(item?.id ?? '');
    };

    const RemoveCustomer = async () => {
        // const check = CheckDangSuDungGDV(1);
        // if (!check) {
        //     return;
        // }
        await AgreeRemoveCustomer();
    };

    const AgreeRemoveCustomer = async () => {
        // const idCheckinDelete = hoadon?.idCheckIn ?? Guid.EMPTY;
        // await CheckinService.UpdateTrangThaiCheckin(idCheckinDelete, TrangThaiCheckin.DELETED);
        // await CheckinService.UpdateTrangThaiBooking_byIdCheckIn(idCheckinDelete, TrangThaiBooking.Confirm);
        // setCustomerHasGDV(false);
        // setConfirmDialog({ ...confirmDialog, show: false });
        // setHoaDon({ ...hoadon, idKhachHang: null });
        setCustomerChosed({
            ...customerChosed,
            id: Guid.EMPTY,
            maKhachHang: 'KL', // todo makhachhang
            tenKhachHang: 'Khách lẻ',
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
    return (
        <>
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
            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
                <DialogButtonClose onClose={() => setOpen(false)} />
                <DialogTitle className="modal-title">
                    {isNew ? 'Thêm ' : 'Cập nhật '}
                    {productPhone.tenLoaiHangHoa?.toLocaleLowerCase()}
                </DialogTitle>

                <DialogContent>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={4} md={4} lg={4}>
                            <Stack
                                sx={{
                                    border: '1px dashed #ccc',
                                    borderRadius: 3,
                                    p: 3,
                                    height: '100%',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                <Box
                                    component="img"
                                    src="https://cdn-icons-png.flaticon.com/512/15/15874.png"
                                    sx={{ width: 80, height: 80, mb: 1 }}
                                />
                            </Stack>
                        </Grid>

                        <Grid item xs={12} sm={8} md={8} lg={8} sx={{ mt: 1 }}>
                            <Stack spacing={2}>
                                {/* TÊN + GB + MÀU */}
                                <Stack direction="row" spacing={2}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        autoFocus
                                        sx={{ flex: 2 }}
                                        label={`Tên ${productPhone.tenLoaiHangHoa?.toLowerCase() || ''} *`}
                                        error={wasClickSave && errTenHangHoa}
                                        helperText={
                                            wasClickSave && errTenHangHoa
                                                ? `Vui lòng nhập tên ${productPhone.tenLoaiHangHoa?.toLowerCase()}`
                                                : ''
                                        }
                                        value={productPhone.tenHangHoa || ''}
                                        onChange={(e) => {
                                            setProductPhone((prev) => ({
                                                ...prev,
                                                tenHangHoa: e.target.value
                                            }));
                                            setErrTenHangHoa(false);
                                            setWasClickSave(false);
                                        }}
                                    />

                                    <TextField
                                        size="small"
                                        sx={{ flex: 1 }}
                                        label="GB"
                                        value={productPhone.dungLuong || ''}
                                        onChange={(e) =>
                                            setProductPhone((prev) => ({
                                                ...prev,
                                                dungLuong: e.target.value
                                            }))
                                        }
                                    />

                                    <TextField
                                        size="small"
                                        sx={{ flex: 1 }}
                                        label="Màu sắc"
                                        value={productPhone.mau || ''}
                                        onChange={(e) =>
                                            setProductPhone((prev) => ({
                                                ...prev,
                                                mau: e.target.value
                                            }))
                                        }
                                    />
                                </Stack>

                                {/* PIN + IMEI + MẬT KHẨU */}
                                <Stack direction="row" spacing={2}>
                                    <TextField
                                        size="small"
                                        sx={{ flex: 0.7 }}
                                        label="Pin"
                                        value={productPhone.pin || ''}
                                        onChange={(e) =>
                                            setProductPhone((prev) => ({
                                                ...prev,
                                                pin: e.target.value
                                            }))
                                        }
                                    />

                                    <TextField
                                        size="small"
                                        sx={{ flex: 2 }}
                                        label="IMEI"
                                        value={productPhone.imel || ''}
                                        onChange={(e) =>
                                            setProductPhone((prev) => ({
                                                ...prev,
                                                imel: e.target.value
                                            }))
                                        }
                                    />

                                    <TextField
                                        size="small"
                                        sx={{ flex: 1 }}
                                        label="Mật khẩu"
                                        value={productPhone.matKhau || ''}
                                        onChange={(e) =>
                                            setProductPhone((prev) => ({
                                                ...prev,
                                                matKhau: e.target.value
                                            }))
                                        }
                                    />
                                </Stack>

                                {/* GIÁ */}
                                <Stack direction="row" spacing={2}>
                                    <NumericFormat
                                        size="small"
                                        fullWidth
                                        label="Giá bán"
                                        value={productPhone.giaBan}
                                        thousandSeparator="."
                                        decimalSeparator=","
                                        customInput={TextField}
                                        onChange={editGiaBan}
                                    />

                                    <NumericFormat
                                        size="small"
                                        fullWidth
                                        label="Giá vốn"
                                        value={productPhone.giaVon}
                                        thousandSeparator="."
                                        decimalSeparator=","
                                        customInput={TextField}
                                        onChange={editGiaVon}
                                    />
                                </Stack>

                                {/* LỖI */}
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Lỗi"
                                    placeholder="Nhập mô tả lỗi"
                                    value={productPhone.loi || ''}
                                    onChange={(e) =>
                                        setProductPhone((prev) => ({
                                            ...prev,
                                            loi: e.target.value
                                        }))
                                    }
                                />

                                {/* GHI CHÚ */}
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={2}
                                    label="Ghi chú"
                                    value={productPhone.moTa || ''}
                                    onChange={(e) =>
                                        setProductPhone((prev) => ({
                                            ...prev,
                                            moTa: e.target.value
                                        }))
                                    }
                                />
                            </Stack>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions style={{ paddingBottom: '20px' }}>
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
                            {!wasClickSave ? (
                                <>
                                    <Button
                                        variant="contained"
                                        sx={{ bgcolor: '#7C3367' }}
                                        onClick={() => {
                                            //setIsPrintAfterSave(false);
                                            saveProduct();
                                        }}>
                                        Lưu
                                    </Button>

                                    <Button
                                        variant="contained"
                                        sx={{ bgcolor: '#1976d2', ml: 1 }}
                                        onClick={() => {
                                            //setIsPrintAfterSave(true);
                                            saveProduct();
                                        }}>
                                        Lưu & In
                                    </Button>
                                </>
                            ) : (
                                <Button variant="contained" sx={{ bgcolor: '#7C3367' }}>
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
export default observer(ModalHangHoaDienThoai);
