import {
    Grid,
    Stack,
    Avatar,
    Typography,
    Button,
    Tab,
    Checkbox,
    TextField,
    FormControlLabel,
    Radio,
    RadioGroup,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    TableFooter
} from '@mui/material';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import TabCuocHen from './TabCuocHen';
import TabMuaHang from './TabMuaHang';
import utils from '../../../utils/utils';
import { useEffect, useState } from 'react';
import { Guid } from 'guid-typescript';
import khachHangService from '../../../services/khach-hang/khachHangService';
import { ICustomerDetail_FullInfor } from '../../../services/khach-hang/dto/KhachHangDto';
import { HoatDongKhachHang } from '../../../services/khach-hang/dto/ThongTinKhachHangTongHopDto';
import { format } from 'date-fns';
import CreateOrEditCustomerDialog from '../components/create-or-edit-customer-modal';
import SnackbarAlert from '../../../components/AlertDialog/SnackbarAlert';
import ConfirmDelete from '../../../components/AlertDialog/ConfirmDelete';
import { PropConfirmOKCancel } from '../../../utils/PropParentToChild';
import { CreateOrEditKhachHangDto } from '../../../services/khach-hang/dto/CreateOrEditKhachHangDto';
import uploadFileService from '../../../services/uploadFileService';
import TabAnhLieuTrinh from './TabAnhLieuTrinh';
import TabNhatKySuDungGDV from '../../goi_dich_vu/tab_nhat_ky_su_dung_gdv';
import PageBCNhatKySuDungTGTTGT from '../../bao_cao/the_gia_tri/nhat_ky_su_dung';
import { RdoTrangThaiFilter } from '../../../enum/TrangThaiFilter';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';

import ParamSearchChiTietSuDungGDVDto from '../../../services/ban_hang/ParamSearchChiTietSuDungGDVDto';
import ChiTietSuDungGDVDto, { GroupChiTietSuDungGDVDto } from '../../../services/ban_hang/ChiTietSuDungGDVDto';
import HoaDonService from '../../../services/ban_hang/HoaDonService';
import { IHeaderTable, MyHeaderTable } from '../../../components/Table/MyHeaderTable';
import { PagedResultDto } from '../../../services/dto/pagedResultDto';
import PageHoaDonDto from '../../../services/ban_hang/PageHoaDonDto';
import { HoaDonRequestDto } from '../../../services/dto/ParamSearchDto';
import { useRef, useContext } from 'react';
import { AppContext } from '../../../services/chi_nhanh/ChiNhanhContext';
import AppConsts, { DateType, LoaiChungTu } from '../../../lib/appconst';
import { TrangThaiHoaDon } from '../../../services/ban_hang/HoaDonConst';

export interface IScreenCustomerInfor {
    khachHangId?: string;
    onClose: () => void;
}

