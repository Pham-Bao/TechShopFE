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
import { FormControlLabel, Grid, Radio, RadioGroup, SelectChangeEvent, Stack, Typography } from '@mui/material';
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

    return (
        <div style={{ height: 'auto' }}>
            <ModalAllLichHenDoard
                isShowModal={showAllLichHen}
                objUpDate={paramSearchLichHen}
                onClose={() => setShowAllLichHen(false)}
                onOK={() => setShowAllLichHen(false)}
            />
            <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                sx={{ paddingTop: '16px', paddingBottom: '16px' }}>
                <Typography fontSize={18} fontWeight={600}>
                    Trang chủ
                </Typography>
                <Stack
                    direction={'row'}
                    spacing={1}
                    sx={{ padding: '8px 12px', background: 'wheat', borderRadius: '4px' }}>
                    {suggestStore?.suggestChiNhanh_byUserLogin?.length > 1 && (
                        <Stack
                            direction={'row'}
                            alignItems={'center'}
                            spacing={1.5}
                            // display={{ xs: 'none', lg: 'flex', md: 'flex' }}
                        >
                            <Stack>
                                <Stack direction={'row'} spacing={0.5} onClick={toggleChiNhanh}>
                                    <Typography variant="body1">{lblChiNhanh}</Typography>
                                    <ExpandMoreIcon />
                                </Stack>

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
                            </Stack>
                        </Stack>
                    )}

                    <Stack>
                        <Stack
                            direction={'row'}
                            spacing={0.5}
                            onClick={(event) => setAnchorDateEl(event.currentTarget)}>
                            <Typography variant="body1">{lblDateTypeFilter}</Typography>
                            <ExpandMoreIcon />
                        </Stack>

                        <DateFilterCustom
                            id="popover-date-filter"
                            dateTypeDefault={paramSearch.dateType}
                            open={openDateFilter}
                            anchorEl={anchorDateEl}
                            onClose={() => setAnchorDateEl(null)}
                            onApplyDate={onApplyFilterDate}
                        />
                    </Stack>
                </Stack>
            </Box>
            <div style={{ gap: '16px' }}>
                <OverView />
                <Box paddingTop={'16px'}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={12} md={6} lg={6} xl={6} sx={{ height: '100%' }}>
                            <Stack padding={1} bgcolor={'#FFF'} borderRadius={'4px'}>
                                <Stack
                                    padding={2}
                                    borderBottom={'1px solid #EEF0F4'}
                                    borderRadius={'4px'}
                                    direction={'row'}
                                    justifyContent={'space-between'}>
                                    <Stack direction={'row'} spacing={1}>
                                        <Typography
                                            sx={{
                                                fontSize: '18px',
                                                fontWeight: '600'
                                            }}>
                                            Danh sách cuộc hẹn
                                        </Typography>
                                        <Typography component={'span'} variant="body2">
                                            ({dashboardStore?.countLichHen})
                                        </Typography>
                                        {dashboardStore?.countLichHen > 3 && (
                                            <ArrowOutwardIcon
                                                titleAccess="Xem tất cả"
                                                color="info"
                                                onClick={() => setShowAllLichHen(true)}
                                            />
                                        )}
                                    </Stack>

                                    <Stack>
                                        <Stack
                                            direction={'row'}
                                            spacing={0.5}
                                            onClick={(event) => setAnchorDateLichHen(event.currentTarget)}>
                                            <Typography variant="body1">{lblDateTypeFilterLichHen}</Typography>
                                            <ExpandMoreIcon />
                                        </Stack>

                                        <DateFilterCustom
                                            id="popover-date-filter"
                                            dateTypeDefault={paramSearchLichHen.dateType}
                                            open={openDateFilterLichHen}
                                            anchorEl={anchorDateLichHen}
                                            onClose={() => setAnchorDateLichHen(null)}
                                            onApplyDate={onApplyFilterDateLichHen}
                                        />
                                    </Stack>
                                </Stack>

                                <Box bgcolor={'#FFF'} padding={'8px 24px 16px 0px'} sx={{ height: '300px' }}>
                                    <AppoimentsNew />
                                </Box>
                            </Stack>
                        </Grid>
                        <Grid item xs={12} sm={12} md={6} lg={6} xl={6}>
                            <Box
                                style={{
                                    background: '#FFF',
                                    padding: '16px 24px',
                                    borderRadius: '4px'
                                }}>
                                <Typography
                                    sx={{
                                        fontSize: '18px',
                                        fontWeight: '600'
                                    }}>
                                    Tổng số cuộc hẹn hàng tuần
                                </Typography>
                                <Stack>
                                    <LineChartNew />
                                </Stack>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
                <Box marginTop={'16px'}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={12} md={9} lg={12} xl={12} borderRadius={'8px'}>
                            <Box bgcolor={'#FFF'} padding={'8px 24px'} borderRadius={'8px'}>
                                <Typography
                                    sx={{
                                        fontSize: '18px',
                                        fontWeight: '600'
                                    }}>
                                    Doanh thu
                                </Typography>
                            </Box>
                            <Grid
                                container
                                display={'flex'}
                                justifyContent={'space-between'}
                                bgcolor={'#FFF'}
                                padding={'8px 24px'}>
                                <Grid item xs={12} sm={6}>
                                    <Box width={'100%'} borderRadius={'8px'}>
                                        <Typography
                                            sx={{
                                                color: '#3D475C',
                                                fontSize: '24px',
                                                fontWeight: '700'
                                            }}>
                                            {new Intl.NumberFormat('vi-VN').format(sumTongTien)}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item>
                                    <Box display={'flex'} justifyContent={'end'} width={'100%'}>
                                        <Box
                                            display={'flex'}
                                            justifyContent={'space-between'}
                                            alignItems={'center'}
                                            marginRight={'24px'}>
                                            <Box
                                                sx={{
                                                    borderRadius: '50%',
                                                    width: '12px',
                                                    height: '12px',
                                                    bgcolor: 'var(--color-main)'
                                                }}></Box>
                                            <Typography
                                                sx={{
                                                    marginLeft: '8px',
                                                    fontSize: '12px',
                                                    fontWeight: '400'
                                                }}>
                                                Năm này
                                            </Typography>
                                        </Box>

                                        <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'}>
                                            <Box
                                                sx={{
                                                    borderRadius: '50%',
                                                    width: '12px',
                                                    height: '12px',
                                                    bgcolor: '#ff9900'
                                                }}></Box>
                                            <Typography
                                                sx={{
                                                    marginLeft: '8px',
                                                    fontSize: '12px',
                                                    fontWeight: '400'
                                                }}>
                                                Năm trước
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                            </Grid>

                            <Box bgcolor={'#FFF'} padding={'8px 24px'} borderRadius={'8px'}>
                                <ColumnChartNew />
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
                            <Stack
                                width={'100%'}
                                bgcolor={'#FFF'}
                                padding={'16px 24px'}
                                paddingRight={0}
                                borderRadius={'4px'}>
                                <Stack direction={'row'} justifyContent={'space-between'} alignItems={'center'}>
                                    <Typography
                                        sx={{
                                            fontSize: '18px',
                                            fontWeight: '600'
                                        }}>
                                        Top 5 dịch vụ hot
                                    </Typography>
                                    <Stack direction={'row'} spacing={2} alignItems={'center'}>
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
                                        <Stack
                                            direction={'row'}
                                            spacing={0.5}
                                            onClick={(event) => setAnchorDateTopService(event.currentTarget)}>
                                            <Typography variant="body1">{lblDateTypeFilterTopService}</Typography>
                                            <ExpandMoreIcon />
                                        </Stack>

                                        <DateFilterCustom
                                            id="popover-date-filter"
                                            dateTypeDefault={paramSearchTopService.dateType}
                                            open={openDateFilterTopService}
                                            anchorEl={anchorDateTopService}
                                            onClose={() => setAnchorDateTopService(null)}
                                            onApplyDate={onApplyFilterDateTopService}
                                        />
                                    </Stack>
                                </Stack>
                                <Stack paddingTop={2}>
                                    <HotServicesNew />
                                </Stack>
                            </Stack>
                        </Grid>
                    </Grid>
                </Box>
            </div>
        </div>
    );
};

export default observer(Dashboard);
