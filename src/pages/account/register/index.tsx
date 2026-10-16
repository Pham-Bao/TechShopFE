import React, { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
    TextField,
    FormControlLabel,
    Checkbox,
    InputAdornment,
    IconButton,
    Typography,
    CircularProgress,
    Button,
    FormHelperText
} from '@mui/material';
import '../login/login.css';
import Cookies from 'js-cookie';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../../images/TechShopLogo.png';
import {
    Visibility,
    VisibilityOff,
    CheckCircleRounded,
    StorefrontOutlined,
    PhoneAndroidOutlined,
    EmailOutlined,
    LockOutlined
} from '@mui/icons-material';
import { enqueueSnackbar } from 'notistack';
import tenantService from '../../../services/tenant/tenantService';

const RegisterScreen: React.FC = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        // đăng ký gian hàng luôn ở ngữ cảnh Host: xóa thông tin tenant/đăng nhập cũ
        Object.keys(Cookies.get()).forEach((cookieName) => {
            Cookies.remove(cookieName);
        });
    }, []);

    const formik = useFormik({
        initialValues: {
            tenantName: '',
            phoneNumber: '',
            emailAddress: '',
            password: '',
            confirmPassword: '',
            agree: true
        },
        validationSchema: Yup.object({
            tenantName: Yup.string().trim().required('Vui lòng nhập tên cửa hàng.'),
            phoneNumber: Yup.string()
                .trim()
                .required('Vui lòng nhập số điện thoại.')
                .matches(/^(0|\+84)[0-9]{9}$/, 'Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0).'),
            emailAddress: Yup.string()
                .trim()
                .required('Vui lòng nhập gmail.')
                .matches(/^[a-zA-Z0-9._%+-]+@gmail\.com$/i, 'Gmail không hợp lệ (phải có đuôi @gmail.com).'),
            password: Yup.string().required('Vui lòng nhập mật khẩu.').min(6, 'Mật khẩu tối thiểu 6 ký tự.'),
            confirmPassword: Yup.string()
                .required('Vui lòng xác nhận mật khẩu.')
                .oneOf([Yup.ref('password')], 'Mật khẩu không khớp.'),
            agree: Yup.boolean().oneOf([true], 'Vui lòng đồng ý với điều khoản.')
        }),
        onSubmit: async (values, helpers) => {
            try {
                const result = await tenantService.registerTenant({
                    tenantName: values.tenantName.trim(),
                    phoneNumber: values.phoneNumber.trim(),
                    emailAddress: values.emailAddress.trim().toLowerCase(),
                    password: values.password
                });
                // điền sẵn ID đăng nhập (số điện thoại) ở màn hình đăng nhập
                Cookies.set('TenantName', result.tenancyName, { expires: 365 });
                enqueueSnackbar(
                    `Đăng ký thành công! Đăng nhập với ID: ${result.tenancyName}, tài khoản: ${values.emailAddress
                        .trim()
                        .toLowerCase()} hoặc ${result.userName}`,
                    { variant: 'success', autoHideDuration: 8000 }
                );
                navigate('/login');
            } catch (error) {
                // lỗi từ API đã được hiển thị qua httpService
                helpers.setSubmitting(false);
            }
        }
    });

    const fieldError = (name: keyof typeof formik.values) =>
        formik.touched[name] && formik.errors[name] ? (formik.errors[name] as string) : undefined;

    return (
        <div className="ts-login">
            {/* Bên trái: giới thiệu thương hiệu (ẩn trên điện thoại) */}
            <div className="ts-login__brand">
                <div className="ts-login__brand-logo">
                    <img src={logo} alt="TechShop" />
                    <span>TechShop</span>
                </div>
                <div className="ts-login__brand-body">
                    <h1>Tạo gian hàng của bạn chỉ trong 1 phút.</h1>
                    <p>Đăng ký bằng số điện thoại và gmail, sử dụng ngay toàn bộ tính năng quản lý cửa hàng.</p>
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

            {/* Bên phải: form đăng ký */}
            <div className="ts-login__panel">
                <div className="ts-login__card">
                    <div className="ts-login__mobile-logo">
                        <img src={logo} alt="TechShop" />
                        <span>TechShop</span>
                    </div>
                    <Typography component="h2" className="ts-login__title">
                        Đăng ký gian hàng
                    </Typography>
                    <Typography className="ts-login__subtitle">
                        Số điện thoại sẽ là ID đăng nhập của cửa hàng.
                    </Typography>
                    <form className="ts-login__form" onSubmit={formik.handleSubmit} noValidate>
                        <label className="ts-login__label" htmlFor="tenantName">
                            Tên cửa hàng
                        </label>
                        <TextField
                            {...formik.getFieldProps('tenantName')}
                            id="tenantName"
                            placeholder="Nhập tên cửa hàng"
                            error={!!fieldError('tenantName')}
                            helperText={fieldError('tenantName')}
                            fullWidth
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <StorefrontOutlined fontSize="small" />
                                    </InputAdornment>
                                )
                            }}
                        />

                        <label className="ts-login__label" htmlFor="phoneNumber">
                            Số điện thoại (ID đăng nhập)
                        </label>
                        <TextField
                            {...formik.getFieldProps('phoneNumber')}
                            id="phoneNumber"
                            type="tel"
                            placeholder="VD: 0912345678"
                            error={!!fieldError('phoneNumber')}
                            helperText={fieldError('phoneNumber')}
                            fullWidth
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <PhoneAndroidOutlined fontSize="small" />
                                    </InputAdornment>
                                )
                            }}
                        />

                        <label className="ts-login__label" htmlFor="emailAddress">
                            Gmail
                        </label>
                        <TextField
                            {...formik.getFieldProps('emailAddress')}
                            id="emailAddress"
                            type="email"
                            placeholder="VD: tencuahang@gmail.com"
                            error={!!fieldError('emailAddress')}
                            helperText={fieldError('emailAddress')}
                            fullWidth
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <EmailOutlined fontSize="small" />
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
                            placeholder="Nhập mật khẩu"
                            type={showPassword ? 'text' : 'password'}
                            error={!!fieldError('password')}
                            helperText={fieldError('password')}
                            fullWidth
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockOutlined fontSize="small" />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />

                        <label className="ts-login__label" htmlFor="confirmPassword">
                            Xác nhận mật khẩu
                        </label>
                        <TextField
                            {...formik.getFieldProps('confirmPassword')}
                            id="confirmPassword"
                            placeholder="Nhập lại mật khẩu"
                            type={showConfirmPassword ? 'text' : 'password'}
                            error={!!fieldError('confirmPassword')}
                            helperText={fieldError('confirmPassword')}
                            fullWidth
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockOutlined fontSize="small" />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            edge="end">
                                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />

                        <div className="ts-login__row">
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        {...formik.getFieldProps('agree')}
                                        checked={formik.values.agree}
                                        size="small"
                                    />
                                }
                                label="Tôi đồng ý với Điều khoản và Chính sách bảo mật"
                            />
                        </div>
                        {fieldError('agree') && <FormHelperText error>{fieldError('agree')}</FormHelperText>}

                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            size="large"
                            className="ts-login__submit"
                            disabled={formik.isSubmitting}>
                            {formik.isSubmitting ? (
                                <CircularProgress sx={{ color: 'white' }} size={24} />
                            ) : (
                                'Tạo gian hàng'
                            )}
                        </Button>
                    </form>
                    <Typography sx={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#4b5563' }}>
                        Bạn đã có tài khoản?{' '}
                        <Link className="ts-login__forgot" to="/login">
                            Đăng nhập
                        </Link>
                    </Typography>
                </div>
            </div>
        </div>
    );
};

export default RegisterScreen;