const CustomerInfor2 = ({ khachHangId, onClose }: IScreenCustomerInfor) => {
    const [tabActive, setTabActive] = useState('1');
    const [isShowEditKhachHang, setIsShowEditKhachHang] = useState(false);
    const [cusEdit, setCusEdit] = useState<ICustomerDetail_FullInfor>({} as ICustomerDetail_FullInfor);
    const [nkyHoatDong, setNKyHoatDong] = useState<HoatDongKhachHang[]>([]);
    const [objAlert, setObjAlert] = useState({ show: false, mes: '', type: 1 });
    const [objDelete, setObjDelete] = useState<PropConfirmOKCancel>(new PropConfirmOKCancel({ show: false }));
    const [soDuTheGiaTri, setSoDuTheGiaTri] = useState(0);

    const handleChangeTab = (event: React.SyntheticEvent, newValue: string) => {
        setTabActive(newValue);
    };

    useEffect(() => {
        getNhatKyHoatDong();
        getKhachHangInfo();
        if (khachHangId) {
            setParamSearch((prev) => ({
                ...prev,
                idCustomer: khachHangId
            }));
        }
    }, [khachHangId]);

    const getNhatKyHoatDong = async () => {
        const data = await khachHangService.GetNhatKyHoatDong_ofKhachHang(khachHangId ?? Guid.EMPTY);
        setNKyHoatDong(data);
    };

    const getKhachHangInfo = async () => {
        const data = await khachHangService.getDetail(khachHangId ?? Guid.EMPTY);
        setCusEdit({
            ...cusEdit,
            id: data.id,
            maKhachHang: data?.maKhachHang as string,
            tenKhachHang: data?.tenKhachHang as string,
            soDienThoai: data?.soDienThoai as string,
            ngaySinh: data?.ngaySinh as Date,
            diaChi: data?.diaChi as string,
            idNhomKhach: data?.idNhomKhach as string,
            avatar: data?.avatar,
            tenNhomKhach: data?.tenNhomKhach,
            cuocHenGanNhat: data?.cuocHenGanNhat,
            soLanBooking: data?.soLanBooking,
            tongChiTieu: data?.tongChiTieu,
            conNo: data?.conNo
        });
    };

    const onShowModalEditCustomer = async () => {
        setIsShowEditKhachHang(true);
    };

    const gotoBack = () => {
        onClose();
    };

    const onDeleteCustomer = async () => {
        await khachHangService.delete(khachHangId ?? Guid.EMPTY);
        setObjDelete({ ...objDelete, show: false });
        setObjAlert({ ...objAlert, show: true, mes: 'Xóa khách hàng thành công' });
        gotoBack();
    };

    const onSaveEditCustomer = async () => {
        await getKhachHangInfo();
        setIsShowEditKhachHang(false);
    };
    const [paramSearch, setParamSearch] = useState<ParamSearchChiTietSuDungGDVDto>({
        idCustomer: khachHangId ?? '',
        idChiNhanhs: [],
        trangThais: [RdoTrangThaiFilter.CO]
    });
    const arrTrangThai = [
        { text: 'Tất cả', value: RdoTrangThaiFilter.TAT_CA },
        { text: 'Còn buổi', value: RdoTrangThaiFilter.CO },
        { text: 'Hết buổi', value: RdoTrangThaiFilter.KHONG }
    ];

    const handlePageChange = async (currentPage: number) => {
        console.log('test ', cusEdit.maKhachHang);
        setParamSearch({
            ...paramSearch,
            currentPage: currentPage,
            textSearch: cusEdit.maKhachHang
        });
    };
    const changePageSize = async (pageSizeNew: number) => {
        setParamSearch({
            ...paramSearch,
            currentPage: 1,
            pageSize: pageSizeNew
        });
    };
    const [balance, setBalance] = useState<number>(0);

    const handleUpdateBalance = (newBalance: number) => {
        setBalance(newBalance);
    };
    useEffect(() => {
        if (khachHangId) {
            GetChiTiet_SuDungGDV_ofCustomer(paramSearch?.textSearch ?? '');
        }
    }, [paramSearch?.trangThais]);
    const [ctChosed, setCTChosed] = useState<ChiTietSuDungGDVDto[]>([]);
    const [lstChiTietGDV, setLstChiTietGDV] = useState<GroupChiTietSuDungGDVDto[]>();
    const GetChiTiet_SuDungGDV_ofCustomer = async (txtSearch: string | null) => {
        const param = { ...paramSearch };
        // param.idCustomer = cusEdit.id ?? '';
        param.textSearch = txtSearch ?? '';

        const data = await HoaDonService.GetChiTiet_SuDungGDV_ofCustomer(param);
        setLstChiTietGDV([...data]);
    };
    const changeCheckAll = (isCheck: boolean) => {
        let arrIdSearch = lstChiTietGDV?.flatMap((x) => x?.chitiets?.map((o) => o?.idChiTietHoaDon));
        arrIdSearch = arrIdSearch ?? [];

        const arrConLai = ctChosed?.filter((x) => !arrIdSearch?.includes(x?.idChiTietHoaDon ?? ''));
        if (isCheck) {
            const arrChosed = lstChiTietGDV?.flatMap((x) => x?.chitiets?.map((o) => o));
            setCTChosed([...arrConLai, ...(arrChosed ?? [])]);
        } else {
            setCTChosed([...arrConLai]);
        }
    };

    const choseItem = (isCheck: boolean, itemChosed: ChiTietSuDungGDVDto) => {
        if (itemChosed?.soLuongConLai === 0) {
            setObjAlert({
                ...objAlert,
                show: true,
                mes: `Dịch vụ ${itemChosed?.tenHangHoa} đã hết số buổi dùng`,
                type: 2
            });
            return;
        }
        const lstOld = ctChosed?.filter((x) => x?.idChiTietHoaDon !== itemChosed?.idChiTietHoaDon);
        if (isCheck) {
            setCTChosed([itemChosed, ...(lstOld ?? [])]);
        } else {
            setCTChosed([...(lstOld ?? [])]);
        }
    };
    const arrIdChiTietChosed = ctChosed?.map((x) => {
        return x?.idChiTietHoaDon;
    });
    const listColumnHeader: IHeaderTable[] = [
        { columnId: 'maHoaDon', columnText: 'Mã thẻ' },
        { columnId: 'ngayLapHoaDon', columnText: 'Ngày lập' },
        { columnId: 'maKhachHang', columnText: 'Mã khách hàng' },
        { columnId: 'soDienThoai', columnText: 'Điện thoại' },
        { columnId: 'tenKhachHang', columnText: 'Tên khách hàng' },
        { columnId: 'tongTienHang', columnText: 'Tổng tiền nạp', align: 'right' },
        { columnId: 'tongGiamGiaHD', columnText: 'Giảm giá', align: 'right' },
        { columnId: 'tongThanhToan', columnText: 'Phải thanh toán', align: 'right' },
        { columnId: 'khachDaTra', columnText: 'Đã thanh toán', align: 'right' },
        { columnId: 'conNo', columnText: 'Còn nợ', align: 'right' },
        { columnId: 'ghiChuHD', columnText: 'Ghi chú' }
    ];
    const [pageDataHoaDon, setPageDataHoaDon] = useState<PagedResultDto<PageHoaDonDto>>({
        totalCount: 0,
        totalPage: 0,
        items: []
    });
    const appContext = useContext(AppContext);
    const chinhanh = appContext.chinhanhCurrent;
    const [paramSearchTGT, setParamSearchTGT] = useState<HoaDonRequestDto>({
        textSearch: '',
        idChiNhanhs: [chinhanh?.id],
        idLoaiChungTus: [LoaiChungTu.THE_GIA_TRI],
        currentPage: 1,
        pageSize: 1000,
        columnSort: 'NgayLapHoaDon',
        typeSort: 'DESC',
        fromDate: null,
        toDate: null,
        dateType: DateType.TAT_CA,
        trangThais: [TrangThaiHoaDon.HOAN_THANH]
    });
    const GetListTheGiaTri = async () => {
        const param = { ...paramSearchTGT };
        console.log('maKhachHang', cusEdit.maKhachHang);
        const data = await HoaDonService.GetListHoaDon(param);
        if (data?.items?.length > 0) {
            const filteredItems = data.items.filter((item) => item.maKhachHang == cusEdit.maKhachHang);

            setPageDataHoaDon({
                ...pageDataHoaDon,
                items: filteredItems,
                totalCount: filteredItems.length,
                totalPage: utils.getTotalPage(filteredItems.length, paramSearch?.pageSize)
            });

            const firstRow = filteredItems[0];
        } else {
            setPageDataHoaDon({
                ...pageDataHoaDon,
                items: [],
                totalCount: 0,
                totalPage: 0
            });
        }
    };
    useEffect(() => {
        if (cusEdit.maKhachHang) {
            GetListTheGiaTri();
        }
    }, [cusEdit.maKhachHang]);

    useEffect(() => {
        GetSoDuTheGiaTri_ofKhachHang(cusEdit?.id ?? '');
    }, [cusEdit?.id]);

    const GetSoDuTheGiaTri_ofKhachHang = async (idKhachHang: string) => {
        const data = await HoaDonService.GetSoDuTheGiaTri_ofKhachHang(idKhachHang);
        setSoDuTheGiaTri(data);
    };
    return (
        <>
            <SnackbarAlert
                showAlert={objAlert.show}
                type={objAlert.type}
                title={objAlert.mes}
                handleClose={() => setObjAlert({ show: false, mes: '', type: 1 })}></SnackbarAlert>
            <ConfirmDelete
                title={objDelete.title}
                mes={objDelete.mes}
                isShow={objDelete.show}
                onOk={onDeleteCustomer}
                onCancel={() => setObjDelete({ ...objDelete, show: false })}></ConfirmDelete>
            <CreateOrEditCustomerDialog
                visible={isShowEditKhachHang}
                onCancel={() => {
                    setIsShowEditKhachHang(!isShowEditKhachHang);
                }}
                onOk={onSaveEditCustomer}
                title={'Cập nhật thông tin khách hàng'}
                formRef={
                    {
                        id: khachHangId,
                        maKhachHang: cusEdit?.maKhachHang,
                        tenKhachHang: cusEdit?.tenKhachHang,
                        soDienThoai: cusEdit?.soDienThoai,
                        ngaySinh: cusEdit?.ngaySinh,
                        diaChi: cusEdit?.diaChi ?? '',
                        gioiTinhNam: cusEdit?.gioiTinhNam ?? false,
                        moTa: cusEdit?.moTa ?? '',
                        idNhomKhach: cusEdit?.idNhomKhach,
                        idNguonKhach: cusEdit?.idNguonKhach,
                        avatar: cusEdit?.avatar,
                        idLoaiKhach: cusEdit?.idLoaiKhach
                    } as CreateOrEditKhachHangDto
                }
            />
            <Grid container paddingTop={2} spacing={1}>
                <Grid item xs={12} md={4} lg={4} sx={{ position: 'relative' }}>
                    <Stack
                        padding={2}
                        spacing={2}
                        className="page-full"
                        sx={{ border: '1px solid #cccc', borderRadius: '4px' }}>
                        <Stack sx={{ position: 'relative' }}>
                            <Stack direction={'row'} spacing={1.5} alignItems={'center'}>
                                <Stack position={'relative'}>
                                    {cusEdit?.avatar ? (
                                        <Stack
                                            sx={{
                                                '& img': {
                                                    maxWidth: '100%',
                                                    maxHeight: '100%',
                                                    height: '60px',
                                                    width: '60px',
                                                    objectFit: 'cover',
                                                    borderRadius: '6px'
                                                }
                                            }}>
                                            <img
                                                src={uploadFileService.GoogleApi_NewLink(cusEdit?.avatar)}
                                                alt="avatar"
                                            />
                                        </Stack>
                                    ) : (
                                        <Avatar
                                            sx={{
                                                width: 60,
                                                height: 60,
                                                backgroundColor: 'var(--color-bg)',
                                                color: 'var(--color-main)',
                                                fontSize: '18px'
                                            }}>
                                            {utils.getFirstLetter(cusEdit?.tenKhachHang, 3)}
                                        </Avatar>
                                    )}
                                </Stack>
                                <Stack sx={{ position: 'relative' }}>
                                    <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>
                                        {cusEdit?.tenKhachHang}
                                    </Typography>
                                    <Typography variant="caption" color={'#b2b7bb'}>
                                        {cusEdit?.maKhachHang}
                                    </Typography>
                                </Stack>
                            </Stack>
                        </Stack>

                        <Stack sx={{ borderBottom: '1px solid #cccc' }}>
                            <Grid container spacing={1.5} paddingBottom={2}>
                                <Grid item xs={5} lg={4}>
                                    <Typography variant="body2" fontWeight={600}>
                                        Điện thoại
                                    </Typography>
                                </Grid>
                                <Grid item xs={7} lg={8}>
                                    <Typography variant="body2">{cusEdit?.soDienThoai}</Typography>
                                </Grid>
                                <Grid item xs={5} lg={4}>
                                    <Typography variant="body2" fontWeight={600}>
                                        Ngày sinh
                                    </Typography>
                                </Grid>
                                <Grid item xs={7} lg={8}>
                                    <Typography variant="body2">
                                        {!utils.checkNull(cusEdit?.ngaySinh as unknown as string)
                                            ? format(new Date(cusEdit?.ngaySinh as unknown as string), 'dd/MM/yyyy')
                                            : ''}
                                    </Typography>
                                </Grid>
                                <Grid item xs={5} lg={4}>
                                    <Typography variant="body2" fontWeight={600}>
                                        Địa chỉ
                                    </Typography>
                                </Grid>
                                <Grid item xs={7} lg={8}>
                                    <Typography variant="body2"> {cusEdit?.diaChi}</Typography>
                                </Grid>
                                <Grid item xs={5} lg={4}>
                                    <Typography variant="body2" fontWeight={600}>
                                        Nhóm khách
                                    </Typography>
                                </Grid>
                                <Grid item xs={7} lg={8}>
                                    <Typography variant="body2">{cusEdit?.tenNhomKhach}</Typography>
                                </Grid>
                                <Grid item xs={5} lg={4}>
                                    <Typography variant="body2" fontWeight={600}>
                                        Số dư thẻ giá trị
                                    </Typography>
                                </Grid>
                                <Grid item xs={7} lg={8}>
                                    <Typography variant="body2">
                                        {new Intl.NumberFormat('vi-VN').format(soDuTheGiaTri)} đ
                                    </Typography>{' '}
                                </Grid>
                                <Grid item xs={12}>
                                    <Stack spacing={1} direction={'row'} justifyContent={'center'}>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            fullWidth
                                            sx={{ borderRadius: '12px', flex: 8 }}
                                            onClick={onShowModalEditCustomer}>
                                            Thay đổi thông tin
                                        </Button>
                                        {/* <DeleteOutlinedIcon
                                            titleAccess="Xóa khách hàng"
                                            sx={{ color: '#b75151' }}
                                            onClick={() => {
                                                setObjDelete({
                                                    ...objDelete,
                                                    show: true,
                                                    title: 'Thông báo xóa',
                                                    mes: 'Bạn có chắc chắn muốn xóa khách hàng này không?'
                                                });
                                            }}
                                        /> */}
                                    </Stack>
                                </Grid>
                            </Grid>
                        </Stack>
                        <Stack sx={{ borderBottom: '1px solid #cccc' }} paddingBottom={2}>
                            <Stack spacing={2}>
                                <Stack justifyContent={'space-between'} direction={'row'}>
                                    <Typography variant="body2">Cuộc hẹn gần nhất</Typography>

                                    <Typography variant="body2">
                                        {!utils.checkNull(cusEdit?.cuocHenGanNhat as unknown as string)
                                            ? format(
                                                  new Date(cusEdit?.cuocHenGanNhat as unknown as string),
                                                  'dd/MM/yyyy'
                                              )
                                            : ''}
                                    </Typography>
                                </Stack>
                                <Stack>
                                    <Stack justifyContent={'space-between'} direction={'row'}>
                                        <Stack alignItems={'center'}>
                                            <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>
                                                {cusEdit?.soLanBooking}
                                            </Typography>
                                            <Typography variant="caption">Cuộc hẹn</Typography>
                                        </Stack>
                                        <Stack alignItems={'center'}>
                                            <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>
                                                {utils.formatNumber(cusEdit?.tongChiTieu ?? 0)}
                                            </Typography>
                                            <Typography variant="caption">Chi tiêu</Typography>
                                        </Stack>
                                        <Stack alignItems={'center'}>
                                            <Typography
                                                sx={{
                                                    fontSize: '18px',
                                                    fontWeight: 600,
                                                    color:
                                                        (cusEdit?.conNo ?? 0) > 0 ? '#b75151' : 'var(--font-color-main)'
                                                }}>
                                                {utils.formatNumber(cusEdit?.conNo ?? 0)}
                                            </Typography>
                                            <Typography variant="caption">Còn nợ</Typography>
                                        </Stack>
                                    </Stack>
                                </Stack>
                            </Stack>
                        </Stack>

                        <Stack>
                            <Stack spacing={2}>
                                <Typography variant="body2" fontWeight={600} textAlign={'center'}>
                                    Nhật ký hoạt động
                                </Typography>
                                <Stack
                                    spacing={1.5}
                                    sx={{ overflow: 'auto', maxHeight: 'calc(70vh - 335px)', paddingBottom: '16px' }}>
                                    {nkyHoatDong?.map((item, index) => (
                                        <Stack key={index} spacing={0.5}>
                                            <Typography
                                                variant="body2"
                                                dangerouslySetInnerHTML={{ __html: item?.hoatDong }}></Typography>
                                            <Typography variant="caption" color={'#978686'}>
                                                {format(new Date(item?.thoiGian), 'dd/MM/yyyy HH:mm')}
                                            </Typography>
                                        </Stack>
                                    ))}
                                </Stack>
                            </Stack>
                        </Stack>
                    </Stack>
                </Grid>
                <Grid item xs={12} md={8} lg={8}>
                    <Stack padding={2} className="page-full" sx={{ border: '1px solid #cccc', borderRadius: '4px' }}>
                        <TabContext value={tabActive}>
                            <Grid container alignItems={'center'}>
                                <Grid item lg={8} xs={12}>
                                    <TabList
                                        onChange={handleChangeTab}
                                        sx={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: 1
                                        }}>
                                        <Tab
                                            label="Gói dịch vụ"
                                            value="1"
                                            sx={{
                                                padding: '4px 8px',
                                                fontSize: { xs: '12px', sm: '13px' },
                                                minWidth: '70px',
                                                textTransform: 'none'
                                            }}
                                        />
                                        <Tab
                                            label="Nhật ký gói"
                                            value="2"
                                            sx={{
                                                padding: '4px 8px',
                                                fontSize: { xs: '9px', sm: '13px' },
                                                minWidth: '70px',
                                                textTransform: 'none'
                                            }}
                                        />
                                        <Tab
                                            label="Thẻ giá trị"
                                            value="7"
                                            sx={{
                                                padding: '4px 8px',
                                                fontSize: { xs: '9px', sm: '13px' },
                                                minWidth: '70px',
                                                textTransform: 'none'
                                            }}
                                        />
                                        <Tab
                                            label="Nhật ký thẻ giá trị"
                                            value="3"
                                            sx={{
                                                padding: '4px 8px',
                                                fontSize: { xs: '9px', sm: '13px' },
                                                minWidth: '80px',
                                                textTransform: 'none'
                                            }}
                                        />
                                        <Tab
                                            label="Cuộc hẹn"
                                            value="4"
                                            sx={{
                                                padding: '4px 8px',
                                                fontSize: { xs: '9px', sm: '13px' },
                                                minWidth: '80px',
                                                textTransform: 'none'
                                            }}
                                        />
                                        <Tab
                                            label="Mua hàng"
                                            value="5"
                                            sx={{
                                                padding: '4px 8px',
                                                fontSize: { xs: '9px', sm: '13px' },
                                                minWidth: '80px',
                                                textTransform: 'none'
                                            }}
                                        />
                                        <Tab
                                            label="Ảnh liệu trình"
                                            value="6"
                                            sx={{
                                                padding: '4px 8px',
                                                fontSize: { xs: '9px', sm: '13px' },
                                                minWidth: '80px',
                                                textTransform: 'none'
                                            }}
                                        />
                                    </TabList>
                                </Grid>
                                <Grid item lg={4}>
                                    <Stack direction={'row'} spacing={1} justifyContent={'end'}>
                                        <Button
                                            variant="outlined"
                                            startIcon={<ArrowBackOutlinedIcon />}
                                            onClick={gotoBack}>
                                            Quay lại
                                        </Button>
                                        <Button variant="outlined" startIcon={<FileUploadOutlinedIcon />}>
                                            Xuất excel
                                        </Button>
                                    </Stack>
                                </Grid>
                            </Grid>
                            <TabPanel value="1" sx={{ padding: 0 }}>
                                <Grid container>
                                    <Grid item xs={12}>
                                        <RadioGroup
                                            row
                                            value={paramSearch?.trangThais?.[0]}
                                            onChange={(e) =>
                                                setParamSearch({
                                                    ...paramSearch,
                                                    trangThais: [parseInt(e.target.value)]
                                                })
                                            }>
                                            {arrTrangThai?.map((x, index) => (
                                                <FormControlLabel
                                                    key={index}
                                                    label={x.text}
                                                    value={x.value}
                                                    control={<Radio />}></FormControlLabel>
                                            ))}
                                        </RadioGroup>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            size="small"
                                            variant="outlined"
                                            placeholder="Tìm kiếm mã gói dịch vụ, tên dịch vụ"
                                            fullWidth
                                            InputProps={{ startAdornment: <SearchOutlinedIcon /> }}
                                            onChange={(e) =>
                                                setParamSearch({ ...paramSearch, textSearch: e.target.value })
                                            }
                                        />
                                    </Grid>
                                    <Grid
                                        container
                                        sx={{
                                            backgroundColor: ' var(--color-header-table)'
                                        }}
                                        className="grid-table grid-table-header">
                                        <Grid item xs={1.5}>
                                            <Typography variant="body2">Mã DV</Typography>
                                        </Grid>
                                        <Grid item xs={4}>
                                            <Typography variant="body2">Tên dịch vụ</Typography>
                                        </Grid>
                                        <Grid item xs={1}>
                                            <Typography variant="body2">Số lượng</Typography>
                                        </Grid>
                                        <Grid item xs={1}>
                                            <Typography variant="body2">Đơn giá</Typography>
                                        </Grid>
                                        <Grid item xs={2}>
                                            <Typography variant="body2">Thành tiền</Typography>
                                        </Grid>
                                        <Grid item xs={1}>
                                            <Typography variant="body2">Sử dụng</Typography>
                                        </Grid>

                                        <Grid item xs={1}>
                                            <Typography variant="body2">Còn lại</Typography>
                                        </Grid>
                                        <Grid item xs={0.5}>
                                            <Checkbox onChange={(e) => changeCheckAll(e.target.checked)} />
                                        </Grid>
                                    </Grid>
                                    <Grid container style={{ overflow: 'auto', maxHeight: '60vh' }}>
                                        {lstChiTietGDV?.map((x, index) => (
                                            <Grid item xs={12} key={index}>
                                                <Grid container sx={{ backgroundColor: 'var(--color-bg)' }}>
                                                    <Grid item xs={12} padding={1}>
                                                        <Stack
                                                            spacing={2}
                                                            direction="row"
                                                            alignItems="center"
                                                            justifyContent={'center'}>
                                                            <Typography> {x?.maHoaDon}</Typography>
                                                            <Typography>
                                                                {' - '}
                                                                {format(new Date(x?.ngayLapHoaDon), 'dd/MM/yyyy')}
                                                            </Typography>
                                                        </Stack>
                                                    </Grid>
                                                </Grid>
                                                {x?.chitiets?.map((ct, index) => (
                                                    <div key={index}>
                                                        <Grid container className="grid-table grid-content">
                                                            <Grid item xs={1.5} textAlign={'center'}>
                                                                <Typography variant="body2">
                                                                    {' '}
                                                                    {ct?.maHangHoa}
                                                                </Typography>
                                                            </Grid>
                                                            <Grid item xs={4}>
                                                                <Typography variant="body2">
                                                                    {' '}
                                                                    {ct?.tenHangHoa}
                                                                </Typography>
                                                            </Grid>
                                                            <Grid item xs={1} textAlign={'center'}>
                                                                <Typography variant="body2">
                                                                    {' '}
                                                                    {ct?.soLuongMua}
                                                                </Typography>
                                                            </Grid>
                                                            <Grid item xs={1} textAlign={'center'}>
                                                                <Typography variant="body2">
                                                                    {' '}
                                                                    {new Intl.NumberFormat('vi-VN').format(
                                                                        ct?.donGiaSauCK ?? 0
                                                                    )}
                                                                </Typography>
                                                            </Grid>
                                                            <Grid item xs={2} textAlign={'center'}>
                                                                <Typography variant="body2">
                                                                    {new Intl.NumberFormat('vi-VN').format(
                                                                        ct?.thanhTienSauCK ?? 0
                                                                    )}
                                                                </Typography>
                                                            </Grid>
                                                            <Grid item xs={1} textAlign={'center'}>
                                                                <Typography variant="body2">
                                                                    {' '}
                                                                    {ct?.soLuongDung}
                                                                </Typography>
                                                            </Grid>
                                                            <Grid item xs={1} textAlign={'center'}>
                                                                <Typography variant="body2">
                                                                    {' '}
                                                                    {ct?.soLuongConLai}
                                                                </Typography>
                                                            </Grid>
                                                            <Grid item xs={0.5} textAlign={'center'}>
                                                                <Checkbox
                                                                    onChange={(e) => choseItem(e.target.checked, ct)}
                                                                    checked={arrIdChiTietChosed?.includes(
                                                                        ct?.idChiTietHoaDon
                                                                    )}
                                                                />
                                                            </Grid>
                                                        </Grid>
                                                    </div>
                                                ))}
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Grid>{' '}
                            </TabPanel>
                            <TabPanel value="2" sx={{ padding: 0 }}>
                                <TabNhatKySuDungGDV idCustomer={khachHangId ?? ''} />
                            </TabPanel>
                            <TabPanel value="3" sx={{ padding: 0 }}>
                                <PageBCNhatKySuDungTGTTGT
                                    onChangePage={handlePageChange}
                                    onChangePageSize={changePageSize}
                                    maKhachHang={cusEdit.maKhachHang}
                                    onUpdateBalance={handleUpdateBalance}
                                />{' '}
                            </TabPanel>
                            <TabPanel value="4" sx={{ padding: 0 }}>
                                <TabCuocHen khachHangId={khachHangId} />
                            </TabPanel>
                            <TabPanel value="5" sx={{ padding: 0 }}>
                                <TabMuaHang khachHangId={khachHangId} />
                            </TabPanel>
                            <TabPanel value="6" sx={{ padding: 0 }}>
                                <TabAnhLieuTrinh khachHangId={khachHangId ?? ''} />
                            </TabPanel>
                            <TabPanel value="7">
                                <Grid item lg={12} md={12} sm={12} width="100%">
                                    <Stack className="page-box-right">
                                        <TableContainer>
                                            <Table>
                                                <TableHead>
                                                    <TableRow>
                                                        {listColumnHeader.map((header) => (
                                                            <TableCell
                                                                key={header.columnId}
                                                                align={header.align || 'left'}
                                                                sx={{ whiteSpace: 'nowrap' }} // Ngăn chữ xuống dòng
                                                            >
                                                                {header.columnText}
                                                            </TableCell>
                                                        ))}
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {pageDataHoaDon.items.length > 0 ? (
                                                        pageDataHoaDon.items.map((row, index) => (
                                                            <TableRow key={index}>
                                                                <TableCell>{row.maHoaDon}</TableCell>
                                                                <TableCell>
                                                                    {format(new Date(row.ngayLapHoaDon), 'dd/MM/yyyy')}
                                                                </TableCell>
                                                                <TableCell>{row.maKhachHang}</TableCell>
                                                                <TableCell>{row.soDienThoai}</TableCell>
                                                                <TableCell>{row.tenKhachHang}</TableCell>
                                                                <TableCell align="right">
                                                                    {new Intl.NumberFormat('vi-VN').format(
                                                                        row.tongTienHang || 0
                                                                    )}
                                                                </TableCell>
                                                                <TableCell align="right">
                                                                    {new Intl.NumberFormat('vi-VN').format(
                                                                        row.tongGiamGiaHD || 0
                                                                    )}
                                                                </TableCell>
                                                                <TableCell align="right">
                                                                    {new Intl.NumberFormat('vi-VN').format(
                                                                        row.tongThanhToan || 0
                                                                    )}
                                                                </TableCell>
                                                                <TableCell align="right">
                                                                    {new Intl.NumberFormat('vi-VN').format(
                                                                        row.daThanhToan || 0
                                                                    )}
                                                                </TableCell>
                                                                <TableCell align="right">
                                                                    {new Intl.NumberFormat('vi-VN').format(
                                                                        row.conNo || 0
                                                                    )}
                                                                </TableCell>
                                                                <TableCell>{row.ghiChuHD}</TableCell>
                                                            </TableRow>
                                                        ))
                                                    ) : (
                                                        <TableRow>
                                                            <TableCell colSpan={listColumnHeader.length} align="center">
                                                                Không có dữ liệu
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                                {pageDataHoaDon.totalCount > 0 && (
                                                    <TableFooter>
                                                        {(() => {
                                                            const totals = pageDataHoaDon.items.reduce(
                                                                (acc, curr) => {
                                                                    acc.tongTienHang += curr.tongTienHang || 0;
                                                                    acc.tongGiamGiaHD += curr.tongGiamGiaHD || 0;
                                                                    acc.tongThanhToan += curr.tongThanhToan || 0;
                                                                    acc.daThanhToan += curr.daThanhToan || 0;
                                                                    acc.conNo += curr.conNo || 0;
                                                                    return acc;
                                                                },
                                                                {
                                                                    tongTienHang: 0,
                                                                    tongGiamGiaHD: 0,
                                                                    tongThanhToan: 0,
                                                                    daThanhToan: 0,
                                                                    conNo: 0
                                                                }
                                                            );

                                                            return (
                                                                <TableRow>
                                                                    <TableCell
                                                                        colSpan={5}
                                                                        align="right"
                                                                        style={{ fontWeight: 'bold' }}>
                                                                        Tổng:
                                                                    </TableCell>
                                                                    <TableCell align="right">
                                                                        {new Intl.NumberFormat('vi-VN').format(
                                                                            totals.tongTienHang
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell align="right">
                                                                        {new Intl.NumberFormat('vi-VN').format(
                                                                            totals.tongGiamGiaHD
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell align="right">
                                                                        {new Intl.NumberFormat('vi-VN').format(
                                                                            totals.tongThanhToan
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell align="right">
                                                                        {new Intl.NumberFormat('vi-VN').format(
                                                                            totals.daThanhToan
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell align="right">
                                                                        {new Intl.NumberFormat('vi-VN').format(
                                                                            totals.conNo
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell align="right"></TableCell>
                                                                </TableRow>
                                                            );
                                                        })()}
                                                    </TableFooter>
                                                )}
                                            </Table>
                                        </TableContainer>
                                    </Stack>
                                </Grid>
                            </TabPanel>
                        </TabContext>
                    </Stack>
                </Grid>
            </Grid>
        </>
    );
};
export default CustomerInfor2;
