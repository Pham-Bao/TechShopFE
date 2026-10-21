import React, { useEffect, useRef, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import AppSiderMenu from '../SiderMenu/index';
import Cookies from 'js-cookie';
import LoginAlertDialog from '../AlertDialog/LoginAlert';
import { Container } from '@mui/system';
import Box from '@mui/material/Box';
import { AppContext } from '../../services/chi_nhanh/ChiNhanhContext';
import { SuggestChiNhanhDto } from '../../services/suggests/dto/SuggestChiNhanhDto';
import http from '../../services/httpService';
import sessionStore from '../../stores/sessionStore';
import ResponsiveDrawer from '../SiderMenu/mobileSideMenu';
import Header from '../Header';
import { CuaHangDto } from '../../services/cua_hang/Dto/CuaHangDto';
import cuaHangService from '../../services/cua_hang/cuaHangService';
import { PagedRequestDto } from '../../services/dto/pagedRequestDto';
import { inject, observer } from 'mobx-react';
import NotificationStore from '../../stores/notificationStore';
import Stores from '../../stores/storeIdentifier';
import IphoneDangCam from '../PhoneAgent/IphoneDangCam';

const isAuthenticated = (): boolean => {
    const accessToken = Cookies.get('Abp.AuthToken');
    if (accessToken && !accessToken.includes('error')) {
        try {
            return true;
        } catch (error) {
            console.log(error);
        }
    }
    return false;
};
interface IMainAppLayout {
    notificationStore: NotificationStore;
}

const MainAppLayout: React.FC<IMainAppLayout> = (props) => {
    const [chinhanhCurrent, setChiNhanhCurrent] = React.useState<SuggestChiNhanhDto>({
        id: '',
        tenChiNhanh: ''
    });
    const { notificationStore } = props;
    const [congty, setCongTy] = useState<CuaHangDto>({} as CuaHangDto);
    const GetAllCongTy = async () => {
        const data = await cuaHangService.GetAllCongTy({} as PagedRequestDto);
        if (data.length > 0) {
            setCongTy(data[0]);
        }
    };
    const getPermissions = () => {
        const userId = Cookies.get('userId');
        const token = Cookies.get('Abp.AuthToken');
        const encryptedAccessToken = Cookies.get('encryptedAccessToken');
        if (userId !== undefined && userId !== null && token !== undefined && token !== null) {
            http.post(`api/services/app/Permission/GetAllPermissionByRole?UserId=${userId}`, {
                headers: {
                    accept: 'text/plain',
                    Authorization: 'Bearer ' + token,
                    'X-XSRF-TOKEN': encryptedAccessToken
                }
            })
                .then((response) => {
                    sessionStore.listPermisson = response.data.result['permissions'];
                    const item = {
                        value: response.data.result['permissions']
                    };
                    localStorage.setItem('permissions', JSON.stringify(item));
                })
                .catch((error) => console.log(error));
        }
    };
    useEffect(() => {
        notificationStore.createHubConnection();
    });
    useEffect(() => {
        // Call API to get list of permissions here
        getPermissions();
        GetAllCongTy();
    }, []);
    const [open, setOpen] = React.useState(!isAuthenticated);
    const navigate = useNavigate();
    useEffect(() => {
        setOpen(!isAuthenticated);
    }, []);

    const confirm = () => {
        setOpen(false);
        navigate('/login');
    };
    const [isChildHovered, setChildHovered] = useState(false);

    const handleChildHoverChange = (isHovered: boolean) => {
        setChildHovered(isHovered);
    };
    const [collapsed, onCollapse] = useState(true);

    const toggle = () => {
        onCollapse(!collapsed);
        handleChildHoverChange(!isChildHovered);
        if (collapsed == false) {
            Cookies.set('sidebar', 'true', { expires: 7 });
        } else {
            Cookies.set('sidebar', 'false');
        }
    };
    const CookieSidebar = Cookies.get('sidebar') === 'true';

    useEffect(() => {
        if (CookieSidebar) {
            onCollapse(true);
            handleChildHoverChange(false);
        } else {
            onCollapse(false);
            handleChildHoverChange(true);
        }
    }, []);

    const changeChiNhanh = (item: SuggestChiNhanhDto) => {
        setChiNhanhCurrent(item);
    };

    // Mobile: trang có bảng (DataGrid) thì khóa vừa 1 màn hình - thanh tiêu đề/nút & phân trang đứng yên,
    // chỉ nội dung bảng cuộn. Tự co/giãn chiều cao bảng cho vừa phần còn trống (không đổi bố cục từng trang).
    const isMobileLayout = window.screen.width <= 650;
    const mobileContentRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const content = mobileContentRef.current;
        if (!isMobileLayout || !content) return;

        const MIN_GRID_HEIGHT = 220;
        let frame = 0;
        const fitGrid = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                // chỉ xử lý khi có đúng 1 bảng đang hiển thị (bỏ qua bảng ẩn trong tab khác / bảng autoHeight)
                // ưu tiên DataGrid, nếu trang không có DataGrid thì dùng bảng thường (TableContainer)
                const visible = (x: HTMLElement) => x.offsetParent !== null;
                let grids = Array.from(content.querySelectorAll<HTMLElement>('.MuiDataGrid-root')).filter(
                    (x) => visible(x) && !x.classList.contains('MuiDataGrid-autoHeight')
                );
                const isTable = grids.length === 0;
                if (isTable) {
                    grids = Array.from(content.querySelectorAll<HTMLElement>('.MuiTableContainer-root')).filter(
                        (x) => visible(x) && !x.parentElement?.closest('.MuiTableContainer-root')
                    );
                }
                const hasGrid = grids.length === 1;
                content.classList.toggle('mobile-fit-grid', hasGrid);
                if (!hasGrid) return;

                const grid = grids[0];
                if (isTable) {
                    grid.style.overflow = 'auto';
                    // tiêu đề bảng đứng yên khi cuộn: ô tiêu đề trong suốt thì cho nền trắng để không bị lộ chữ bên dưới
                    grid.querySelectorAll<HTMLElement>('thead th').forEach((th) => {
                        th.style.position = 'sticky';
                        th.style.top = '0';
                        th.style.zIndex = '2';
                        const bg = getComputedStyle(th).backgroundColor;
                        if (bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)') th.style.backgroundColor = '#fff';
                    });
                }
                const contentTop = content.getBoundingClientRect().top - content.scrollTop;
                const paddingBottom = parseFloat(getComputedStyle(content).paddingBottom) || 0;
                let usedBottom = 0;
                Array.from(content.children).forEach((child) => {
                    usedBottom = Math.max(usedBottom, child.getBoundingClientRect().bottom - contentTop);
                });
                const used = usedBottom + paddingBottom;
                const gridHeight = grid.getBoundingClientRect().height;
                const newHeight = Math.max(MIN_GRID_HEIGHT, Math.floor(gridHeight + content.clientHeight - used));
                if (Math.abs(newHeight - gridHeight) > 1) {
                    // !important để thắng chiều cao cố định theo vh của .data-grid-row (responsive.css)
                    grid.style.setProperty('height', `${newHeight}px`, 'important');
                    grid.style.setProperty('min-height', `${newHeight}px`, 'important');
                    grid.style.setProperty('max-height', `${newHeight}px`, 'important');
                }
            });
        };

        const mutationObserver = new MutationObserver(fitGrid);
        mutationObserver.observe(content, { childList: true, subtree: true });
        window.addEventListener('resize', fitGrid);
        fitGrid();
        return () => {
            cancelAnimationFrame(frame);
            mutationObserver.disconnect();
            window.removeEventListener('resize', fitGrid);
        };
    }, []);
    return (
        <Container maxWidth={false} disableGutters={true}>
            {window.screen.width > 650 ? (
                <Box>
                    <AppSiderMenu
                        collapsed={!collapsed}
                        toggle={toggle}
                        onHoverChange={handleChildHoverChange}
                        CookieSidebar={CookieSidebar}
                    />
                    <Box
                        sx={{
                            marginLeft: !collapsed ? '240px' : '0px',
                            transition: '.4s'
                        }}>
                        <Header
                            collapsed={collapsed}
                            toggle={toggle}
                            onClick={toggle}
                            isChildHovered={isChildHovered}
                            CookieSidebar={CookieSidebar}
                            handleChangeChiNhanh={changeChiNhanh}
                            notificationStore={notificationStore}
                        />
                        <Box
                            padding={2}
                            paddingTop={0}
                            sx={{
                                borderBottom: 'solid 0.1rem #e6e1e6',
                                borderRight: 'solid 0.1rem #e6e1e6',
                                borderLeft: 'solid 0.1rem #e6e1e6',
                                marginTop: '70px',
                                minHeight: 'calc(100vh - 70px)',
                                bgcolor: '#F3F4F6'
                            }}>
                            <AppContext.Provider value={{ chinhanhCurrent, congty }}>
                                <Outlet />
                            </AppContext.Provider>
                            <LoginAlertDialog open={open} confirmLogin={confirm} />
                        </Box>
                    </Box>
                </Box>
            ) : (
                <Box>
                    <Header
                        collapsed={collapsed}
                        toggle={toggle}
                        onClick={toggle}
                        isChildHovered={isChildHovered}
                        CookieSidebar={CookieSidebar}
                        handleChangeChiNhanh={changeChiNhanh}
                        notificationStore={notificationStore}
                    />
                    <Box>
                        <ResponsiveDrawer isOpen={!collapsed} onOpen={toggle} />
                        <Box
                            ref={mobileContentRef}
                            className="main-content-mobile"
                            padding={2}
                            paddingTop={0}
                            sx={{
                                borderBottom: 'solid 0.1rem #e6e1e6',
                                borderRight: 'solid 0.1rem #e6e1e6',
                                borderLeft: 'solid 0.1rem #e6e1e6',
                                marginTop: '70px',
                                minHeight: 'calc(100vh - 70px)',
                                bgcolor: '#F3F4F6'
                            }}>
                            <AppContext.Provider value={{ chinhanhCurrent, congty }}>
                                <Outlet />
                            </AppContext.Provider>
                            <LoginAlertDialog open={open} confirmLogin={confirm} />
                        </Box>
                    </Box>
                </Box>
            )}
            {/* iPhone đang cắm USB (qua PhoneAgent) - góc dưới bên trái */}
            <IphoneDangCam />
        </Container>
    );
};

export default inject(Stores.NotificationStore)(observer(MainAppLayout));
