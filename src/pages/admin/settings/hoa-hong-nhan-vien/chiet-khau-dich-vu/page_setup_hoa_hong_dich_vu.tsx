/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { DataGrid, GridColDef, GridRenderCellParams, GridRowId, GridRowModel } from '@mui/x-data-grid';
import {
    Grid,
    Box,
    Stack,
    Typography,
    TextField,
    Button,
    Pagination,
    IconButton,
    Avatar,
    Popover,
    ButtonGroup,
    Checkbox,
    Menu,
    MenuItem
} from '@mui/material';
import { Add, CopyAll, Search } from '@mui/icons-material';
import ClearOutlinedIcon from '@mui/icons-material/ClearOutlined';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import { PropConfirmOKCancel } from '../../../../../utils/PropParentToChild';
import utils from '../../../../../utils/utils';
import fileDowloadService from '../../../../../services/file-dowload.service';
import ConfirmDelete from '../../../../../components/AlertDialog/ConfirmDelete';
import SnackbarAlert from '../../../../../components/AlertDialog/SnackbarAlert';
import { TextTranslate } from '../../../../../components/TableLanguage';
import { OptionPage } from '../../../../../components/Pagination/OptionPage';
import { LabelDisplayedRows } from '../../../../../components/Pagination/LabelDisplayedRows';
import { PagedResultDto } from '../../../../../services/dto/pagedResultDto';
import { ChietKhauDichVuItemDto_TachRiengCot } from '../../../../../services/hoa_hong/chiet_khau_dich_vu/Dto/ChietKhauDichVuItemDto';
import nhanVienService from '../../../../../services/nhan-vien/nhanVienService';
import { PagedNhanSuRequestDto } from '../../../../../services/nhan-vien/dto/PagedNhanSuRequestDto';
import NhanSuItemDto from '../../../../../services/nhan-vien/dto/nhanSuItemDto';
import { ModelNhomHangHoa } from '../../../../../services/product/dto';
import { PagedRequestDto } from '../../../../../services/dto/pagedRequestDto';
import chietKhauDichVuService from '../../../../../services/hoa_hong/chiet_khau_dich_vu/chietKhauDichVuService';
import Cookies from 'js-cookie';
import { Guid } from 'guid-typescript';
import { NumericFormat } from 'react-number-format';
import ModalSetupHoaHongDichVu from './modal_setup_hoa_hong_dich_vu';
import { debounce } from '@mui/material/utils';
import {
    ChietKhauDichVuDto_AddMultiple,
    CreateOrEditChietKhauDichVuDto
} from '../../../../../services/hoa_hong/chiet_khau_dich_vu/Dto/CreateOrEditChietKhauDichVuDto';
import { LoaiHoaHongDichVu } from '../../../../../lib/appconst';
import abpCustom from '../../../../../components/abp-custom';
import { ButtonNavigate } from '../../../../../components/Button/ButtonNavigate';
import { Person } from '@mui/icons-material'; // Import icon user
import { Category } from '@mui/icons-material'; // Import icon dịch vụ
import GroupProductService from '../../../../../services/product/GroupProductService';
import CommissionCopyDialog from './CommissionCopyDialog';
import SettingsIcon from '@mui/icons-material/Settings';
import CopyIcon from '@mui/icons-material/FileCopy';
import MenuIcon from '@mui/icons-material/Menu';

const TypeGroupPopover = {
    NHAN_VIEN: 1,
    DICH_VU: 2,
    NHOM_DICH_VU: 3
};

