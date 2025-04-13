import { observer } from 'mobx-react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useEffect, useState, useContext } from 'react';
import { Grid, Box, Autocomplete, InputAdornment, TextField, Stack } from '@mui/material';
import { PropConfirmOKCancel } from '../../../../utils/PropParentToChild';
import ConfirmDelete from '../../../../components/AlertDialog/ConfirmDelete';

import GroupProductService from '../../../../services/product/GroupProductService';
import { ModelNhomHangHoa } from '../../../../services/product/dto';
// import { ReactComponent as CloseIcon } from '../../images/close-square.svg';
import Utils from '../../../../utils/utils';
import AppConsts, { LoaiNhatKyThaoTac, TypeAction } from '../../../../lib/appconst';
import abpCustom from '../../../../components/abp-custom';
import { NumericFormat } from 'react-number-format';
import nhomHangHoaStore from '../../../../stores/nhomHangHoaStore';
import utils from '../../../../utils/utils';
import Cookies from 'js-cookie';
import { AppContext } from '../../../../services/chi_nhanh/ChiNhanhContext';
import { CreateNhatKyThaoTacDto } from '../../../../services/nhat_ky_hoat_dong/dto/CreateNhatKyThaoTacDto';
import nhatKyHoatDongService from '../../../../services/nhat_ky_hoat_dong/nhatKyHoatDongService';
import KhuVucStore from '../../../../stores/KhuVucStore';
import { KhuVucDto } from '../../../../services/khu_vuc/dto';
import khuyenMaiStore from '../../../../stores/khuyenMaiStore';
import KhuVucService from '../../../../services/khu_vuc/KhuVucService';
import khuVuc from '.';
import KhuVucList from './ListKhuVuc';

