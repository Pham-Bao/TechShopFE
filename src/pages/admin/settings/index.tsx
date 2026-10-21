import { Box, Chip, Grid, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import { ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import StarBorderOutlinedIcon from '@mui/icons-material/StarBorderOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import LoaiHoaDonSetting from './LoaiHoaDonSetting';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import KhoHangSetting from './KhoHangSetting';
import PhoneIphoneOutlinedIcon from '@mui/icons-material/PhoneIphoneOutlined';

type SettingItem = {
    title: string;
    description: string;
    icon: ReactNode;
    // không có path: mục chưa hoạt động (hiển thị "Sắp ra mắt")
    path?: string;
    // nội dung hiển thị trực tiếp trong thẻ (thay vì chuyển trang)
    content?: ReactNode;
};

type SettingGroup = {
    title: string;
    color: string;
    items: SettingItem[];
};

const settingGroups: SettingGroup[] = [
    {
        title: 'Cửa hàng',
        color: '#2563EB',
        items: [
            {
                title: 'Chi tiết cửa hàng',
                description: 'Tên, logo, địa chỉ và thông tin liên hệ',
                icon: <StorefrontOutlinedIcon />,
                path: '/settings/cua-hang'
            },
            {
                title: 'Quản lý chi nhánh',
                description: 'Thêm, sửa thông tin các chi nhánh',
                icon: <AccountTreeOutlinedIcon />,
                path: '/settings/chi-nhanhs'
            },
            {
                title: 'Tài khoản ngân hàng',
                description: 'Tài khoản nhận thanh toán chuyển khoản',
                icon: <AccountBalanceOutlinedIcon />,
                path: '/settings/tai-khoan-ngan-hang'
            },
            {
                title: 'Cài đặt booking',
                description: 'Thiết lập đặt lịch cho khách hàng',
                icon: <EventAvailableOutlinedIcon />,
                path: '/settings/dat-lich'
            },
            {
                title: 'Kết nối Zalo - Email',
                description: 'Kết nối tài khoản Zalo OA và Email',
                icon: <ForumOutlinedIcon />,
                path: '/settings/ket-noi-zalo-gmail'
            },
            {
                title: 'Khu vực - vị trí',
                description: 'Quản lý khu vực và vị trí trong cửa hàng',
                icon: <PlaceOutlinedIcon />,
                path: '/settings/khu-vuc'
            }
        ]
    },
    {
        title: 'Nhân viên',
        color: '#7C3AED',
        items: [
            {
                title: 'Hoa hồng',
                description: 'Thiết lập hoa hồng theo dịch vụ và hóa đơn',
                icon: <PaidOutlinedIcon />,
                path: '/settings/hoa-hong'
            }
        ]
    },
    {
        title: 'Bán hàng',
        color: '#059669',
        items: [
            {
                title: 'Mẫu in',
                description: 'Tùy chỉnh mẫu in hóa đơn, phiếu',
                icon: <PrintOutlinedIcon />,
                path: '/settings/mau-in'
            },
            {
                title: 'Voucher',
                description: 'Quản lý chương trình khuyến mãi, voucher',
                icon: <LocalOfferOutlinedIcon />,
                path: '/settings/voucher'
            },
            {
                title: 'Loại hóa đơn',
                description: 'Bật/tắt loại hóa đơn được sử dụng',
                icon: <ReceiptLongOutlinedIcon />,
                content: <LoaiHoaDonSetting />
            }
        ]
    },
    {
        title: 'Kho hàng',
        color: '#0891B2',
        items: [
            {
                title: 'Xuất kho',
                description: 'Cho phép bán / xuất khi không đủ tồn',
                icon: <Inventory2OutlinedIcon />,
                content: <KhoHangSetting />
            },
            {
                title: 'Cài đặt lấy máy nhanh',
                description: 'Cài iTunes + PhoneAgent để đọc nhanh thông tin iPhone cắm USB',
                icon: <PhoneIphoneOutlinedIcon />,
                path: '/settings/lay-may-nhanh'
            }
        ]
    },
    {
        title: 'Khách hàng',
        color: '#EA580C',
        items: [
            {
                title: 'Đánh giá của khách hàng',
                description: 'Thu thập đánh giá sau khi sử dụng dịch vụ',
                icon: <StarBorderOutlinedIcon />
            },
            {
                title: 'Tin nhắn tự động',
                description: 'Nhắc nhở, chúc mừng khách hàng tự động',
                icon: <NotificationsActiveOutlinedIcon />,
                path: '/settings/nhac_nho_tu_dong'
            }
        ]
    }
];

const SettingCard = ({ item, color }: { item: SettingItem; color: string }) => {
    const isDisabled = !item.path && !item.content;
    const isLink = !!item.path;

    return (
        <Box
            component={isLink ? (Link as React.ElementType) : 'div'}
            to={item.path}
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                padding: '16px',
                bgcolor: '#fff',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                textDecoration: 'none',
                color: 'inherit',
                opacity: isDisabled ? 0.6 : 1,
                cursor: isLink ? 'pointer' : 'default',
                transition: 'all .2s',
                '&:hover': isLink
                    ? {
                          borderColor: color,
                          boxShadow: '0 6px 16px rgba(17, 24, 39, 0.08)',
                          transform: 'translateY(-2px)',
                          '& .setting-arrow': { color: color, transform: 'translateX(2px)' }
                      }
                    : undefined
            }}>
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <Box
                    sx={{
                        flexShrink: 0,
                        width: 40,
                        height: 40,
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: color,
                        bgcolor: `${color}14`
                    }}>
                    {item.icon}
                </Box>
                <Box flex={1} minWidth={0}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography fontSize={15} fontWeight={600} color="#111827">
                            {item.title}
                        </Typography>
                        {isDisabled && <Chip label="Sắp ra mắt" size="small" sx={{ height: 20, fontSize: 11 }} />}
                    </Stack>
                    <Typography fontSize={13} color="#6B7280" marginTop="2px">
                        {item.description}
                    </Typography>
                </Box>
                {isLink && (
                    <ChevronRightIcon
                        className="setting-arrow"
                        sx={{ color: '#9CA3AF', alignSelf: 'center', transition: 'all .2s' }}
                    />
                )}
            </Stack>
            {item.content && <Box marginTop="12px">{item.content}</Box>}
        </Box>
    );
};

