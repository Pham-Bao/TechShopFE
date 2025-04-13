import * as React from 'react';
import { useEffect, useState, useContext } from 'react';
import { NumericFormat } from 'react-number-format';
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
    Checkbox
} from '@mui/material';
import { ReactComponent as CloseIcon } from '../../images/close-square.svg';
import { Add } from '@mui/icons-material';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import { ModelNhomHangHoa, ModelHangHoaDto } from '../../../../services/product/dto';
import { PropConfirmOKCancel, PropModal } from '../../../../utils/PropParentToChild';
import ConfirmDelete from '../../../../components/AlertDialog/ConfirmDelete';

import ProductService from '../../../../services/product/ProductService';
// import './style.css';

import { Guid } from 'guid-typescript';
import utils from '../../../../utils/utils';
import Cookies from 'js-cookie';
import uploadFileService from '../../../../services/uploadFileService';
import abpCustom from '../../../../components/abp-custom';
import SnackbarAlert from '../../../../components/AlertDialog/SnackbarAlert';
// import ModalNhomHangHoa from './ModalGroupProduct';
import { observer } from 'mobx-react';
import nhomHangHoaStore from '../../../../stores/nhomHangHoaStore';
import { LoaiNhatKyThaoTac, TypeAction } from '../../../../lib/appconst';
import ImgurAPI from '../../../../services/ImgurAPI/ImgurAPI';
import { util } from 'prettier';
import DialogButtonClose from '../../../../components/Dialog/ButtonClose';
import { AppContext } from '../../../../services/chi_nhanh/ChiNhanhContext';
import { CreateNhatKyThaoTacDto } from '../../../../services/nhat_ky_hoat_dong/dto/CreateNhatKyThaoTacDto';
import nhatKyHoatDongService from '../../../../services/nhat_ky_hoat_dong/nhatKyHoatDongService';
import ModalKhuVuc from './ModalKhuVuc';
import KhuVucStore from '../../../../stores/KhuVucStore';
import { KhuVucDto, ViTriCreate, ViTriDto, ViTriUpdate } from '../../../../services/khu_vuc/dto';
import khuVuc from '.';
import khuyenMaiService from '../../../../services/khuyen_mai/khuyenMaiService';
import KhuVucService from '../../../../services/khu_vuc/KhuVucService';