const ModalKhuVuc = ({ handleSave, trigger }: any) => {
    const appContext = useContext(AppContext);
    const chiNhanhCurrent = appContext.chinhanhCurrent;
    const idChiNhanh = utils.checkNull(chiNhanhCurrent?.id) ? Cookies.get('IdChiNhanh') : chiNhanhCurrent?.id;
    const [colorToggle, setColorToggle] = useState(false);
    const [isShow, setIsShow] = useState(false);
    const [isNew, setIsNew] = useState(false);
    const [wasClickSave, setWasClickSave] = useState(false);
    const [errTenNhom, setErrTenNhom] = useState(false);
    const [KhuVuc, setKhuVuc] = useState<KhuVucDto>({
        id: '',
        maKhuVuc: '',
        tenKhuVuc: '',
        tenKhuVuc_KhongDau: '',
        idParent: null,
        moTa: '',
        isDeleted: false,
        children: []
    });

    const [khuVucGoc, setKhuVucGoc] = useState<KhuVucDto | null>(null);

    const [inforDeleteProduct, setInforDeleteProduct] = useState<PropConfirmOKCancel>(
        new PropConfirmOKCancel({ show: false })
    );

    const showModal = async (id: string) => {
        if (id) {
            console.log('Modal', trigger?.item);
            setKhuVuc(trigger.item);
            setKhuVuc((old: any) => {
                return {
                    ...old,
                    sLoaiNhomHang: old.laNhomHangHoa ? 'nhóm hàng hóa' : 'nhóm dịch vụ'
                };
            });

            // find nhomhang
            const nhom = KhuVucStore?.listAllKhuVuc?.filter((x) => x.id == trigger.item.idParent);
            if (nhom.length > 0) {
                setKhuVucGoc(nhom[0]);
            } else {
                setKhuVucGoc(null);
            }
        } else {
            // setGroupProduct(new ModelNhomHangHoa({ color: '#FF979C' }));
            setKhuVucGoc(null);
        }
    };

    const handleChangeNhomGoc = (item: any) => {
        if (item == null) {
            setKhuVucGoc(null);
        } else {
            setKhuVucGoc({
                id: item?.id ?? '',
                maKhuVuc: item?.maKhuVuc ?? '',
                tenKhuVuc: item?.tenKhuVuc ?? '',
                tenKhuVuc_KhongDau: item?.tenKhuVuc_KhongDau ?? '',
                idParent: item?.idParent ?? null,
                moTa: item?.moTa ?? '',
                isDeleted: item?.isDeleted ?? false,
                children: item?.children ?? []
            });
        }
        setKhuVuc((old: any) => {
            return { ...old, idParent: item?.id ?? null };
        });
    };

    useEffect(() => {
        if (trigger.isShow) {
            setIsShow(true);
            showModal(trigger.id);
        }
        setIsNew(trigger.isNew);
        setWasClickSave(false);
    }, [trigger]);

    const xoaNhomHang = async () => {
        await KhuVucService.XoaKhuVuc(khuVucGoc?.id ?? '');
        setIsShow(false);
        setInforDeleteProduct({ ...inforDeleteProduct, show: false });
        //KhuVucStore?.changeListKhuVuc(khuVucGoc, TypeAction.DELETE);
        handleSave(khuVucGoc, true);
    };

    const CheckSave = () => {
        if (Utils.checkNull(KhuVuc.tenKhuVuc)) {
            setErrTenNhom(true);
            return false;
        }
        return true;
    };

    const saveDiaryProductGroup = async (obj: KhuVucDto) => {
        const sLoai = isNew ? 'Thêm mới' : 'Cập nhật';
        const tenKhuVucGoc = utils.checkNull(khuVucGoc?.tenKhuVuc) ? '' : khuVucGoc?.tenKhuVuc;
        let sOld = '';
        if (!isNew) {
            sOld = `<br /> <b> Thông tin cũ: </b> <br /> Tên nhóm hàng: ${trigger?.item?.tenNhomHang} <br /> Thứ tự hiển thị: ${trigger?.item?.thuTuHienThi}`;
        }
        const diary = {
            idChiNhanh: idChiNhanh,
            chucNang: `Nhóm dịch vụ`,
            noiDung: `${sLoai} nhóm dịch vụ ${obj?.tenKhuVuc}`,
            noiDungChiTiet: `Tên nhóm hàng: ${obj?.tenKhuVuc}  <br /> Nhóm cha: ${tenKhuVucGoc} <br /> `,
            loaiNhatKy: isNew ? LoaiNhatKyThaoTac.INSEART : LoaiNhatKyThaoTac.UPDATE
        } as CreateNhatKyThaoTacDto;
        await nhatKyHoatDongService.createNhatKyThaoTac(diary);
    };

    const saveKhuVuc = async () => {
        setWasClickSave(true);

        const check = CheckSave();
        if (!check) {
            return;
        }

        if (wasClickSave) {
            return;
        }
        const objNew: KhuVucDto = {
            ...KhuVuc,
            tenKhuVuc_KhongDau: utils.strToEnglish(KhuVuc.tenKhuVuc ?? '')
        };
        if (trigger.isNew) {
            const newKhuVuc = { ...KhuVuc, id: undefined };
            KhuVucService.InsertKhuVuc(newKhuVuc).then((data) => {
                objNew.id = data.id;
                handleSave(objNew);
            });
            KhuVucStore.changeListKhuVuc(objNew, TypeAction.INSEART);
        } else {
            KhuVucService.UpdateKhuVuc(KhuVuc).then(() => {
                handleSave(objNew);
            });
            KhuVucStore.changeListKhuVuc(objNew, TypeAction.UPDATE);
        }
        await saveDiaryProductGroup(objNew);
        setIsShow(false);
    };

    return (
        <div>
            <ConfirmDelete
                isShow={inforDeleteProduct.show}
                title={inforDeleteProduct.title}
                mes={inforDeleteProduct.mes}
                onOk={xoaNhomHang}
                onCancel={() => setInforDeleteProduct({ ...inforDeleteProduct, show: false })}></ConfirmDelete>
            <Dialog
                open={isShow}
                onClose={() => setIsShow(false)}
                aria-labelledby="draggable-dialog-title"
                maxWidth="xs">
                <DialogTitle className="modal-title" id="draggable-dialog-title">
                    {isNew ? 'Thêm' : 'Cập nhật'}
                </DialogTitle>
                <Button
                    sx={{
                        minWidth: 'unset',
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        '&:hover svg': {
                            filter: 'brightness(0) saturate(100%) invert(36%) sepia(74%) saturate(1465%) hue-rotate(318deg) brightness(94%) contrast(100%)'
                        }
                    }}
                    onClick={() => setIsShow(false)}></Button>
                <DialogContent sx={{ overflow: 'unset' }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={12} md={12} lg={12}>
                            <TextField
                                variant="outlined"
                                size="small"
                                fullWidth
                                required
                                autoFocus
                                label="Tên khu vực"
                                value={KhuVuc.tenKhuVuc}
                                error={errTenNhom && wasClickSave}
                                helperText={errTenNhom && wasClickSave ? 'Tên Khu vực không để chốngchống' : ''}
                                onChange={(event) => {
                                    setKhuVuc((olds: any) => {
                                        return { ...olds, tenKhuVuc: event.target.value };
                                    });
                                    setErrTenNhom(false);
                                    setWasClickSave(false);
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={12} md={12} lg={12}>
                            <Autocomplete
                                size="small"
                                fullWidth
                                disablePortal
                                multiple={false}
                                value={khuVucGoc}
                                onChange={(event: any, newValue: any) => {
                                    handleChangeNhomGoc(newValue);
                                }}
                                options={KhuVucStore?.listAllKhuVuc?.filter((x) => x.id !== null && x.id !== '')}
                                getOptionLabel={(option: any) => (option.tenKhuVuc ? option.tenKhuVuc : '')}
                                renderInput={(params) => <TextField {...params} label="Khu vực cha" />}
                                renderOption={(props, item) => (
                                    <Box component={'li'} {...props} className="autocomplete-option">
                                        {item.tenKhuVuc}
                                    </Box>
                                )}
                            />
                        </Grid>

                        <Grid item xs={12} sm={12} md={12} lg={12} sx={{ display: 'block' }}>
                            <TextField
                                variant="outlined"
                                fullWidth
                                multiline
                                label="Mô tả"
                                rows={2}
                                value={KhuVuc.moTa || ''}
                                onChange={(event) =>
                                    setKhuVuc((olds: any) => {
                                        return { ...olds, moTa: event.target.value };
                                    })
                                }
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions style={{ paddingBottom: '20px' }}>
                    <Button
                        variant="outlined"
                        sx={{
                            color: 'var(--color-main)'
                        }}
                        onClick={() => setIsShow(false)}
                        className="btn-outline-hover">
                        Hủy
                    </Button>
                    <Button
                        variant="outlined"
                        color="error"
                        sx={{
                            display: isNew || !abpCustom.isGrandPermission('Pages.DM_NhomHangHoa.Delete') ? 'none' : ''
                        }}
                        onClick={() => {
                            setInforDeleteProduct(
                                new PropConfirmOKCancel({
                                    show: true,
                                    title: 'Xác nhận xóa',
                                    mes: `Bạn có chắc chắn muốn xóa  ${KhuVuc?.tenKhuVuc ?? ' '} không?`
                                })
                            );
                        }}>
                        Xóa
                    </Button>
                    <Button
                        variant="contained"
                        sx={{ bgcolor: 'var(--color-main)!important' }}
                        onClick={saveKhuVuc}
                        className="btn-container-hover">
                        Lưu
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default observer(ModalKhuVuc);
