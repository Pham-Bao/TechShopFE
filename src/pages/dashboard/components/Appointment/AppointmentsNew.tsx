import React from 'react';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocalPhoneOutlinedIcon from '@mui/icons-material/LocalPhoneOutlined';
import './appointmentsNew.css';
import dashboardStore from '../../../../stores/dashboardStore';
import { observer } from 'mobx-react';
import { format } from 'date-fns';
import { Avatar, Box, Stack, Typography } from '@mui/material';
import utils from '../../../../utils/utils';
const AppoimentsNew: React.FC = () => {
    const datas = dashboardStore.danhSachLichHen ?? [];

    return (
        <Box>
            {datas.length > 0 ? (
                datas.map((data, key) => {
                    return (
                        <Box
                            key={key}
                            display={'flex'}
                            padding={1}
                            justifyContent={'space-between'}
                            borderBottom={'1px solid #EEF0F4'}>
                            <Stack direction={'row'} spacing={2} alignItems={'center'}>
                                <Stack>
                                    {data?.avatar ? (
                                        <Avatar src={data?.avatar} sx={{ width: 24, height: 24 }} />
                                    ) : (
                                        <Avatar
                                            sx={{
                                                width: 40,
                                                height: 40,
                                                fontSize: '14px',
                                                color: 'white',
                                                backgroundColor: '#c3c3d5'
                                            }}>
                                            {utils.getFirstLetter(data?.tenKhachHang, 2)}
                                        </Avatar>
                                    )}
                                </Stack>
                                <Stack spacing={1}>
                                    <Typography component={'span'} sx={{ fontWeight: 600, fontSize: '16px' }}>
                                        {data?.tenKhachHang}
                                        {data?.soDienThoai && (
                                            <Stack
                                                spacing={1}
                                                direction={'row'}
                                                color={'#6c6c81'}
                                                alignItems={'center'}>
                                                <LocalPhoneOutlinedIcon sx={{ width: '16px' }} />
                                                <Typography component={'span'} variant="body1">
                                                    {data?.soDienThoai}
                                                </Typography>
                                            </Stack>
                                        )}
                                    </Typography>
                                    <Typography variant="body1">{data?.tenHangHoa}</Typography>
                                </Stack>
                            </Stack>
                            <Stack justifyContent={'end'} alignItems={'end'}>
                                <Stack spacing={1} direction={'row'} color={'#6c6c81'}>
                                    <AccessTimeIcon sx={{ width: 20 }} />
                                    <Typography
                                        sx={{
                                            marginLeft: '4px'
                                        }}>
                                        {data.startTime != undefined ? format(new Date(data.startTime), 'HH:mm') : ''}
                                    </Typography>
                                </Stack>
                                <Typography
                                    className={
                                        data?.trangThai === 2
                                            ? 'data-grid-cell-trangthai-active'
                                            : 'data-grid-cell-trangthai-notActive'
                                    }
                                    sx={{
                                        fontSize: '12px'
                                    }}>
                                    {data.txtTrangThai}
                                </Typography>
                            </Stack>
                        </Box>
                    );
                })
            ) : (
                <Box padding={2}>Không có dữ liệu</Box>
            )}
        </Box>
    );
};

export default observer(AppoimentsNew);
