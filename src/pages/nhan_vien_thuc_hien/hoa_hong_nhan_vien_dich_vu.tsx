import {
    Dialog,
    DialogContent,
    DialogTitle,
    Typography,
    Grid,
    TextField,
    Stack,
    Avatar,
    DialogActions,
    Button,
    Tab,
    Checkbox
} from '@mui/material';
import ClearOutlinedIcon from '@mui/icons-material/ClearOutlined';
import DialogButtonClose from '../../components/Dialog/ButtonClose';
import nhanVienService from '../../services/nhan-vien/nhanVienService';
import { PagedNhanSuRequestDto } from '../../services/nhan-vien/dto/PagedNhanSuRequestDto';
import React, { useContext, useEffect, useRef, useState } from 'react';
import NhanSuItemDto from '../../services/nhan-vien/dto/nhanSuItemDto';
import NhanVienThucHienDto from '../../services/nhan_vien_thuc_hien/NhanVienThucHienDto';
import { Search } from '@mui/icons-material';
import utils from '../../utils/utils';
import chietKhauHoaDonService from '../../services/hoa_hong/chiet_khau_hoa_don/chietKhauHoaDonService';
import { AppContext } from '../../services/chi_nhanh/ChiNhanhContext';
import { NumericFormat } from 'react-number-format';
import NhanVienThucHienServices from '../../services/nhan_vien_thuc_hien/NhanVienThucHienServices';
import SnackbarAlert from '../../components/AlertDialog/SnackbarAlert';
import chietKhauDichVuService from '../../services/hoa_hong/chiet_khau_dich_vu/chietKhauDichVuService';
import TabList from '@mui/lab/TabList';
import TabContext from '@mui/lab/TabContext';
import { LoaiHoaHongDichVu, TypeAction } from '../../lib/appconst';
import { enqueueSnackbar } from 'notistack';

