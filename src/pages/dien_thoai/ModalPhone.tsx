import * as React from 'react';
import { useEffect, useState, useContext } from 'react';
import { NumericFormat } from 'react-number-format';
import axios, { AxiosError } from 'axios';
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
import { COLOR_SUGGEST } from '../../lib/mauSacSuggest';
import { STORAGE_SUGGEST } from '../../lib/dungLuongSugget';
import { PHONE_SUGGEST } from '../../lib/phoneSuggest';
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
            console.log('hiển thị phone', obj);
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

    useEffect(() => {
        GetInforAlbum();
        InitData();

        //setIsNew(trigger.isNew);

        if (trigger.isShow) {
            setOpen(true);
            showModal(trigger.id);

            // if (trigger.isNew) {
            //     GetIphoneConnectPC(); // 👈 chỉ gọi khi tạo mới
            // }
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

    async function saveProduct(isPrint = false) {
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
                tinhTrang: productPhone.tinhTrang,
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
            if (isPrint) {
                handlePrintProduct(objNew);
            }
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
    const handlePrintProduct = (rowItem: any) => {
        const imei = rowItem.imel;

        const width = window.screen.width * 0.7;
        const height = window.screen.height * 0.7;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;

        const printWindow = window.open('', '', `width=${width},height=${height},left=${left},top=${top}`);

        if (printWindow) {
            printWindow.document.write(`
        <html>
        <head>
            <title>In Tem TechShop</title>

           <style>

@page{
    size:80mm 60mm;
    margin:0;
}

body{
    font-family: Arial, sans-serif;
    font-size:11px;
    margin:0;
    padding:5px;
    width:80mm;
    height:60mm;
    box-sizing:border-box;
    display:flex;
    flex-direction:column;
}

.header{
    display:flex;
    justify-content:space-between;
    font-weight:bold;
    font-size:12px;
}

.product{
    margin-top:4px;
    font-weight:bold;
    font-size:13px;
}

.info{
    margin-top:3px;
    line-height:1.3;
}

.barcode{
    text-align:center;
    margin-top:4px;
}

.barcode svg{
    width:100%;
    height:28px;
}

.barcode-text{
    font-size:11px;
    letter-spacing:1px;
}

.footer{
    text-align:center;
    font-size:10px;
    margin-top:auto;
}

.line{
    border-bottom:1px dashed #000;
    margin:4px 0;
}

</style>

            <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>

        </head>

       <body>

<div class="header">
    <div>TECHSHOP</div>
    <div>${new Date().toLocaleDateString()}</div>
</div>

<div class="product">
    ${rowItem.tenHangHoa} ${rowItem.mau || ''} ${rowItem.dungLuong || ''}GB
</div>
<div><b>Pin:</b> ${rowItem.pin || '-'}% | <b>Sạc:</b> ${rowItem.soLanSac || '-'} lần</div>

<div class="info">
    <div><b>Tình trạng:</b> ${rowItem.tinhTrang || '-'}</div>
    <div><b>Nội dung:</b> ${rowItem.noiDung || '-'}</div>
    <div><b>Lỗi:</b> ${rowItem.loi || '-'}</div>
   <div><b>Giá bán</b> ${rowItem.giaBan ? rowItem.giaBan.toLocaleString('vi-VN') + 'đ' : '-'}</div>
</div>

<div class="line"></div>

<div class="info">
    <b>IMEI:</b> ${imei}
</div>

<div class="barcode">
    <svg id="barcode"></svg>
    <div class="barcode-text">${imei}</div>
</div>

<div class="footer">
miniphone.vn
</div>

<script>

window.onload=function(){

    JsBarcode("#barcode","${imei}",{
        format:"CODE128",
        width:2,
        height:35,
        displayValue:false
    });

    window.print();
    window.close();
}

</script>

</body>
        </html>
        `);

            printWindow.document.close();
        }
    };

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
                dungLuong: STORAGE_SUGGEST.find((x) => x.label === data.dungLuong)?.value ?? prev.dungLuong,
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
    const TINH_TRANG = ['Kính phẩy', 'Zin', 'Keng', 'Áp', 'A', 'A-', 'B+', 'B', 'B-', 'C', 'D'];
    const handleChangeTinhTrang = (value: string) => {
        setProductPhone((prev) => {
            const list = prev.tinhTrang ? prev.tinhTrang.split(',').filter(Boolean) : [];

            const newList = list.includes(value) ? list.filter((x) => x !== value) : [...list, value];

            return {
                ...prev,
                tinhTrang: newList.join(',')
            };
        });
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
                        <Grid
                            item
                            xs={12}
                            sm={4}
                            md={4}
                            lg={4}
                            display="flex"
                            justifyContent="center"
                            alignItems="center">
                            <Box
                                sx={{
                                    width: '100%',
                                    maxWidth: 220,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center'
                                }}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    startIcon={
                                        loading ? <CircularProgress size={18} color="inherit" /> : <PhoneIphoneIcon />
                                    }
                                    onClick={handleGetIphone}
                                    disabled={loading}
                                    sx={{
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        borderRadius: '12px',
                                        py: 1.2,
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                        background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, #1565c0, #1e88e5)',
                                            boxShadow: '0 6px 16px rgba(0,0,0,0.15)'
                                        }
                                    }}>
                                    {loading ? 'Đang lấy dữ liệu...' : 'Lấy nhanh'}
                                </Button>

                                <Typography
                                    variant="caption"
                                    mt={1}
                                    textAlign="center"
                                    sx={{
                                        color:
                                            status === 'success'
                                                ? 'green'
                                                : status === 'error' || status === 'empty'
                                                ? 'red'
                                                : 'text.secondary'
                                    }}>
                                    {status === 'loading' && 'Đang lấy dữ liệu...'}
                                    {status === 'success' && '✅ Lấy thông tin thành công'}
                                    {status === 'empty' && '⚠️ Không có thông tin thiết bị'}
                                    {status === 'error' && '❌ Không phát hiện iPhone'}
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid item xs={12} sm={8} md={8} lg={8} sx={{ mt: 1 }}>
                            <Stack spacing={2}>
                                {/* TÊN + GB + MÀU */}
                                {/* TÊN MÁY */}
                                <Stack>
                                    <Autocomplete
                                        freeSolo
                                        fullWidth
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
                                                fullWidth
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
                                </Stack>

                                {/* DUNG LƯỢNG + MÀU */}
                                <Stack direction="row" spacing={2}>
                                    <Autocomplete
                                        sx={{
                                            flex: 1.3,
                                            minWidth: 120,

                                            // Ẩn mũi tên
                                            '& .MuiAutocomplete-popupIndicator': {
                                                display: 'none'
                                            },

                                            // Giữ nút X sát bên phải
                                            '& .MuiAutocomplete-endAdornment': {
                                                right: 8
                                            },

                                            // Không cắt chữ
                                            '& .MuiAutocomplete-input': {
                                                overflow: 'visible',
                                                textOverflow: 'clip'
                                            }
                                        }}
                                        options={STORAGE_SUGGEST}
                                        value={
                                            STORAGE_SUGGEST.find(
                                                (x) => Number(x.value) === Number(productPhone.dungLuong)
                                            ) || null
                                        }
                                        getOptionLabel={(option) => option.label}
                                        isOptionEqualToValue={(option, value) => option.value === value.value}
                                        onChange={(event, newValue) => {
                                            setProductPhone((prev) => ({
                                                ...prev,
                                                dungLuong: newValue?.value ?? 0
                                            }));
                                        }}
                                        renderInput={(params) => (
                                            <TextField {...params} variant="outlined" size="small" label="Dung lượng" />
                                        )}
                                    />

                                    <Autocomplete
                                        freeSolo
                                        sx={{ flex: 2 }}
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
                                <Stack direction="row" spacing={4}>
                                    {[0, 4, 8].map((start) => (
                                        <Stack key={start} spacing={0}>
                                            {TINH_TRANG.slice(start, start + 4).map((item) => (
                                                <FormControlLabel
                                                    key={item}
                                                    sx={{ m: 0 }}
                                                    control={
                                                        <Checkbox
                                                            size="small"
                                                            checked={productPhone.tinhTrang?.split(',').includes(item)}
                                                            onChange={() => handleChangeTinhTrang(item)}
                                                        />
                                                    }
                                                    label={item}
                                                />
                                            ))}
                                        </Stack>
                                    ))}
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
                                        onClick={() => saveProduct(false)}>
                                        Lưu
                                    </Button>

                                    <Button
                                        variant="contained"
                                        sx={{ bgcolor: '#1976d2', ml: 1 }}
                                        onClick={() => saveProduct(true)}>
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
