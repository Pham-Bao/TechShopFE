/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    Dialog,
    DialogContent,
    Grid,
    Stack,
    Avatar,
    TextField,
    Checkbox,
    DialogTitle,
    Button,
    DialogActions,
    Pagination,
    Typography
} from '@mui/material';
import { Search } from '@mui/icons-material';
import utils from '../../../../../utils/utils';
import NhanSuItemDto from '../../../../../services/nhan-vien/dto/nhanSuItemDto';
import { useState, useEffect, useRef } from 'react';
import { NumericFormat } from 'react-number-format';
import { debounce } from '@mui/material/utils';
import ProductService from '../../../../../services/product/ProductService';
import { ModelHangHoaDto, PagedProductSearchDto } from '../../../../../services/product/dto';
import DialogButtonClose from '../../../../../components/Dialog/ButtonClose';
import SnackbarAlert from '../../../../../components/AlertDialog/SnackbarAlert';
import chietKhauDichVuService from '../../../../../services/hoa_hong/chiet_khau_dich_vu/chietKhauDichVuService';
import { ChietKhauDichVuDto_AddMultiple } from '../../../../../services/hoa_hong/chiet_khau_dich_vu/Dto/CreateOrEditChietKhauDichVuDto';
import Cookies from 'js-cookie';
import { Guid } from 'guid-typescript';
import AppConsts, { LoaiHoaHongDichVu } from '../../../../../lib/appconst';
import { LabelDisplayedRows } from '../../../../../components/Pagination/LabelDisplayedRows';
import GroupProductService from '../../../../../services/product/GroupProductService';

