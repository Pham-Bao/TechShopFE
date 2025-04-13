import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Tab,
    Tabs,
    Stack,
    Checkbox,
    FormControlLabel,
    Grid,
    Radio,
    RadioGroup,
    TextField,
    Typography,
    debounce,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    TableFooter
} from '@mui/material';
import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import { useEffect, useRef, useState, useContext } from 'react';
import TabPanel from '../../components/TabPanel/TabPanel';
import { IPropModal } from '../../services/dto/IPropsComponent';
import HoaDonService from '../../services/ban_hang/HoaDonService';
import { RdoTrangThaiFilter } from '../../enum/TrangThaiFilter';
import ParamSearchChiTietSuDungGDVDto from '../../services/ban_hang/ParamSearchChiTietSuDungGDVDto';
import ChiTietSuDungGDVDto, { GroupChiTietSuDungGDVDto } from '../../services/ban_hang/ChiTietSuDungGDVDto';
import { format } from 'date-fns';
import SnackbarAlert from '../../components/AlertDialog/SnackbarAlert';
import DialogButtonClose from '../../components/Dialog/ButtonClose';
import utils from '../../utils/utils';
import TabNhatKySuDungGDV from './tab_nhat_ky_su_dung_gdv';
import { IHeaderTable, MyHeaderTable } from '../../components/Table/MyHeaderTable';
import { PagedResultDto } from '../../services/dto/pagedResultDto';
import PageHoaDonDto from '../../services/ban_hang/PageHoaDonDto';
import { HoaDonRequestDto } from '../../services/dto/ParamSearchDto';
import AppConsts, { DateType, LoaiChungTu } from '../../lib/appconst';
import { TrangThaiHoaDon } from '../../services/ban_hang/HoaDonConst';
import { AppContext } from '../../services/chi_nhanh/ChiNhanhContext';
import PageBCNhatKySuDungTGTTGT from '../bao_cao/the_gia_tri/nhat_ky_su_dung';

enum TabMain {
    GOI_DICH_VU = 1,
    NHAT_KY_SU_DUNG_GOI_DICH_VU = 2,
    THE_GIA_TRI = 3,
    NHAT_KY_SU_DUNG_THE_GIA_TRI = 4
}