const ModalViTri = ({ handleSave, trigger }: any) => {
    const appContext = useContext(AppContext);
    const chiNhanhCurrent = appContext.chinhanhCurrent;
    const idChiNhanh = utils.checkNull(chiNhanhCurrent?.id) ? Cookies.get('IdChiNhanh') : chiNhanhCurrent?.id;
    const [open, setOpen] = useState(false);
    const [isNew, setIsNew] = useState(false);
    const [product, setProduct] = useState(new ModelHangHoaDto());
    const [viTri, setViTri] = useState(new ViTriUpdate());
    const [inforOldProduct, setInforOldProduct] = useState(new ModelHangHoaDto());
    const [wasClickSave, setWasClickSave] = useState(false);
    const [actionProduct, setActionProduct] = useState(TypeAction.INSEART);

    const [nhomChosed, setNhomChosed] = useState<KhuVucDto | null>(null);
    const [inforDeleteProduct, setInforDeleteProduct] = useState<PropConfirmOKCancel>(
        new PropConfirmOKCancel({ show: false })
    );
    const [objAlert, setObjAlert] = useState({ show: false, type: 1, mes: '' });

    const showModal = async (id?: string) => {
        if (id) {
            const response = (await KhuVucService.GetDMViTriById(id)) as { totalCount: number; items: ViTriCreate[] };
            if (!response || !response.items || response.items.length === 0) return;

            const obj = response.items[0]; // Lấy bản ghi đầu tiên
            console.log('Dữ liệu vị trí được set:', obj);

            setViTri({ ...obj });
        } else {
            setViTri({
                idKhuVuc: null,
                tenViTri: '',
                tenKhuVuc: '',
                trangThai: 0,
                donGia: null,
                moTa: ''
            });
        }
    };

    useEffect(() => {
        if (viTri.idKhuVuc) {
            const selectedKhuVuc = KhuVucStore.listAllKhuVuc.find((kv) => kv.id === viTri.idKhuVuc);
            setNhomChosed(selectedKhuVuc || null);
        }
    }, [viTri]);

    useEffect(() => {
        if (trigger.isShow) {
            setOpen(true);
            showModal(trigger.id);
        }
        setIsNew(trigger.isNew);
    }, [trigger]);

    const handleChangeNhom = (item: KhuVucDto | null) => {
        setViTri((old) => ({
            ...old,
            idKhuVuc: item?.id ?? '',
            tenKhuVuc: item?.tenKhuVuc ?? ''
        }));
        setNhomChosed(item);
    };

    const handleClickOKComfirm = () => {
        setOpen(false);
        setInforDeleteProduct({ ...inforDeleteProduct, show: false });
        handleSave(product, actionProduct);
    };

    const saveDiaryProduct = async (product: ViTriCreate) => {
        const sLoai = isNew ? 'Thêm mới' : 'Cập nhật';
        let sOld = '';
        if (!isNew) {
            sOld = `<br /> <b> Thông tin cũ: </b> <br /> Mã dịch vụ: ${
                inforOldProduct?.maHangHoa
            }  <br /> Tên dịch vụ: ${inforOldProduct?.tenHangHoa} <br /> Thuộc nhóm: ${
                inforOldProduct?.tenNhomHang ?? ''
            }  <br /> Giá bán:  ${Intl.NumberFormat('vi-VN').format(inforOldProduct?.giaBan as unknown as number)}`;
        }
        const diary = {
            idChiNhanh: idChiNhanh,
            chucNang: `Danh mục vị trí`,
            noiDung: `${sLoai} dịch vụ ${product?.tenViTri} `,
            noiDungChiTiet: `Mã dịch vụ: ${product?.tenViTri}  <br /> Tên dịch vụ: ${
                product?.tenKhuVuc
            } <br /> Thuộc nhóm: ${product?.tenKhuVuc ?? ''}  <br /> Giá bán:  ${Intl.NumberFormat('vi-VN').format(
                product?.donGia as unknown as number
            )} ${sOld}`,
            loaiNhatKy: isNew ? LoaiNhatKyThaoTac.INSEART : LoaiNhatKyThaoTac.UPDATE
        } as CreateNhatKyThaoTacDto;
        await nhatKyHoatDongService.createNhatKyThaoTac(diary);
    };

    async function saveViTri() {
        setWasClickSave(true);

        if (!viTri.tenViTri?.trim() || !viTri.idKhuVuc || viTri.donGia == null) {
            console.error('Lỗi: Dữ liệu chưa hợp lệ', viTri);
            return;
        }

        const objNew = {
            id: viTri.id ?? undefined, // Nếu không có ID, BE sẽ tự động tạo mới
            idKhuVuc: viTri.idKhuVuc ?? '',
            tenViTri: viTri.tenViTri?.trim() ?? '',
            tenViTri_KhongDau: utils.strToEnglish(viTri.tenViTri ?? ''),
            tenKhuVuc: viTri.tenKhuVuc?.trim() ?? '',
            trangThai: 1,
            donGia: utils.formatNumberToFloat(viTri.donGia ?? 0),
            moTa: viTri.moTa?.trim() ?? ''
        };

        try {
            const data = await KhuVucService.CreateOrUpdateViTri(objNew);
            const objForSave = { ...objNew, id: data.id };
            await saveDiaryProduct(objForSave);
            handleSave(objForSave, viTri.id ? TypeAction.UPDATE : TypeAction.INSEART);
            setOpen(false);
        } catch (error) {
            console.error('❌ Lỗi khi lưu vị trí:', error);
        }
    }

    return (
        <>
            <ConfirmDelete
                isShow={inforDeleteProduct.show}
                title={inforDeleteProduct.title}
                mes={inforDeleteProduct.mes}
                onOk={handleClickOKComfirm}
                onCancel={() => setInforDeleteProduct({ ...inforDeleteProduct, show: false })}
            />
            <SnackbarAlert
                showAlert={objAlert.show}
                type={objAlert.type}
                title={objAlert.mes}
                handleClose={() => setObjAlert({ show: false, mes: '', type: 1 })}
            />
            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
                <DialogButtonClose onClose={() => setOpen(false)} />
                <DialogTitle className="modal-title">
                    {isNew ? 'Thêm ' : 'Cập nhật '} {'vị trí'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Stack spacing={2}>
                                <TextField
                                    variant="outlined"
                                    size="small"
                                    fullWidth
                                    label={`Tên Vị trí`}
                                    error={wasClickSave && !viTri.tenViTri}
                                    helperText={wasClickSave && !viTri.tenViTri ? `Vui lòng nhập tên vị trí` : ''}
                                    value={viTri.tenViTri ?? ''}
                                    onChange={(event) => setViTri({ ...viTri, tenViTri: event.target.value })}
                                />

                                <Autocomplete
                                    size="small"
                                    fullWidth
                                    disablePortal
                                    value={nhomChosed}
                                    isOptionEqualToValue={(option, value) => option.id === value.id}
                                    options={KhuVucStore?.listAllKhuVuc?.filter((x) => x.id)}
                                    onChange={(event, newValue) => handleChangeNhom(newValue)}
                                    getOptionLabel={(option) => option.tenKhuVuc || ''}
                                    renderInput={(params) => <TextField {...params} label={`Khu vực`} />}
                                />
                                <NumericFormat
                                    size="small"
                                    fullWidth
                                    label="Đơn giá"
                                    value={viTri.donGia ?? ''}
                                    thousandSeparator="."
                                    decimalSeparator=","
                                    customInput={TextField}
                                    onValueChange={(values) => {
                                        const { floatValue } = values;
                                        setViTri({ ...viTri, donGia: floatValue });
                                    }}
                                />

                                <TextField
                                    variant="outlined"
                                    fullWidth
                                    multiline
                                    rows={2}
                                    label="Mô tả"
                                    value={viTri?.moTa ?? ''}
                                    onChange={(event) => setViTri((prev) => ({ ...prev, moTa: event.target.value }))}
                                />
                            </Stack>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions style={{ paddingBottom: '20px' }}>
                    <Button variant="outlined" onClick={() => setOpen(false)} className="btn-outline-hover">
                        Hủy
                    </Button>
                    <Button
                        variant="contained"
                        sx={{ bgcolor: '#7C3367' }}
                        onClick={saveViTri}
                        className="btn-container-hover">
                        {wasClickSave ? 'Đang lưu' : 'Lưu'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
export default observer(ModalViTri);
