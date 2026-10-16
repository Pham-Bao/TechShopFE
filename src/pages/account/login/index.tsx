/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
    Grid,
    TextField,
    FormControlLabel,
    Checkbox,
    InputAdornment,
    IconButton,
    Typography,
    CircularProgress,
    Button
} from '@mui/material';
import './login.css';
import LoginModel from '../../../models/Login/loginModel';
import LoginService from '../../../services/login/loginService';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import logo from '../../../images/TechShopLogo.png';
import { Link } from 'react-router-dom';
import {
    Visibility,
    VisibilityOff,
    CheckCircleRounded,
    StorefrontOutlined,
    PersonOutlineOutlined,
    LockOutlined
} from '@mui/icons-material';
import nhatKyHoatDongService from '../../../services/nhat_ky_hoat_dong/nhatKyHoatDongService';
import { enqueueSnackbar } from 'notistack';
const LoginScreen: React.FC = () => {
    const navigate = useNavigate();
    const loginModel = new LoginModel();
    useEffect(() => {
        localStorage.clear();
        sessionStorage.clear();
        // get an array of all cookie names
        Object.keys(Cookies.get()).forEach((cookieName) => {
            if (cookieName !== 'TenantName') {
                Cookies.remove(cookieName);
            }
        });
    }, []);
    const [showPassword, setShowPassword] = useState(false);
    const formik = useFormik({
        initialValues: {
            tenant: Cookies.get('TenantName') ?? '',
            userNameOrEmail: '',
            password: '',
            remember: true
        },
        validationSchema: Yup.object({
            tenant: Yup.string(),
            userNameOrEmail: Yup.string().required('Tài khoản không được để trống.'),
            password: Yup.string().required('Mật khẩu không được để trống.')
        }),
        onSubmit: async (values) => {
            loginModel.tenancyName = values.tenant;
            loginModel.userNameOrEmailAddress = values.userNameOrEmail;
            loginModel.password = values.password;
            loginModel.rememberMe = values.remember;
            const loginResult = await LoginService.Login(loginModel);
            if (loginResult.success === true) {
                await nhatKyHoatDongService.createNhatKyThaoTac({
                    chucNang: 'Đăng nhập',
                    loaiNhatKy: 6,
                    noiDung: 'Đăng nhập hệ thống',
                    noiDungChiTiet: 'Đăng nhập hệ thống'
                });
                window.location.href = '/';
            } else {
                await nhatKyHoatDongService.createNhatKyThaoTac({
                    chucNang: 'Đăng nhập',
                    loaiNhatKy: 6,
                    noiDung: 'Đăng nhập hệ thống thất bại',
                    noiDungChiTiet: 'Đăng nhập hệ thống thất bại'
                });
                enqueueSnackbar(loginResult.message, {
                    variant: 'error',
                    autoHideDuration: 3000
                });
            }
        }
    });

    const handleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter') {
            formik.handleSubmit();
        }
    };

    return (
        <div className="ts-login">
            {/* Bên trái: giới thiệu thương hiệu (ẩn trên điện thoại) */}
            <div className="ts-login__brand">
                <div className="ts-login__brand-logo">
                    <img src={logo} alt="TechShop" />
                    <span>TechShop</span>
                </div>
                <div className="ts-login__brand-body">
                    <h1>Quản lý cửa hàng điện thoại, gọn trong một nơi.</h1>
                    <p>Bán hàng, sửa chữa, kho máy và báo cáo doanh thu, theo dõi mọi lúc trên mọi thiết bị.</p>
                    <ul>
                        <li>
                            <CheckCircleRounded /> Bán hàng &amp; tiếp nhận máy sửa chữa
                        </li>
                        <li>
                            <CheckCircleRounded /> Quản lý máy theo IMEI, bảo hành
                        </li>
                        <li>
                            <CheckCircleRounded /> Kho hàng, thu chi, báo cáo doanh thu
                        </li>
                    </ul>
                </div>
                <div className="ts-login__brand-footer">© {new Date().getFullYear()} TechShop</div>
            </div>

            {/* Bên phải: form đăng nhập */}
            <div className="ts-login__panel">
                <div className="ts-login__card">
                    <div className="ts-login__mobile-logo">
                        <img src={logo} alt="TechShop" />
                        <span>TechShop</span>
                    </div>
                    <Typography component="h2" className="ts-login__title">
                        Đăng nhập
                    </Typography>
                    <Typography className="ts-login__subtitle">
                        Chào mừng quay lại! Nhập thông tin tài khoản để tiếp tục.
                    </Typography>
                    <form className="ts-login__form" onSubmit={formik.handleSubmit}>
                        <label className="ts-login__label" htmlFor="tenant">
                            ID đăng nhập
                        </label>
                        <TextField
                            {...formik.getFieldProps('tenant')}
                            id="tenant"
                            error={formik.touched.tenant && formik.errors.tenant ? true : false}
                            helperText={formik.touched.tenant && formik.errors.tenant}
                            onKeyDown={handleKeyDown}
                            variant="outlined"
                            name="tenant"
                            value={formik.values.tenant}
                            placeholder="Số điện thoại đăng ký cửa hàng"
                            type="text"
                            fullWidth
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <StorefrontOutlined fontSize="small" />
                                    </InputAdornment>
                                )
                            }}
                        />

                        <label className="ts-login__label" htmlFor="userNameOrEmail">
                            Tên đăng nhập
                        </label>
                        <TextField
                            {...formik.getFieldProps('userNameOrEmail')}
                            id="userNameOrEmail"
                            error={formik.touched.userNameOrEmail && formik.errors.userNameOrEmail ? true : false}
                            helperText={formik.touched.userNameOrEmail && formik.errors.userNameOrEmail}
                            onKeyDown={handleKeyDown}
                            variant="outlined"
                            name="userNameOrEmail"
                            placeholder="Nhập email hoặc tên tài khoản"
                            type="text"
                            fullWidth
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <PersonOutlineOutlined fontSize="small" />
                                    </InputAdornment>
                                )
                            }}
                        />

                        <label className="ts-login__label" htmlFor="password">
                            Mật khẩu
                        </label>
                        <TextField
                            {...formik.getFieldProps('password')}
                            id="password"
                            onKeyDown={handleKeyDown}
                            variant="outlined"
                            name="password"
                            placeholder="Nhập mật khẩu"
                            error={formik.touched.password && formik.errors.password ? true : false}
                            helperText={formik.touched.password && formik.errors.password}
                            type={showPassword ? 'text' : 'password'}
                            fullWidth
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockOutlined fontSize="small" />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={handleShowPassword} edge="end">
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />

                        <div className="ts-login__row">
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        {...formik.getFieldProps('remember')}
                                        checked={formik.values.remember}
                                        size="small"
                                    />
                                }
                                label="Ghi nhớ"
                            />
                            <Link className="ts-login__forgot" to="/forgot-password">
                                Quên mật khẩu?
                            </Link>
                        </div>

                        <Button type="submit" variant="contained" fullWidth size="large" className="ts-login__submit">
                            {formik.isSubmitting ? <CircularProgress sx={{ color: 'white' }} size={24} /> : 'Đăng nhập'}
                        </Button>
                    </form>
                    <Typography sx={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#4b5563' }}>
                        Chưa có tài khoản?{' '}
                        <Link className="ts-login__forgot" to="/register">
                            Đăng ký gian hàng
                        </Link>
                    </Typography>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
