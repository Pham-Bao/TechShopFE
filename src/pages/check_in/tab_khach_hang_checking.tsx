import {
    Avatar,
    Badge,
    Button,
    debounce,
    Grid,
    IconButton,
    InputLabel,
    Menu,
    MenuItem,
    Stack,
    TextField,
    Typography
} from '@mui/material';
import GroupAddOutlinedIcon from '@mui/icons-material/GroupAddOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import React, { useEffect, useRef, useState } from 'react';
import { LoaiChungTu, TrangThaiCheckin } from '../../lib/appconst';
import Loading from '../../components/Loading';
import { PageKhachHangCheckInDto } from '../../services/check_in/CheckinDto';
import CheckinService from '../../services/check_in/CheckinService';
import { PagedRequestDto } from '../../services/dto/pagedRequestDto';
import ModalAddCustomerCheckIn from './modal_add_cus_checkin';
import PageEmpty from '../../components/PageEmpty';
import { PropConfirmOKCancel } from '../../utils/PropParentToChild';
import TrangThaiBooking from '../../enum/TrangThaiBooking';
import { dbDexie } from '../../lib/dexie/dexieDB';
import { Guid } from 'guid-typescript';
import ConfirmDelete from '../../components/AlertDialog/ConfirmDelete';
import MoreVertIcon from '@mui/icons-material/MoreVert';

export type IPropsTabKhachHangCheckIn = {
    txtSearch: string;
    idChiNhanhChosed: string;
    isShowModalAddCheckin: boolean;
    onClickAddHoaDon: (customerId: string, idCheckIn?: string, idPhone?: string) => void;
    onCloseModalAddCheckin: () => void;
};

