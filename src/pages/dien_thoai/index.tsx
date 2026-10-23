import * as React from 'react';
import { observer } from 'mobx-react';
import JsBarcode from 'jsbarcode';
import { format } from 'date-fns';
import { useState, useEffect, useContext } from 'react';
import { DataGrid, GridColDef, GridRenderCellParams, GridRowId, GridRowSelectionModel } from '@mui/x-data-grid';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import { useMemo } from 'react';
import {
    Grid,
    Box,
    Typography,
    TextField,
    Stack,
    Button,
    Pagination,
    IconButton,
    Popover,
    Checkbox,
    FormControl,
    RadioGroup,
    FormControlLabel,
    Radio
} from '@mui/material';
import { Add, Category, DeleteOutline, LocalOfferOutlined, Search } from '@mui/icons-material';
// prop for send data from parent to child
import { PropModal, PropConfirmOKCancel } from '../../utils/PropParentToChild';
import { TextTranslate } from '../../components/TableLanguage';
/* custom component */
import AccordionNhomHangHoa from '../../components/Accordion/NhomHangHoa';
import ConfirmDelete from '../../components/AlertDialog/ConfirmDelete';
import SnackbarAlert from '../../components/AlertDialog/SnackbarAlert';
import { OptionPage } from '../../components/Pagination/OptionPage';
import { LabelDisplayedRows } from '../../components/Pagination/LabelDisplayedRows';
import ModalNhomHangHoa from './ModalGroupProduct';
import ModalHangHoaDienThoai from './ModalPhone';
import { PagedResultDto } from '../../services/dto/pagedResultDto';
import ProductService from '../../services/product/ProductService';
import GroupProductService from '../../services/product/GroupProductService';
import {
    ModelNhomHangHoa,
    ModelHangHoaDto,
    PagedProductSearchDto,
    SoLuongTheoTrangThaiBanHangDto
} from '../../services/product/dto';
import { ReactComponent as UploadIcon } from '../../images/upload.svg';
import { ReactComponent as DownIcon } from '../../images/download.svg';
import Utils from '../../utils/utils'; // func common
import AppConsts, { LoaiNhatKyThaoTac, TypeAction } from '../../lib/appconst';
import './style.css';
import fileDowloadService from '../../services/file-dowload.service';
import uploadFileService from '../../services/uploadFileService';
import { FileUpload } from '../../services/dto/FileUpload';
import ImportExcel from '../../components/ImportComponent/ImportExcel';
import utils from '../../utils/utils';
import BangBaoLoiFileImport from '../../components/ImportComponent/BangBaoLoiFileImport';
import { BangBaoLoiFileimportDto } from '../../services/dto/BangBaoLoiFileimportDto';
import ActionRowSelect from '../../components/DataGrid/ActionRowSelect';
import { IList } from '../../services/dto/IList';
import { ModalChuyenNhom } from '../../components/Dialog/modal_chuyen_nhom';
import abpCustom from '../../components/abp-custom';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { useNavigate } from 'react-router-dom';
import nhomHangHoaStore from '../../stores/nhomHangHoaStore';
import { AppContext } from '../../services/chi_nhanh/ChiNhanhContext';
import { CreateNhatKyThaoTacDto } from '../../services/nhat_ky_hoat_dong/dto/CreateNhatKyThaoTacDto';
import nhatKyHoatDongService from '../../services/nhat_ky_hoat_dong/nhatKyHoatDongService';
import Cookies from 'js-cookie';
import TrangThaiHangSelect, { listTrangThai } from './TrangThaiHangSelect';
import PopoverFilterDienThoai from './PopoverFilterDienThoai';
import { DienThoaiRequestDto } from '../../services/dto/ParamSearchDto';
import ButtonOnlyIcon from '../../components/Button/ButtonOnlyIcon';
import bookingStore from '../../stores/bookingStore';
import CreateOrEditLichHenModal from '../appoinments/components/create-or-edit-lich-hen';
import suggestStore from '../../stores/suggestStore';
import MaChungTuLink from '../../components/MaChungTu/MaChungTuLink';

