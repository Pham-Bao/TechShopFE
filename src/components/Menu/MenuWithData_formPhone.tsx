import { debounce, Menu, MenuItem, Stack, TextField, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { CSSProperties } from 'styled-components';
import { useEffect, useRef, useState } from 'react';
import ProductService from '../../services/product/ProductService';
import { PagedProductSearchDto } from '../../services/product/dto';
import { IListPhone } from '../../services/dto/IListPhone';
import { TypeSearchfromDB } from '../../enum/TypeSearch_fromDB';

type IPropsMenu = {
    open: boolean;
    typeSearch: number; // 1: customer, other: product or other types
    anchorEl: HTMLElement | null;
    handleChoseItem: (item: IListPhone) => void;
    handleClose: () => void;
    style?: CSSProperties;
};

export default function MenuWithDataFromPhone({
    open,
    typeSearch,
    anchorEl,
    handleChoseItem,
    handleClose
}: IPropsMenu) {
    const [txtSearch, setTxtSearch] = useState<string>('');
    const [lstOption, setLstOption] = useState<IListPhone[]>([]);
    const [filterPageProduct, setFilterPageProduct] = useState<PagedProductSearchDto>({
        idNhomHangHoas: [],
        textSearch: '',
        currentPage: 1,
        pageSize: 50,
        columnSort: '',
        typeSort: ''
    });

    const debounceDropDown = useRef(
        debounce(async (txt: string) => {
            switch (typeSearch) {
                case TypeSearchfromDB.CUSTOMER: {
                    const data = await ProductService.Get_DMHangHoaDienThoai(filterPageProduct);

                    // Kiểm tra xem dữ liệu trả về có items không, rồi map qua để lấy thông tin cần thiết
                    const arrProduct = data?.items?.map((x: any) => {
                        return {
                            id: x.id.toString(),
                            tenMay: x.tenHangHoa,
                            tenNhomHang: x.tenNhomHang, // Tên máy
                            imel: x.imel, // IMEI
                            dungLuong: x.dungLuong,
                            mau: x.mau,
                            chuMay: x.tenChu,
                            noiDung: x.noiDung,
                            loi: x.loi,
                            pin: x.pin,
                            idChuSoHuu: x.idChuSoHuu
                        } as IListPhone;
                    });

                    // Cập nhật danh sách các option
                    setLstOption(arrProduct || []);
                    break;
                }
                default:
                    break;
            }
        }, 500)
    ).current;

    useEffect(() => {
        debounceDropDown(txtSearch);
    }, [txtSearch]);

    return (
        <Menu
            id="menu-with-data-from-db"
            anchorEl={anchorEl}
            open={open}
            autoFocus={false}
            onClose={handleClose}
            MenuListProps={{
                'aria-labelledby': 'basic-button'
            }}>
            <MenuItem
                disableRipple={true}
                sx={{
                    cursor: 'none',
                    '&:hover': {
                        backgroundColor: 'transparent'
                    },
                    '&.Mui-focusVisible': {
                        backgroundColor: 'transparent'
                    }
                }}>
                <TextField
                    onKeyDown={(e) => e.stopPropagation()}
                    autoFocus
                    fullWidth
                    size="small"
                    InputProps={{ startAdornment: <SearchIcon /> }}
                    variant="standard"
                    onChange={(e) => setTxtSearch(e.target.value)}
                />
            </MenuItem>

            {lstOption?.map((x, index) => (
                <MenuItem
                    key={index}
                    onClick={() => handleChoseItem(x)}
                    style={{
                        borderBottom: index === (lstOption?.length ?? 0) - 1 ? 'none' : '1px solid #ccc'
                    }}>
                    <Stack spacing={0.1}>
                        <Stack spacing={0.1} direction="row" alignItems="center">
                            <Typography sx={{ display: 'inline' }}>{x.tenMay}</Typography> {/* Tên máy */}
                            <Typography sx={{ display: 'inline', mx: 1 }}>|</Typography> {/* Gạch ngang giữa */}
                            <Typography sx={{ display: 'inline' }}>{x.dungLuong}GB</Typography> {/* Dung lượng */}
                            <Typography sx={{ display: 'inline', mx: 1 }}>|</Typography> {/* Gạch ngang giữa */}
                            <Typography sx={{ display: 'inline' }}>{x.mau}</Typography> {/* Màu */}
                        </Stack>
                        {x.chuMay && (
                            <Typography sx={{ color: '#acaca5', fontSize: '12px' }}>User: {x.chuMay}</Typography>
                        )}
                        {x.noiDung && (
                            <Typography sx={{ color: '#acaca5', fontSize: '12px' }}>Nhóm: {x.noiDung}</Typography>
                        )}
                        {x.loi && <Typography sx={{ color: '#acaca5', fontSize: '12px' }}>Lỗi: {x.loi}</Typography>}
                    </Stack>
                </MenuItem>
            ))}
        </Menu>
    );
}