export default function TabKhachHangChecking(props: IPropsTabKhachHangCheckIn) {
    const { txtSearch, idChiNhanhChosed, onClickAddHoaDon, isShowModalAddCheckin, onCloseModalAddCheckin, ...other } =
        props;
    const firstLoad = useRef(true);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [idCheckinDelete, setIdCheckinDelete] = useState<string>('');
    const [inforDelete, setinforDelete] = useState<PropConfirmOKCancel>({
        show: false,
        title: '',
        type: 1,
        mes: ''
    });
    const [lstCustomerChecking, setLstCustomerChecking] = useState<PageKhachHangCheckInDto[]>([]);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedCus, setSelectedCus] = useState<PageKhachHangCheckInDto | null>(null);

    const handleClickMenu = (event: React.MouseEvent<HTMLElement>, cus: PageKhachHangCheckInDto) => {
        setAnchorEl(event.currentTarget);
        setSelectedCus(cus);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
        setSelectedCus(null);
    };

    const handleMarkDone = () => {
        if (selectedCus) {
            onFinishCustomer(selectedCus);
        }
        handleCloseMenu();
    };

    const handleRemoveCustomer = () => {
        if (selectedCus) {
            onRemoveCustomerChecking(selectedCus);
        }
        handleCloseMenu();
    };

    const GetListCustomerChecking = async (txtSearch: string) => {
        const param: PagedRequestDto = {
            keyword: txtSearch,
            skipCount: 0,
            maxResultCount: 16,
            idChiNhanh: idChiNhanhChosed
        };
        const data = await CheckinService.GetListCustomerChecking(param);

        const arrUpdate = data?.map(async (x) => {
            const hdCache = await dbDexie.hoaDon.where('idCheckIn').equals(x.idCheckIn).toArray();
            if (hdCache.length > 0) {
                return {
                    ...x,
                    tongThanhToan: hdCache[0].tongThanhToan,
                    loaiHoaDon: hdCache[0]?.idLoaiChungTu
                } as PageKhachHangCheckInDto;
            } else {
                return { ...x, tongThanhToan: 0, loaiHoaDon: -1 } as PageKhachHangCheckInDto;
            }
        });
        const lstNew = await Promise.all(arrUpdate);

        setLstCustomerChecking([...lstNew]);
        setIsLoadingData(false);
    };

    const debounceCustomer = useRef(
        debounce(async (txt) => {
            await GetListCustomerChecking(txt);
        }, 500)
    ).current;

    useEffect(() => {
        debounceCustomer(txtSearch);
    }, [txtSearch]);

    const addHoaDon = async (cusItem: PageKhachHangCheckInDto) => {
        console.log(cusItem?.idHangHoa);
        onClickAddHoaDon(cusItem?.idKhachHang ?? '', cusItem?.idCheckIn ?? '', cusItem?.idHangHoa ?? '');
    };

    const onRemoveCustomerChecking = (item: PageKhachHangCheckInDto) => {
        setIdCheckinDelete(item?.idCheckIn);
        setinforDelete({
            ...inforDelete,
            show: true,
            title: 'Xác nhận hủy',
            mes: 'Bạn có chắc chắn muốn hủy khách hàng ' + item?.tenKhachHang + ' đang check-in không'
        });
    };

    const deleteCusChecking = async () => {
        setLstCustomerChecking(lstCustomerChecking.filter((x) => x.idCheckIn !== idCheckinDelete));
        await CheckinService.UpdateTrangThaiCheckin(idCheckinDelete, TrangThaiCheckin.DELETED);
        setinforDelete(
            new PropConfirmOKCancel({
                show: false,
                title: '',
                mes: ''
            })
        );

        // update again trangThaiBooking = xác nhận vì không biết trạng thái cũ
        await CheckinService.UpdateTrangThaiBooking_byIdCheckIn(idCheckinDelete, TrangThaiBooking.Confirm);

        const dataCheckIn_Dexie = await dbDexie.hoaDon.where('idCheckIn').equals(idCheckinDelete).toArray();
        if (dataCheckIn_Dexie.length > 0) {
            await dbDexie.hoaDon.delete(dataCheckIn_Dexie[0].id);
        }
        setIdCheckinDelete('');
    };

    const saveCheckInOK = async (typeAction: number, dataCheckIn: PageKhachHangCheckInDto | undefined) => {
        onCloseModalAddCheckin();
        const cusChecking: PageKhachHangCheckInDto = new PageKhachHangCheckInDto({
            idKhachHang: dataCheckIn?.idKhachHang ?? '',
            idCheckIn: dataCheckIn?.idCheckIn,
            maKhachHang: dataCheckIn?.maKhachHang ?? '',
            tenKhachHang: dataCheckIn?.tenKhachHang,
            soDienThoai: dataCheckIn?.soDienThoai,
            tongTichDiem: dataCheckIn?.tongTichDiem,
            dateTimeCheckIn: dataCheckIn?.dateTimeCheckIn
        });
        // getTongThanhToan from cache if booking
        const hdCache = await dbDexie.hoaDon
            .where('idCheckIn')
            .equals(dataCheckIn?.idCheckIn ?? Guid.EMPTY)
            .toArray();
        if (hdCache?.length > 0) {
            cusChecking.tongThanhToan = hdCache[0]?.tongThanhToan;
        }
        setLstCustomerChecking([cusChecking, ...lstCustomerChecking]);
    };

    if (isLoadingData) {
        return <Loading />;
    }
    const getColorByTrangThai = (trangThaiCheckIn?: number): string => {
        //console.log(trangThaiCheckIn);
        switch (trangThaiCheckIn) {
            case 1:
                return '#d0f0c0'; // Xanh nhạt
            case 2:
                return '#fff3cd'; // Vàng nhạt
            case 3:
                return '#d1ecf1'; // Xanh dương
            case 4:
                return '#f8d7da'; // Đỏ nhạt
            default:
                return '#ffffff'; // Mặc định
        }
    };
    const onFinishCustomer = async (cusItem: PageKhachHangCheckInDto) => {
        const nextStatus = cusItem.trangThaiCheckIn === 1 ? 2 : 1;
        let nextStatusText = '';

        if (nextStatus === 1) {
            nextStatusText = 'Đang sửa chữa';
        } else {
            nextStatusText = 'Đã sửa xong';
        }

        try {
            // Gọi API cập nhật trạng thái mới
            await CheckinService.UpdateTrangThaiCheckin(cusItem.idCheckIn, nextStatus);

            // Cập nhật danh sách khách hàng trong local state
            setLstCustomerChecking((prev) =>
                prev.map((item) => {
                    if (item.idCheckIn === cusItem.idCheckIn) {
                        return new PageKhachHangCheckInDto({
                            ...item,
                            idKhachHang: item.idKhachHang ?? undefined,
                            idHangHoa: item.idHangHoa ?? undefined,
                            idChiNhanh: typeof item.idChiNhanh === 'string' ? null : item.idChiNhanh,
                            maKhachHang: item.maKhachHang ?? undefined,
                            dateTimeCheckIn: item.dateTimeCheckIn ?? undefined,
                            soDienThoai: item.soDienThoai ?? '',
                            tenKhachHang: item.tenKhachHang ?? '',
                            tongTichDiem: item.tongTichDiem ?? 0,
                            ghiChu: item.ghiChu ?? '',
                            trangThaiCheckIn: nextStatus ?? '',
                            txtTrangThaiCheckIn: nextStatusText
                        });
                    }
                    return item;
                })
            );
        } catch (error) {
            console.error('Lỗi khi cập nhật trạng thái khách hàng:', error);
        }
    };

    return (
        <>
            <ModalAddCustomerCheckIn
                typeForm={1}
                isNew={true}
                idChiNhanh={idChiNhanhChosed}
                isShowModal={isShowModalAddCheckin}
                onOK={saveCheckInOK}
                onClose={onCloseModalAddCheckin}
            />
            <ConfirmDelete
                isShow={inforDelete?.show}
                title={inforDelete?.title}
                mes={inforDelete?.mes}
                onOk={deleteCusChecking}
                onCancel={() => setinforDelete({ ...inforDelete, show: false })}
            />
            {(lstCustomerChecking?.length ?? 0) == 0 ? (
                <PageEmpty
                    text="Không có khách hàng check in"
                    style={{ minHeight: '86vh' }}
                    icon={<GroupAddOutlinedIcon sx={{ width: 60, height: 60, color: 'burlywood' }} />}
                />
            ) : (
                <Grid container spacing={2.5}>
                    {lstCustomerChecking?.map((cusItem, index) => (
                        <Grid item key={index} xs={12} sm={6} md={4} lg={3}>
                            <Stack
                                padding={2}
                                position={'relative'}
                                border={'1px solid #cccc'}
                                borderRadius={1}
                                sx={{
                                    boxShadow: '0px 2px 5px 0px #c6bdd1',
                                    backgroundColor: getColorByTrangThai(cusItem.trangThaiCheckIn ?? 0),
                                    '&:hover': {
                                        borderColor: 'var(--color-main)',
                                        cursor: 'pointer'
                                    }
                                }}>
                                <IconButton
                                    sx={{ position: 'absolute', top: 4, right: 4 }}
                                    onClick={(e) => handleClickMenu(e, cusItem)}>
                                    <MoreVertIcon />
                                </IconButton>
                                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}>
                                    {selectedCus?.trangThaiCheckIn === 1 ? (
                                        <MenuItem onClick={handleMarkDone}>Đang sửa chữa</MenuItem>
                                    ) : (
                                        <MenuItem onClick={handleMarkDone}>Đã sửa xong</MenuItem>
                                    )}
                                    <MenuItem onClick={handleRemoveCustomer}>Xóa</MenuItem>
                                </Menu>

                                <Stack
                                    justifyContent={'space-between'}
                                    spacing={1.5}
                                    onClick={() => addHoaDon(cusItem)}>
                                    <Stack minHeight={50} direction="row" justifyContent="space-between">
                                        <Stack spacing={2} direction="row">
                                            <Avatar src={cusItem?.avatar} />
                                            <Stack spacing={0.5}>
                                                <Typography
                                                    variant="body2"
                                                    fontWeight={500}
                                                    maxWidth={260}
                                                    className="lableOverflow"
                                                    title={cusItem?.tenKhachHang}>
                                                    {cusItem?.tenKhachHang}{' '}
                                                    <span style={{ color: 'var(--color-text-blur)' }}>
                                                        ({cusItem?.soDienThoai})
                                                    </span>
                                                </Typography>

                                                <Typography
                                                    variant="body2"
                                                    fontWeight={500}
                                                    maxWidth={260}
                                                    className="lableOverflow"
                                                    title={cusItem?.tenHangHoa}>
                                                    {cusItem?.tenHangHoa}{' '}
                                                    <span style={{ color: 'var(--color-text-blur)' }}>
                                                        ({cusItem?.noiDung})
                                                    </span>
                                                </Typography>
                                            </Stack>
                                        </Stack>
                                    </Stack>

                                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                                        <Stack direction="column" spacing={0.2}>
                                            {cusItem?.loaiHoaDon !== LoaiChungTu.GOI_DICH_VU ? (
                                                <Typography
                                                    sx={{
                                                        color: '#1976d2',
                                                        '&:hover': {
                                                            color: '#3c9977',
                                                            cursor: 'pointer'
                                                        }
                                                    }}>
                                                    Hóa đơn sửa
                                                </Typography>
                                            ) : (
                                                <Typography
                                                    sx={{
                                                        color: 'var(--color-second)',
                                                        '&:hover': {
                                                            color: '#c32b2b',
                                                            cursor: 'pointer'
                                                        }
                                                    }}>
                                                    Gói dịch vụ
                                                </Typography>
                                            )}

                                            <Typography variant="body2" fontStyle="italic" color="GrayText">
                                                {cusItem?.txtTrangThaiCheckIn}
                                            </Typography>
                                        </Stack>

                                        <Typography variant="body2" color="var(--color-text-secondary)">
                                            {cusItem?.dateCheckIn}
                                        </Typography>
                                    </Stack>

                                    <Stack alignItems={'center'} direction={'row'} spacing={1}>
                                        <Typography variant="body2">Tổng mua:</Typography>
                                        <Typography variant="body2" fontWeight={500}>
                                            {new Intl.NumberFormat('vi-VN').format(cusItem?.tongThanhToan ?? 0)}
                                        </Typography>
                                    </Stack>
                                </Stack>
                            </Stack>
                        </Grid>
                    ))}
                </Grid>
            )}
        </>
    );
}
