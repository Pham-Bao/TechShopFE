import { Avatar, Box, Dialog, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocalPhoneOutlinedIcon from '@mui/icons-material/LocalPhoneOutlined';
import dashboardStore from '../../../../stores/dashboardStore';
import { format } from 'date-fns';
import utils from '../../../../utils/utils';
import { IPropModal } from '../../../../services/dto/IPropsComponent';
import DialogButtonClose from '../../../../components/Dialog/ButtonClose';
import { RequestFromToDto } from '../../../../services/dto/ParamSearchDto';
import { useEffect, useState } from 'react';
import dashboardService from '../../../../services/dashboard/dashboardService';
import { PagedResultDto } from '../../../../services/dto/pagedResultDto';
import { DanhSachLichHen } from '../../../../services/dashboard/dto/danhSachLichHen';

const ModalAllLichHenDoard = ({ isShowModal, onClose, onOK, objUpDate }: IPropModal<RequestFromToDto>) => {
    const [pageDataLichHen, setPageDataLichHen] = useState<PagedResultDto<DanhSachLichHen>>({
        items: [],
        totalCount: 0,
        totalPage: 0
    });

    const getListCuocHen = async () => {
        const param = { ...objUpDate };
        param.pageSize = dashboardStore?.countLichHen ?? 10;
        const data = await dashboardService.danhSachLichHen(param);
        setPageDataLichHen({
            ...pageDataLichHen,
            items: data?.items,
            totalCount: data?.totalCount
        });
    };

    useEffect(() => {
        if (isShowModal) {
            getListCuocHen();
        }
    }, [isShowModal]);
    return (
        <Dialog open={isShowModal} maxWidth="sm" fullWidth>
            <DialogTitle>Danh sách cuộc hẹn</DialogTitle>
            <DialogButtonClose onClose={onClose} />
            <DialogContent>
                <Box>
                    {pageDataLichHen?.items?.map((data, index) => (
                        <Box
                            key={index}
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
                                <Typography variant="body2">
                                    {data?.bookingDate != undefined
                                        ? format(new Date(data?.bookingDate), 'dd/MM/yyyy')
                                        : ''}
                                </Typography>
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
                    ))}
                </Box>
            </DialogContent>
        </Dialog>
    );
};
export default ModalAllLichHenDoard;