export default function ModalSetupHoaHongDichVu({ isShow, nhanVienChosed, allNhanVien, onClose, onSaveOK }: any) {
    const [txtSearchNV, setTxtSearchNV] = useState('');
    const [totalCount, setTotalCount] = useState(0);
    const [totalPage, setTotalPage] = useState(1);
    const [lstNhanVien, setLstNhanVien] = useState<NhanSuItemDto[]>([]);
    const [listProduct, setListProduct] = useState<ModelHangHoaDto[]>([]);
    const [listProductAll, setListProductAll] = useState<ModelHangHoaDto[]>([]);
    const [arrIdQuyDoiChosed, setArrIdQuyDoiChosed] = useState<string[]>([]);
    const [arrIdNhanVienChosed, setArrIdNhanVienChosed] = useState<string[]>([]);

    const [checkAllNVien, setCheckAllNVien] = useState(false);
    const [checkAllProdcuct, setCheckAllProdcuct] = useState(false);

    const [objHoaHongThucHien, setObjHoaHongThucHien] = useState({
        loaiChietKhau: LoaiHoaHongDichVu.THUC_HIEN,
        laPhanTram: true,
        giaTri: 0
    });
    const [objHoaHongTuVan, setObjHoaHongTuVan] = useState({
        loaiChietKhau: LoaiHoaHongDichVu.TU_VAN,
        laPhanTram: true,
        giaTri: 0
    });

    const [paramSearch, setParamSearch] = useState<PagedProductSearchDto>({
        textSearch: '',
        idChiNhanhs: [''],
        currentPage: 1,
        pageSize: AppConsts.pageOption[0].value,
        columnSort: 'NgayLapHoaDon',
        typeSort: 'DESC'
    });

    const [objAlert, setObjAlert] = useState({ show: false, type: 1, mes: '' });
    const [isSaving, setIsSaving] = useState(false);

    const SearchNhanVienClient = () => {
        if (!utils.checkNull(txtSearchNV)) {
            const txt = txtSearchNV.trim().toLowerCase();
            const txtUnsign = utils.strToEnglish(txt);
            const data = allNhanVien.filter(
                (x: NhanSuItemDto) =>
                    (x.maNhanVien !== null && x.maNhanVien.trim().toLowerCase().indexOf(txt) > -1) ||
                    (x.tenNhanVien !== null && x.tenNhanVien.trim().toLowerCase().indexOf(txt) > -1) ||
                    (x.soDienThoai !== null && x.soDienThoai.trim().toLowerCase().indexOf(txt) > -1) ||
                    (x.maNhanVien !== null && utils.strToEnglish(x.maNhanVien).indexOf(txtUnsign) > -1) ||
                    (x.tenNhanVien !== null && utils.strToEnglish(x.tenNhanVien).indexOf(txtUnsign) > -1) ||
                    (x.soDienThoai !== null && utils.strToEnglish(x.soDienThoai).indexOf(txtUnsign) > -1) ||
                    (x.tenChucVu !== null && utils.strToEnglish(x.tenChucVu).indexOf(txtUnsign) > -1)
            );
            setLstNhanVien(data);
        } else {
            setLstNhanVien([...allNhanVien]);
        }
    };

    useEffect(() => {
        if (isShow) {
            setLstNhanVien([...allNhanVien]);
            setIsSaving(false);
            setObjHoaHongThucHien({ loaiChietKhau: 1, laPhanTram: true, giaTri: 0 });
            setObjHoaHongTuVan({ loaiChietKhau: 3, laPhanTram: true, giaTri: 0 });

            setArrIdQuyDoiChosed([]);
            setTxtSearchNV('');
            setParamSearch({ ...paramSearch, textSearch: '', currentPage: 1, pageSize: AppConsts.pageOption[0].value });
            if (nhanVienChosed != null) {
                setArrIdNhanVienChosed([nhanVienChosed?.id]);
            } else {
                setArrIdNhanVienChosed([]);
            }
        }
    }, [isShow]);

    useEffect(() => {
        SearchNhanVienClient();
    }, [txtSearchNV]);

    const debounceProduct = useRef(
        debounce(async (input: string) => {
            GetDanhMucHangHoa(input);
        }, 500)
    ).current;

    const GetDanhMucHangHoa = async (input = '') => {
        const param = { ...paramSearch };
        param.textSearch = input;

        const data = await ProductService.Get_DMHangHoa(param);
        setListProduct(data.items); // Dữ liệu phân trang
        const allData = await fetchAllProducts();
        setListProductAll(allData); // Dữ liệu phân trang
        setTotalCount(data?.totalCount);
        setTotalPage(Math.ceil(data?.totalCount / (paramSearch?.pageSize ?? 10))); // Cung cấp giá trị mặc định cho pageSize nếu undefined
    };

    const fetchAllProducts = async (): Promise<ModelHangHoaDto[]> => {
        const param = { ...paramSearch, pageSize: 10000 }; // Đặt pageSize lớn để lấy tất cả dữ liệu trong một lần
        const data = await ProductService.Get_DMHangHoa(param);

        return data.items; // Trả về tất cả các items trong lần gọi này
    };
    const [data, setData] = useState<any[]>([]); // State để lưu danh sách nhóm hàng
    const GetNhomDichVu = async () => {
        const response = await GroupProductService.GetDM_NhomHangHoa();
        // console.log('Dữ liệu nhóm hàng:', response);
        if (response && response.items) {
            setData(response.items); // Cập nhật dữ liệu nhóm hàng vào state
        }
    };

    useEffect(() => {
        debounceProduct(paramSearch?.textSearch ?? '');
    }, [paramSearch?.textSearch]);

    useEffect(() => {
        GetDanhMucHangHoa();
        GetNhomDichVu();
    }, [paramSearch?.currentPage]);

    const NVien_changeCheckAll = () => {
        const gtriNew = !checkAllNVien;
        setCheckAllNVien(gtriNew);
        const arrIdNhanVienNew = lstNhanVien.map((x) => {
            return x.id;
        });
        if (gtriNew) {
            const arrAddIdUnique = Array.from(new Set([...arrIdNhanVienChosed, ...arrIdNhanVienNew]));
            setArrIdNhanVienChosed(arrAddIdUnique);
        } else {
            setArrIdNhanVienChosed(arrIdNhanVienChosed.filter((x) => !arrIdNhanVienNew.includes(x)));
        }
    };
    const NVien_changeCheckOne = (nvien: NhanSuItemDto) => {
        // check exist this nvien in list chosed
        const exist = arrIdNhanVienChosed.filter((x) => x == nvien.id);
        if (exist.length > 0) {
            // remove if exists
            setArrIdNhanVienChosed(arrIdNhanVienChosed.filter((x) => x !== nvien.id));
            setCheckAllNVien(false);
        } else {
            // add if not
            const arrIdAfterChosed = [...arrIdNhanVienChosed, nvien.id];
            setArrIdNhanVienChosed([...arrIdAfterChosed]);

            // check length of listNVien - list idcurrent chosed
            const arrIdNhanVienSearch = lstNhanVien.map((x) => {
                return x.id;
            });
            // if all nvien search exist in newArray --> checkall
            const arrFindAll = arrIdAfterChosed.filter((x) => arrIdNhanVienSearch.includes(x));
            setCheckAllNVien(arrFindAll.length === arrIdNhanVienSearch.length);
        }
    };

    const NVien_clickBoChon = () => {
        setArrIdNhanVienChosed([]);
        setCheckAllNVien(false);
    };
    const Product_clickBoChon = () => {
        setArrIdQuyDoiChosed([]);
        setCheckAllProdcuct(false);
    };

    const Product_changeCheckAll = () => {
        const gtriNew = !checkAllProdcuct;
        setCheckAllProdcuct(!checkAllProdcuct);
        const arrIdQuyDoiNew = listProductAll.map((x) => {
            return x.idDonViQuyDoi as string;
        });
        if (gtriNew) {
            const arrAddIdUnique = Array.from(new Set([...arrIdQuyDoiChosed, ...arrIdQuyDoiNew]));
            setArrIdQuyDoiChosed(arrAddIdUnique);
        } else {
            setArrIdQuyDoiChosed(arrIdQuyDoiChosed.filter((x) => !arrIdQuyDoiNew.includes(x)));
        }
    };
    const Product_changeCheckByGroup = (groupId: string) => {
        console.log('id chuyền vào', groupId);

        // Lọc các sản phẩm trong nhóm được chọn
        const productsInGroup = listProductAll.filter((product) => product.idNhomHangHoa === groupId);
        const arrIdQuyDoiInGroup = productsInGroup.map((x) => x.idDonViQuyDoi as string);

        console.log('mảng dữ liệu', arrIdQuyDoiInGroup);

        const gtriNew = !arrIdQuyDoiChosed.some((id) => arrIdQuyDoiInGroup.includes(id)); // Kiểm tra trạng thái chọn nhóm

        if (gtriNew) {
            // Thêm các id sản phẩm của nhóm vào danh sách đã chọn
            const arrAddIdUnique = Array.from(new Set([...arrIdQuyDoiChosed, ...arrIdQuyDoiInGroup]));
            setArrIdQuyDoiChosed(arrAddIdUnique);
        } else {
            // Nếu bỏ chọn nhóm, loại bỏ các sản phẩm trong nhóm khỏi danh sách đã chọn
            setArrIdQuyDoiChosed(arrIdQuyDoiChosed.filter((x) => !arrIdQuyDoiInGroup.includes(x)));
        }
    };

    const Product_changeCheckOne = (product: ModelHangHoaDto) => {
        const idQuyDoi = product.idDonViQuyDoi as string;
        // check exist  in list chosed
        const exist = arrIdQuyDoiChosed.filter((x) => x == idQuyDoi);
        if (exist.length > 0) {
            // remove if exists
            setArrIdQuyDoiChosed(arrIdQuyDoiChosed.filter((x) => x !== idQuyDoi));
            setCheckAllProdcuct(false);
        } else {
            // add if not
            const arrIdAfterChosed = [...arrIdQuyDoiChosed, idQuyDoi];
            setArrIdQuyDoiChosed([...arrIdAfterChosed]);

            // check length of list search - list idcurrent chosed
            const arrIdProductSearch = listProduct.map((x) => {
                return x.idDonViQuyDoi as string;
            });
            // if all id in array search exist in newArray --> checkall
            const arrFindAll = arrIdAfterChosed.filter((x) => arrIdProductSearch.includes(x));
            setCheckAllProdcuct(arrFindAll.length === arrIdProductSearch.length);
        }
    };

    const saveSetup = async () => {
        if (arrIdQuyDoiChosed.length === 0) {
            setObjAlert({ ...objAlert, show: true, mes: 'Vui lòng chọn dịch vụ áp dụng', type: 2 });
            return;
        }

        if (isSaving) return;
        setIsSaving(true);

        const idChiNhanh = Cookies.get('IdChiNhanh') ?? Guid.EMPTY;
        const paramThucHien = {
            idChiNhanh: idChiNhanh,
            idNhanViens: arrIdNhanVienChosed,
            idDonViQuyDois: arrIdQuyDoiChosed,
            loaiChietKhau: objHoaHongThucHien.loaiChietKhau,
            giaTri: objHoaHongThucHien.giaTri,
            laPhanTram: objHoaHongThucHien.laPhanTram
        } as ChietKhauDichVuDto_AddMultiple;
        const dataTH = await chietKhauDichVuService.AddMultiple_ChietKhauDichVu_toMultipleNhanVien(paramThucHien);
        // const dataTHV2 = await chietKhauDichVuService.AddMultiple_ChietKhauDichVu_toMultipleNhanVienV2(paramThucHien);

        setIsSaving(false);
        if (dataTH === 0) {
            setObjAlert({ ...objAlert, show: true, mes: 'Cài đặt hoa hồng dịch vụ thất bại', type: 2 });
            return;
        }
        setObjAlert({ ...objAlert, show: true, mes: 'Cài đặt hoa hồng dịch vụ thành công', type: 1 });
        onSaveOK();
    };

    const handleChangePage = (event: any, value: number) => {
        setParamSearch({
            ...paramSearch,
            currentPage: value
        });
    };

    return (
        <>
            <SnackbarAlert
                showAlert={objAlert.show}
                type={objAlert.type}
                title={objAlert.mes}
                handleClose={() => setObjAlert({ show: false, mes: '', type: 1 })}></SnackbarAlert>
            <Dialog open={isShow} maxWidth="md" fullWidth onClose={onClose}>
                <DialogTitle className="modal-title">
                    Cài đặt hoa hồng dịch vụ {`(${nhanVienChosed?.tenNhanVien})`}
                    <DialogButtonClose onClose={onClose} />
                </DialogTitle>
                <DialogContent sx={{ paddingTop: '16px!important' }}>
                    <Grid container spacing={2}>
                        {/* Cột 1: Checkbox để chọn nhóm */}
                        <Grid item xs={12} md={3} lg={3}>
                            <Stack>
                                {/* Tiêu đề */}
                                <Typography
                                    variant="h6"
                                    sx={{
                                        fontWeight: 'bold',
                                        marginBottom: 1,
                                        textAlign: 'center',
                                        backgroundColor: 'var(--color-bg-header)',
                                        padding: '4px 0'
                                    }}>
                                    Chọn nhóm dịch vụ
                                </Typography>
                                <Stack
                                    justifyContent={'space-between'}
                                    direction={'row'}
                                    fontSize={'13px'}
                                    alignItems={'center'}
                                    paddingRight={1}
                                    sx={{ backgroundColor: 'var(--color-bg)' }}>
                                    <Stack direction={'row'} alignItems={'center'} onClick={Product_changeCheckAll}>
                                        <Checkbox value={checkAllProdcuct} checked={checkAllProdcuct} />
                                        <span style={{ cursor: 'pointer', fontWeight: 'bold' }}> Chọn tất cả nhóm</span>
                                    </Stack>
                                </Stack>

                                {/* Danh sách nhóm dịch vụ */}
                                <Stack sx={{ overflow: 'auto', maxHeight: 400, marginTop: 1 }}>
                                    {data.map((item: any, index: number) => (
                                        <Stack
                                            direction="row"
                                            alignItems="center"
                                            key={item.id}
                                            sx={{
                                                borderBottom: '1px dashed #cccc',
                                                padding: '6px',
                                                marginBottom: '2px',
                                                cursor: 'pointer',
                                                fontWeight: 'bold'
                                            }}
                                            onClick={() => Product_changeCheckByGroup(item.id)}>
                                            <Checkbox
                                                checked={arrIdQuyDoiChosed.some((id) =>
                                                    listProductAll.some(
                                                        (product) =>
                                                            product.idNhomHangHoa === item.id &&
                                                            product.idDonViQuyDoi === id
                                                    )
                                                )}
                                            />
                                            <span style={{ fontSize: '14px' }}>{item.tenNhomHang}</span>
                                        </Stack>
                                    ))}
                                </Stack>
                            </Stack>
                        </Grid>

                        {/* Cột 2: Tìm kiếm và danh sách dịch vụ */}
                        <Grid item xs={12} md={9} lg={9}>
                            <Stack>
                                <TextField
                                    size="small"
                                    fullWidth
                                    label="Tìm dịch vụ"
                                    value={paramSearch?.textSearch ?? ''}
                                    onChange={(event) => {
                                        setParamSearch({ ...paramSearch, textSearch: event.currentTarget.value });
                                    }}
                                    InputProps={{
                                        startAdornment: <Search />
                                    }}
                                />
                                <Stack sx={{ overflow: 'auto', maxHeight: 400, marginTop: 2 }}>
                                    {listProduct?.map((item: ModelHangHoaDto, index: number) => (
                                        <Stack
                                            direction="row"
                                            justifyContent="space-between"
                                            key={index}
                                            sx={{
                                                borderBottom: `1px dashed ${
                                                    arrIdQuyDoiChosed.includes(item?.idDonViQuyDoi as string)
                                                        ? '#ff7171'
                                                        : '#cccc'
                                                }`,
                                                padding: '6px',
                                                backgroundColor: arrIdQuyDoiChosed.includes(
                                                    item?.idDonViQuyDoi as string
                                                )
                                                    ? 'antiquewhite'
                                                    : ''
                                            }}
                                            onClick={() => Product_changeCheckOne(item)}>
                                            <Stack direction="row">
                                                <Checkbox
                                                    checked={arrIdQuyDoiChosed.includes(item?.idDonViQuyDoi as string)}
                                                />
                                                <Stack spacing={1}>
                                                    <Stack sx={{ fontSize: '14px' }}>{item?.tenHangHoa}</Stack>
                                                    <Stack sx={{ fontStyle: 'italic', fontSize: '12px' }}>
                                                        {item?.tenNhomHang}
                                                    </Stack>
                                                </Stack>
                                            </Stack>

                                            <Stack sx={{ fontSize: '14px' }}>
                                                {new Intl.NumberFormat('vi-VN').format(item?.giaBan as number)}
                                            </Stack>
                                        </Stack>
                                    ))}
                                </Stack>
                            </Stack>
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ paddingBottom: '16px!important' }}>
                    <Grid container sx={{ paddingRight: '16px', paddingLeft: '24px' }}>
                        <Grid item xs={8}>
                            <Stack direction="row">
                                <LabelDisplayedRows
                                    currentPage={paramSearch?.currentPage ?? 1}
                                    pageSize={paramSearch?.pageSize ?? 10}
                                    totalCount={totalCount}
                                />
                                <Pagination
                                    shape="rounded"
                                    count={totalPage}
                                    page={paramSearch?.currentPage ?? 1}
                                    defaultPage={paramSearch?.currentPage ?? 1}
                                    onChange={handleChangePage}
                                />
                            </Stack>
                        </Grid>
                        <Grid item xs={4}>
                            <Stack spacing={1} direction={'row'} justifyContent={'end'}>
                                <Button variant="outlined" onClick={onClose}>
                                    Bỏ qua
                                </Button>
                                {isSaving ? (
                                    <Button variant="contained">Đang lưu</Button>
                                ) : (
                                    <Button variant="contained" onClick={saveSetup}>
                                        Áp dụng
                                    </Button>
                                )}
                            </Stack>
                        </Grid>
                    </Grid>
                </DialogActions>
            </Dialog>
        </>
    );
}