const PageProduct = () => {
    const navigate = useNavigate();
    const appContext = useContext(AppContext);
    const chiNhanhCurrent = appContext.chinhanhCurrent;
    const [checkAllRow, setCheckAllRow] = useState(false);
    const idChiNhanh = utils.checkNull(chiNhanhCurrent?.id) ? Cookies.get('IdChiNhanh') : chiNhanhCurrent?.id;
    const [rowHover, setRowHover] = useState<ModelHangHoaDto>();
    const [inforDeleteProduct, setInforDeleteProduct] = useState<PropConfirmOKCancel>(
        new PropConfirmOKCancel({ show: false })
    );
    const [objAlert, setObjAlert] = useState({ show: false, type: 1, mes: '' });

    const [triggerModalProduct, setTriggerModalProduct] = useState<PropModal>(new PropModal({ isShow: false }));
    const [triggerModalNhomHang, setTriggerModalNhomHang] = useState<PropModal>(new PropModal({ isShow: false }));
    const [isShowImport, setShowImport] = useState<boolean>(false);
    const [isImporting, setIsImporting] = useState<boolean>(false);
    const [treeNhomHangHoa, setTreeNhomHangHoa] = useState<ModelNhomHangHoa[]>([]);
    const [treeSearchNhomHangHoa, setTreeSearchNhomHangHoa] = useState<ModelNhomHangHoa[]>([]);
    const [lstErrImport, setLstErrImport] = useState<BangBaoLoiFileimportDto[]>([]);
    const [rowSelectionModel, setRowSelectionModel] = React.useState<GridRowSelectionModel>([]);
    const [isShowModalChuyenNhom, setIsShowModalChuyenNhom] = useState(false);
    const [anchorElFilterNangCao, setAnchorElFilterNangCao] = useState<any>(null);

    const [selectedLoaiDienThoai, setSelectedLoaiDienThoai] = useState<number>(4);
    const [pageDataProduct, setPageDataProduct] = useState<PagedResultDto<ModelHangHoaDto>>({
        totalCount: 0,
        totalPage: 0,
        items: []
    });
    const [filterPageProduct, setFilterPageProduct] = useState<PagedProductSearchDto>({
        idNhomHangHoas: [],
        textSearch: '',
        currentPage: 1,
        pageSize: AppConsts.pageOption[0].value,
        columnSort: '',
        typeSort: '',
        idLoaiHangHoa: 4,
        // mặc định chỉ hiện máy chưa bán (đổi trong bộ lọc để xem trạng thái khác)
        trangThais: listTrangThai.filter((x) => x.value === 1).map((x) => x.value)
    });
    const [soLuongTheoTrangThai, setSoLuongTheoTrangThai] = useState<SoLuongTheoTrangThaiBanHangDto[]>([]);

    const GetListHangHoa = async () => {
        const list = await ProductService.Get_DMHangHoaDienThoai(filterPageProduct);
        setPageDataProduct({
            totalCount: list.totalCount,
            totalPage: Utils.getTotalPage(list.totalCount, filterPageProduct.pageSize),
            items: list.items
        });
        setSoLuongTheoTrangThai(list.soLuongTheoTrangThai ?? []);

        const arrIdThisPage = list.items?.map((x) => {
            return x.id ?? '';
        });
        const arrExists = rowSelectionModel?.filter((x) => arrIdThisPage.includes(x as string));
        setCheckAllRow(arrExists?.length == arrIdThisPage?.length && rowSelectionModel?.length !== 0);
    };
    const GetListHangHoaDaXoa = async () => {
        const list = await ProductService.Get_DMHangHoaDaXoa(filterPageProduct);
        setPageDataProduct({
            totalCount: list.totalCount,
            totalPage: Utils.getTotalPage(list.totalCount, filterPageProduct.pageSize),
            items: list.items
        });

        const arrIdThisPage = list.items?.map((x) => {
            return x.id ?? '';
        });
        const arrExists = rowSelectionModel?.filter((x) => arrIdThisPage.includes(x as string));
        setCheckAllRow(arrExists?.length == arrIdThisPage?.length && rowSelectionModel?.length !== 0);
    };
    const GetListNhomHangHoa = async () => {
        await nhomHangHoaStore.getAllNhomHang();
    };

    const GetTreeNhomHangHoa = async () => {
        // used to tree at menu left
        const list = await GroupProductService.GetTreeNhomHangHoa();
        const obj = new ModelNhomHangHoa({
            id: '',
            tenNhomHang: 'Tất cả',
            color: 'var(--color-main)'
        });
        setTreeNhomHangHoa([obj, ...list.items]);
        setTreeSearchNhomHangHoa([obj, ...list.items]);
    };

    const PageLoad = () => {
        GetListNhomHangHoa();
        GetTreeNhomHangHoa();
        //GetIphoneConnectPC();
        GetAllDichVu();
        GetAllListCustomer();
        GetAllKyThuatVien();
    };

    useEffect(() => {
        PageLoad();
    }, []);

    useEffect(() => {
        GetListHangHoa();
    }, [
        filterPageProduct.currentPage,
        filterPageProduct.pageSize,
        filterPageProduct.idNhomHangHoas,
        filterPageProduct.idLoaiHangHoa
    ]);
    useEffect(() => {
        GetListHangHoa();
    }, [filterPageProduct]);
    function showModalAddNhomHang(id = '') {
        setTriggerModalNhomHang({
            isShow: true,
            isNew: Utils.checkNull(id),
            id: id
        });
    }

    function showModalAddProduct(action?: number, id = '') {
        setTriggerModalProduct((old) => {
            return {
                ...old,
                isShow: true,
                isNew: Utils.checkNull(id),
                id: id
            };
        });
    }
    const handlePrintProduct = (rowItem: any) => {
        const imei = rowItem.imel;

        const width = window.screen.width * 0.7;
        const height = window.screen.height * 0.7;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;

        const printWindow = window.open('', '', `width=${width},height=${height},left=${left},top=${top}`);

        if (printWindow) {
            printWindow.document.write(`
        <html>
        <head>
            <title>In Tem TechShop</title>

           <style>

@page{
    size:80mm 60mm;
    margin:0;
}

body{
    font-family: Arial, sans-serif;
    font-size:11px;
    margin:0;
    padding:5px;
    width:80mm;
    height:60mm;
    box-sizing:border-box;
    display:flex;
    flex-direction:column;
}

.header{
    display:flex;
    justify-content:space-between;
    font-weight:bold;
    font-size:12px;
}

.product{
    margin-top:4px;
    font-weight:bold;
    font-size:13px;
}

.info{
    margin-top:3px;
    line-height:1.3;
}

.barcode{
    text-align:center;
    margin-top:4px;
}

.barcode svg{
    width:100%;
    height:28px;
}

.barcode-text{
    font-size:11px;
    letter-spacing:1px;
}

.footer{
    text-align:center;
    font-size:10px;
    margin-top:auto;
}

.line{
    border-bottom:1px dashed #000;
    margin:4px 0;
}

</style>

            <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>

        </head>

       <body>

<div class="header">
    <div>TECHSHOP</div>
    <div>${new Date().toLocaleDateString()}</div>
</div>

<div class="product">
    ${rowItem.tenHangHoa} ${rowItem.mau || ''} ${rowItem.dungLuong || ''}GB
</div>
<div><b>Pin:</b> ${rowItem.pin || '-'}% | <b>Sạc:</b> ${rowItem.soLanSac || '-'} lần</div>

<div class="info">
    <div><b>Tình trạng:</b> ${rowItem.tinhTrang || '-'}</div>
    <div><b>Nội dung:</b> ${rowItem.noiDung || '-'}</div>
    <div><b>Lỗi:</b> ${rowItem.loi || '-'}</div>
</div>

<div class="line"></div>

<div class="info">
    <b>IMEI:</b> ${imei}
</div>

<div class="barcode">
    <svg id="barcode"></svg>
    <div class="barcode-text">${imei}</div>
</div>

<div class="footer">
miniphone.vn
</div>

<script>

window.onload=function(){

    JsBarcode("#barcode","${imei}",{
        format:"CODE128",
        width:2,
        height:35,
        displayValue:false
    });

    window.print();
    window.close();
}

</script>

</body>
        </html>
        `);

            printWindow.document.close();
        }
    };
    const editNhomHangHoa = (isEdit: any, item: ModelNhomHangHoa) => {
        if (isEdit) {
            setTriggerModalNhomHang({
                isShow: true,
                isNew: Utils.checkNull(item.id),
                id: item.id,
                item: item
            });
        } else {
            setFilterPageProduct({ ...filterPageProduct, idNhomHangHoas: [item?.id ?? ''] });
            setTriggerModalProduct((old) => {
                return {
                    ...old,
                    isShow: false,
                    item: { ...old.item, idNhomHangHoa: item.id }
                };
            });
        }
    };
    const searchNhomHang = (textSearch: string) => {
        let txt = textSearch;
        let txtUnsign = '';
        if (!utils.checkNull(txt)) {
            txt = txt.trim();
            txtUnsign = utils.strToEnglish(txt);
        }
        const arr = treeNhomHangHoa.filter(
            (x: ModelNhomHangHoa) =>
                (x.tenNhomHang ?? '').indexOf(txt) > -1 ||
                utils.strToEnglish(x.tenNhomHang ?? '').indexOf(txtUnsign) > -1
        );
        const obj = new ModelNhomHangHoa({
            id: '',
            tenNhomHang: 'Tất cả',
            color: 'var(--color-main)'
        });
        arr.unshift(obj);
        setTreeSearchNhomHangHoa(arr);
    };

    function saveNhomHang(objNew: ModelNhomHangHoa, isDelete = false) {
        if (isDelete) {
            setObjAlert({
                show: true,
                type: 1,
                mes: 'Xóa ' + objNew.sLoaiNhomHang + ' thành công'
            });
        } else {
            if (triggerModalNhomHang.isNew) {
                setObjAlert({
                    show: true,
                    type: 1,
                    mes: 'Thêm ' + objNew.sLoaiNhomHang + ' thành công'
                });
            } else {
                setObjAlert({
                    show: true,
                    type: 1,
                    mes: 'Cập nhật ' + objNew.sLoaiNhomHang + ' thành công'
                });
            }
        }
        setTriggerModalNhomHang({ ...triggerModalNhomHang, isShow: false });

        GetTreeNhomHangHoa();
    }

    function saveProduct(objNew: ModelHangHoaDto, type = 1) {
        // 1.insert, 2.update, 3.delete, 4.khoiphuc
        const sLoai = objNew.tenLoaiHangHoa?.toLocaleLowerCase();
        switch (type) {
            case 1:
                setPageDataProduct((olds) => {
                    return {
                        ...olds,
                        totalCount: olds.totalCount + 1,
                        totalPage: Utils.getTotalPage(olds.totalCount + 1, filterPageProduct.pageSize),
                        items: [objNew, ...olds.items]
                    };
                });
                setObjAlert({ show: true, type: 1, mes: 'Thêm ' + sLoai + ' thành công' });
                break;
            case 2:
                GetListHangHoa();
                setObjAlert({ show: true, type: 1, mes: 'Sửa ' + sLoai + ' thành công' });
                break;
            case 3:
                deleteProduct();
                break;
            case 4:
                restoreProduct();
                setObjAlert({ show: true, type: 1, mes: 'Khôi phục ' + sLoai + ' thành công' });
                break;
        }
    }

    const handleChangePage = (event: any, value: number) => {
        setFilterPageProduct({
            ...filterPageProduct,
            currentPage: value
        });
    };
    const changeNumberOfpage = (sizePage: number) => {
        setFilterPageProduct({
            ...filterPageProduct,
            pageSize: sizePage
        });
    };

    const handleKeyDownTextSearch = (event: any) => {
        if (event.keyCode === 13) {
            hanClickIconSearch();
        }
    };

    const hanClickIconSearch = () => {
        if (filterPageProduct.currentPage !== 1) {
            setFilterPageProduct({
                ...filterPageProduct,
                currentPage: 1
            });
        } else {
            GetListHangHoa();
        }
    };

    const doActionRow = (type: number, rowItem: any) => {
        setRowHover(rowItem);

        switch (type) {
            case TypeAction.UPDATE: {
                const role = abpCustom.isGrandPermission('Pages.DM_HangHoa.Edit');
                if (!role) {
                    setObjAlert({ ...objAlert, show: true, type: 2, mes: 'Không có quyền cập nhật điện thoại' });
                    return;
                }

                showModalAddProduct(TypeAction.UPDATE, rowItem?.idDonViQuyDoi);
                break;
            }

            case TypeAction.DELETE: {
                const role = abpCustom.isGrandPermission('Pages.DM_HangHoa.Delete');
                if (!role) {
                    setObjAlert({ ...objAlert, show: true, type: 2, mes: 'Không có quyền xóa điện thoại' });
                    return;
                }

                setInforDeleteProduct(
                    new PropConfirmOKCancel({
                        show: true,
                        title: 'Xác nhận xóa',
                        mes: `Bạn có chắc chắn muốn xóa ${rowItem.tenLoaiHangHoa.toLocaleLowerCase()} ${
                            rowItem?.maHangHoa ?? ''
                        } không?`
                    })
                );
                break;
            }

            case TypeAction.PRINT: {
                handlePrintProduct(rowItem);
                break;
            }

            default:
                break;
        }
    };
    const deleteProduct = async () => {
        if (!Utils.checkNull(rowHover?.idDonViQuyDoi)) {
            await ProductService.DeleteProduct_byIDHangHoa(rowHover?.id ?? '');
            setObjAlert({
                show: true,
                type: 1,
                mes: 'Xóa ' + rowHover?.tenLoaiHangHoa?.toLocaleLowerCase() + ' thành công'
            });
            GetListHangHoa();
            setInforDeleteProduct({ ...inforDeleteProduct, show: false });
            setPageDataProduct((olds) => {
                return {
                    ...olds,
                    // neu sau nay khong can lay hang ngung kinhdoanh --> bo comment doan nay
                    // totalCount: olds.totalCount - 1,
                    // totalPage: Utils.getTotalPage(olds.totalCount - 1, filterPageProduct.pageSize),
                    items: olds.items.map((x: any) => {
                        if (x.idDonViQuyDoi === rowHover?.idDonViQuyDoi) {
                            return { ...x, trangThai: 0, txtTrangThaiHang: 'Ngừng kinh doanh' };
                        } else {
                            return x;
                        }
                    })
                };
            });

            // save diary
            const diary = {
                idChiNhanh: idChiNhanh,
                chucNang: `Danh mục điện thoại`,
                noiDung: `Xóa điện thoại ${rowHover?.tenHangHoa} (${rowHover?.maHangHoa})`,
                noiDungChiTiet: `Xóa điện thoại ${rowHover?.tenHangHoa} (${rowHover?.maHangHoa})`,
                loaiNhatKy: LoaiNhatKyThaoTac.DELETE
            } as CreateNhatKyThaoTacDto;
            await nhatKyHoatDongService.createNhatKyThaoTac(diary);
        } else {
            if (rowSelectionModel.length > 0) {
                //  todo remove image from Imgur
                const result = await ProductService.DeleteMultipleProduct(rowSelectionModel);

                if (result) {
                    setObjAlert({
                        show: true,
                        type: 1,
                        mes: `Xóa ${rowSelectionModel.length} điện thoại thành công`
                    });
                } else {
                    setObjAlert({
                        show: true,
                        type: 2,
                        mes: `Xóa ${rowSelectionModel.length} điện thoại thất bại`
                    });
                }

                setInforDeleteProduct({ ...inforDeleteProduct, show: false });
                setPageDataProduct({
                    ...pageDataProduct,
                    items: pageDataProduct.items.map((item: ModelHangHoaDto) => {
                        if (rowSelectionModel.toString().indexOf(item.id ?? '') > -1) {
                            return { ...item, trangThai: 0, txtTrangThaiHang: 'Ngừng kinh doanh' };
                        } else {
                            return item;
                        }
                    })
                });
                setRowSelectionModel([]);
                const arrIDHangHoa = rowSelectionModel as string[];
                const lstPoduct = await ProductService.GetInforBasic_OfListHangHoa(arrIDHangHoa);
                const sTenHangHoa = lstPoduct
                    ?.map((x) => {
                        return x.ma_TenHangHoa;
                    })
                    .join(' <br />');

                const diary = {
                    idChiNhanh: idChiNhanh,
                    chucNang: `Danh mục điện thoại`,
                    noiDung: `Xóa ${rowSelectionModel?.length} điện thoại`,
                    noiDungChiTiet: `Danh sách điện thoại xóa gồm: <br /> ${sTenHangHoa} `,
                    loaiNhatKy: LoaiNhatKyThaoTac.DELETE
                } as CreateNhatKyThaoTacDto;
                await nhatKyHoatDongService.createNhatKyThaoTac(diary);
            }
        }
    };

    const handleOpenLichHen = (row: any) => {
        setRowSelected(row);
        bookingStore.createOrEditBookingDto.idDonViQuiDoi = row.idDonViQuyDoi;

        setOpenLichHen(true);
    };

    const GetAllDichVu = async () => {
        await suggestStore.getSuggestDichVu();
    };

    const GetAllListCustomer = async () => {
        await suggestStore.getSuggestKhachHang();
    };
    const GetAllKyThuatVien = async () => {
        await suggestStore.getSuggestKyThuatVien();
    };
    const handleChangeTrangThai = async (row: any, newStatus: number) => {
        setPageDataProduct((old) => ({
            ...old,
            items: old.items.map((x) =>
                x.idHangHoa === row.idHangHoa
                    ? {
                          ...x,
                          trangThai: newStatus
                      }
                    : x
            )
        }));

        try {
            const { trangThai, idHangHoa } = row;

            const isOpenLichHen = trangThai !== 3 && newStatus === 3;

            if (isOpenLichHen) {
                bookingStore.createOrEditBookingDto.idHangHoaDienThoai = idHangHoa;
                bookingStore.createOrEditBookingDto.newTrangThai = newStatus;

                await handleOpenLichHen(row);
                return;
            }

            await ProductService.UpdateTrangThaiDienThoai(idHangHoa, newStatus);
        } catch (error) {
            // Nếu lỗi thì trả lại trạng thái cũ
            setPageDataProduct((old) => ({
                ...old,
                items: old.items.map((x) =>
                    x.idHangHoa === row.idHangHoa
                        ? {
                              ...x,
                              trangThai: row.trangThai
                          }
                        : x
                )
            }));
        }
    };
    const restoreProduct = async () => {
        await ProductService.RestoreProduct_byIdHangHoa(rowHover?.id ?? '');
        setRowHover({} as ModelHangHoaDto);
        setObjAlert({
            show: true,
            type: 1,
            mes: 'Khôi phục ' + rowHover?.tenLoaiHangHoa?.toLocaleLowerCase() + ' thành công'
        });
        setInforDeleteProduct({ ...inforDeleteProduct, show: false });
        setPageDataProduct((olds) => {
            return {
                ...olds,
                // neu sau nay khong can lay hang ngung kinhdoanh --> bo comment doan nay
                // totalCount: olds.totalCount - 1,
                // totalPage: Utils.getTotalPage(olds.totalCount - 1, filterPageProduct.pageSize),
                items: olds.items.map((x: any) => {
                    if (x.idDonViQuyDoi === rowHover?.idDonViQuyDoi) {
                        return { ...x, trangThai: 1, txtTrangThaiHang: 'Đang kinh doanh' };
                    } else {
                        return x;
                    }
                })
            };
        });

        const diary = {
            idChiNhanh: idChiNhanh,
            chucNang: `Danh mục hàng hóa`,
            noiDung: `Khôi phục hàng hóa ${rowHover?.tenHangHoa}`,
            noiDungChiTiet: `Khôi phục hàng hóa ${rowHover?.tenHangHoa} (${rowHover?.maHangHoa})`,
            loaiNhatKy: LoaiNhatKyThaoTac.RESTORE
        } as CreateNhatKyThaoTacDto;
        await nhatKyHoatDongService.createNhatKyThaoTac(diary);
    };
    const exportToExcel = async () => {
        const param = { ...filterPageProduct };
        param.currentPage = 1;
        param.pageSize = pageDataProduct.totalCount;
        const result = await ProductService.ExportToExcel(filterPageProduct);
        fileDowloadService.downloadExportFile(result);
    };
    const onImportShow = () => {
        setShowImport(!isShowImport);
        setIsImporting(false);
        setLstErrImport([]);
    };
    const handleImportData = async (input: FileUpload) => {
        setIsImporting(true);
        const data = await ProductService.importHangHoa(input);
        setLstErrImport(data);
        if (data.length === 0) {
            setObjAlert({ ...objAlert, show: true, mes: 'Import thành công' });
        } else {
            const errImport = data.filter((x: BangBaoLoiFileimportDto) => x.loaiErr === 2).length;
            if (errImport > 0) {
                setObjAlert({
                    ...objAlert,
                    show: true,
                    mes: `Import thành công, ${errImport} thất bại`
                });
            }
        }
        setShowImport(false);
        setIsImporting(false);
        GetListHangHoa();
        GetTreeNhomHangHoa();
    };
    const downloadImportTemplate = async () => {
        const result = await uploadFileService.downloadImportTemplate('HangHoa_DichVu_ImportTemplate.xlsx');
        fileDowloadService.downloadExportFile(result);
    };

    const DataGrid_handleAction = async (item: any) => {
        switch (parseInt(item.id)) {
            case 1: // chuyennhom
                setIsShowModalChuyenNhom(true);
                break;
            case 2:
                {
                    setInforDeleteProduct({
                        ...inforDeleteProduct,
                        show: true,
                        mes: `Bạn có chắc chắn muốn xóa ${rowSelectionModel.length} điện thoại này không?`
                    });
                }
                break;
        }
    };

    const chuyenNhomHang = async (item: IList) => {
        setIsShowModalChuyenNhom(false);
        const result = await ProductService.ChuyenNhomHang(rowSelectionModel, item.id);
        if (result) {
            setObjAlert({ ...objAlert, show: true, mes: 'Chuyển nhóm điện thoại thành công' });
        }
        setRowSelectionModel([]);
        GetListHangHoa();

        const arrIDHangHoa = rowSelectionModel as string[];

        // save diary
        const lstPoduct = await ProductService.GetInforBasic_OfListHangHoa(arrIDHangHoa);
        const sTenHangHoa = lstPoduct
            ?.map((x) => {
                return x.ma_TenHangHoa;
            })
            .join(' <br />');

        const diary = {
            idChiNhanh: idChiNhanh,
            chucNang: `Danh mục điện thoại`,
            noiDung: `Chuyển ${rowSelectionModel?.length} điện thoại sang nhóm ${item?.text}`,
            noiDungChiTiet: `Danh sách điện thoại chuyển gồm: <br /> ${sTenHangHoa} `,
            loaiNhatKy: LoaiNhatKyThaoTac.UPDATE
        } as CreateNhatKyThaoTacDto;
        await nhatKyHoatDongService.createNhatKyThaoTac(diary);
    };

    const dataGrid_clickCheckOne = (idHangHoa: string, isCheck: boolean) => {
        if (isCheck) {
            const arrNew = [...rowSelectionModel, idHangHoa];
            setRowSelectionModel([...arrNew]);

            // check all: if allId this page exists in rowSelectionModel
            const arrIdThisPage = pageDataProduct.items?.map((x) => {
                return x.id ?? '';
            });
            const arrExists = arrNew?.filter((x) => arrIdThisPage.includes(x as string));
            setCheckAllRow(arrExists?.length == arrIdThisPage?.length);
        } else {
            setRowSelectionModel(rowSelectionModel?.filter((x) => x !== idHangHoa));
            setCheckAllRow(isCheck);
        }
    };
    const dataGrid_clickCheckAll = (isCheck: boolean) => {
        const arrIdThisPage = pageDataProduct.items?.map((x) => {
            return x.id ?? '';
        });

        const arrIdNotThisPage = rowSelectionModel?.filter((x) => !arrIdThisPage.includes(x as string));
        if (isCheck) {
            setRowSelectionModel([...arrIdNotThisPage, ...arrIdThisPage]);
        } else {
            setRowSelectionModel([...arrIdNotThisPage]);
        }
        setCheckAllRow(isCheck);
    };
    const [openLichHen, setOpenLichHen] = useState(false);
    const [rowSelected, setRowSelected] = useState<any>(null);
    const columns: GridColDef[] = useMemo(() => {
        const isKhach = selectedLoaiDienThoai === 5;

        return [
            {
                field: 'checkBox',
                flex: 0.3,
                sortable: false,
                filterable: false,
                disableColumnMenu: true,
                renderHeader: () => (
                    <Checkbox onChange={(e) => dataGrid_clickCheckAll(e.target.checked)} checked={checkAllRow} />
                ),
                renderCell: (params) => (
                    <Checkbox
                        onChange={(e) => dataGrid_clickCheckOne(params.row.id, e.target.checked)}
                        checked={rowSelectionModel.includes(params.row.id)}
                    />
                )
            },
            {
                field: 'tenHangHoa',
                headerName: 'Tên điện thoại',
                minWidth: 150
            },
            {
                field: 'mau',
                headerName: 'Màu',
                minWidth: 90
            },
            {
                field: 'pin',
                headerName: 'Pin',
                minWidth: 80
            },
            {
                field: 'dungLuong',
                headerName: 'GB',
                minWidth: 80
            },

            ...(isKhach
                ? [
                      {
                          field: 'tenChu',
                          headerName: 'Khách hàng',
                          minWidth: 150
                      },
                      {
                          field: 'soDienThoai',
                          headerName: 'SĐT',
                          minWidth: 120
                      }
                  ]
                : []),

            {
                field: 'imel',
                headerName: 'IMEL',
                width: 120,
                renderCell: (params) => {
                    const imei = params.value || '';
                    const imeiShow = imei.length > 8 ? '...' + imei.slice(-8) : imei;

                    return (
                        <Box
                            title="Click để copy"
                            onClick={() => navigator.clipboard.writeText(imei)}
                            sx={{
                                cursor: 'pointer',
                                '&:hover': {
                                    textDecoration: 'underline',
                                    color: 'primary.main'
                                }
                            }}>
                            {imeiShow}
                        </Box>
                    );
                }
            },
            {
                field: 'giaVon',
                headerName: 'Giá nhập',
                minWidth: 100,
                flex: 1,
                renderCell: (params) => (
                    <Box display="flex" justifyContent="end" width="100%">
                        {new Intl.NumberFormat('vi-VN').format(params.value)}
                    </Box>
                )
            },
            {
                field: 'giaBan',
                headerName: 'Giá bán',
                minWidth: 100,
                flex: 1,
                renderCell: (params) => (
                    <Box display="flex" justifyContent="end" width="100%">
                        {new Intl.NumberFormat('vi-VN').format(params.value)}
                    </Box>
                )
            },
            {
                field: 'ngayNhap',
                headerName: 'Ngày nhập',
                minWidth: 110,
                flex: 1,
                renderCell: (params) => (params.value ? format(new Date(params.value), 'dd/MM/yyyy') : '')
            },
            {
                // mỗi điện thoại phải thuộc 1 phiếu nhập; máy cũ chưa gắn thì gắn qua "Thêm máy có sẵn" ở phiếu nhập
                field: 'maPhieuNhap',
                headerName: 'Phiếu nhập',
                minWidth: 130,
                flex: 1,
                renderCell: (params) =>
                    isKhach ? null : params.value ? (
                        <MaChungTuLink ma={params.value} idLoaiChungTu={4} sx={{ fontWeight: 600 }} />
                    ) : (
                        <Box component="span" sx={{ fontSize: 12, color: '#d97706' }}>
                            Chưa có phiếu nhập
                        </Box>
                    )
            },
            {
                field: 'loi',
                headerName: 'Lỗi',
                minWidth: 180,
                flex: 1
            },
            {
                field: 'moTa',
                headerName: 'Ghi chú',
                minWidth: 180,
                flex: 1
            },
            {
                field: 'trangThai',
                headerName: 'Trạng thái',
                minWidth: 150,
                renderCell: (params) => (
                    <TrangThaiHangSelect
                        value={params.row.trangThai}
                        onChange={(newStatus: number) => handleChangeTrangThai(params.row, newStatus)}
                    />
                )
            },
            {
                field: 'actions',
                headerName: '#',
                maxWidth: 160,
                flex: 1,
                disableColumnMenu: true,
                // con mắt: mở trang chi tiết máy (thông tin + nhật ký, sửa máy ở trang đó); in tem; xóa
                renderCell: (params) => (
                    <Stack spacing={1} direction={'row'}>
                        <VisibilityOutlinedIcon
                            titleAccess="Xem chi tiết"
                            sx={{ fontSize: 18, color: '#7e7979', cursor: 'pointer' }}
                            onClick={() => navigate(`/dien-thoai-chi-tiet/${params.row.idDonViQuyDoi}`)}
                        />
                        <PrintOutlinedIcon
                            titleAccess="In"
                            sx={{ width: '16px', color: '#7e7979', cursor: 'pointer' }}
                            onClick={() => doActionRow(TypeAction.PRINT, params.row)}
                        />
                        <DeleteOutlinedIcon
                            titleAccess="Xóa"
                            sx={{ fontSize: 18, color: '#7e7979', cursor: 'pointer' }}
                            onClick={() => doActionRow(TypeAction.DELETE, params.row)}
                        />
                    </Stack>
                )
            }
        ];
    }, [selectedLoaiDienThoai, checkAllRow, rowSelectionModel]);

    const ApplyFilter = (paramFilter: PagedProductSearchDto) => {
        setAnchorElFilterNangCao(null);
        setFilterPageProduct({
            ...filterPageProduct,
            currentPage: 1,
            dungLuong: Array.isArray(paramFilter.dungLuong) ? paramFilter.dungLuong : [],
            mau: paramFilter.mau,
            trangThais: paramFilter.trangThais,
            idChiNhanhs: paramFilter.idChiNhanhs
        });
    };

    return (
        <>
            <div id="printArea" style={{ display: 'none' }}></div>
            <ModalNhomHangHoa trigger={triggerModalNhomHang} handleSave={saveNhomHang}></ModalNhomHangHoa>
            <ModalHangHoaDienThoai trigger={triggerModalProduct} handleSave={saveProduct}></ModalHangHoaDienThoai>
            <CreateOrEditLichHenModal
                visible={openLichHen}
                onCancel={() => setOpenLichHen(false)}
                idLichHen=""
                onOk={async () => {
                    if (rowSelected) {
                        await ProductService.UpdateTrangThaiDienThoai(rowSelected.idHangHoa, 3);

                        setPageDataProduct((old) => ({
                            ...old,
                            items: old.items.map((x) =>
                                x.idHangHoa === rowSelected.idHangHoa
                                    ? {
                                          ...x,
                                          trangThai: 3
                                      }
                                    : x
                            )
                        }));
                    }

                    setOpenLichHen(false);
                }}
            />
            <div id="printLabel" style={{ display: 'none' }}></div>{' '}
            <ConfirmDelete
                isShow={inforDeleteProduct.show}
                title={inforDeleteProduct.title}
                mes={inforDeleteProduct.mes}
                onOk={deleteProduct}
                onCancel={() => setInforDeleteProduct({ ...inforDeleteProduct, show: false })}></ConfirmDelete>
            <SnackbarAlert
                showAlert={objAlert.show}
                type={objAlert.type}
                title={objAlert.mes}
                handleClose={() => setObjAlert({ show: false, mes: '', type: 1 })}></SnackbarAlert>
            <ImportExcel
                tieude={'Nhập file điện thoại'}
                isOpen={isShowImport}
                isImporting={isImporting}
                onClose={onImportShow}
                downloadImportTemplate={downloadImportTemplate}
                importFile={handleImportData}
            />
            <BangBaoLoiFileImport
                isOpen={lstErrImport.length > 0}
                lstError={lstErrImport}
                onClose={() => setLstErrImport([])}
                clickImport={() => console.log(lstErrImport)}
            />
            <ModalChuyenNhom
                title="Chuyển nhóm điện thoại"
                icon={<LocalOfferOutlined />}
                isOpen={isShowModalChuyenNhom}
                lstData={treeNhomHangHoa
                    .filter((x) => !utils.checkNull(x.id))
                    .map((item: any) => {
                        return { id: item.id, text: item.tenNhomHang, color: item?.color };
                    })}
                onClose={() => setIsShowModalChuyenNhom(false)}
                agreeChuyenNhom={chuyenNhomHang}
            />
            <PopoverFilterDienThoai
                anchorEl={anchorElFilterNangCao}
                paramFilter={filterPageProduct}
                handleClose={() => setAnchorElFilterNangCao(null)}
                handleApply={ApplyFilter}
                soLuongTheoTrangThai={soLuongTheoTrangThai}
            />
            <Grid container className="dich-vu-page" spacing={1} gap={4} paddingTop={2}>
                <Grid item container alignItems="center" spacing={1} justifyContent="space-between">
                    <Grid container item xs={12} spacing={1} md={6} lg={6} alignItems="center">
                        <Grid container spacing={1} item alignItems="center">
                            <Grid item xs={6} sm={6} lg={4} md={4}>
                                <span className="page-title"> Danh mục điện thoại</span>
                            </Grid>
                            <Grid item xs={6} sm={6} lg={6} md={6}>
                                <TextField
                                    size="small"
                                    fullWidth
                                    sx={{
                                        backgroundColor: '#fff'
                                    }}
                                    variant="outlined"
                                    placeholder="Tìm kiếm"
                                    InputProps={{
                                        startAdornment: (
                                            <IconButton onClick={hanClickIconSearch}>
                                                <Search />
                                            </IconButton>
                                        )
                                    }}
                                    onChange={(event) =>
                                        setFilterPageProduct((itemOlds: any) => {
                                            return {
                                                ...itemOlds,
                                                textSearch: event.target.value
                                            };
                                        })
                                    }
                                    onKeyDown={(event) => {
                                        handleKeyDownTextSearch(event);
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid
                        item
                        xs={12}
                        md={6}
                        lg={6}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: {
                                xs: 'flex-start',
                                md: 'flex-end'
                            },
                            gap: 1,
                            flexWrap: 'wrap'
                        }}>
                        <FormControl component="fieldset">
                            <RadioGroup
                                row
                                value={selectedLoaiDienThoai}
                                onChange={(e) => {
                                    const value = Number(e.target.value);

                                    setSelectedLoaiDienThoai(value);

                                    setFilterPageProduct((prev) => ({
                                        ...prev,
                                        idLoaiHangHoa: value,
                                        currentPage: 1
                                    }));
                                }}
                                sx={{
                                    gap: 1,
                                    flexWrap: 'wrap'
                                }}>
                                <FormControlLabel
                                    value={4}
                                    control={<Radio size="small" />}
                                    label="Điện thoại hệ thống"
                                    sx={{ mr: 0 }}
                                />

                                <FormControlLabel
                                    value={5}
                                    control={<Radio size="small" />}
                                    label="Điện thoại khách"
                                    sx={{ mr: 0 }}
                                />
                            </RadioGroup>
                        </FormControl>

                        {/* Filter nâng cao */}
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={(event) => setAnchorElFilterNangCao(event.currentTarget)}
                            sx={{
                                minWidth: 36,
                                width: 36,
                                height: 36,
                                p: 0,
                                bgcolor: '#fff',
                                color: '#666466',
                                borderColor: '#E6E1E6',
                                '&:hover': {
                                    bgcolor: '#f8f8f8'
                                }
                            }}>
                            <FilterAltOutlinedIcon fontSize="small" />
                        </Button>

                        {/* Nhập */}
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<UploadIcon />}
                            onClick={onImportShow}
                            className="btnNhapXuat btn-outline-hover"
                            sx={{
                                height: 36,
                                minWidth: 95,
                                bgcolor: '#fff',
                                color: '#666466',
                                // điện thoại (loại 4) chỉ nhập qua phiếu nhập: ẩn nhập Excel
                                display:
                                    abpCustom.isGrandPermission('Pages.DM_HangHoa.Import') &&
                                    selectedLoaiDienThoai !== 4
                                        ? ''
                                        : 'none'
                            }}>
                            Nhập
                        </Button>

                        {/* Xuất */}
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<DownIcon />}
                            onClick={exportToExcel}
                            className="btnNhapXuat btn-outline-hover"
                            sx={{
                                height: 36,
                                minWidth: 95,
                                bgcolor: '#fff',
                                color: '#666466',
                                display: abpCustom.isGrandPermission('Pages.DM_HangHoa.Export') ? '' : 'none'
                            }}>
                            Xuất
                        </Button>

                        {/* Thêm điện thoại */}
                        <Button
                            size="small"
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => showModalAddProduct()}
                            className="btn-container-hover"
                            sx={{
                                height: 36,
                                minWidth: 160,
                                fontSize: 14,
                                whiteSpace: 'nowrap',
                                // điện thoại (loại 4) chỉ tạo qua phiếu nhập: ẩn thêm máy
                                display:
                                    abpCustom.isGrandPermission('Pages.DM_HangHoa.Create') &&
                                    selectedLoaiDienThoai !== 4
                                        ? ''
                                        : 'none'
                            }}>
                            Thêm điện thoại
                        </Button>
                    </Grid>
                </Grid>
                <Grid container item spacing={2} paddingTop={1} columns={13}>
                    <Grid item lg={13} md={13} sm={13} xs={13}>
                        {rowSelectionModel.length > 0 && (
                            <ActionRowSelect
                                lstOption={[
                                    {
                                        id: '1',
                                        text: 'Chuyển nhóm',
                                        isShow: abpCustom.isGrandPermission('Pages.DM_HangHoa.Edit')
                                    },
                                    {
                                        id: '2',
                                        text: 'Xóa điện thoại',
                                        isShow: abpCustom.isGrandPermission('Pages.DM_HangHoa.Delete')
                                    }
                                ]}
                                countRowSelected={rowSelectionModel.length}
                                title="điện thoại"
                                choseAction={DataGrid_handleAction}
                                removeItemChosed={() => {
                                    setRowSelectionModel([]);
                                    setCheckAllRow(false);
                                }}
                            />
                        )}

                        <Box className="page-box-right" marginTop={rowSelectionModel.length > 0 ? 1 : 0}>
                            <DataGrid
                                className={rowSelectionModel.length > 0 ? 'data-grid-row-chosed' : 'data-grid-row'}
                                autoHeight={pageDataProduct.items.length === 0}
                                disableRowSelectionOnClick
                                rowHeight={42}
                                rows={pageDataProduct.items}
                                columns={columns}
                                hideFooter
                                checkboxSelection={false}
                                localeText={TextTranslate}
                            />

                            <Grid
                                item
                                container
                                style={{
                                    display: pageDataProduct.totalCount > 0 ? 'flex' : 'none',
                                    paddingLeft: '16px',
                                    bottom: '16px'
                                }}>
                                <Grid item xs={4} md={4} lg={4} sm={4}>
                                    <OptionPage
                                        changeNumberOfpage={changeNumberOfpage}
                                        totalRow={pageDataProduct.totalCount}
                                    />
                                </Grid>
                                <Grid item xs={8} md={8} lg={8} sm={8}>
                                    <Stack direction="row" style={{ float: 'right' }}>
                                        <LabelDisplayedRows
                                            currentPage={filterPageProduct.currentPage}
                                            pageSize={filterPageProduct.pageSize}
                                            totalCount={pageDataProduct.totalCount}
                                        />
                                        <Pagination
                                            shape="rounded"
                                            count={pageDataProduct.totalPage}
                                            page={filterPageProduct.currentPage}
                                            defaultPage={filterPageProduct.currentPage}
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
};

export default observer(PageProduct);