export function PopperSetupHoaHongDV_byGroup({
    id,
    open,
    anchorEl,
    lblGroupPopover,
    lblGroupPopoverV2,
    rowChosed = {} as ChietKhauDichVuItemDto_TachRiengCot,
    onClose,
    onApply,
    loaiChietKhauActive
}: any) {
    const inputEl = useRef<HTMLInputElement>(null);
    const [lblLoaiHoaHong, setLblLoaiHoaHong] = useState('');
    const [isCheck, setIsCheck] = useState(false);
    const [gtriCK, setGiaTriCK] = useState(0);
    const [laPhanTram, setLaPhanTram] = useState(true);
    const [loaiChietKhau, setLoaiChietKhau] = useState(LoaiHoaHongDichVu.THUC_HIEN);
    const [loaiApply, setLoaiApply] = useState(0);

    useEffect(() => {
        switch (loaiChietKhau) {
            case LoaiHoaHongDichVu.THUC_HIEN:
                setLblLoaiHoaHong('Hoa hồng thực hiện');
                break;
            case LoaiHoaHongDichVu.YEU_CAU_THUC_HIEN:
                setLblLoaiHoaHong('Hoa hồng yêu cầu thực hiện');
                break;
            case LoaiHoaHongDichVu.TU_VAN:
                setLblLoaiHoaHong('Hoa hồng tư vấn');
                break;
        }
    }, [loaiChietKhau]);

    useEffect(() => {
        gettest(loaiChietKhauActive);
        switch (loaiChietKhau) {
            case LoaiHoaHongDichVu.THUC_HIEN:
                {
                    setGiaTriCK(rowChosed?.hoaHongThucHien);
                    setLaPhanTram(rowChosed?.laPhanTram_HoaHongThucHien);
                }
                break;
            case LoaiHoaHongDichVu.YEU_CAU_THUC_HIEN:
                {
                    setGiaTriCK(rowChosed?.hoaHongYeuCau);
                    setLaPhanTram(rowChosed?.laPhanTram_HoaHongYeuCauThucHien);
                }
                break;
            case LoaiHoaHongDichVu.TU_VAN:
                {
                    setGiaTriCK(rowChosed?.hoaHongTuVan);
                    setLaPhanTram(rowChosed?.laPhanTram_HoaHongTuVan);
                }
                break;
        }
    }, [open]);

    const handleFocus = () => {
        if (inputEl.current) {
            // why not select?? todo
            inputEl.current.select();
        }
    };

    const clickPtramVND = (gtriNew: boolean) => {
        setLaPhanTram(gtriNew);
        if (laPhanTram) {
            if (!gtriNew) {
                // % to vnd
                setGiaTriCK((gtriCK * rowChosed?.giaDichVu) / 100);
            }
        } else {
            if (gtriNew) {
                // vnd to %
                if (rowChosed?.giaDichVu > 0) {
                    setGiaTriCK((gtriCK / rowChosed?.giaDichVu) * 100);
                } else {
                    setGiaTriCK(0);
                }
            }
        }
    };

    const changeGtriChietKhau = (gtri: string) => {
        setGiaTriCK(utils.formatNumberToFloat(gtri));
    };

    const gettest = (loaiChietKhauActive: number) => {
        console.log(loaiChietKhauActive);
    };

    const onClickApply = () => {
        onApply(gtriCK, laPhanTram, isCheck, loaiChietKhauActive, loaiApply);
        onClose();
    };

    return (
        <>
            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={onClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left'
                }}>
                <Stack padding={2} spacing={1}>
                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                        <Typography variant="body2">
                            Loại chiết khấu:{' '}
                            <span style={{ fontWeight: 'bold' }}>
                                {(() => {
                                    switch (loaiChietKhauActive) {
                                        case LoaiHoaHongDichVu.THUC_HIEN:
                                            return 'Hoa hồng thực hiện';
                                        case LoaiHoaHongDichVu.YEU_CAU_THUC_HIEN:
                                            return 'Hoa hồng yêu cầu thực hiện';
                                        case LoaiHoaHongDichVu.TU_VAN:
                                            return 'Hoa hồng tư vấn';
                                        default:
                                            return 'Không xác định';
                                    }
                                })()}
                            </span>
                        </Typography>

                        {/* <ButtonGroup>
                            <Button
                                size="small"
                                variant={loaiChietKhau === LoaiHoaHongDichVu.THUC_HIEN ? 'contained' : 'outlined'}
                                onClick={() => setLoaiChietKhau(LoaiHoaHongDichVu.THUC_HIEN)}>
                                Thực hiện
                            </Button>{' '}
                            <Button
                                size="small"
                                variant={
                                    loaiChietKhau === LoaiHoaHongDichVu.YEU_CAU_THUC_HIEN ? 'contained' : 'outlined'
                                }
                                onClick={() => setLoaiChietKhau(LoaiHoaHongDichVu.YEU_CAU_THUC_HIEN)}>
                                Yêu cầu
                            </Button>
                            <Button
                                size="small"
                                variant={loaiChietKhau === LoaiHoaHongDichVu.TU_VAN ? 'contained' : 'outlined'}
                                onClick={() => setLoaiChietKhau(LoaiHoaHongDichVu.TU_VAN)}>
                                Tư vấn
                            </Button>
                        </ButtonGroup> */}
                    </Stack>

                    <Stack direction={'row'} spacing={1} alignItems={'center'}>
                        <Typography variant="body2">{`${lblLoaiHoaHong} = `}</Typography>
                        <Stack direction={'row'} spacing={1}>
                            <NumericFormat
                                fullWidth
                                size="small"
                                inputRef={inputEl}
                                autoFocus
                                thousandSeparator={'.'}
                                decimalSeparator={','}
                                value={gtriCK}
                                customInput={TextField}
                                InputProps={{
                                    inputProps: {
                                        style: { textAlign: 'right' }
                                    }
                                }}
                                onChange={(e) => changeGtriChietKhau(e.target.value)}
                                // onFocus={handleFocus}
                                onFocus={handleFocus}
                                isAllowed={(values) => {
                                    const floatValue = values.floatValue;
                                    if (laPhanTram) return (floatValue ?? 0) <= 100;
                                    return true;
                                }}
                            />
                            <ButtonGroup>
                                <Button
                                    size="small"
                                    variant={laPhanTram ? 'contained' : 'outlined'}
                                    onClick={() => clickPtramVND(true)}>
                                    %
                                </Button>
                                <Button
                                    size="small"
                                    variant={!laPhanTram ? 'contained' : 'outlined'}
                                    onClick={() => clickPtramVND(false)}>
                                    đ
                                </Button>
                            </ButtonGroup>
                        </Stack>
                    </Stack>
                    <Stack direction={'row'} spacing={1} alignItems={'center'}>
                        <Checkbox
                            value={isCheck}
                            onChange={(e) => {
                                setIsCheck(e.currentTarget.checked);
                                setLoaiApply(3);
                            }}
                        />
                        <Stack direction={'row'} spacing={0.1}>
                            <Typography variant="body2"> Áp dụng cho tất cả dịch vụ</Typography>
                            <Typography variant="body2" fontWeight={500}>
                                {' '}
                                {lblGroupPopover}
                            </Typography>
                        </Stack>
                    </Stack>
                    <Stack direction={'row'} spacing={1} alignItems={'center'}>
                        <Checkbox
                            value={isCheck}
                            onChange={(e) => {
                                setIsCheck(e.currentTarget.checked);
                                setLoaiApply(1);
                            }}
                        />
                        <Stack direction={'row'} spacing={0.1}>
                            <Typography variant="body2"> Áp dụng cho tất cả dịch vụ</Typography>
                            <Typography variant="body2" fontWeight={500}>
                                {' '}
                                {lblGroupPopoverV2}
                            </Typography>
                        </Stack>
                    </Stack>

                    <Stack direction={'row'}>
                        <Stack flex={3}></Stack>
                        <Stack flex={1} justifyContent={'end'}>
                            <Button variant="contained" fullWidth onClick={onClickApply}>
                                Áp dụng
                            </Button>
                        </Stack>
                    </Stack>
                </Stack>
            </Popover>
        </>
    );
}

