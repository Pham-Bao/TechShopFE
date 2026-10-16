import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import { Grid, Stack, Typography } from '@mui/material';
import './overViewNew.css';
import dashboardStore from '../../../../stores/dashboardStore';
import { observer } from 'mobx-react';
const OverView = () => {
    const data = dashboardStore.thongKeSoLuong ?? {
        tongDoanhThu: 0,
        tongThucThu: 0,
        tongKhachHangSinhNhat: 0,
        tongLichHen: 0
    };

    // Thẻ số liệu: nền trắng viền mảnh, icon trong ô vuông màu nhạt
    const arr = [
        {
            text: 'Tổng doanh thu',
            icon: <ReceiptIcon />,
            value: data.tongDoanhThu,
            color: '#2563EB',
            backgroundColor: '#EFF6FF'
        },
        {
            text: 'Tổng thực thu',
            icon: <AttachMoneyIcon />,
            value: data.tongThucThu,
            color: '#059669',
            backgroundColor: '#ECFDF5'
        },
        {
            text: 'Tổng cuộc hẹn',
            icon: <CalendarMonthOutlinedIcon />,
            value: data.tongLichHen,
            color: '#111827',
            backgroundColor: '#F3F4F6'
        }
    ];
    return (
        <Grid container spacing={2}>
            {arr?.map((x: any, index: number) => (
                <Grid item xs={12} sm={4} md={4} lg={4} xl={4} key={index}>
                    <Stack className="ts-stat" direction={'row'} spacing={2} alignItems={'center'}>
                        <span className="ts-stat__icon" style={{ color: x.color, backgroundColor: x.backgroundColor }}>
                            {x.icon}
                        </span>
                        <Stack spacing={0.25} minWidth={0}>
                            <Typography className="ts-stat__label">{x.text}</Typography>
                            <Typography className="ts-stat__value">
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
