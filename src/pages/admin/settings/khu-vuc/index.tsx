import * as React from 'react';
import { observer } from 'mobx-react';

import { useState, useEffect, useContext } from 'react';
import { DataGrid, GridColDef, GridRenderCellParams, GridRowId, GridRowSelectionModel } from '@mui/x-data-grid';
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
    Checkbox
} from '@mui/material';
import { Add, Category, DeleteOutline, Edit, LocalOfferOutlined, Search } from '@mui/icons-material';
// import { ReactComponent as FilterIcon } from '../../../images/icons/i-filter.svg';
// prop for send data from parent to child
import { PropModal, PropConfirmOKCancel } from '../../../../utils/PropParentToChild';
import { TextTranslate } from '../../../../components/TableLanguage';
/* custom component */
import ConfirmDelete from '../../../../components/AlertDialog/ConfirmDelete';
import SnackbarAlert from '../../../../components/AlertDialog/SnackbarAlert';
import { OptionPage } from '../../../../components/Pagination/OptionPage';
import { LabelDisplayedRows } from '../../../../components/Pagination/LabelDisplayedRows';
import ModalKhuVuc from './ModalKhuVuc';
// import ModalHangHoa from './ModalProduct';
import { PagedResultDto } from '../../../../services/dto/pagedResultDto';
import ProductService from '../../../../services/product/ProductService';
import GroupProductService from '../../../../services/product/GroupProductService';
import { ModelNhomHangHoa, ModelHangHoaDto, PagedProductSearchDto } from '../../../../services/product/dto';
// import { ReactComponent as UploadIcon } from '../../images/upload.svg';
// import { ReactComponent as DownIcon } from '../../images/download.svg';
import Utils from '../../../../utils/utils'; // func common
import AppConsts, { LoaiNhatKyThaoTac, TypeAction } from '../../../../lib/appconst';
// import './style.css';
import fileDowloadService from '../../../../services/file-dowload.service';
import uploadFileService from '../../../../services/uploadFileService';
import { FileUpload } from '../../../../services/dto/FileUpload';
import ImportExcel from '../../../../components/ImportComponent/ImportExcel';
import utils from '../../../../utils/utils';
import BangBaoLoiFileImport from '../../../../components/ImportComponent/BangBaoLoiFileImport';
import { BangBaoLoiFileimportDto } from '../../../../services/dto/BangBaoLoiFileimportDto';
import ActionRowSelect from '../../../../components/DataGrid/ActionRowSelect';
import { IList } from '../../../../services/dto/IList';
import { ModalChuyenNhom } from '../../../../components/Dialog/modal_chuyen_nhom';
import abpCustom from '../../../../components/abp-custom';
import ActionRow2Button from '../../../../components/DataGrid/ActionRow2Button';
import nhomHangHoaStore from '../../../../stores/nhomHangHoaStore';
import KhuVucStore from '../../../../stores/KhuVucStore';
import { AppContext } from '../../../../services/chi_nhanh/ChiNhanhContext';
import { CreateNhatKyThaoTacDto } from '../../../../services/nhat_ky_hoat_dong/dto/CreateNhatKyThaoTacDto';
import nhatKyHoatDongService from '../../../../services/nhat_ky_hoat_dong/nhatKyHoatDongService';
import Cookies from 'js-cookie';
import ModalViTri from './ModalViTri';
import KhuVucService from '../../../../services/khu_vuc/KhuVucService';
import { KhuVucDto, PagedKhuVucSearchDto, PagedViTriSearchDto, ViTriDto } from '../../../../services/khu_vuc/dto';
import TreeItem from '@mui/lab/TreeItem';
import TreeView from '@mui/lab/TreeView';
import KhuVucList from './ListKhuVuc';
import khuyenMaiStore from '../../../../stores/khuyenMaiStore';

