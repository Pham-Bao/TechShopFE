import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import PhoneIphoneOutlinedIcon from '@mui/icons-material/PhoneIphoneOutlined';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import { Grid, Stack, Typography } from '@mui/material';
import './overViewNew.css';
import dashboardStore from '../../../../stores/dashboardStore';
import { observer } from 'mobx-react';
const OverView = () => {
    const tongLichHen = dashboardStore.thongKeSoLuong?.tongLichHen ?? 0;
    const tq = dashboardStore.thongKeTongQuan ?? {
        tongThu: 0,
        tongChi: 0,
        thuTruChi: 0,
        soMayDangBan: 0,
        soMayDaBan: 0,
        soMayDangSua: 0,
        soMayDaSua: 0
    };

    // Thẻ số liệu: nền trắng viền mảnh, icon trong ô vuông màu nhạt
    // hàng 1: tiền theo sổ quỹ (phiếu thu / chi) + cuộc hẹn; hàng 2: điện thoại
    const arr = [
        {
            text: 'Doanh thu (tổng thu)',
            icon: <ReceiptIcon />,
            value: tq.tongThu,
            color: '#2563EB',
            backgroundColor: '#EFF6FF'
        },
        {
            text: 'Tổng chi',
            icon: <AccountBalanceWalletOutlinedIcon />,
            value: tq.tongChi,
            color: '#DC2626',
            backgroundColor: '#FEF2F2'
        },
        {
            text: 'Thu - Chi',
            icon: <AttachMoneyIcon />,
            value: tq.thuTruChi,
            color: tq.thuTruChi < 0 ? '#DC2626' : '#059669',
            backgroundColor: tq.thuTruChi < 0 ? '#FEF2F2' : '#ECFDF5'
        },
        {
            text: 'Tổng cuộc hẹn',
            icon: <CalendarMonthOutlinedIcon />,
            value: tongLichHen,
            color: '#111827',
            backgroundColor: '#F3F4F6'
        },
        {
            text: 'Điện thoại đang bày bán',
            icon: <PhoneIphoneOutlinedIcon />,
            value: tq.soMayDangBan,
            color: '#7C3AED',
            backgroundColor: '#F5F3FF'
        },
        {
            text: 'Số máy đã bán',
            icon: <ShoppingBagOutlinedIcon />,
            value: tq.soMayDaBan,
            color: '#0891B2',
            backgroundColor: '#ECFEFF'
        },
        {
            text: 'Điện thoại đang sửa',
            icon: <BuildOutlinedIcon />,
            value: tq.soMayDangSua,
            color: '#D97706',
            backgroundColor: '#FFFBEB'
        },
        {
            text: 'Số máy đã sửa',
            icon: <TaskAltOutlinedIcon />,
            value: tq.soMayDaSua,
            color: '#16A34A',
            backgroundColor: '#F0FDF4'
        }
    ];
    return (
        <Grid container spacing={2}>
            {arr?.map((x: any, index: number) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                    <Stack className="ts-stat" direction={'row'} spacing={2} alignItems={'center'}>
                        <span className="ts-stat__icon" style={{ color: x.color, backgroundColor: x.backgroundColor }}>
                            {x.icon}
                        </span>
                        <Stack spacing={0.25} minWidth={0}>
                            <Typography className="ts-stat__label">{x.text}</Typography>
                            <Typography className="ts-stat__value" sx={{ color: x.value < 0 ? '#DC2626' : undefined }}>
                                {new Intl.NumberFormat('vi-VN').format(x.value)}
                            </Typography>
                        </Stack>
                    </Stack>
                </Grid>
            ))}
        </Grid>
    );
};
export default observer(OverView);