export default function ModalSuDungGDV({
    isShowModal,
    idUpdate,
    maKhachHang,
    onClose,
    onOK
}: IPropModal<ChiTietSuDungGDVDto[]>) {
    const firstLoad = useRef(true);
    const [tabActive, settabActive] = useState(TabMain.NHAT_KY_SU_DUNG_THE_GIA_TRI);
    const [lstChiTietGDV, setLstChiTietGDV] = useState<GroupChiTietSuDungGDVDto[]>();
    const [ctChosed, setCTChosed] = useState<ChiTietSuDungGDVDto[]>([]);
    const [objAlert, setObjAlert] = useState({ show: false, type: 1, mes: '' });
    const [paramSearch, setParamSearch] = useState<ParamSearchChiTietSuDungGDVDto>({
        idCustomer: '',
        idChiNhanhs: [],
        trangThais: [RdoTrangThaiFilter.CO]
    });
    const arrTrangThai = [
        { text: 'Tất cả', value: RdoTrangThaiFilter.TAT_CA },
        { text: 'Còn buổi', value: RdoTrangThaiFilter.CO },
        { text: 'Hết buổi', value: RdoTrangThaiFilter.KHONG }
    ];

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

        const data = await HoaDonService.GetListHoaDon(param);
        if (data?.items?.length > 0) {
            const filteredItems = data.items.filter((item) => item.maKhachHang == maKhachHang);

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

    const GetChiTiet_SuDungGDV_ofCustomer = async (txtSearch: string | null) => {
        const param = { ...paramSearch };
        param.idCustomer = idUpdate ?? '';
        param.textSearch = txtSearch ?? '';

        const data = await HoaDonService.GetChiTiet_SuDungGDV_ofCustomer(param);
        setLstChiTietGDV([...data]);
    };

    const debounSearch = useRef(
        debounce(async (txtSearch: string) => {
            GetChiTiet_SuDungGDV_ofCustomer(txtSearch);
        }, 500)
    ).current;

    useEffect(() => {
        setCTChosed([]);
        GetListTheGiaTri();
        setParamSearch({ ...paramSearch, textSearch: '', trangThais: [RdoTrangThaiFilter.CO] });
    }, [isShowModal]);

    useEffect(() => {
        if (firstLoad.current) {
            firstLoad.current = false;
            return;
        }
        if (isShowModal) {
            debounSearch(paramSearch?.textSearch ?? '');
        }
    }, [paramSearch?.textSearch]);

    useEffect(() => {
        if (isShowModal) {
            GetChiTiet_SuDungGDV_ofCustomer(paramSearch?.textSearch ?? '');
        }
    }, [paramSearch?.trangThais]);

    const arrIdChiTietChosed = ctChosed?.map((x) => {
        return x?.idChiTietHoaDon;
    });

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

    const onAgree = () => {
        if (ctChosed) {
            if (ctChosed?.length === 0) {
                setObjAlert({
                    ...objAlert,
                    show: true,
                    type: 2,
                    mes: `Vui lòng chọn dịch vụ để sử dụng`
                });
                return;
            }
            let tenDV = '';
            for (let index = 0; index < ctChosed?.length; index++) {
                const element = ctChosed[index];
                if (element?.soLuongConLai === 0) {
                    tenDV += ` ${element?.tenHangHoa} ,`;
                }
            }
            if (!utils.checkNull(tenDV)) {
                setObjAlert({
                    ...objAlert,
                    show: true,
                    type: 2,
                    mes: `Dịch vụ ${utils.Remove_LastComma(tenDV)} đã dùng hết số buổi`
                });
                return;
            }
            onOK(1, ctChosed);
        }
    };
    const handlePageChange = async (currentPage: number) => {
        setParamSearch({
            ...paramSearch,
            currentPage: currentPage,
            textSearch: maKhachHang
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

    return (
        <>
            <SnackbarAlert
                showAlert={objAlert.show}
                type={objAlert.type}
                title={objAlert.mes}
                handleClose={() => setObjAlert({ show: false, mes: '', type: 1 })}
            />
            <Dialog open={isShowModal} fullWidth maxWidth="lg" onClose={onClose} sx={{}}>
                {' '}
                <DialogTitle className="modal-title">Sử dụng gói dịch vụ</DialogTitle>
                <Typography
                    variant="subtitle1"
                    className="modal-subtitle"
                    sx={{ marginLeft: 3, textAlign: 'left', color: 'darkgray' }}>
                    Số dư thẻ giá trị: {new Intl.NumberFormat('vi-VN').format(balance)} đ
                </Typography>
                <DialogButtonClose onClose={onClose} />
                <DialogContent>
                    <Tabs value={tabActive} onChange={(event, newVal) => settabActive(newVal)}>
                        <Tab label="Gói dịch vụ" value={TabMain.GOI_DICH_VU} />
                        <Tab label="Nhật ký sử gói dịch vụ" value={TabMain.NHAT_KY_SU_DUNG_GOI_DICH_VU} />
                        <Tab label="Thẻ giá trị" value={TabMain.THE_GIA_TRI} />
                        <Tab label="Nhật ký thẻ giá trị" value={TabMain.NHAT_KY_SU_DUNG_THE_GIA_TRI} />
                    </Tabs>
                    <TabPanel value={tabActive} index={TabMain.GOI_DICH_VU}>
                        <Grid container>
                            <Grid item xs={12}>
                                <RadioGroup
                                    row
                                    value={paramSearch?.trangThais?.[0]}
                                    onChange={(e) =>
                                        setParamSearch({ ...paramSearch, trangThais: [parseInt(e.target.value)] })
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
                                    onChange={(e) => setParamSearch({ ...paramSearch, textSearch: e.target.value })}
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
                                                        <Typography variant="body2"> {ct?.maHangHoa}</Typography>
                                                    </Grid>
                                                    <Grid item xs={4}>
                                                        <Typography variant="body2"> {ct?.tenHangHoa}</Typography>
                                                    </Grid>
                                                    <Grid item xs={1} textAlign={'center'}>
                                                        <Typography variant="body2"> {ct?.soLuongMua}</Typography>
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
                                                        <Typography variant="body2"> {ct?.soLuongDung}</Typography>
                                                    </Grid>
                                                    <Grid item xs={1} textAlign={'center'}>
                                                        <Typography variant="body2"> {ct?.soLuongConLai}</Typography>
                                                    </Grid>
                                                    <Grid item xs={0.5} textAlign={'center'}>
                                                        <Checkbox
                                                            onChange={(e) => choseItem(e.target.checked, ct)}
                                                            checked={arrIdChiTietChosed?.includes(ct?.idChiTietHoaDon)}
                                                        />
                                                    </Grid>
                                                </Grid>
                                            </div>
                                        ))}
                                    </Grid>
                                ))}
                            </Grid>
                        </Grid>
                    </TabPanel>
                    <TabPanel value={tabActive} index={TabMain.NHAT_KY_SU_DUNG_GOI_DICH_VU}>
                        <TabNhatKySuDungGDV idCustomer={idUpdate ?? ''} />
                    </TabPanel>
                    <TabPanel value={tabActive} index={TabMain.THE_GIA_TRI}>
                        <Grid item lg={12} md={12} sm={12} paddingTop={3} width="100%">
                            <Stack className="page-box-right">
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                {listColumnHeader.map((header) => (
                                                    <TableCell key={header.columnId} align={header.align || 'left'}>
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
                                                            {new Intl.NumberFormat('vi-VN').format(row.conNo || 0)}
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
                                                                {new Intl.NumberFormat('vi-VN').format(totals.conNo)}
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

                    <TabPanel value={tabActive} index={TabMain.NHAT_KY_SU_DUNG_THE_GIA_TRI}>
                        <PageBCNhatKySuDungTGTTGT
                            onChangePage={handlePageChange}
                            onChangePageSize={changePageSize}
                            maKhachHang={maKhachHang}
                            onUpdateBalance={handleUpdateBalance}
                        />
                    </TabPanel>
                </DialogContent>
                <DialogActions>
                    <Button variant="outlined" color="error" startIcon={<BlockOutlinedIcon />} onClick={onClose}>
                        Hủy bỏ
                    </Button>
                    <Button variant="outlined" startIcon={<CheckOutlinedIcon />} onClick={onAgree}>
                        Xác nhận
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