export default function HoaHongNhanVienDichVu({
    idChiNhanh,
    iShow,
    isNew = false,
    onClose,
    itemHoaDonChiTiet,
    onSaveOK
}: any) {
    const [txtSearch, setTxtSearch] = useState('');
    const [tabActive, setTabActive] = useState(LoaiHoaHongDichVu.THUC_HIEN.toString());
    const [lstNhanVien, setLstNhanVien] = useState<NhanSuItemDto[]>([]);
    const [allNhanVien, setAllNhanVien] = useState<NhanSuItemDto[]>([]);
    const [lstNVThucHien, setLstNhanVienChosed] = useState<NhanVienThucHienDto[]>([]);
    const [objAlert, setObjAlert] = useState({ show: false, type: 1, mes: '' });
    const [checkedItems, setCheckedItems] = React.useState<boolean[]>([]);
    const [lstNhanVienFiltered, setLstNhanVienFiltered] = useState<NhanVienThucHienDto[]>([]);

    const GetListNhanVien = async () => {
        const data = await nhanVienService.getAll({
            filter: txtSearch,
            skipCount: 0,
            maxResultCount: 100
        } as PagedNhanSuRequestDto);
        setAllNhanVien([...data.items]);
        setLstNhanVien([...data.items]);
    };

    const GetNhanVienThucHien_byIdHoaDonChiTiet = async () => {
        const data = await NhanVienThucHienServices.GetNhanVienThucHien_byIdHoaDonChiTiet(itemHoaDonChiTiet?.id);

        if (data != null && data.length > 0) {
            const arr = data.map((x: NhanVienThucHienDto) => {
                return { ...x, laPhanTram: x.ptChietKhau > 0 };
            });
            setLstNhanVienChosed([...arr]);
        } else {
            setLstNhanVienChosed([]);
        }
    };

    useEffect(() => {
        GetListNhanVien();
    }, []);

    useEffect(() => {
        setTabActive(LoaiHoaHongDichVu.THUC_HIEN.toString());
        if (isNew) {
            // page thungan
            setLstNhanVienChosed([...(itemHoaDonChiTiet?.nhanVienThucHien ?? [])]);
        } else {
            GetNhanVienThucHien_byIdHoaDonChiTiet();
        }
    }, [iShow]);

    const SearchNhanVienClient = () => {
        if (!utils.checkNull(txtSearch)) {
            const txt = txtSearch.trim().toLowerCase();
            const txtUnsign = utils.strToEnglish(txt);
            const data = allNhanVien.filter(
                (x) =>
                    (x.maNhanVien !== null && x.maNhanVien.trim().toLowerCase().indexOf(txt) > -1) ||
                    (x.tenNhanVien !== null && x.tenNhanVien.trim().toLowerCase().indexOf(txt) > -1) ||
                    (x.soDienThoai !== null && x.soDienThoai.trim().toLowerCase().indexOf(txt) > -1) ||
                    (x.maNhanVien !== null && utils.strToEnglish(x.maNhanVien).indexOf(txtUnsign) > -1) ||
                    (x.tenNhanVien !== null && utils.strToEnglish(x.tenNhanVien).indexOf(txtUnsign) > -1) ||
                    (x.soDienThoai !== null && utils.strToEnglish(x.soDienThoai).indexOf(txtUnsign) > -1) ||
                    (x.tenChucVu !== null && utils.strToEnglish(x.tenChucVu).indexOf(txtUnsign) > -1)
            );
            setLstNhanVien(data);
        } else {
            setLstNhanVien([...allNhanVien]);
        }
    };

    useEffect(() => {
        SearchNhanVienClient();
    }, [txtSearch]);

    const giaTriTinhHoaHong = itemHoaDonChiTiet.soLuong * (itemHoaDonChiTiet?.donGiaSauCK ?? 0);

    const ChoseNhanVien = async (item: NhanSuItemDto) => {
        const loaiCKActive = parseInt(tabActive);
        const nvEX = lstNVThucHien.filter((x) => x.idNhanVien === item.id && x.loaiChietKhau === loaiCKActive);

        // Nếu nhân viên với loại chiết khấu đã tồn tại
        if (nvEX.length > 0) {
            enqueueSnackbar(`Nhân viên ${item.tenNhanVien} với loại chiết khấu này đã được chọn`, {
                variant: 'error',
                autoHideDuration: 3000
            });
            return;
        }
        const newNV = new NhanVienThucHienDto({
            idNhanVien: item.id,
            maNhanVien: item.maNhanVien,
            tenNhanVien: item.tenNhanVien,
            soDienThoai: item.soDienThoai,
            gioiTinh: item.gioiTinh,
            avatar: item.avatar,
            loaiChietKhau: loaiCKActive,
            ptChietKhau: 0,
            tienChietKhau: 0,
            tinhHoaHongTruocCK: false,
            laPhanTram: true
        });
        const ckSetup = await chietKhauDichVuService.GetHoaHongNV_theoDichVu(
            newNV.idNhanVien as unknown as string,
            itemHoaDonChiTiet.idDonViQuyDoi,
            idChiNhanh
        );
        const ckSetup_byLoai = ckSetup?.filter((x) => x.loaiChietKhau === loaiCKActive);
        if (ckSetup_byLoai != null && ckSetup_byLoai.length > 0) {
            const gtriSetup = ckSetup_byLoai[0].giaTri ?? 0;
            newNV.ptChietKhau = ckSetup_byLoai[0].laPhanTram ? gtriSetup : 0;

            if (newNV.ptChietKhau > 0) {
                newNV.tienChietKhau = (newNV.ptChietKhau * giaTriTinhHoaHong) / 100;
            } else {
                newNV.tienChietKhau = gtriSetup * itemHoaDonChiTiet?.soLuong;
                newNV.laPhanTram = false;
            }
        }
        handleChange({} as React.SyntheticEvent, tabActive);
        setLstNhanVienChosed([newNV, ...lstNVThucHien]);
    };
    const onCheckboxChange = async (nv: NhanVienThucHienDto) => {
        const updatedNV = await Promise.all(
            lstNVThucHien.map(async (item) => {
                if (item.idNhanVien === nv.idNhanVien) {
                    const ckSetup = await chietKhauDichVuService.GetHoaHongNV_theoDichVu(
                        nv.idNhanVien as unknown as string,
                        itemHoaDonChiTiet.idDonViQuyDoi,
                        idChiNhanh
                    );

                    const updatedLoaiChietKhau = item.loaiChietKhau === 2 ? 1 : 2;
                    item.loaiChietKhau = updatedLoaiChietKhau;

                    const ckSetup_byLoai = ckSetup?.filter((x) => x.loaiChietKhau === updatedLoaiChietKhau);

                    if (ckSetup_byLoai != null && ckSetup_byLoai.length > 0) {
                        item.ptChietKhau = ckSetup_byLoai[0].giaTri ?? 0;
                        item.tienChietKhau = ckSetup_byLoai[0].laPhanTram
                            ? (item.ptChietKhau * giaTriTinhHoaHong) / 100
                            : ckSetup_byLoai[0].giaTri;
                    } else {
                        item.ptChietKhau = 0;
                        item.tienChietKhau = 0;
                    }

                    return item;
                }
                return item;
            })
        );

        setLstNhanVienChosed(updatedNV);
    };

    const removeNVienChosed = (nv: NhanVienThucHienDto) => {
        setLstNhanVienChosed(lstNVThucHien.filter((x: NhanVienThucHienDto) => x.idNhanVien !== nv.idNhanVien));
    };

    const onClickPtramVND = (laPhanTram: boolean, nv: NhanVienThucHienDto) => {
        const laPtramNew = !laPhanTram;
        setLstNhanVienChosed(
            lstNVThucHien.map((x: NhanVienThucHienDto) => {
                if (x.idNhanVien === nv.idNhanVien) {
                    const ckNew = x.tienChietKhau;
                    let ptChietKhau = x.ptChietKhau;
                    if (ptChietKhau > 0) {
                        if (!laPtramNew) {
                            // % --> vnd
                            ptChietKhau = 0;
                        }
                    } else {
                        // vnd --> %
                        if (laPtramNew) {
                            ptChietKhau = (ckNew / giaTriTinhHoaHong) * 100;
                        }
                    }

                    return { ...x, laPhanTram: laPtramNew, ptChietKhau: ptChietKhau, tienChietKhau: ckNew };
                } else {
                    return x;
                }
            })
        );
    };

    const changeGtriChietKhau = (gtriNew: string, nv: NhanVienThucHienDto) => {
        const gtriCK = utils.formatNumberToFloat(gtriNew);

        setLstNhanVienChosed(
            lstNVThucHien.map((x: NhanVienThucHienDto) => {
                if (x.idNhanVien === nv.idNhanVien) {
                    let tienCKnew = x.tienChietKhau;
                    let ptCKNew = x.ptChietKhau;
                    if (x.laPhanTram) {
                        ptCKNew = gtriCK;
                        tienCKnew = (gtriCK * giaTriTinhHoaHong) / 100;
                    } else {
                        ptCKNew = 0;
                        tienCKnew = gtriCK;
                    }
                    return { ...x, tienChietKhau: tienCKnew, ptChietKhau: ptCKNew };
                } else {
                    return x;
                }
            })
        );
    };

    const changeTienChietKhau = (gtriNew: string, nv: NhanVienThucHienDto) => {
        const tienCK = utils.formatNumberToFloat(gtriNew);
        setLstNhanVienChosed(
            lstNVThucHien.map((x: NhanVienThucHienDto) => {
                if (x.idNhanVien === nv.idNhanVien) {
                    let tienCKnew = x.tienChietKhau;
                    let ptCKNew = x.ptChietKhau;
                    if (x.laPhanTram) {
                        ptCKNew = (tienCK / giaTriTinhHoaHong) * 100;
                        tienCKnew = tienCK;
                    } else {
                        ptCKNew = 0;
                        tienCKnew = tienCK;
                    }
                    return { ...x, tienChietKhau: tienCKnew, ptChietKhau: ptCKNew };
                } else {
                    return x;
                }
            })
        );
    };

    const removeAllNVienChosed = () => {
        setLstNhanVienChosed([]);
    };

    const refInputCK: any = useRef([]);
    const refTienChietKhau: any = useRef([]);
    const gotoNextInputCK = (e: React.KeyboardEvent<HTMLDivElement>, targetElem: any) => {
        if (e.key === 'Enter' && targetElem) {
            targetElem.focus();
        }
    };
    const gotoNextTienChietKhau = (e: React.KeyboardEvent<HTMLDivElement>, targetElem: any) => {
        if (e.key === 'Enter' && targetElem) {
            targetElem.focus();
        }
    };

    const handleChange = (event: React.SyntheticEvent, newValue: string) => {
        setTabActive(newValue);

        // Lọc danh sách nhân viên theo loại hoa hồng của tab
        const filteredNhanVien = lstNVThucHien?.filter((nv) => {
            if (newValue === `${LoaiHoaHongDichVu.THUC_HIEN}`) {
                return nv.loaiChietKhau === 1 || nv.loaiChietKhau === 2; // Loại hoa hồng "Thực hiện" hoặc "Loại khác"
            } else if (newValue === `${LoaiHoaHongDichVu.TU_VAN}`) {
                return nv.loaiChietKhau === 3; // Loại hoa hồng "Tư vấn"
            }
            return false;
        });

        setLstNhanVienFiltered(filteredNhanVien); // Cập nhật danh sách nhân viên hiển thị
    };

    useEffect(() => {
        handleChange({} as React.SyntheticEvent, tabActive);
    }, [lstNVThucHien, tabActive]);

    // Effect hook để lọc lại nhân viên khi thay đổi tab
    useEffect(() => {
        if (tabActive) {
            handleChange({} as React.SyntheticEvent, tabActive);
        }
    }, [tabActive]);

    const saveHoaHongDV = async () => {
        if (!isNew) {
            setObjAlert({ ...objAlert, mes: 'Cập nhật hoa hồng dịch vụ thành công', show: true, type: 1 });
            await NhanVienThucHienServices.UpdateNVThucHien_byIdHoaDonChiTiet(itemHoaDonChiTiet?.id, lstNVThucHien);
        }

        onSaveOK(lstNVThucHien);
    };
    const getLoaiChietKhauLabel = (loaiChietKhau: number) => {
        switch (loaiChietKhau) {
            case 1:
                return 'Thực hiện';
            case 2:
                return 'Yêu cầu';
            case 3:
                return 'Tư vấn';
            default:
                return 'Chưa xác định'; // Giá trị mặc định nếu không có loại chiết khấu hợp lệ
        }
    };
    return (
        <>
            <SnackbarAlert
                showAlert={objAlert.show}
                type={objAlert.type}
                title={objAlert.mes}
                handleClose={() => setObjAlert({ show: false, mes: '', type: 1 })}></SnackbarAlert>
            <Dialog open={iShow} onClose={onClose} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Typography className="modal-title">Hoa hồng theo dịch vụ</Typography>
                    <DialogButtonClose onClose={onClose} />
                </DialogTitle>
                <DialogContent>
                    <Grid container>
                        <Grid item lg={4} xs={12} md={4}>
                            <TabContext value={tabActive}>
                                <TabList
                                    onChange={handleChange}
                                    sx={{
                                        ' button': {
                                            textTransform: 'unset',
                                            paddingTop: '4px',
                                            paddingBottom: '4px'
                                        },
                                        '.MuiTabs-indicator': {
                                            backgroundColor: 'unset'
                                        }
                                    }}>
                                    <Tab
                                        label="Thực hiện"
                                        value={`${LoaiHoaHongDichVu.THUC_HIEN}`}
                                        className={
                                            tabActive == LoaiHoaHongDichVu.THUC_HIEN.toString() ? 'tab-active' : ''
                                        }></Tab>
                                    <Tab
                                        label="Tư vấn"
                                        value={`${LoaiHoaHongDichVu.TU_VAN}`}
                                        className={
                                            tabActive == LoaiHoaHongDichVu.TU_VAN.toString() ? 'tab-active' : ''
                                        }></Tab>
                                </TabList>
                            </TabContext>
                        </Grid>
                        <Grid item lg={8} xs={12} md={8}>
                            <Stack flex={4} fontSize={14}>
                                <Stack
                                    direction={'row'}
                                    justifyContent={'center'}
                                    sx={{
                                        padding: '10px'
                                    }}>
                                    <Stack
                                        direction={{ lg: 'row', md: 'row', sm: 'row', xs: 'column' }}
                                        spacing={1}
                                        flex={1}
                                        justifyContent={'space-between'}>
                                        <Stack direction={'row'} spacing={1}>
                                            <Stack sx={{ fontWeight: '600' }}>{itemHoaDonChiTiet?.tenHangHoa}</Stack>
                                        </Stack>
                                        <Stack sx={{ fontWeight: '600' }}>
                                            Giá trị: {new Intl.NumberFormat('vi-VN').format(giaTriTinhHoaHong)}
                                        </Stack>
                                    </Stack>
                                </Stack>
                            </Stack>
                        </Grid>
                    </Grid>

                    <Grid container spacing={2}>
                        <Grid item lg={4} xs={12} md={4}>
                            <Stack spacing={1}>
                                <TextField
                                    size="small"
                                    fullWidth
                                    placeholder="Tìm kiếm"
                                    value={txtSearch}
                                    onChange={(event) => {
                                        setTxtSearch(event.target.value);
                                    }}
                                    InputProps={{
                                        startAdornment: <Search />
                                    }}
                                />
                                <Stack sx={{ overflow: 'auto', maxHeight: 400 }}>
                                    {lstNhanVien?.map((nvien: NhanSuItemDto, index: number) => (
                                        <Stack
                                            direction={'row'}
                                            spacing={1}
                                            key={index}
                                            sx={{ borderBottom: '1px dashed #cccc', padding: '8px' }}
                                            onClick={() => ChoseNhanVien(nvien)}>
                                            <Stack>
                                                <Avatar
                                                    sx={{
                                                        width: 40,
                                                        height: 40,
                                                        backgroundColor: 'var(--color-bg)',
                                                        color: 'var(--color-main)',
                                                        fontSize: '14px'
                                                    }}>
                                                    {utils.getFirstLetter(nvien?.tenNhanVien ?? '')}
                                                </Avatar>
                                            </Stack>
                                            <Stack justifyContent={'center'} spacing={1}>
                                                <Stack sx={{ fontSize: '14px', fontWeight: 500 }}>
                                                    {nvien?.tenNhanVien}
                                                </Stack>
                                                <Stack sx={{ fontSize: '12px', color: '#839bb1' }}>
                                                    {nvien?.tenChucVu}
                                                </Stack>
                                            </Stack>
                                        </Stack>
                                    ))}
                                </Stack>
                            </Stack>
                        </Grid>
                        <Grid item lg={8} xs={12} md={8} sx={{ fontSize: '14px' }}>
                            <Stack>
                                <Stack
                                    direction={'row'}
                                    spacing={1}
                                    sx={{
                                        fontWeight: '600',
                                        padding: '8px',
                                        background: 'var(--color-header-table)'
                                    }}>
                                    <Stack flex={2}>Yêu cầu</Stack>
                                    <Stack flex={5}>Nhân viên</Stack>
                                    <Stack flex={3}>Chiết khấu</Stack>
                                    <Stack flex={1}>%</Stack>
                                    <Stack flex={3}>Tiền được nhận</Stack>
                                    <Stack flex={1} alignItems={'end'}>
                                        <ClearOutlinedIcon sx={{ color: 'red' }} onClick={removeAllNVienChosed} />
                                    </Stack>
                                </Stack>

                                {/* Bảng có chiều cao cố định và cuộn nội dung */}
                                <Stack
                                    sx={{
                                        minHeight: '350px', // Chiều cao cố định cho phần danh sách nhân viên
                                        overflowY: 'auto', // Cho phép cuộn khi nội dung quá dài
                                        padding: '10px'
                                    }}>
                                    {lstNhanVienFiltered?.map((nv: NhanVienThucHienDto, index: number) => (
                                        <Stack direction={'row'} spacing={1} padding={'10px'} key={index}>
                                            {/* Checkbox */}
                                            <Stack
                                                flex={1}
                                                alignItems="center"
                                                justifyContent="center"
                                                textAlign="center">
                                                <Checkbox
                                                    checked={nv.loaiChietKhau === 2} // Kiểm tra nếu loaiChietKhau = 2 thì checkbox được chọn
                                                    onChange={() => onCheckboxChange(nv)} // Gọi onCheckboxChange khi thay đổi trạng thái checkbox
                                                />
                                            </Stack>

                                            {/* Tên nhân viên */}
                                            <Stack flex={5}>
                                                <Stack>{nv.tenNhanVien}</Stack>
                                                <Stack>
                                                    <Typography variant="caption" color={'var(--color-text-secondary)'}>
                                                        {nv.loaiChietKhau === 1
                                                            ? 'Thực hiện'
                                                            : nv.loaiChietKhau === 2
                                                            ? 'Yêu cầu thực hiện'
                                                            : nv.loaiChietKhau === 3
                                                            ? 'Tư vấn'
                                                            : ''}
                                                    </Typography>
                                                </Stack>
                                            </Stack>

                                            {/* Chiết khấu */}
                                            <Stack flex={3} alignItems={'center'} sx={{ cursor: 'pointer' }}>
                                                <Stack sx={{ color: 'var(--color-main)' }}>
                                                    <NumericFormat
                                                        fullWidth
                                                        size="small"
                                                        variant="standard"
                                                        thousandSeparator={'.'}
                                                        decimalSeparator={','}
                                                        value={nv.laPhanTram ? nv.ptChietKhau : nv.tienChietKhau}
                                                        customInput={TextField}
                                                        InputProps={{
                                                            inputProps: {
                                                                style: { textAlign: 'right' }
                                                            }
                                                        }}
                                                        inputRef={(el: any) => (refInputCK.current[index] = el)}
                                                        onChange={(e) => changeGtriChietKhau(e.target.value, nv)}
                                                        onKeyUp={(e: React.KeyboardEvent<HTMLDivElement>) =>
                                                            gotoNextInputCK(
                                                                e,
                                                                refInputCK.current[
                                                                    index === lstNhanVienFiltered.length - 1
                                                                        ? 0
                                                                        : index + 1
                                                                ]
                                                            )
                                                        }
                                                    />
                                                </Stack>
                                            </Stack>

                                            {/* Avatar cho phần trăm hoặc tiền */}
                                            <Stack direction={'row'} flex={1}>
                                                {nv?.laPhanTram ? (
                                                    <Avatar
                                                        style={{
                                                            width: 25,
                                                            height: 25,
                                                            fontSize: '12px',
                                                            backgroundColor: 'var(--color-main)'
                                                        }}
                                                        onClick={() => onClickPtramVND(true, nv)}>
                                                        %
                                                    </Avatar>
                                                ) : (
                                                    <Avatar
                                                        style={{ width: 25, height: 25, fontSize: '12px' }}
                                                        onClick={() => onClickPtramVND(false, nv)}>
                                                        đ
                                                    </Avatar>
                                                )}
                                            </Stack>

                                            {/* Tiền được nhận */}
                                            <Stack flex={3} alignItems={'end'}>
                                                <NumericFormat
                                                    fullWidth
                                                    size="small"
                                                    variant="standard"
                                                    thousandSeparator={'.'}
                                                    decimalSeparator={','}
                                                    value={nv.tienChietKhau}
                                                    customInput={TextField}
                                                    InputProps={{
                                                        inputProps: {
                                                            style: { textAlign: 'right' }
                                                        }
                                                    }}
                                                    onChange={(e) => {
                                                        changeTienChietKhau(e.target.value, nv);
                                                    }}
                                                    inputRef={(el: any) => (refTienChietKhau.current[index] = el)}
                                                    onKeyUp={(e: React.KeyboardEvent<HTMLDivElement>) =>
                                                        gotoNextTienChietKhau(
                                                            e,
                                                            refTienChietKhau.current[
                                                                index === lstNhanVienFiltered.length - 1 ? 0 : index + 1
                                                            ]
                                                        )
                                                    }
                                                />
                                            </Stack>

                                            {/* Xóa nhân viên */}
                                            <Stack flex={1} alignItems={'end'}>
                                                <ClearOutlinedIcon
                                                    sx={{ color: 'red' }}
                                                    onClick={() => removeNVienChosed(nv)}
                                                />
                                            </Stack>
                                        </Stack>
                                    ))}
                                </Stack>
                                <Stack
                                    sx={{
                                        paddingInlineEnd: '20px',
                                        marginTop: '10px'
                                    }}>
                                    <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
                                        {lstNVThucHien
                                            .filter(
                                                (nv) =>
                                                    nv.loaiChietKhau === 1 ||
                                                    nv.loaiChietKhau === 3 ||
                                                    nv.loaiChietKhau === 2
                                            )
                                            .map((nv, index) => (
                                                <Stack
                                                    key={index}
                                                    direction="row"
                                                    alignItems="center" // Căn giữa Avatar với các chữ
                                                    spacing={1}
                                                    sx={{
                                                        marginBottom: '8px', // Khoảng cách giữa các mục
                                                        paddingBottom: '4px'
                                                    }}>
                                                    <Avatar
                                                        sx={{
                                                            width: 25,
                                                            height: 25,
                                                            backgroundColor: 'var(--color-main)',
                                                            fontSize: '14px'
                                                        }}>
                                                        {nv.tenNhanVien.charAt(0)}{' '}
                                                        {/* Hiển thị chữ cái đầu tiên của tên */}
                                                    </Avatar>
                                                    <Stack direction="column" alignItems="flex-start" spacing={0.2}>
                                                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                            {nv.tenNhanVien}
                                                        </Typography>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                fontSize: '12px', // chữ nhỏ hơn
                                                                color: 'rgba(0, 0, 0, 0.6)', // màu mờ hơn
                                                                marginTop: '0px' // Đảm bảo không có khoảng cách thừa trên
                                                            }}>
                                                            {getLoaiChietKhauLabel(nv.loaiChietKhau)}{' '}
                                                            {/* Hiển thị loại chiết khấu */}
                                                        </Typography>
                                                    </Stack>
                                                </Stack>
                                            ))}
                                    </Stack>
                                </Stack>
                            </Stack>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ paddingBottom: '20px' }}>
                    <Button variant="outlined" onClick={onClose}>
                        Bỏ qua
                    </Button>
                    <Button variant="contained" onClick={saveHoaHongDV}>
                        {isNew ? 'Đồng ý' : ' Cập nhật'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