const SettingPages = () => {
    const [keyword, setKeyword] = useState('');
    const txtSearch = keyword.trim().toLowerCase();

    const groups = settingGroups
        .map((group) => ({
            ...group,
            items: group.items.filter(
                (x) =>
                    txtSearch === '' ||
                    x.title.toLowerCase().includes(txtSearch) ||
                    x.description.toLowerCase().includes(txtSearch)
            )
        }))
        .filter((group) => group.items.length > 0);

    return (
        <Box padding="16px">
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'stretch', sm: 'center' }}
                spacing={2}>
                <Box>
                    <Typography fontSize={20} fontWeight={700} color="#111827">
                        Cài đặt
                    </Typography>
                    <Typography fontSize={13} color="#6B7280">
                        Quản lý thông tin cửa hàng và cấu hình hệ thống
                    </Typography>
                </Box>
                <TextField
                    size="small"
                    placeholder="Tìm cài đặt..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    sx={{ width: { xs: '100%', sm: 300 }, bgcolor: '#fff' }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" />
                            </InputAdornment>
                        )
                    }}
                />
            </Stack>

            {groups.length === 0 && (
                <Typography marginTop="32px" textAlign="center" fontSize={14} color="#6B7280">
                    Không tìm thấy cài đặt phù hợp
                </Typography>
            )}

            {groups.map((group) => (
                <Box key={group.title} marginTop="24px">
                    <Stack direction="row" alignItems="center" spacing={1} marginBottom="12px">
                        <Box sx={{ width: 4, height: 16, borderRadius: 2, bgcolor: group.color }} />
                        <Typography
                            fontSize={13}
                            fontWeight={700}
                            color="#374151"
                            sx={{ textTransform: 'uppercase', letterSpacing: '.5px' }}>
                            {group.title}
                        </Typography>
                    </Stack>
                    <Grid container spacing={2}>
                        {group.items.map((item) => (
                            <Grid item key={item.title} xs={12} sm={6} md={4} lg={3}>
                                <SettingCard item={item} color={group.color} />
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            ))}
        </Box>
    );
};

export default SettingPages;