const PageProduct = () => {
    const appContext = useContext(AppContext);
    const chiNhanhCurrent = appContext.chinhanhCurrent;
    const [checkAllRow, setCheckAllRow] = useState(false);
    const idChiNhanh = utils.checkNull(chiNhanhCurrent?.id) ? Cookies.get('IdChiNhanh') : chiNhanhCurrent?.id;
    const [rowHover, setRowHover] = useState<ViTriDto>();
    const [inforDeleteViTri, setInforDeleteViTri] = useState<PropConfirmOKCancel>(
        new PropConfirmOKCancel({ show: false })
    );
    const [objAlert, setObjAlert] = useState({ show: false, type: 1, mes: '' });

    const [triggerModalKhuVuc, setTriggerModalKhuVuc] = useState<PropModal>(new PropModal({ isShow: false }));
    const [triggerModalViTri, setTriggerModalViTri] = useState<PropModal>(new PropModal({ isShow: false }));
    const [isShowImport, setShowImport] = useState<boolean>(false);
    const [isImporting, setIsImporting] = useState<boolean>(false);
    const [treeSearchKhuVuc, setTreeSearchKhuVuc] = useState<KhuVucDto[]>([]);
    const [searchText, setSearchText] = useState(''); // Thêm state tìm kiếm
    const [lstErrImport, setLstErrImport] = useState<BangBaoLoiFileimportDto[]>([]);
    const [rowSelectionModel, setRowSelectionModel] = React.useState<GridRowSelectionModel>([]);
    const [isShowModalChuyenNhom, setIsShowModalChuyenNhom] = useState(false);
    const [anchorElFilter, setAnchorElFilter] = useState<any>(null);
    const [pageDataViTri, setPageDataViTri] = useState<PagedResultDto<ViTriDto>>({
        totalCount: 0,
        totalPage: 0,
        items: []
    });

    const [filterPageViTri, setFilterPageViTri] = useState<PagedViTriSearchDto>({
        idKhuVuc: '',
        textSearch: '',
        currentPage: 1,
        pageSize: AppConsts.pageOption[0].value,
        columnSort: '',
        typeSort: ''
    });
    const [filterPageKhuVuc, setFilterPagekhuVuc] = useState<PagedKhuVucSearchDto>({
        idKhuVucs: [],
        textSearch: '',
        currentPage: 1,
        pageSize: AppConsts.pageOption[0].value,
        columnSort: '',
        typeSort: ''
    });
    const GetListViTri = async () => {
        const list = await KhuVucService.Get_DMViTri(filterPageViTri);
        setPageDataViTri({
            totalCount: list.totalCount,
            totalPage: Utils.getTotalPage(list.totalCount, filterPageViTri.pageSize),
            items: list.items
        });

        const arrIdThisPage = list.items?.map((x) => {
            return x.id ?? '';
        });
        const arrExists = rowSelectionModel?.filter((x) => arrIdThisPage.includes(x as string));
        setCheckAllRow(arrExists?.length == arrIdThisPage?.length && rowSelectionModel?.length !== 0);
    };

    const GetListKhuVucs = async () => {
        await KhuVucStore.getAllKhuVuc();
    };

    const GetTreeKhuVuc = async () => {
        try {
            const list = await KhuVucService.GetDM_TreeKhuVuc();
            const items: KhuVucDto[] = list?.items ?? [];

            const obj: Partial<KhuVucDto> = {
                id: '',
                tenKhuVuc: 'Tất cả',
                maKhuVuc: '',
                tenKhuVuc_KhongDau: '',
                moTa: '',
                isDeleted: false,
                children: []
            };

            setTreeSearchKhuVuc([obj as KhuVucDto, ...items]);
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu khu vực:', error);
        }
    };
    const filterTree = (data: KhuVucDto[], keyword: string): KhuVucDto[] => {
        if (!keyword) return data;
        return data
            .map((item) => ({
                ...item,
                children: item.children ? filterTree(item.children, keyword) : []
            }))
            .filter((item) => item.tenKhuVuc.toLowerCase().includes(keyword.toLowerCase()) || item.children.length > 0);
    };

    const PageLoad = () => {
        GetListKhuVucs();
    };

    useEffect(() => {
        PageLoad();
        GetTreeKhuVuc();
    }, []);

    useEffect(() => {
        GetListViTri();
    }, [filterPageViTri.currentPage, filterPageViTri.pageSize, filterPageViTri]);

    function showModalAddKhuVuc(id = '') {
        setTriggerModalKhuVuc({
            isShow: true,
            isNew: Utils.checkNull(id),
            id: id
        });
    }

    function showModalAddViTRi(action?: number, id = '') {
        setTriggerModalViTri((old) => {
            return {
                ...old,
                isShow: true,
                isNew: Utils.checkNull(id),
                id: id
            };
        });
    }

    const editKhuVuc = (isEdit: any, item: KhuVucDto) => {
        if (isEdit) {
            setTriggerModalKhuVuc({
                isShow: true,
                isNew: Utils.checkNull(item.id),
                id: item.id,
                item: item
            });
        } else {
            setFilterPagekhuVuc({ ...filterPageKhuVuc, idKhuVucs: [item?.id ?? ''] });
            setTriggerModalKhuVuc((old) => {
                return {
                    ...old,
                    isShow: false,
                    item: { ...old.item, idNhomHangHoa: item.id }
                };
            });
        }
    };

    function saveKhuVuc(objNew: KhuVucDto, isDelete = false) {
        if (isDelete) {
            setObjAlert({
                show: true,
                type: 1,
                mes: 'Xóa thành công'
            });
        } else {
            if (triggerModalKhuVuc.isNew) {
                setObjAlert({
                    show: true,
                    type: 1,
                    mes: 'Thêm thành công'
                });
            } else {
                setObjAlert({
                    show: true,
                    type: 1,
                    mes: 'Cập nhật thành công'
                });
            }
        }
        setTriggerModalKhuVuc({ ...triggerModalKhuVuc, isShow: false });

        GetTreeKhuVuc();
    }

    function saveProduct(objNew: ViTriDto, type = 1) {
        // 1.insert, 2.update, 3.delete, 4.khoiphuc
        const sLoai = objNew.tenViTri?.toLocaleLowerCase();
        switch (type) {
            case 1:
                setPageDataViTri((olds) => {
                    return {
                        ...olds,
                        totalCount: olds.totalCount + 1,
                        totalPage: Utils.getTotalPage(olds.totalCount + 1, filterPageViTri.pageSize),
                        items: [objNew, ...olds.items]
                    };
                });
                setObjAlert({ show: true, type: 1, mes: 'Thêm ' + sLoai + ' thành công' });
                break;
            case 2:
                GetListViTri();
                setObjAlert({ show: true, type: 1, mes: 'Sửa ' + sLoai + ' thành công' });
                break;
            case 3:
                deleteViTri();
                break;
            case 4:
                restoreProduct();
                setObjAlert({ show: true, type: 1, mes: 'Khôi phục ' + sLoai + ' thành công' });
                break;
        }
    }

    const handleChangePage = (event: any, value: number) => {
        setFilterPageViTri({
            ...filterPageViTri,
            currentPage: value
        });
    };
    const changeNumberOfpage = (sizePage: number) => {
        setFilterPageViTri({
            ...filterPageViTri,
            pageSize: sizePage
        });
    };

    const handleKeyDownTextSearch = (event: any) => {
        if (event.keyCode === 13) {
            hanClickIconSearch();
        }
    };

    const hanClickIconSearch = () => {
        if (filterPageViTri.currentPage !== 1) {
            setFilterPageViTri({
                ...filterPageViTri,
                currentPage: 1
            });
        } else {
            GetListViTri();
        }
    };
    const handleSelectKhuVuc = (idKhuVuc: string) => {
        setFilterPageViTri((prev) => ({
            ...prev,
            idKhuVuc: idKhuVuc,
            currentPage: 1
        }));
    };

    const doActionRow = (type: number, rowItem: any) => {
        setRowHover(rowItem);
        switch (type) {
            case TypeAction.DELETE:
                {
                    const role = abpCustom.isGrandPermission('Pages.DM_HangHoa.Delete');
                    if (!role) {
                        setObjAlert({ ...objAlert, show: true, type: 2, mes: 'Không có quyền xóa dịch vụ' });
                        return;
                    }
                }
                break;
            case TypeAction.UPDATE:
                {
                    const role = abpCustom.isGrandPermission('Pages.DM_HangHoa.Edit');
                    if (!role) {
                        setObjAlert({ ...objAlert, show: true, type: 2, mes: 'Không có quyền cập nhật dịch vụ' });
                        return;
                    }
                }
                break;
        }

        if (type < 3) {
            showModalAddViTRi(type, rowItem?.id);
        } else {
            setInforDeleteViTri(
                new PropConfirmOKCancel({
                    show: true,
                    title: 'Xác nhận xóa',
                    mes: `Bạn có chắc chắn muốn xóa ${rowItem.tenViTri.toLocaleLowerCase()}  không?`
                })
            );
        }
    };
    const deleteViTri = async () => {
        if (!Utils.checkNull(rowHover?.id)) {
            await KhuVucService.XoaViTri(rowHover?.id ?? '');
            setObjAlert({
                show: true,
                type: 1,
                mes: 'Xóa ' + rowHover?.tenViTri?.toLocaleLowerCase() + ' thành công'
            });
            GetListViTri();
            setInforDeleteViTri({ ...inforDeleteViTri, show: false });
            setPageDataViTri((olds) => {
                return {
                    ...olds,

                    items: olds.items.map((x: any) => {
                        if (x.id === rowHover?.id) {
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
                chucNang: `Danh mục khu vực`,
                noiDung: `Xóa khu vựcvực ${rowHover?.tenViTri} (${rowHover?.tenKhuVuc})`,
                noiDungChiTiet: `Xóa khu vực ${rowHover?.tenViTri} (${rowHover?.moTa})`,
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
                        mes: `Xóa ${rowSelectionModel.length} dịch vụ thành công`
                    });
                } else {
                    setObjAlert({
                        show: true,
                        type: 2,
                        mes: `Xóa ${rowSelectionModel.length} dịch vụ thất bại`
                    });
                }

                setInforDeleteViTri({ ...inforDeleteViTri, show: false });
                setPageDataViTri({
                    ...pageDataViTri,
                    items: pageDataViTri.items.map((item: ViTriDto) => {
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
                    chucNang: `Danh mục khu vực`,
                    noiDung: `Xóa ${rowSelectionModel?.length} khu vực`,
                    noiDungChiTiet: `Danh sách khu vực xóa gồm: <br /> ${sTenHangHoa} `,
                    loaiNhatKy: LoaiNhatKyThaoTac.DELETE
                } as CreateNhatKyThaoTacDto;
                await nhatKyHoatDongService.createNhatKyThaoTac(diary);
            }
        }
    };

    const restoreProduct = async () => {
        await ProductService.RestoreProduct_byIdHangHoa(rowHover?.id ?? '');
        setRowHover({} as ViTriDto);
        setObjAlert({
            show: true,
            type: 1,
            mes: 'Khôi phục ' + rowHover?.tenViTri?.toLocaleLowerCase() + ' thành công'
        });
        setInforDeleteViTri({ ...inforDeleteViTri, show: false });
        setPageDataViTri((olds) => {
            return {
                ...olds,
                // neu sau nay khong can lay hang ngung kinhdoanh --> bo comment doan nay
                // totalCount: olds.totalCount - 1,
                // totalPage: Utils.getTotalPage(olds.totalCount - 1, filterPageProduct.pageSize),
                items: olds.items.map((x: any) => {
                    if (x.idDonViQuyDoi === rowHover?.idKhuVuc) {
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
            noiDung: `Khôi phục hàng hóa ${rowHover?.tenViTri}`,
            noiDungChiTiet: `Khôi phục hàng hóa ${rowHover?.tenViTri} (${rowHover?.tenKhuVuc})`,
            loaiNhatKy: LoaiNhatKyThaoTac.RESTORE
        } as CreateNhatKyThaoTacDto;
        await nhatKyHoatDongService.createNhatKyThaoTac(diary);
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
                // import 1 số thành côg, 1 số thất bại
                setObjAlert({
                    ...objAlert,
                    show: true,
                    mes: `Import thành công, ${errImport} thất bại`
                });
            }
        }
        setShowImport(false);
        setIsImporting(false);
        GetListViTri();
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
                    setInforDeleteViTri({
                        ...inforDeleteViTri,
                        show: true,
                        mes: `Bạn có chắc chắn muốn xóa ${rowSelectionModel.length} dịch vụ này không?`
                    });
                }
                break;
        }
    };

    const chuyenNhomHang = async (item: IList) => {
        setIsShowModalChuyenNhom(false);
        // const result = await ProductService.ChuyenNhomHang(rowSelectionModel, item.id);
        // if (result) {
        //     setObjAlert({ ...objAlert, show: true, mes: 'Chuyển nhóm dịch vụ thành công' });
        // }
        setRowSelectionModel([]);
        GetListViTri();

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
            chucNang: `Danh mục Khu vực`,
            noiDung: `Chuyển ${rowSelectionModel?.length} dịch vụ sang nhóm ${item?.text}`,
            noiDungChiTiet: `Danh sách dịch vụ chuyển gồm: <br /> ${sTenHangHoa} `,
            loaiNhatKy: LoaiNhatKyThaoTac.UPDATE
        } as CreateNhatKyThaoTacDto;
        await nhatKyHoatDongService.createNhatKyThaoTac(diary);
    };

    const dataGrid_clickCheckOne = (idHangHoa: string, isCheck: boolean) => {
        if (isCheck) {
            const arrNew = [...rowSelectionModel, idHangHoa];
            setRowSelectionModel([...arrNew]);

            // check all: if allId this page exists in rowSelectionModel
            const arrIdThisPage = pageDataViTri.items?.map((x) => {
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
        const arrIdThisPage = pageDataViTri.items?.map((x) => {
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

    const columns: GridColDef[] = [
        // {
        //     field: 'checkBox',
        //     flex: 0.3,
        //     sortable: false,
        //     filterable: false,
        //     disableColumnMenu: true,
        //     renderHeader: () => {
        //         return <Checkbox onChange={(e) => dataGrid_clickCheckAll(e.target.checked)} checked={checkAllRow} />;
        //     },
        //     renderCell: (params) => (
        //         <Checkbox
        //             onChange={(e) => dataGrid_clickCheckOne(params.row.id, e.target.checked)}
        //             checked={rowSelectionModel.includes(params.row.id)}
        //         />
        //     )
        // },
        {
            field: 'tenViTri',
            headerName: 'Tên vị trí',
            minWidth: 250,
            renderHeader: (params) => <Box component={'span'}>{params.colDef.headerName}</Box>
        },
        {
            field: 'tenKhuVuc',
            headerName: 'Tên khu vực',
            minWidth: 176,
            flex: 1,
            renderHeader: (params) => <Box component={'span'}>{params.colDef.headerName}</Box>
        },
        {
            field: 'donGia',
            headerName: 'Đơn giá',
            minWidth: 76,
            flex: 1,
            renderCell: (params) => (
                <Box display="flex" justifyContent="end" width="80%">
                    {new Intl.NumberFormat('vi-VN').format(params.value)}
                </Box>
            ),
            renderHeader: (params) => <Box component={'span'}>{params.colDef.headerName}</Box>
        },
        {
            field: 'moTa',
            headerName: 'Mô tả',
            minWidth: 176,
            flex: 1,
            renderHeader: (params) => <Box component={'span'}>{params.colDef.headerName}</Box>
        },
        {
            field: 'txtTrangThaiHang',
            headerName: 'Trạng thái',
            headerAlign: 'center',
            align: 'center',
            minWidth: 130,
            flex: 1,
            renderCell: (params) => (
                <Box
                    className={
                        params.row.trangThai === 1
                            ? 'data-grid-cell-trangthai-active'
                            : 'data-grid-cell-trangthai-notActive'
                    }>
                    {params.value || ''}
                </Box>
            ),
            renderHeader: (params) => <Box component={'span'}>{params.colDef.headerName}</Box>
        },
        {
            field: 'actions',
            headerName: '#',
            headerAlign: 'center',
            maxWidth: 60,
            flex: 1,
            disableColumnMenu: true,
            renderCell: (params) => (
                <ActionRow2Button handleClickAction={(type: number) => doActionRow(type, params.row)} />
            ),

            renderHeader: (params) => <Box component={'span'}>{params.colDef.headerName}</Box>
        }
    ];
    const filteredKhuVuc = treeSearchKhuVuc.filter((kv) =>
        kv.tenKhuVuc.toLowerCase().includes(searchText.toLowerCase())
    );
    const filterContent = (
        <Box
            className="page-box-left"
            sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
            <Box>
                <Box
                    display="flex"
                    justifyContent="space-between"
                    borderBottom="1px solid #E6E1E6"
                    padding="12px"
                    borderRadius="4px"
                    sx={{ backgroundColor: 'var(--color-header-table)' }}>
                    <Typography fontSize="14px" fontWeight="700">
                        Khu vực
                    </Typography>

                    <Add
                        sx={{
                            transition: '.4s',
                            height: '32px',
                            cursor: 'pointer',
                            width: '32px',
                            borderRadius: '4px',
                            padding: '4px 0px',
                            border: '1px solid #cccc',
                            display: abpCustom.isGrandPermission('Pages.DM_NhomHangHoa.Create') ? '' : 'none'
                        }}
                        onClick={() => showModalAddKhuVuc()}
                    />
                </Box>

                {/* Ô tìm kiếm */}
                <Stack spacing={1} paddingTop={1}>
                    <TextField
                        variant="standard"
                        fullWidth
                        placeholder="Tìm kiếm khu vực"
                        InputProps={{ startAdornment: <Search /> }}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </Stack>
                <Box
                    sx={{
                        overflow: 'auto',
                        maxHeight: '66vh',
                        '&::-webkit-scrollbar': { width: '7px' },
                        '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,0,0,0.1)', borderRadius: '4px' },
                        '&::-webkit-scrollbar-track': { bgcolor: 'var(--color-bg)' }
                    }}>
                    <KhuVucList data={filteredKhuVuc} onEdit={editKhuVuc} onSelectKhuVuc={handleSelectKhuVuc} />
                </Box>
            </Box>
        </Box>
    );

    return (
        <>
            <ModalKhuVuc trigger={triggerModalKhuVuc} handleSave={saveKhuVuc}></ModalKhuVuc>
            <ModalViTri trigger={triggerModalViTri} handleSave={saveProduct}></ModalViTri>
            <ConfirmDelete
                isShow={inforDeleteViTri.show}
                title={inforDeleteViTri.title}
                mes={inforDeleteViTri.mes}
                onOk={deleteViTri}
                onCancel={() => setInforDeleteViTri({ ...inforDeleteViTri, show: false })}></ConfirmDelete>
            <SnackbarAlert
                showAlert={objAlert.show}
                type={objAlert.type}
                title={objAlert.mes}
                handleClose={() => setObjAlert({ show: false, mes: '', type: 1 })}></SnackbarAlert>
            <ImportExcel
                tieude={'Nhập file dịch vụ'}
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
                title="Chuyển khu vực vị trí"
                icon={<LocalOfferOutlined />}
                isOpen={isShowModalChuyenNhom}
                lstData={treeSearchKhuVuc
                    .filter((x) => !utils.checkNull(x.id))
                    .map((item: any) => {
                        return { id: item.id, text: item.tenKhuVuc, color: item?.color };
                    })}
                onClose={() => setIsShowModalChuyenNhom(false)}
                agreeChuyenNhom={chuyenNhomHang}
            />
            <Grid container className="dich-vu-page" spacing={1} gap={4} paddingTop={2}>
                <Grid item container alignItems="center" spacing={1} justifyContent="space-between">
                    <Grid container item xs={12} spacing={1} md={6} lg={6} alignItems="center">
                        <Grid container spacing={1} item alignItems="center">
                            <Grid item xs={6} sm={6} lg={4} md={4}>
                                <span className="page-title"> Danh mục khu vực</span>
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
                                        setFilterPageViTri((itemOlds: any) => {
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
                    <Grid item xs={12} md={6} lg={6} display="flex" gap="8px" justifyContent="end">
                        {window.screen.width < 768 ? (
                            <Button
                                className="btnNhapXuat btn-outline-hover"
                                aria-describedby="popover-filter"
                                variant="outlined"
                                size="small"
                                sx={{
                                    textTransform: 'capitalize',
                                    fontWeight: '400',
                                    color: '#666466',
                                    borderColor: '#E6E1E6',
                                    bgcolor: '#fff!important',
                                    display: window.screen.width > 500 ? 'none' : 'inherit'
                                }}
                                onClick={(e) => {
                                    setAnchorElFilter(e.currentTarget);
                                }}></Button>
                        ) : null}

                        <Button
                            size="small"
                            variant="contained"
                            className=" btn-container-hover"
                            sx={{
                                minWidth: '143px',
                                fontSize: '14px',
                                display: abpCustom.isGrandPermission('Pages.DM_HangHoa.Create') ? '' : 'none'
                            }}
                            startIcon={<Add />}
                            onClick={() => showModalAddViTRi()}>
                            Thêm vị trí
                        </Button>
                    </Grid>
                </Grid>
                <Grid container item spacing={2} paddingTop={1} columns={13}>
                    <Grid item lg={3} md={3} sm={4} xs={13} display={window.screen.width <= 600 ? 'none' : ''}>
                        {filterContent}
                    </Grid>
                    <Grid item lg={10} md={10} sm={9} xs={13}>
                        {/* {rowSelectionModel.length > 0 && (
                            <ActionRowSelect
                                lstOption={[
                                    {
                                        id: '1',
                                        text: 'Chuyển khu vực',
                                        isShow: abpCustom.isGrandPermission('Pages.DM_HangHoa.Edit')
                                    },
                                    {
                                        id: '2',
                                        text: 'Xóa Khu vực',
                                        isShow: abpCustom.isGrandPermission('Pages.DM_HangHoa.Delete')
                                    }
                                ]}
                                countRowSelected={rowSelectionModel.length}
                                title="Vị trí"
                                choseAction={DataGrid_handleAction}
                                removeItemChosed={() => {
                                    setRowSelectionModel([]);
                                    setCheckAllRow(false);
                                }}
                            />
                        )} */}

                        <Box className="page-box-right" marginTop={rowSelectionModel.length > 0 ? 1 : 0}>
                            <DataGrid
                                className={rowSelectionModel.length > 0 ? 'data-grid-row-chosed' : 'data-grid-row'}
                                autoHeight={pageDataViTri.items.length === 0}
                                disableRowSelectionOnClick
                                rowHeight={42}
                                rows={pageDataViTri.items}
                                columns={columns}
                                hideFooter
                                checkboxSelection={false}
                                localeText={TextTranslate}
                            />

                            <Grid
                                item
                                container
                                style={{
                                    display: pageDataViTri.totalCount > 0 ? 'flex' : 'none',
                                    paddingLeft: '16px',
                                    bottom: '16px'
                                }}>
                                <Grid item xs={4} md={4} lg={4} sm={4}>
                                    <OptionPage
                                        changeNumberOfpage={changeNumberOfpage}
                                        totalRow={pageDataViTri.totalCount}
                                    />
                                </Grid>
                                <Grid item xs={8} md={8} lg={8} sm={8}>
                                    <Stack direction="row" style={{ float: 'right' }}>
                                        <LabelDisplayedRows
                                            currentPage={filterPageViTri.currentPage}
                                            pageSize={filterPageViTri.pageSize}
                                            totalCount={pageDataViTri.totalCount}
                                        />
                                        <Pagination
                                            shape="rounded"
                                            count={pageDataViTri.totalPage}
                                            page={filterPageViTri.currentPage}
                                            defaultPage={filterPageViTri.currentPage}
                                            onChange={handleChangePage}
                                        />
                                    </Stack>
                                </Grid>
                            </Grid>
                        </Box>
                        <Popover
                            id={'popover-filter'}
                            open={Boolean(anchorElFilter)}
                            anchorEl={anchorElFilter}
                            onClose={() => {
                                setAnchorElFilter(null);
                            }}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'center'
                            }}
                            sx={{ marginTop: 1 }}>
                            {filterContent}
                        </Popover>
                    </Grid>
                </Grid>
            </Grid>
        </>
    );
};

export default observer(PageProduct);