export default function PageSetupHoaHongDichVu() {
    const [inforDeleteProduct, setInforDeleteProduct] = useState<PropConfirmOKCancel>(
        new PropConfirmOKCancel({ show: false })
    );
    const [objAlert, setObjAlert] = useState({ show: false, type: 1, mes: '' });
    const [isShowModalSetup, setIsShowModalSetup] = useState(false);
    const [txtSearchNV, setTxtSearchNV] = useState('');
    const [idNhanVienChosed, setIdNhanVienChosed] = useState<string>(Guid.EMPTY);
    const [allData, setAllData] = useState<any[]>([]); // Dữ liệu gốc từ API
    const [filteredData, setFilteredData] = useState<any[]>([]); // Dữ liệu đã lọc
    const [lstNhanVien, setLstNhanVien] = useState<NhanSuItemDto[]>([]);
    const [allNhanVien, setAllNhanVien] = useState<NhanSuItemDto[]>([]);
    const [allNhomDichVuNhomDichVu, setAllNhomDichVu] = useState<ModelNhomHangHoa[]>([]);
    const [nhanVienChosed, setNhanVienChosed] = useState<NhanSuItemDto | null>();
    const [rowChosed, setRowChosed] = useState<ChietKhauDichVuItemDto_TachRiengCot | null>(null);
    const idChiNhanh = Cookies.get('IdChiNhanh') ?? Guid.EMPTY;
    const [anchorPopover, setAnchorPopover] = React.useState<HTMLDivElement | null>(null);
    const [lblGroupPopover, setLblGroupPopover] = useState('');
    const [lblGroupPopoverV2, setLblGroupPopoverV2] = useState('');
    const [idPopoverV2, setIdPopoverV2] = useState<GridRowId | null>('');
    const [idPopover, setIdPopover] = useState<GridRowId | null>('');
    const [rowChosedPopover, setRowChosedPopover] = useState<ChietKhauDichVuItemDto_TachRiengCot | null>(null);
    const [typePopover, setTypePopover] = useState(0);
    const openPopover = Boolean(anchorPopover);
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [loaiChietKhauActive, setloaiChietKhauActive] = useState(0);

    const [pageResultChietKhauDV, setPageResultChietKhauDV] = useState<
        PagedResultDto<ChietKhauDichVuItemDto_TachRiengCot>
    >({
        items: [],
        totalCount: 0,
        totalPage: 1
    } as PagedResultDto<ChietKhauDichVuItemDto_TachRiengCot>);

    const [paramSearch, setParamSearch] = useState<PagedRequestDto>({
        skipCount: 1,
        maxResultCount: 10,
        keyword: '',
        sortBy: 'tenNhanVien'
    } as PagedRequestDto);

    const GetAllNhanVien = async () => {
        const data = await nhanVienService.getAll({
            filter: '',
            skipCount: 1,
            maxResultCount: 100
        } as PagedNhanSuRequestDto);
        setAllNhanVien([...data.items]);
        setLstNhanVien([...data.items]);
    };

    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

    const handleOpenDialog = (id: string) => {
        setSelectedEmployeeId(id); // Set ID nhân viên cần hiển thị
        setDialogOpen(true); // Mở dialog
    };
    useEffect(() => {
        getListSetupHoaHongDV();
    }, []);

    useEffect(() => {
        setFilteredData(allData);
    }, [allData]);

    const GetAllNhomHangHoa = async () => {
        const data = await GroupProductService.GetDM_NhomHangHoa();

        // Kiểm tra xem data có trả về kết quả không
        if (data && data.items) {
            setAllNhomDichVu(data.items); // Cập nhật state với dữ liệu nhóm dịch vụ
        } else {
            console.error('Không có dữ liệu nhóm dịch vụ');
        }
    };

    const getListSetupHoaHongDV = async () => {
        const data = await chietKhauDichVuService.GetAllSetup_HoaHongDichVu(paramSearch, idNhanVienChosed, idChiNhanh);
        setAllData(data.items); // Lưu toàn bộ dữ liệu vào `allData`
        setFilteredData(data.items); // Hiển thị dữ liệu ban đầu
        setPageResultChietKhauDV({
            items: data.items,
            totalCount: data.totalCount,
            totalPage: Math.ceil(data.totalCount / paramSearch.maxResultCount)
        });
    };
    const getAllDataSetupHoaHongDV = async () => {
        // Tạo một bản sao paramSearch và đặt maxResultCount rất lớn
        const fullParamSearch = { ...paramSearch, maxResultCount: 1000, skipCount: 0 };

        // Gọi API để lấy tất cả dữ liệu
        const data = await chietKhauDichVuService.GetAllSetup_HoaHongDichVu(
            fullParamSearch,
            idNhanVienChosed,
            idChiNhanh
        );

        // Trả về dữ liệu (toàn bộ items)
        return data.items;
    };

    const PageLoad = async () => {
        await GetAllNhanVien();
        await getListSetupHoaHongDV();
        await GetAllNhomHangHoa();
    };

    useEffect(() => {
        PageLoad();
    }, []);

    // popover
    useEffect(() => {
        if (idPopover == null) {
            document.addEventListener('mousemove', closePopOver);
        }
    }, [idPopover]);

    useEffect(() => {
        window.addEventListener('mouseup', function () {
            document.removeEventListener('mousemove', closePopOver);
        });
    }, []);

    const showPopOver = (
        event: React.MouseEvent<HTMLDivElement>,
        type = TypeGroupPopover.NHAN_VIEN,
        itemRow: GridRenderCellParams
    ) => {
        const roleEdit = abpCustom.isGrandPermission('Pages.ChietKhauDichVu.Edit');
        if (!roleEdit) {
            setObjAlert({
                ...objAlert,
                show: true,
                mes: `Bạn không có quyền cập nhật hoa hồng nhân viên`,
                type: 2
            });
            return;
        }
        setAnchorPopover(event.currentTarget);
        setTypePopover(type);
        setRowChosedPopover(itemRow.row);
        setloaiChietKhauActive(loaiChietKhauActive);

        switch (type) {
            case TypeGroupPopover.NHAN_VIEN:
                {
                    setLblGroupPopover('của nhân viên ' + itemRow.row?.tenNhanVien);
                    setIdPopover('nhanvien_' + itemRow?.id);
                }
                break;
            case TypeGroupPopover.DICH_VU:
                {
                    setLblGroupPopover(`${itemRow.row?.tenDichVu}`);
                    setIdPopover('dichvu_' + itemRow?.id);
                }
                break;
            case TypeGroupPopover.NHOM_DICH_VU:
                {
                    setLblGroupPopover(`thuộc nhóm ${itemRow.row?.tenNhomDichVu}`);
                    setIdPopover('nhomdichvu_' + itemRow?.id);
                    setLblGroupPopoverV2('của nhân viên ' + itemRow.row?.tenNhanVien);
                    setIdPopoverV2('nhanvien_' + itemRow?.id);
                }
                break;
        }
    };

    const closePopOver = () => {
        setAnchorPopover(null);
        setRowChosedPopover(null);
    };

    const applyPopover = async (
        gtriCK: number,
        laPhanTram: boolean,
        isCheckAll: boolean,
        loaiChietKhau: (typeof LoaiHoaHongDichVu)[keyof typeof LoaiHoaHongDichVu],
        loaiApply: number
    ) => {
        const param: any = {
            idChiNhanh: idChiNhanh,
            giaTri: gtriCK,
            laPhanTram: laPhanTram,
            loaiChietKhau
        };
        if (isCheckAll) {
            // switch (typePopover) {
            //     case TypeGroupPopover.NHAN_VIEN:
            //         param.idNhanViens = [rowChosedPopover?.idNhanVien as string];
            //         break;
            //     case TypeGroupPopover.DICH_VU:
            //         param.idDonViQuyDois = [rowChosedPopover?.idDonViQuiDoi as string];
            //         break;
            //     case TypeGroupPopover.NHOM_DICH_VU:
            //         param.idNhomHang = rowChosedPopover?.idNhomHangHoa;
            //         break;
            // }
            if (loaiApply === 1) {
                param.idNhanViens = [rowChosedPopover?.idNhanVien as string];
            }
            if (loaiApply === 3) {
                param.idNhomHang = rowChosedPopover?.idNhomHangHoa;
                setTypePopover(loaiApply);
            }
            if (loaiApply === 2) {
                param.idDonViQuyDois = [rowChosedPopover?.idDonViQuiDoi as string];
                setTypePopover(loaiApply);
            }
            const result = await chietKhauDichVuService.ApplyAll_SetupHoaHongDV(param, idNhanVienChosed, loaiApply);
            if (result > 0) {
                setObjAlert({ ...objAlert, show: true, mes: 'Áp dụng cài đặt thành công' });
            }
        } else {
            param.idNhanViens = [rowChosedPopover?.idNhanVien];
            param.idDonViQuiDoi = rowChosedPopover?.idDonViQuiDoi;
            const result = await chietKhauDichVuService.UpdateSetup_HoaHongDichVu_ofNhanVien(param);
            if (result) {
                setObjAlert({ ...objAlert, show: true, mes: 'Áp dụng cài đặt thành công' });
            }
        }

        await getListSetupHoaHongDV();
    };

    // end popover

    function showModalSetup(action?: number, id = '') {
        setIsShowModalSetup(true);
    }

    const searchNhanVien = () => {
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
        searchNhanVien();
    }, [txtSearchNV]);

    useEffect(() => {
        getListSetupHoaHongDV();
    }, [paramSearch.skipCount, paramSearch.maxResultCount, idNhanVienChosed]);

    const handleChangePage = (event: any, value: number) => {
        setParamSearch({
            ...paramSearch,
            skipCount: value
        });
    };
    const changeNumberOfpage = (sizePage: number) => {
        setParamSearch({
            ...paramSearch,
            maxResultCount: sizePage
        });
    };

    const handleKeyDownTextSearch = (event: any) => {
        if (event.keyCode === 13) {
            hanClickIconSearch();
        }
    };

    const hanClickIconSearch = () => {
        if (paramSearch.skipCount !== 1) {
            setParamSearch({
                ...paramSearch,
                skipCount: 1
            });
        } else {
            getListSetupHoaHongDV();
        }
    };

    const deleteRow = async () => {
        let arrIdNhanVienDelete: string[] = [];
        let arrIdQuyDoiDelete: string[] = [];
        let totalRowDelete = 1;

        if (rowChosed === null) {
            // Lấy tất cả dữ liệu từ cơ sở dữ liệu (dùng hàm getAllDataSetupHoaHongDV)
            const allData = await getAllDataSetupHoaHongDV();
            arrIdNhanVienDelete = allData.map((x) => x.idNhanVien);
            arrIdQuyDoiDelete = allData.map((x) => x.idDonViQuiDoi);
            totalRowDelete = allData.length;
        } else {
            arrIdNhanVienDelete = [rowChosed?.idNhanVien as string];
            arrIdQuyDoiDelete = [rowChosed?.idDonViQuiDoi as string];
        }

        // Chia thành các nhóm 15 phần tử
        const chunkSize = 15;
        const chunkedArrIdNhanVienDelete = chunkArray(arrIdNhanVienDelete, chunkSize);
        const chunkedArrIdQuyDoiDelete = chunkArray(arrIdQuyDoiDelete, chunkSize);

        // Lặp qua các nhóm và xóa từng nhóm
        for (let i = 0; i < chunkedArrIdNhanVienDelete.length; i++) {
            const deleteOK = await chietKhauDichVuService.DeleteSetup_DichVu_ofNhanVien(
                chunkedArrIdNhanVienDelete[i],
                chunkedArrIdQuyDoiDelete[i]
            );

            if (!deleteOK) {
                setObjAlert({ ...objAlert, show: true, mes: 'Xóa thất bại', type: 2 });
                return;
            }
        }

        setObjAlert({ ...objAlert, show: true, mes: 'Xóa thành công', type: 1 });
        await getListSetupHoaHongDV();

        // Cập nhật lại danh sách trên client
        setPageResultChietKhauDV({
            items: pageResultChietKhauDV.items.filter(
                (x) =>
                    !(
                        arrIdNhanVienDelete.includes(x.idNhanVien) &&
                        arrIdQuyDoiDelete.includes(x.idDonViQuiDoi as string)
                    )
            ),
            totalCount: pageResultChietKhauDV.totalCount - totalRowDelete,
            totalPage: Math.ceil((pageResultChietKhauDV.totalCount - totalRowDelete) / paramSearch.maxResultCount)
        });

        // Đóng modal và reset trạng thái
        setInforDeleteProduct({
            ...inforDeleteProduct,
            show: false
        });
        setRowChosed(null);
    };

    // Hàm hỗ trợ chia mảng thành các nhóm
    const chunkArray = (arr: string[], chunkSize: number): string[][] => {
        const result: string[][] = [];
        for (let i = 0; i < arr.length; i += chunkSize) {
            result.push(arr.slice(i, i + chunkSize));
        }
        return result;
    };

    const onClickDeleteRow = async (rowItem: ChietKhauDichVuItemDto_TachRiengCot) => {
        setRowChosed(rowItem);
        setInforDeleteProduct({
            ...inforDeleteProduct,
            show: true,
            title: 'Thông báo xóa',
            mes: `Bạn có chắc chắn muốn xóa cài đặt dịch vụ ${rowItem.tenDichVu} của nhân viên ${rowItem.tenNhanVien} không?`
        });
    };

    const onClickDeleteAll = async () => {
        setInforDeleteProduct({
            ...inforDeleteProduct,
            show: true,
            title: 'Thông báo xóa',
            mes: `Bạn có chắc chắn muốn xóa tất cả cài đặt này khỏi hệ thống không?`
        });
    };

    const exportToExcel = async () => {
        const param = { ...paramSearch };
        param.skipCount = 1;
        param.maxResultCount = pageResultChietKhauDV.totalCount;
        const result = await chietKhauDichVuService.ExportToExcel_CaiDat_HoaHongDV(
            paramSearch,
            idNhanVienChosed,
            idChiNhanh
        );
        fileDowloadService.downloadExportFile(result);
    };

    const refInputThucHien: any = useRef([]);
    const refInputTuVan: any = useRef([]);
    const gotoNextInputThucHien = (e: React.KeyboardEvent<HTMLDivElement>, targetElem: any) => {
        if (e.key === 'Enter' && targetElem) {
            targetElem.focus();
        }
    };
    const gotoNextInputTuVan = (e: React.KeyboardEvent<HTMLDivElement>, targetElem: any) => {
        if (e.key === 'Enter' && targetElem) {
            targetElem.focus();
        }
    };

    const updateHoaHongDV = useRef(
        debounce(async (input: CreateOrEditChietKhauDichVuDto) => {
            const data = await chietKhauDichVuService.UpdateSetup_HoaHongDichVu_ofNhanVien(input);
            if (data) {
                setObjAlert({ ...objAlert, show: true, mes: 'Cập nhật thành công', type: 1 });
            }
        }, 500)
    ).current;

    const changeGtriChietKhau = async (
        gtriNew: string,
        itemCK: ChietKhauDichVuItemDto_TachRiengCot,
        loaiChietKhau: number
    ) => {
        const roleEdit = abpCustom.isGrandPermission('Pages.ChietKhauDichVu.Edit');
        if (!roleEdit) {
            setObjAlert({
                ...objAlert,
                show: true,
                mes: `Bạn không có quyền cập nhật hoa hồng nhân viên`,
                type: 2
            });
            return;
        }
        const gtriCK = utils.formatNumberToFloat(gtriNew);
        // get laPhanTram old: used to update
        let laPhanTram = false;
        switch (loaiChietKhau) {
            case LoaiHoaHongDichVu.THUC_HIEN:
                {
                    laPhanTram = itemCK.laPhanTram_HoaHongThucHien;
                }
                break;
            case LoaiHoaHongDichVu.YEU_CAU_THUC_HIEN:
                {
                    laPhanTram = itemCK.laPhanTram_HoaHongYeuCauThucHien;
                }
                break;
            case LoaiHoaHongDichVu.TU_VAN:
                {
                    laPhanTram = itemCK.laPhanTram_HoaHongTuVan;
                }
                break;
        }
        const objUpdate = {
            idChiNhanh: idChiNhanh,
            idNhanViens: [itemCK.idNhanVien],
            idDonViQuiDoi: itemCK.idDonViQuiDoi,
            loaiChietKhau: loaiChietKhau,
            giaTri: gtriCK,
            laPhanTram: laPhanTram
        } as CreateOrEditChietKhauDichVuDto;
        await updateHoaHongDV(objUpdate);

        setPageResultChietKhauDV({
            ...pageResultChietKhauDV,
            items: pageResultChietKhauDV.items.map((x) => {
                if (x.idNhanVien === itemCK.idNhanVien && x.idDonViQuiDoi === itemCK.idDonViQuiDoi) {
                    if (loaiChietKhau === LoaiHoaHongDichVu.THUC_HIEN) {
                        return { ...x, hoaHongThucHien: gtriCK };
                    } else {
                        if (loaiChietKhau === LoaiHoaHongDichVu.YEU_CAU_THUC_HIEN) {
                            return {
                                ...x,
                                hoaHongYeuCauThucHien: gtriCK
                            };
                        } else {
                            return { ...x, hoaHongTuVan: gtriCK };
                        }
                    }
                } else {
                    return x;
                }
            })
        });
    };
    const onClickPtramVND = async (
        itemCK: ChietKhauDichVuItemDto_TachRiengCot,
        laPhanTram: boolean,
        loaiChietKhau: number
    ) => {
        // get gtriCK old: used to update
        let gtriCKOld = 0;
        switch (loaiChietKhau) {
            case LoaiHoaHongDichVu.THUC_HIEN:
                {
                    gtriCKOld = itemCK.hoaHongThucHien;
                }
                break;
            case LoaiHoaHongDichVu.YEU_CAU_THUC_HIEN:
                {
                    gtriCKOld = itemCK.hoaHongYeuCauThucHien;
                }
                break;
            case LoaiHoaHongDichVu.TU_VAN:
                {
                    gtriCKOld = itemCK.hoaHongTuVan;
                }
                break;
        }

        const objUpdate = {
            idChiNhanh: idChiNhanh,
            idNhanViens: [itemCK.idNhanVien],
            idDonViQuiDoi: itemCK.idDonViQuiDoi,
            loaiChietKhau: loaiChietKhau,
            giaTri: gtriCKOld,
            laPhanTram: laPhanTram
        } as CreateOrEditChietKhauDichVuDto;
        await updateHoaHongDV(objUpdate);

        setPageResultChietKhauDV({
            ...pageResultChietKhauDV,
            items: pageResultChietKhauDV.items.map((x) => {
                if (x.idNhanVien === itemCK.idNhanVien && x.idDonViQuiDoi === itemCK.idDonViQuiDoi) {
                    if (loaiChietKhau === LoaiHoaHongDichVu.THUC_HIEN) {
                        return { ...x, laPhanTram_HoaHongThucHien: laPhanTram };
                    } else {
                        if (loaiChietKhau === LoaiHoaHongDichVu.YEU_CAU_THUC_HIEN) {
                            return {
                                ...x,
                                laPhanTram_HoaHongYeuCauThucHien: laPhanTram
                            };
                        } else {
                            return { ...x, laPhanTram_HoaHongTuVan: laPhanTram };
                        }
                    }
                } else {
                    return x;
                }
            })
        });
    };

    const saveOKHoaHongDV = async () => {
        await getListSetupHoaHongDV();
        setIsShowModalSetup(false);
    };
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [currentNhanVien, setCurrentNhanVien] = useState<null | NhanSuItemDto>(null);

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>, nvien: NhanSuItemDto) => {
        setAnchorEl(event.currentTarget);
        setCurrentNhanVien(nvien);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setCurrentNhanVien(null);
    };
    const columns: GridColDef[] = [
        {
            field: 'tenNhanVien',
            headerName: 'Nhân viên',
            flex: 0.8,
            renderHeader: (params) => <Box component={'span'}>{params.colDef.headerName}</Box>,
            renderCell: (params) => (
                <Stack
                    onClick={(e) => {
                        showPopOver(e, TypeGroupPopover.NHAN_VIEN, params);
                    }}>
                    {params.value}
                </Stack>
            )
        },
        {
            field: 'tenDichVu',
            headerName: 'Tên dịch vụ',
            flex: 1.2,
            renderHeader: (params) => <Box component={'span'}>{params.colDef.headerName}</Box>,
            renderCell: (params) => (
                <Stack
                    onClick={(e) => {
                        if (idNhanVienChosed == null) showPopOver(e, TypeGroupPopover.NHOM_DICH_VU, params);
                    }}>
                    {params.value}
                </Stack>
            )
        },
        {
            field: 'tenNhomDichVu',
            headerName: 'Nhóm dịch vụ',
            flex: 0.6,
            renderHeader: (params) => <Box component={'span'}>{params.colDef.headerName}</Box>,
            renderCell: (params) => (
                <Stack onClick={(e) => showPopOver(e, TypeGroupPopover.NHOM_DICH_VU, params)}>{params.value}</Stack>
            )
        },
        {
            field: 'giaDichVu',
            headerName: 'Giá bán',
            headerAlign: 'right',
            align: 'right',
            flex: 0.5,
            renderCell: (params) => (
                <Box display="flex" justifyContent="end" width="100%">
                    {new Intl.NumberFormat('vi-VN').format(params.value)}
                </Box>
            ),
            renderHeader: (params) => <Box component={'span'}>{params.colDef.headerName}</Box>
        },
        {
            field: 'hoaHongThucHien',
            headerName: 'Thực hiện',
            headerAlign: 'right',
            align: 'right',
            flex: 0.5,
            renderCell: (params) => (
                <Stack direction={'row'} spacing={1}>
                    <Stack
                        onClick={(e) => {
                            showPopOver(e, TypeGroupPopover.NHOM_DICH_VU, params);
                            setloaiChietKhauActive(LoaiHoaHongDichVu.THUC_HIEN);
                        }}>
                        <NumericFormat
                            fullWidth
                            size="small"
                            variant="standard"
                            thousandSeparator={'.'}
                            decimalSeparator={','}
                            value={params.value}
                            customInput={TextField}
                            InputProps={{
                                inputProps: {
                                    style: { textAlign: 'right' }
                                }
                            }}
                            onChange={(e) =>
                                changeGtriChietKhau(e.target.value, params.row, LoaiHoaHongDichVu.THUC_HIEN)
                            }
                            inputRef={(el: any) =>
                                (refInputThucHien.current[params.row.idNhanVien + '_' + params.row.idDonViQuiDoi] = el)
                            }
                            onKeyUp={(e: React.KeyboardEvent<HTMLDivElement>) => {
                                const indexCurrent = pageResultChietKhauDV.items.findIndex(
                                    (x) =>
                                        x.idNhanVien + '_' + x.idDonViQuiDoi ===
                                        params.row.idNhanVien + '_' + params.row.idDonViQuiDoi
                                );
                                let indexNext = indexCurrent + 1;
                                if (indexNext > pageResultChietKhauDV.items.length - 1) {
                                    indexNext = 0;
                                }
                                const rowNext = pageResultChietKhauDV.items.filter(
                                    (x: ChietKhauDichVuItemDto_TachRiengCot, index: number) => {
                                        return index === indexNext;
                                    }
                                );
                                gotoNextInputThucHien(
                                    e,
                                    refInputThucHien.current[rowNext[0].idNhanVien + '_' + rowNext[0].idDonViQuiDoi]
                                );
                            }}
                        />
                    </Stack>
                    <Stack>
                        {params?.row?.laPhanTram_HoaHongThucHien ? (
                            <Avatar
                                style={{
                                    width: 25,
                                    height: 25,
                                    fontSize: '12px',
                                    backgroundColor: 'var(--color-main)'
                                }}
                                onClick={() => onClickPtramVND(params.row, false, LoaiHoaHongDichVu.THUC_HIEN)}>
                                %
                            </Avatar>
                        ) : (
                            <Avatar
                                style={{ width: 25, height: 25, fontSize: '12px' }}
                                onClick={() => onClickPtramVND(params.row, true, LoaiHoaHongDichVu.THUC_HIEN)}>
                                đ
                            </Avatar>
                        )}
                    </Stack>
                </Stack>
            ),
            renderHeader: (params) => <Box sx={{ fontWeight: '700' }}>{params.colDef.headerName}</Box>
        },

        {
            field: 'hoaHongYeuCauThucHien',
            headerName: 'Yêu cầu',
            headerAlign: 'right',
            align: 'right',
            flex: 0.5,
            renderCell: (params) => (
                <Stack direction={'row'} spacing={1}>
                    <Stack
                        onClick={(e) => {
                            showPopOver(e, TypeGroupPopover.NHOM_DICH_VU, params);
                            setloaiChietKhauActive(LoaiHoaHongDichVu.YEU_CAU_THUC_HIEN);
                        }}>
                        <NumericFormat
                            fullWidth
                            size="small"
                            variant="standard"
                            thousandSeparator={'.'}
                            decimalSeparator={','}
                            value={params.value}
                            customInput={TextField}
                            InputProps={{
                                inputProps: {
                                    style: { textAlign: 'right' }
                                }
                            }}
                            onChange={(e) =>
                                changeGtriChietKhau(e.target.value, params.row, LoaiHoaHongDichVu.YEU_CAU_THUC_HIEN)
                            }
                            inputRef={(el: any) =>
                                (refInputThucHien.current[params.row.idNhanVien + '_' + params.row.idDonViQuiDoi] = el)
                            }
                            onKeyUp={(e: React.KeyboardEvent<HTMLDivElement>) => {
                                const indexCurrent = pageResultChietKhauDV.items.findIndex(
                                    (x) =>
                                        x.idNhanVien + '_' + x.idDonViQuiDoi ===
                                        params.row.idNhanVien + '_' + params.row.idDonViQuiDoi
                                );
                                let indexNext = indexCurrent + 1;
                                if (indexNext > pageResultChietKhauDV.items.length - 1) {
                                    indexNext = 0;
                                }
                                const rowNext = pageResultChietKhauDV.items.filter(
                                    (x: ChietKhauDichVuItemDto_TachRiengCot, index: number) => {
                                        return index === indexNext;
                                    }
                                );
                                gotoNextInputThucHien(
                                    e,
                                    refInputThucHien.current[rowNext[0].idNhanVien + '_' + rowNext[0].idDonViQuiDoi]
                                );
                            }}
                        />
                    </Stack>
                    <Stack>
                        {params?.row?.laPhanTram_HoaHongYeuCauThucHien ? (
                            <Avatar
                                style={{
                                    width: 25,
                                    height: 25,
                                    fontSize: '12px',
                                    backgroundColor: 'var(--color-main)'
                                }}
                                onClick={() => onClickPtramVND(params.row, false, LoaiHoaHongDichVu.YEU_CAU_THUC_HIEN)}>
                                %
                            </Avatar>
                        ) : (
                            <Avatar
                                style={{ width: 25, height: 25, fontSize: '12px' }}
                                onClick={() => onClickPtramVND(params.row, true, LoaiHoaHongDichVu.YEU_CAU_THUC_HIEN)}>
                                đ
                            </Avatar>
                        )}
                    </Stack>
                </Stack>
            ),
            renderHeader: (params) => (
                <Box sx={{ textAlign: 'center', fontWeight: 700, lineHeight: 1 }}>
                    <Box>Thực hiện</Box>
                    <Box sx={{ fontWeight: '400', fontSize: '12px', color: 'gray', marginTop: '1px' }}>(Yêu cầu)</Box>
                </Box>
            )
        },

        // hoahong tuvan
        {
            field: 'hoaHongTuVan',
            headerAlign: 'right',
            headerName: 'Tư vấn',
            align: 'right',
            flex: 0.5,
            renderCell: (params) => (
                <Stack direction={'row'} spacing={1}>
                    <Stack
                        onClick={(e) => {
                            showPopOver(e, TypeGroupPopover.NHOM_DICH_VU, params);
                            setloaiChietKhauActive(LoaiHoaHongDichVu.TU_VAN);
                        }}>
                        {' '}
                        <NumericFormat
                            fullWidth
                            size="small"
                            variant="standard"
                            thousandSeparator={'.'}
                            decimalSeparator={','}
                            value={params.value}
                            customInput={TextField}
                            InputProps={{
                                inputProps: {
                                    style: { textAlign: 'right' }
                                }
                            }}
                            onChange={(e) => changeGtriChietKhau(e.target.value, params.row, LoaiHoaHongDichVu.TU_VAN)}
                            inputRef={(el: any) =>
                                (refInputTuVan.current[params.row.idNhanVien + '_' + params.row.idDonViQuiDoi] = el)
                            }
                            onKeyUp={(e: React.KeyboardEvent<HTMLDivElement>) => {
                                // find id of row next
                                const indexCurrent = pageResultChietKhauDV.items.findIndex(
                                    (x) =>
                                        x.idNhanVien + '_' + x.idDonViQuiDoi ===
                                        params.row.idNhanVien + '_' + params.row.idDonViQuiDoi
                                );
                                let indexNext = indexCurrent + 1;
                                if (indexNext > pageResultChietKhauDV.items.length - 1) {
                                    indexNext = 0;
                                }
                                const rowNext = pageResultChietKhauDV.items.filter(
                                    (x: ChietKhauDichVuItemDto_TachRiengCot, index: number) => {
                                        return index === indexNext;
                                    }
                                );
                                gotoNextInputTuVan(
                                    e,
                                    refInputTuVan.current[rowNext[0].idNhanVien + '_' + rowNext[0].idDonViQuiDoi]
                                );
                            }}
                        />
                    </Stack>
                    <Stack>
                        {params?.row?.laPhanTram_HoaHongTuVan ? (
                            <Avatar
                                style={{
                                    width: 25,
                                    height: 25,
                                    fontSize: '12px',
                                    backgroundColor: 'var(--color-main)'
                                }}
                                onClick={() => onClickPtramVND(params.row, false, LoaiHoaHongDichVu.TU_VAN)}>
                                %
                            </Avatar>
                        ) : (
                            <Avatar
                                style={{ width: 25, height: 25, fontSize: '12px' }}
                                onClick={() => onClickPtramVND(params.row, true, LoaiHoaHongDichVu.TU_VAN)}>
                                đ
                            </Avatar>
                        )}
                    </Stack>
                </Stack>
            ),
            renderHeader: (params) => <Box sx={{ fontWeight: '700' }}>{params.colDef.headerName}</Box>
        },

        {
            field: '#',
            headerName: '#',
            flex: 0.2,
            headerAlign: 'center',
            align: 'center',
            sortable: false,
            disableColumnMenu: true,
            renderHeader: () => (
                <ClearOutlinedIcon
                    sx={{
                        color: 'red',
                        display: abpCustom.isGrandPermission('Pages.ChietKhauDichVu.Delete') ? '' : 'none'
                    }}
                    titleAccess="Xóa tất cả"
                    onClick={onClickDeleteAll}
                />
            ),
            renderCell: (params) => (
                <ClearOutlinedIcon
                    sx={{
                        color: 'red',
                        display: abpCustom.isGrandPermission('Pages.ChietKhauDichVu.Delete') ? '' : 'none'
                    }}
                    titleAccess="Xóa dòng"
                    onClick={() => onClickDeleteRow(params.row)}
                />
            )
        }
    ];

    return (
        <>
            <ConfirmDelete
                isShow={inforDeleteProduct.show}
                title={inforDeleteProduct.title}
                mes={inforDeleteProduct.mes}
                onOk={deleteRow}
                onCancel={() => setInforDeleteProduct({ ...inforDeleteProduct, show: false })}></ConfirmDelete>
            <SnackbarAlert
                showAlert={objAlert.show}
                type={objAlert.type}
                title={objAlert.mes}
                handleClose={() => setObjAlert({ show: false, mes: '', type: 1 })}></SnackbarAlert>
            <ModalSetupHoaHongDichVu
                isShow={isShowModalSetup}
                allNhanVien={allNhanVien}
                nhanVienChosed={nhanVienChosed}
                onClose={() => setIsShowModalSetup(false)}
                onSaveOK={saveOKHoaHongDV}
            />
            <PopperSetupHoaHongDV_byGroup
                id={idPopover}
                open={openPopover}
                anchorEl={anchorPopover}
                lblGroupPopover={lblGroupPopover}
                lblGroupPopoverV2={lblGroupPopoverV2}
                loaiChietKhau={LoaiHoaHongDichVu.THUC_HIEN}
                rowChosed={rowChosedPopover}
                onClose={closePopOver}
                onApply={applyPopover}
                loaiChietKhauActive={loaiChietKhauActive}
            />
            <CommissionCopyDialog
                open={isDialogOpen}
                onClose={() => setDialogOpen(false)}
                employeeId={selectedEmployeeId} // Truyền vào ID nhân viên cần hiển thị
            />
            <Grid container className="dich-vu-page" gap={4} paddingTop={2}>
                <Grid item container alignItems="center" spacing={1} justifyContent="space-between">
                    <Grid container item xs={12} md={6} spacing={1} lg={6} alignItems="center">
                        <Grid container item alignItems="center">
                            <Grid item xs={6} sm={6} lg={4} md={4}>
                                <span className="page-title"> Hoa hồng theo dịch vụ</span>
                            </Grid>
                            <Grid item xs={6} sm={6} lg={6} md={6}>
                                <TextField
                                    size="small"
                                    fullWidth
                                    sx={{
                                        backgroundColor: '#fff'
                                    }}
                                    variant="outlined"
                                    placeholder="Tìm dịch vụ"
                                    InputProps={{
                                        startAdornment: (
                                            <IconButton onClick={hanClickIconSearch}>
                                                <Search />
                                            </IconButton>
                                        )
                                    }}
                                    onChange={(event) =>
                                        setParamSearch({
                                            ...paramSearch,
                                            keyword: event.target.value
                                        })
                                    }
                                    onKeyDown={(event) => {
                                        handleKeyDownTextSearch(event);
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item xs={12} md={6} lg={6} display="flex" gap="8px" justifyContent="end">
                        {/* <Button
                            size="small"
                            variant="outlined"
                            startIcon={<CopyAll />}
                            onClick={() => setDialogOpen(true)}
                            sx={{
                                bgcolor: '#fff!important',
                                color: '#666466'
                            }}>
                            Sao chép
                        </Button> */}
                        <ButtonNavigate navigateTo="/settings" btnText="Trở về cài đặt" />

                        <Button
                            size="small"
                            onClick={exportToExcel}
                            variant="outlined"
                            startIcon={<FileUploadOutlinedIcon />}
                            className="btnNhapXuat btn-outline-hover"
                            sx={{
                                bgcolor: '#fff!important',
                                color: '#666466',
                                display: abpCustom.isGrandPermission('Pages.ChietKhauDichVu.Export') ? '' : 'none'
                            }}>
                            Xuất file
                        </Button>
                        {!utils.checkNull(idNhanVienChosed) && idNhanVienChosed !== Guid.EMPTY && (
                            <Button
                                size="small"
                                variant="contained"
                                className=" btn-container-hover"
                                sx={{
                                    minWidth: '143px',
                                    fontSize: '14px',
                                    display: abpCustom.isGrandPermission('Pages.ChietKhauDichVu.Edit') ? '' : 'none'
                                }}
                                startIcon={<Add />}
                                onClick={() => showModalSetup()}>
                                Cài đặt
                            </Button>
                        )}
                    </Grid>
                </Grid>
                <Grid container item spacing={2} paddingTop={1} columns={13}>
                    <Grid item lg={3} md={3} sm={4} xs={13}>
                        <Box className="page-box-left">
                            <Box
                                display="flex"
                                justifyContent="space-between"
                                borderBottom="1px solid #E6E1E6"
                                padding="12px"
                                borderRadius={'4px'}
                                sx={{ backgroundColor: 'var(--color-header-table)' }}>
                                <Typography fontSize="14px" fontWeight="700">
                                    Chọn nhân viên để cài đặt
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    overflow: 'auto',
                                    maxHeight: '66vh',
                                    '&::-webkit-scrollbar': {
                                        width: '7px'
                                    },
                                    '&::-webkit-scrollbar-thumb': {
                                        bgcolor: 'rgba(0,0,0,0.1)',
                                        borderRadius: '4px'
                                    },
                                    '&::-webkit-scrollbar-track': {
                                        bgcolor: 'var(--color-bg)'
                                    }
                                }}>
                                <Stack paddingTop={1}>
                                    <TextField
                                        variant="standard"
                                        fullWidth
                                        placeholder="Tìm nhân viên"
                                        InputProps={{ startAdornment: <Search /> }}
                                        onChange={(e) => setTxtSearchNV(e.target.value)}
                                    />
                                    <Stack
                                        padding={1}
                                        sx={{ backgroundColor: 'var(--color-bg)', cursor: 'pointer' }}
                                        onClick={() => {
                                            setIdNhanVienChosed(Guid.EMPTY);
                                            setNhanVienChosed(null);
                                        }}>
                                        <Typography variant="body2" fontWeight={600} display="flex" alignItems="center">
                                            <Person sx={{ marginRight: 1 }} /> {/* Icon User */}
                                            Tất cả Nhân Viên
                                        </Typography>
                                    </Stack>
                                    <Stack sx={{ overflow: 'auto', maxHeight: 400 }}>
                                        {lstNhanVien?.map((nvien: NhanSuItemDto, index: number) => (
                                            <Stack
                                                direction={'row'}
                                                spacing={1}
                                                key={index}
                                                sx={{
                                                    borderBottom: '1px dashed #cccc',
                                                    padding: '8px',
                                                    backgroundColor:
                                                        idNhanVienChosed === nvien.id ? 'antiquewhite' : '',
                                                    '&:hover': {
                                                        bgcolor: 'var(--color-bg)'
                                                    }
                                                }}
                                                onClick={() => {
                                                    setIdNhanVienChosed(nvien.id);
                                                    setNhanVienChosed(nvien);
                                                }}>
                                                <Stack>
                                                    <Avatar
                                                        sx={{
                                                            width: 40,
                                                            height: 40,
                                                            backgroundColor: 'var(--color-bg)',
                                                            color: 'var(--color-main)',
                                                            fontSize: '14px'
                                                        }}>
                                                        {utils.getFirstLetter(nvien?.tenNhanVien ?? '')}
                                                    </Avatar>
                                                </Stack>
                                                <Stack justifyContent={'center'} spacing={1} sx={{ flex: 1 }}>
                                                    <Stack sx={{ fontSize: '14px' }}>{nvien?.tenNhanVien}</Stack>
                                                    <Stack sx={{ fontSize: '12px', color: '#839bb1' }}>
                                                        {nvien?.tenChucVu}
                                                    </Stack>
                                                </Stack>
                                                <Stack>
                                                    <IconButton
                                                        sx={{
                                                            fontSize: '18px',
                                                            color: 'rgba(0, 0, 0, 0.5)'
                                                        }}
                                                        onClick={(e) => handleMenuClick(e, nvien)}>
                                                        <MenuIcon />
                                                    </IconButton>
                                                </Stack>
                                            </Stack>
                                        ))}
                                        <Menu
                                            anchorEl={anchorEl}
                                            open={Boolean(anchorEl)}
                                            onClose={handleMenuClose}
                                            anchorOrigin={{
                                                vertical: 'bottom',
                                                horizontal: 'right'
                                            }}
                                            transformOrigin={{
                                                vertical: 'top',
                                                horizontal: 'right'
                                            }}>
                                            <MenuItem
                                                onClick={() => {
                                                    showModalSetup();
                                                    handleMenuClose();
                                                }}>
                                                <SettingsIcon
                                                    sx={{ marginRight: '8px', color: 'rgba(0, 0, 0, 0.3)' }}
                                                />
                                                Cài đặt
                                            </MenuItem>
                                            <MenuItem
                                                onClick={() => {
                                                    if (currentNhanVien) handleOpenDialog(currentNhanVien.id);
                                                    handleMenuClose();
                                                }}>
                                                <CopyIcon sx={{ marginRight: '8px', color: 'rgba(0, 0, 0, 0.3)' }} />{' '}
                                                Sao chép
                                            </MenuItem>
                                        </Menu>
                                    </Stack>
                                </Stack>
                            </Box>
                        </Box>
                    </Grid>
                    <Grid item lg={10} md={10} sm={9} xs={13}>
                        <Box className="page-box-right">
                            <DataGrid
                                disableRowSelectionOnClick
                                rowHeight={46}
                                autoHeight={pageResultChietKhauDV.totalCount === 0}
                                className={'data-grid-row'}
                                rows={filteredData}
                                columns={columns}
                                hideFooter
                                localeText={TextTranslate}
                                getRowId={(row) => row.idNhanVien + '_' + row.idDonViQuiDoi}
                            />

                            <Grid item container>
                                <Grid item xs={4} md={4} lg={4} sm={4}>
                                    <OptionPage changeNumberOfpage={changeNumberOfpage} />
                                </Grid>
                                <Grid item xs={8} md={8} lg={8} sm={8}>
                                    <Stack direction="row" style={{ float: 'right' }}>
                                        <LabelDisplayedRows
                                            currentPage={paramSearch.skipCount}
                                            pageSize={paramSearch.maxResultCount}
                                            totalCount={pageResultChietKhauDV.totalCount}
                                        />
                                        <Pagination
                                            shape="rounded"
                                            count={pageResultChietKhauDV.totalPage}
                                            page={paramSearch.skipCount}
                                            defaultPage={paramSearch.skipCount}
                                            onChange={handleChangePage}
                                        />
                                    </Stack>
                                </Grid>
                            </Grid>
                        </Box>
                    </Grid>
                </Grid>
            </Grid>
        </>
    );
}
