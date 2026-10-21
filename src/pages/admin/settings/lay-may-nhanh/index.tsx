import React, { useEffect, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Checkbox,
    Chip,
    CircularProgress,
    FormControlLabel,
    Grid,
    Link,
    Paper,
    Stack,
    Step,
    StepButton,
    StepIconProps,
    StepLabel,
    Stepper,
    Typography
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import { ButtonNavigate } from '../../../../components/Button/ButtonNavigate';

// iTunes cho Windows: Apple phát hành qua Microsoft Store; máy không có Store thì tải bản cài từ Apple
const LINK_ITUNES = 'https://apps.microsoft.com/detail/9pb2mz1zmb1s';
const LINK_ITUNES_STORE_APP = 'ms-windows-store://pdp/?productid=9PB2MZ1ZMB1S';
const LINK_ITUNES_APPLE = 'https://www.apple.com/itunes/download/win64';
// gói cài PhoneAgent để ở wwwroot/Download của Backend
const LINK_PHONE_AGENT = `${(process.env.REACT_APP_REMOTE_SERVICE_BASE_URL ?? '').replace(
    /\/+$/,
    ''
)}/Download/PhoneAgent.zip`;
// PhoneAgent chạy trên chính máy đang mở trình duyệt
const URL_PHONE_AGENT = 'http://localhost:6789/api/iphone/info';
const KEY_DA_CAI_ITUNES = 'TechShop_LayMayNhanh_DaCaiITunes';

const CAC_BUOC = ['Bước 1: Cài iTunes', 'Bước 2: Tải và cài PhoneAgent', 'Bước 3: Kiểm tra tất cả'];

type TrangThaiAgent = 'dang-kiem-tra' | 'dang-chay' | 'chua-chay';

const docDaCaiITunes = () => {
    try {
        return localStorage.getItem(KEY_DA_CAI_ITUNES) === '1';
    } catch {
        return false;
    }
};
const ghiDaCaiITunes = (value: boolean) => {
    try {
        if (value) localStorage.setItem(KEY_DA_CAI_ITUNES, '1');
        else localStorage.removeItem(KEY_DA_CAI_ITUNES);
    } catch {
        // trình duyệt chặn bộ nhớ: chỉ không nhớ được bước đã làm
    }
};

// biểu tượng bước: xong = tick xanh lá, đang làm = màu chủ đạo, chưa làm = xám
const BieuTuongBuoc = ({ active, completed, icon }: StepIconProps) => {
    if (completed) {
        return <CheckCircleIcon sx={{ color: '#16a34a', fontSize: 28 }} />;
    }
    return (
        <Box
            sx={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 700,
                color: '#fff',
                backgroundColor: active ? 'var(--color-main)' : '#bdbdbd'
            }}>
            {icon}
        </Box>
    );
};

