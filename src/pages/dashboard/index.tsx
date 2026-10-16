import React, { useContext, useEffect, useState } from 'react';
import './dashboardNew.css';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import AppoimentsNew from './components/Appointment/AppointmentsNew';
import LineChartNew from './components/Charts/LineChartNew';
import ColumnChartNew from './components/Charts/ColumnChartNew';
import HotServicesNew from './components/Statistical/HotServicesNew';
import Box from '@mui/material/Box';
import OverView from './components/OverView/ovver-view';
import { Button, FormControlLabel, Grid, Radio, RadioGroup, SelectChangeEvent, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import abpCustom from '../../components/abp-custom';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import PointOfSaleOutlinedIcon from '@mui/icons-material/PointOfSaleOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import PhoneIphoneOutlinedIcon from '@mui/icons-material/PhoneIphoneOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import dashboardStore from '../../stores/dashboardStore';
import Cookies from 'js-cookie';
import { observer } from 'mobx-react';
import { AppContext } from '../../services/chi_nhanh/ChiNhanhContext';
import MenuWithDataHasSearch from '../../components/Menu/MenuWithData_HasSearch';
import { IList } from '../../services/dto/IList';
import suggestStore from '../../stores/suggestStore';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import DateFilterCustom from '../../components/DatetimePicker/DateFilterCustom';
import { RequestFromToDto } from '../../services/dto/ParamSearchDto';
import { DateType } from '../../lib/appconst';
import ModalAllLichHenDoard from './components/Appointment/modal_all_lichhen';

enum TopService_LoaiBaoCao {
    DOANH_THU = 0,
    SO_LUONG = 1
}
const Dashboard: React.FC = () => {
    const toDay = new Date();
    const navigate = useNavigate();
    const [dashboardDateView, setDashboardDateView] = useState('day');
    const appContext = useContext(AppContext);
    const chinhanh = appContext.chinhanhCurrent;

    const [showAllLichHen, setShowAllLichHen] = useState(false);
    const [lblChiNhanh, setLblChiNhanh] = useState(chinhanh?.tenChiNhanh);
    const [lblDateTypeFilter, setLblDateTypeFilter] = useState('Hôm nay');
    const [lblDateTypeFilterLichHen, setLblDateTypeFilterLichHen] = useState('Hôm nay');
    const [lblDateTypeFilterTopService, setLblDateTypeFilterTopService] = useState('Tháng này');

    const [anchorChiNhanh, setAnchorChiNhanh] = React.useState<null | HTMLElement>(null);
    const expandDropdownChiNhanh = Boolean(anchorChiNhanh);

    const [anchorDateEl, setAnchorDateEl] = useState<HTMLSpanElement | null>(null);
    const openDateFilter = Boolean(anchorDateEl);

    const [anchorDateLichHen, setAnchorDateLichHen] = useState<HTMLSpanElement | null>(null);
    const openDateFilterLichHen = Boolean(anchorDateLichHen);

    const [anchorDateTopService, setAnchorDateTopService] = useState<HTMLSpanElement | null>(null);
    const openDateFilterTopService = Boolean(anchorDateTopService);

    const [paramSearch, setParamSearch] = useState<RequestFromToDto>({
        dateType: DateType.HOM_NAY,
        fromDate: format(toDay, 'yyyy-MM-dd'),
        toDate: format(toDay, 'yyyy-MM-dd'),
        idChiNhanhs: [Cookies.get('IdChiNhanh') ?? '']
    });
    const [paramSearchLichHen, setParamSearchLichHen] = useState<RequestFromToDto>({
        dateType: DateType.HOM_NAY,
        fromDate: format(toDay, 'yyyy-MM-dd'),
        toDate: format(toDay, 'yyyy-MM-dd'),
        idChiNhanhs: [Cookies.get('IdChiNhanh') ?? ''],
        currentPage: 1,
        pageSize: 5
    });
    const [paramSearchTopService, setParamSearchTopService] = useState<RequestFromToDto>({
        dateType: DateType.THANG_NAY,
        fromDate: format(startOfMonth(toDay), 'yyyy-MM-dd'),
        toDate: format(endOfMonth(toDay), 'yyyy-MM-dd'),
        idChiNhanhs: [Cookies.get('IdChiNhanh') ?? ''],
        trangThais: [TopService_LoaiBaoCao.DOANH_THU]
    });

    useEffect(() => {
        getData(); // This will be called when chinhanh.id changes
    }, [chinhanh.id]);

    const getData = async () => {
        await dashboardStore.getThongKeSoLuong(paramSearch);
        await dashboardStore.getDanhSachLichHen(paramSearchLichHen);
        await dashboardStore.getThongKeHotService(paramSearchTopService);
        await dashboardStore.getThongKeDoanhThu(paramSearch);
        await dashboardStore.getThongKeLichHen(paramSearch);
    };
    const sumTongTien = dashboardStore.thongKeDoanhThu?.reduce((sum, item) => sum + item.thangNay, 0);
    const handleChangeDateType = async (event: SelectChangeEvent<string>) => {
        const newValue = event.target.value as string;
        setDashboardDateView(newValue);
        await dashboardStore.onChangeDateType(event.target.value as string);
        if (newValue === 'week') {
            Cookies.set('dashBoardDateType', 'week');
        } else if (newValue === 'day') {
            Cookies.set('dashBoardDateType', 'day');
        } else if (newValue === 'month') {
            Cookies.set('dashBoardDateType', 'month');
        } else if (newValue === 'year') {
            Cookies.set('dashBoardDateType', 'year');
        }
    };

    const toggleChiNhanh = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorChiNhanh(event.currentTarget);
    };

    const choseChiNhanh = async (arrIdChosed: string[]) => {
        setParamSearch({ ...paramSearch, idChiNhanhs: arrIdChosed });

        if (arrIdChosed?.length > 0) {
            setLblChiNhanh(`Chi nhánh (${arrIdChosed?.length})`);
        }

        const param = {
            ...paramSearch,
            idChiNhanhs: arrIdChosed
        };
        await dashboardStore.getThongKeSoLuong(param);
    };

    const onApplyFilterDate = async (from: string, to: string, dateType: string, dateTypeText: string) => {
        setAnchorDateEl(null);
        setLblDateTypeFilter(dateTypeText);
        setParamSearch({ ...paramSearch, fromDate: from, toDate: to, currentPage: 1 });

        const param = {
            ...paramSearch,
            fromDate: from,
            toDate: to
        };
        await dashboardStore.getThongKeSoLuong(param);
    };
    const onApplyFilterDateLichHen = async (from: string, to: string, dateType: string, dateTypeText: string) => {
        setAnchorDateLichHen(null);
        setLblDateTypeFilterLichHen(dateTypeText);
        setParamSearchLichHen({ ...paramSearchLichHen, fromDate: from, toDate: to, currentPage: 1, pageSize: 3 });

        const param = {
            ...paramSearchLichHen,
            fromDate: from,
            toDate: to,
            currentPage: 1,
            pageSize: 3
        };
        await dashboardStore.getDanhSachLichHen(param);
    };
    const onApplyFilterDateTopService = async (from: string, to: string, dateType: string, dateTypeText: string) => {
        setAnchorDateTopService(null);
        setLblDateTypeFilterTopService(dateTypeText);
        setParamSearchTopService({ ...paramSearchTopService, fromDate: from, toDate: to, currentPage: 1, pageSize: 3 });

        const param = {
            ...paramSearchTopService,
            fromDate: from,
            toDate: to
        };
        await dashboardStore.getThongKeHotService(param);
    };

    const TopService_ChangeLoaiBaoCao = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = parseInt(e.target.value);
        setParamSearchTopService({
            ...paramSearchTopService,
            trangThais: [newVal]
        });

        const param = {
            ...paramSearchTopService,
            trangThais: [newVal]
        };
        await dashboardStore.getThongKeHotService(param);
    };

    // Lối tắt tới các chức năng có sẵn (chỉ hiện khi có quyền)
    const quickActions = [
        { label: 'Thu ngân', icon: <PointOfSaleOutlinedIcon />, path: '/ban-hang', permission: 'Pages.HoaDon.Create' },
        {
            label: 'Hóa đơn',
            icon: <ReceiptLongOutlinedIcon />,
            path: '/giao-dich-thanh-toan',
            permission: 'Pages.HoaDon'
        },
        { label: 'Khách hàng', icon: <PeopleAltOutlinedIcon />, path: '/khach-hangs', permission: 'Pages.KhachHang' },
        { label: 'Điện thoại', icon: <PhoneIphoneOutlinedIcon />, path: '/dien-thoai', permission: 'Pages.DM_HangHoa' },
        { label: 'Nhập hàng', icon: <Inventory2OutlinedIcon />, path: '/nhap-hangs', permission: 'Pages.DM_HangHoa' },
        { label: 'Sổ quỹ', icon: <AccountBalanceWalletOutlinedIcon />, path: '/so-quy', permission: 'Pages.QuyHoaDon' }
    ].filter((x) => abpCustom.isGrandPermission(x.permission));

    const txtToday = toDay.toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    return (
        <div className="ts-dash">
            <ModalAllLichHenDoard
                isShowModal={showAllLichHen}
                objUpDate={paramSearchLichHen}
                onClose={() => setShowAllLichHen(false)}
                onOK={() => setShowAllLichHen(false)}
            />

            {/* Tiêu đề + bộ lọc chi nhánh / thời gian */}
            <div className="ts-dash__header">
                <div>
                    <Typography className="ts-dash__title">Tổng quan</Typography>
                    <Typography className="ts-dash__subtitle">Xin chào! Hôm nay là {txtToday}</Typography>
                </div>
                <Stack direction={'row'} spacing={1} className="ts-dash__filters">
                    {suggestStore?.suggestChiNhanh_byUserLogin?.length > 1 && (
                        <>
                            <Button
                                variant="outlined"
                                color="inherit"
                                className="ts-dash__filter-btn"
                                startIcon={<StorefrontOutlinedIcon fontSize="small" />}
                                endIcon={<ExpandMoreIcon />}
                                onClick={toggleChiNhanh}>
                                {lblChiNhanh}
                            </Button>
                            <MenuWithDataHasSearch
                                open={expandDropdownChiNhanh}
                                hasCheckBox={true}
                                lstData={suggestStore?.suggestChiNhanh_byUserLogin?.map((x) => {
                                    return {
                                        id: x.id,
                                        text: x.tenChiNhanh
                                    } as IList;
                                })}
                                anchorEl={anchorChiNhanh}
                                handleClose={() => setAnchorChiNhanh(null)}
                                choseMultipleItem={choseChiNhanh}
                            />
                        </>
                    )}
                    <Button
                        variant="outlined"
                        color="inherit"
                        className="ts-dash__filter-btn"
                        startIcon={<CalendarTodayOutlinedIcon fontSize="small" />}
                        endIcon={<ExpandMoreIcon />}
                        onClick={(event) => setAnchorDateEl(event.currentTarget)}>
                        {lblDateTypeFilter}
                    </Button>
                    <DateFilterCustom
                        id="popover-date-filter"
                        dateTypeDefault={paramSearch.dateType}
                        open={openDateFilter}
                        anchorEl={anchorDateEl}
                        onClose={() => setAnchorDateEl(null)}
                        onApplyDate={onApplyFilterDate}
                    />
                </Stack>
            </div>

            {/* Thẻ số liệu */}
            <OverView />

            {/* Thao tác nhanh */}
            {quickActions.length > 0 && (
                <div className="ts-card ts-dash__quick">
                    <div className="ts-card__header">
                        <Typography className="ts-card__title">Thao tác nhanh</Typography>
                    </div>
                    <div className="ts-dash__quick-grid">
                        {quickActions.map((x) => (
                            <button
                                key={x.path}
                                type="button"
                                className="ts-dash__quick-item"
                                onClick={() => navigate(x.path)}>
                                <span className="ts-dash__quick-icon">{x.icon}</span>
                                <span className="ts-dash__quick-label">{x.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <Grid container spacing={2}>
                {/* Doanh thu */}
                <Grid item xs={12} lg={8}>
                    <div className="ts-card">
                        <div className="ts-card__header">
                            <div>
                                <Typography className="ts-card__title">Doanh thu</Typography>
                                <Typography className="ts-dash__revenue">
                                    {new Intl.NumberFormat('vi-VN').format(sumTongTien)}
                                </Typography>
                            </div>
                            <Stack direction={'row'} spacing={2} alignItems={'center'}>
                                <span className="ts-dash__legend">
                                    <i style={{ background: 'var(--color-main)' }} /> Năm này
                                </span>
                                <span className="ts-dash__legend">
                                    <i style={{ background: '#93C5FD' }} /> Năm trước
                                </span>
                            </Stack>
                        </div>
                        <div className="ts-card__body">
                            <ColumnChartNew />
                        </div>
                    </div>
                </Grid>

                {/* Danh sách cuộc hẹn */}
                <Grid item xs={12} lg={4}>
                    <div className="ts-card ts-card--fill">
                        <div className="ts-card__header">
                            <Stack direction={'row'} spacing={1} alignItems={'center'}>
                                <Typography className="ts-card__title">Danh sách cuộc hẹn</Typography>
                                <span className="ts-badge">{dashboardStore?.countLichHen}</span>
                            </Stack>
                            <Stack direction={'row'} spacing={0.5} alignItems={'center'}>
                                {dashboardStore?.countLichHen > 3 && (
                                    <Button
                                        size="small"
                                        color="secondary"
                                        endIcon={<ArrowOutwardIcon fontSize="small" />}
                                        onClick={() => setShowAllLichHen(true)}>
                                        Xem tất cả
                                    </Button>
                                )}
                                <Button
                                    size="small"
                                    color="inherit"
                                    className="ts-dash__filter-btn ts-dash__filter-btn--sm"
                                    endIcon={<ExpandMoreIcon />}
                                    onClick={(event) => setAnchorDateLichHen(event.currentTarget)}>
                                    {lblDateTypeFilterLichHen}
                                </Button>
                                <DateFilterCustom
                                    id="popover-date-filter"
                                    dateTypeDefault={paramSearchLichHen.dateType}
                                    open={openDateFilterLichHen}
                                    anchorEl={anchorDateLichHen}
                                    onClose={() => setAnchorDateLichHen(null)}
                                    onApplyDate={onApplyFilterDateLichHen}
                                />
                            </Stack>
                        </div>
                        <Box className="ts-card__body" sx={{ height: '300px' }}>
                            <AppoimentsNew />
                        </Box>
                    </div>
                </Grid>

                {/* Cuộc hẹn hàng tuần */}
                <Grid item xs={12} md={6}>
                    <div className="ts-card ts-card--fill">
                        <div className="ts-card__header">
                            <Typography className="ts-card__title">Tổng số cuộc hẹn hàng tuần</Typography>
                        </div>
                        <div className="ts-card__body">
                            <LineChartNew />
                        </div>
                    </div>
                </Grid>

                {/* Top dịch vụ */}
                <Grid item xs={12} md={6}>
                    <div className="ts-card ts-card--fill">
                        <div className="ts-card__header ts-card__header--wrap">
                            <Typography className="ts-card__title">Top 5 dịch vụ hot</Typography>
                            <Stack direction={'row'} spacing={1} alignItems={'center'}>
                                <RadioGroup
                                    row
                                    value={paramSearchTopService?.trangThais?.[0]}
                                    onChange={TopService_ChangeLoaiBaoCao}>
                                    <FormControlLabel
                                        value={TopService_LoaiBaoCao.DOANH_THU}
                                        label="Doanh thu"
                                        control={<Radio size="small" />}
                                    />
                                    <FormControlLabel
                                        value={TopService_LoaiBaoCao.SO_LUONG}
                                        label="Số lượng"
                                        control={<Radio size="small" />}
                                    />
                                </RadioGroup>
                                <Button
                                    size="small"
                                    color="inherit"
                                    className="ts-dash__filter-btn ts-dash__filter-btn--sm"
                                    endIcon={<ExpandMoreIcon />}
                                    onClick={(event) => setAnchorDateTopService(event.currentTarget)}>
                                    {lblDateTypeFilterTopService}
                                </Button>
                                <DateFilterCustom
                                    id="popover-date-filter"
                                    dateTypeDefault={paramSearchTopService.dateType}
                                    open={openDateFilterTopService}
                                    anchorEl={anchorDateTopService}
                                    onClose={() => setAnchorDateTopService(null)}
                                    onApplyDate={onApplyFilterDateTopService}
                                />
                            </Stack>
                        </div>
                        <div className="ts-card__body">
                            <HotServicesNew />
                        </div>
                    </div>
                </Grid>
            </Grid>
        </div>
    );
};

export default observer(Dashboard);