const DongHuongDan = ({ so, children }: { so: number; children: React.ReactNode }) => (
    <Stack direction="row" spacing={1.5} sx={{ mb: 1.5 }}>
        <Box
            sx={{
                minWidth: 24,
                height: 24,
                borderRadius: '50%',
                backgroundColor: '#eef2ff',
                color: 'var(--color-main)',
                fontSize: 13,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
            {so}
        </Box>
        <Box sx={{ fontSize: 14, lineHeight: '24px' }}>{children}</Box>
    </Stack>
);

/**
 * Cài đặt lấy máy nhanh: hướng dẫn cài iTunes + PhoneAgent (chạy nền như Windows Service)
 * để nút "Lấy nhanh máy" đọc được thông tin iPhone cắm USB.
 */
const CaiDatLayMayNhanh = () => {
    const [daCaiITunes, setDaCaiITunes] = useState(docDaCaiITunes());
    const [buoc, setBuoc] = useState(docDaCaiITunes() ? 1 : 0);
    const [trangThai, setTrangThai] = useState<TrangThaiAgent>('dang-kiem-tra');
    const [daKiemTraTatCa, setDaKiemTraTatCa] = useState(false);

    // gọi thử PhoneAgent: phản hồi được = đang chạy
    const kiemTraAgent = async () => {
        setTrangThai('dang-kiem-tra');
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4000);
        try {
            await fetch(URL_PHONE_AGENT, { signal: controller.signal });
            setTrangThai('dang-chay');
            return true;
        } catch {
            setTrangThai('chua-chay');
            return false;
        } finally {
            clearTimeout(timer);
        }
    };

    useEffect(() => {
        // đã cài xong từ trước: mở thẳng bước kiểm tra
        kiemTraAgent().then((ok) => ok && setBuoc(2));
    }, []);

    const chonDaCaiITunes = (value: boolean) => {
        ghiDaCaiITunes(value);
        setDaCaiITunes(value);
        if (value) setBuoc(1);
    };

    const kiemTraTatCa = async () => {
        await kiemTraAgent();
        setDaKiemTraTatCa(true);
    };

    const daChay = trangThai === 'dang-chay';
    // CaiDat.bat chỉ cài xong PhoneAgent khi máy đã có iTunes -> PhoneAgent chạy được thì iTunes chắc chắn đã có
    const iTunesOk = daChay || daCaiITunes;
    const sanSang = iTunesOk && daChay;
    const hoanThanh = [iTunesOk, daChay, daKiemTraTatCa && sanSang];

    const ketQua = (ok: boolean, tieuDe: string, moTa: string, buocSua: number) => (
        <Stack
            direction="row"
            alignItems="center"
            spacing={1.5}
            sx={{ p: 1.5, border: '1px solid #e5e7eb', borderRadius: 2, mb: 1 }}>
            {ok ? <CheckCircleIcon sx={{ color: '#16a34a' }} /> : <HighlightOffIcon sx={{ color: '#dc2626' }} />}
            <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{tieuDe}</Typography>
                <Typography sx={{ fontSize: 13, color: '#6b7280' }}>{moTa}</Typography>
            </Box>
            {!ok && (
                <Button size="small" onClick={() => setBuoc(buocSua)} sx={{ textTransform: 'none' }}>
                    Đến {CAC_BUOC[buocSua].split(':')[0]}
                </Button>
            )}
        </Stack>
    );

    return (
        <Grid container spacing={3} paddingTop={2}>
            <Grid item xs={12}>
                <Stack justifyContent="space-between" direction="row">
                    <Typography fontSize={18} fontWeight={600}>
                        Cài đặt lấy máy nhanh
                    </Typography>
                    <ButtonNavigate navigateTo="/settings" btnText="Trở về cài đặt" />
                </Stack>
                <Typography sx={{ mt: 0.5, fontSize: 14, color: '#6b7280' }}>
                    Cài 1 lần trên mỗi máy tính ở quầy để nút <b>“Lấy nhanh máy”</b> tự điền tên máy, dung lượng, màu,
                    IMEI, pin của iPhone đang cắm cáp USB.
                </Typography>
            </Grid>

            <Grid item xs={12}>
                <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
                    {/* THANH CÁC BƯỚC (ngang) */}
                    <Stepper nonLinear activeStep={buoc} alternativeLabel sx={{ mb: 3 }}>
                        {CAC_BUOC.map((ten, index) => (
                            <Step key={ten} completed={hoanThanh[index]}>
                                <StepButton onClick={() => setBuoc(index)}>
                                    <StepLabel StepIconComponent={BieuTuongBuoc}>
                                        <Typography
                                            sx={{
                                                fontSize: 14,
                                                fontWeight: index === buoc ? 800 : 600,
                                                color: hoanThanh[index] ? '#16a34a' : undefined
                                            }}>
                                            {ten}
                                        </Typography>
                                    </StepLabel>
                                </StepButton>
                            </Step>
                        ))}
                    </Stepper>

                    <Box sx={{ maxWidth: 820, mx: 'auto', minHeight: 260 }}>
                        {/* BƯỚC 1: iTunes */}
                        {buoc === 0 && (
                            <>
                                <Typography sx={{ fontWeight: 800, mb: 1 }}>Cài iTunes</Typography>
                                <Typography sx={{ fontSize: 14, color: '#6b7280', mb: 2 }}>
                                    iTunes là phần mềm miễn phí của Apple. Máy tính cần iTunes để nhận iPhone khi cắm
                                    cáp USB. Chỉ cần cài 1 lần, không cần đăng nhập tài khoản Apple.
                                </Typography>
                                <DongHuongDan so={1}>
                                    Bấm nút <b>“Tải iTunes”</b> bên dưới. Trình duyệt mở trang iTunes trên Microsoft
                                    Store (cửa hàng ứng dụng có sẵn trong Windows).
                                </DongHuongDan>
                                <DongHuongDan so={2}>
                                    Trên trang đó bấm <b>“Tải xuống”</b> / <b>“Nhận”</b> / <b>“Get”</b>. Nếu trình duyệt
                                    hỏi “Mở Microsoft Store?” thì bấm <b>Mở</b>, sau đó bấm <b>Nhận</b> trong cửa sổ
                                    Microsoft Store.
                                </DongHuongDan>
                                <DongHuongDan so={3}>
                                    Chờ tải và cài xong (khoảng vài phút, tùy mạng). Khi xong, nút trong Microsoft Store
                                    đổi thành <b>“Mở”</b>.
                                </DongHuongDan>
                                <DongHuongDan so={4}>
                                    Bấm <b>Mở</b> để chạy iTunes lần đầu, bấm <b>Đồng ý</b> (Agree) với điều khoản rồi
                                    đóng iTunes lại. Không cần đăng nhập.
                                </DongHuongDan>
                                <DongHuongDan so={5}>
                                    Quay lại trang này và tích vào ô <b>“Tôi đã cài xong iTunes”</b>.
                                </DongHuongDan>
                                <Stack direction="row" spacing={1} sx={{ my: 2, flexWrap: 'wrap', rowGap: 1 }}>
                                    <Button
                                        variant="contained"
                                        startIcon={<OpenInNewIcon />}
                                        href={LINK_ITUNES}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{ textTransform: 'none', boxShadow: 'none' }}>
                                        Tải iTunes
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        href={LINK_ITUNES_STORE_APP}
                                        sx={{ textTransform: 'none' }}>
                                        Mở thẳng ứng dụng Microsoft Store
                                    </Button>
                                </Stack>
                                <Typography sx={{ fontSize: 13, color: '#6b7280', mb: 2 }}>
                                    Máy không có Microsoft Store hoặc không tải được?{' '}
                                    <Link href={LINK_ITUNES_APPLE} target="_blank" rel="noopener noreferrer">
                                        Tải bản cài iTunes trực tiếp từ Apple
                                    </Link>{' '}
                                    rồi bấm đúp file vừa tải, chọn <b>Next</b> → <b>Install</b> → <b>Finish</b>.
                                </Typography>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={daCaiITunes}
                                            color="success"
                                            onChange={(e) => chonDaCaiITunes(e.target.checked)}
                                        />
                                    }
                                    label={<Typography sx={{ fontWeight: 700 }}>Tôi đã cài xong iTunes</Typography>}
                                />
                            </>
                        )}

                        {/* BƯỚC 2: PhoneAgent */}
                        {buoc === 1 && (
                            <>
                                <Typography sx={{ fontWeight: 800, mb: 1 }}>Tải và cài PhoneAgent</Typography>
                                <Typography sx={{ fontSize: 14, color: '#6b7280', mb: 2 }}>
                                    PhoneAgent là chương trình nhỏ chạy nền trên máy tính (Windows Service), tự khởi
                                    động mỗi khi bật máy để đọc thông tin iPhone.
                                </Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<FileDownloadOutlinedIcon />}
                                    href={LINK_PHONE_AGENT}
                                    sx={{ textTransform: 'none', boxShadow: 'none', mb: 2 }}>
                                    Tải PhoneAgent (PhoneAgent.zip)
                                </Button>
                                <DongHuongDan so={1}>
                                    Mở thư mục <b>Tải xuống</b> (Downloads), chuột phải file <b>PhoneAgent.zip</b> →
                                    chọn <b>Giải nén tất cả</b> (Extract All) → <b>Giải nén</b>.
                                </DongHuongDan>
                                <DongHuongDan so={2}>
                                    Trong thư mục vừa giải nén, chuột phải file <b>CaiDat.bat</b> →{' '}
                                    <b>Chạy với quyền quản trị</b> (Run as administrator), chọn <b>Có</b> (Yes) khi
                                    Windows hỏi.
                                </DongHuongDan>
                                <DongHuongDan so={3}>
                                    Chờ cửa sổ hiện <b>[THANH CONG]</b> rồi đóng cửa sổ. Có thể xóa thư mục vừa giải
                                    nén.
                                </DongHuongDan>
                                <DongHuongDan so={4}>
                                    Bấm <b>“Kiểm tra lại”</b> bên dưới.
                                </DongHuongDan>
                                <Alert
                                    severity="warning"
                                    sx={{ my: 2, fontSize: 13 }}
                                    action={
                                        <Button
                                            color="inherit"
                                            size="small"
                                            onClick={() => setBuoc(0)}
                                            sx={{ textTransform: 'none' }}>
                                            Quay lại Bước 1
                                        </Button>
                                    }>
                                    Nếu cửa sổ CaiDat.bat báo <b>[LOI] May tinh nay CHUA CAI iTunes</b>: máy chưa có
                                    iTunes, hãy quay lại Bước 1 cài iTunes rồi chạy lại CaiDat.bat.
                                </Alert>
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    {trangThai === 'dang-kiem-tra' ? (
                                        <Chip
                                            icon={<CircularProgress size={14} />}
                                            label="Đang kiểm tra PhoneAgent..."
                                        />
                                    ) : daChay ? (
                                        <Chip
                                            color="success"
                                            icon={<CheckCircleOutlineIcon />}
                                            label="PhoneAgent đang chạy trên máy này"
                                        />
                                    ) : (
                                        <Chip color="error" icon={<HighlightOffIcon />} label="PhoneAgent chưa chạy" />
                                    )}
                                    <Button
                                        size="small"
                                        startIcon={<RefreshIcon />}
                                        onClick={() => kiemTraAgent().then((ok) => ok && setBuoc(2))}
                                        sx={{ textTransform: 'none' }}>
                                        Kiểm tra lại
                                    </Button>
                                </Stack>
                                {trangThai === 'chua-chay' && (
                                    <Typography sx={{ mt: 1.5, fontSize: 13, color: '#6b7280' }}>
                                        Đã cài mà vẫn báo chưa chạy: nếu trình duyệt hỏi quyền truy cập “thiết bị trong
                                        mạng cục bộ” hãy chọn <b>Cho phép</b>, hoặc kiểm tra service{' '}
                                        <b>TechShop PhoneAgent</b> trong <b>services.msc</b>.
                                    </Typography>
                                )}
                            </>
                        )}

                        {/* BƯỚC 3: Kiểm tra tất cả */}
                        {buoc === 2 && (
                            <>
                                <Typography sx={{ fontWeight: 800, mb: 1 }}>Kiểm tra tất cả</Typography>
                                <Typography sx={{ fontSize: 14, color: '#6b7280', mb: 2 }}>
                                    Kiểm tra máy tính này đã sẵn sàng dùng “Lấy nhanh máy” chưa.
                                </Typography>
                                <Button
                                    variant="contained"
                                    startIcon={
                                        trangThai === 'dang-kiem-tra' ? (
                                            <CircularProgress size={16} color="inherit" />
                                        ) : (
                                            <RefreshIcon />
                                        )
                                    }
                                    disabled={trangThai === 'dang-kiem-tra'}
                                    onClick={kiemTraTatCa}
                                    sx={{ textTransform: 'none', boxShadow: 'none', mb: 2 }}>
                                    Kiểm tra
                                </Button>
                                {ketQua(
                                    iTunesOk,
                                    'iTunes',
                                    iTunesOk ? 'Đã cài iTunes' : 'Chưa cài / chưa xác nhận cài iTunes',
                                    0
                                )}
                                {ketQua(
                                    daChay,
                                    'PhoneAgent',
                                    daChay ? 'Đang chạy nền trên máy này' : 'Chưa chạy trên máy này',
                                    1
                                )}
                                {daKiemTraTatCa && trangThai !== 'dang-kiem-tra' && (
                                    <Alert severity={sanSang ? 'success' : 'error'} sx={{ mt: 2 }}>
                                        {sanSang
                                            ? 'Đã sẵn sàng! Có thể dùng nút “Lấy nhanh máy” khi thêm / nhập điện thoại.'
                                            : 'Chưa sẵn sàng. Làm lại bước còn thiếu ở trên.'}
                                    </Alert>
                                )}
                            </>
                        )}
                    </Box>

                    {/* ĐIỀU HƯỚNG */}
                    <Stack direction="row" justifyContent="space-between" sx={{ mt: 3, maxWidth: 820, mx: 'auto' }}>
                        <Button
                            variant="outlined"
                            disabled={buoc === 0}
                            onClick={() => setBuoc(buoc - 1)}
                            sx={{ textTransform: 'none' }}>
                            Quay lại
                        </Button>
                        <Button
                            variant="contained"
                            disabled={buoc === CAC_BUOC.length - 1}
                            onClick={() => setBuoc(buoc + 1)}
                            sx={{ textTransform: 'none', boxShadow: 'none' }}>
                            Tiếp tục
                        </Button>
                    </Stack>
                </Paper>
            </Grid>
        </Grid>
    );
};

export default CaiDatLayMayNhanh;
