import {
    Popover,
    Stack,
    Typography,
    Button,
    Grid,
    FormControl,
    Select,
    MenuItem,
    Checkbox,
    ListItemText
} from '@mui/material';
import { useEffect, useState } from 'react';
import { IPropsPopoverFilter } from '../../services/dto/IPropsComponent';
import { PagedProductSearchDto, SoLuongTheoTrangThaiBanHangDto } from '../../services/product/dto';
import { listTrangThai } from './TrangThaiHangSelect';

// ===== OPTIONS =====
const DUNG_LUONG_OPTIONS = ['16', '32', '64', '128', '256', '512'];

const MAU_OPTIONS = ['Đen', 'Đỏ', 'Hồng', 'Trắng', 'Vàng'];

export default function PopoverFilterDienThoai(
    props: IPropsPopoverFilter<PagedProductSearchDto> & { soLuongTheoTrangThai?: SoLuongTheoTrangThaiBanHangDto[] }
) {
    const { id, anchorEl, handleClose, handleApply, paramFilter, soLuongTheoTrangThai } = props;

    const getSoLuong = (trangThai: number) =>
        soLuongTheoTrangThai?.find((x) => x.trangThai === trangThai)?.soLuong ?? 0;

    const [filter, setFilter] = useState<PagedProductSearchDto>(new PagedProductSearchDto({}));

    const allTrangThaiValues = listTrangThai.map((x) => x.value);
    const isAllTrangThaiSelected = allTrangThaiValues.every((v) => (filter.trangThais ?? []).includes(v));
    const toggleSelectAllTrangThai = () => {
        setFilter({
            ...filter,
            trangThais: isAllTrangThaiSelected ? [] : allTrangThaiValues
        });
    };

    useEffect(() => {
        setFilter({
            ...paramFilter,
            trangThais: paramFilter?.trangThais ?? [],
            dungLuong: paramFilter?.dungLuong ?? [],
            mau: paramFilter?.mau ?? []
        });
    }, [paramFilter]);

    const onApply = () => {
        handleApply(filter);
    };

    return (
        <Popover
            id={id ?? 'popover-filter'}
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={handleClose}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'center'
            }}>
            <Grid p={2} minWidth={300}>
                <Stack spacing={2}>
                    <Typography fontWeight={600}>Bộ lọc</Typography>

                    {/* ===== TRẠNG THÁI ===== */}
                    <FormControl fullWidth size="small">
                        <Select
                            multiple
                            displayEmpty
                            value={filter.trangThais ?? []}
                            renderValue={(selected) =>
                                (selected as number[]).length
                                    ? listTrangThai
                                          .filter((x) => (selected as number[]).includes(x.value))
                                          .map((x) => x.label)
                                          .join(', ')
                                    : 'Trạng thái'
                            }
                            onChange={(e) =>
                                setFilter({
                                    ...filter,
                                    trangThais: e.target.value as number[]
                                })
                            }>
                            <MenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSelectAllTrangThai();
                                }}>
                                <Checkbox
                                    checked={isAllTrangThaiSelected}
                                    indeterminate={!isAllTrangThaiSelected && (filter.trangThais?.length ?? 0) > 0}
                                />
                                <ListItemText
                                    primary="Chọn tất cả"
                                    primaryTypographyProps={{ sx: { fontWeight: 500 } }}
                                />
                            </MenuItem>
                            {listTrangThai.map((item) => (
                                <MenuItem key={item.value} value={item.value}>
                                    <Checkbox checked={filter.trangThais?.includes(item.value) ?? false} />
                                    <ListItemText
                                        primary={`${item.label} (${getSoLuong(item.value)})`}
                                        primaryTypographyProps={{ sx: { color: item.color, fontWeight: 500 } }}
                                    />
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* ===== DUNG LƯỢNG ===== */}
                    <FormControl fullWidth size="small">
                        <Select
                            multiple
                            displayEmpty
                            value={filter.dungLuong ?? []}
                            renderValue={(selected) =>
                                (selected as number[]).length ? (selected as number[]).join(', ') : 'Dung lượng'
                            }
                            onChange={(e) =>
                                setFilter({
                                    ...filter,
                                    dungLuong: e.target.value as number[]
                                })
                            }>
                            {DUNG_LUONG_OPTIONS.map((item) => {
                                const value = Number(item.replace('GB', ''));

                                return (
                                    <MenuItem key={value} value={value}>
                                        <Checkbox checked={(filter.dungLuong ?? []).includes(value)} />
                                        <ListItemText primary={item} />
                                    </MenuItem>
                                );
                            })}
                        </Select>
                    </FormControl>

                    {/* ===== MÀU ===== */}
                    <FormControl fullWidth size="small">
                        <Select
                            multiple
                            displayEmpty
                            value={filter.mau ?? []}
                            renderValue={(selected) =>
                                (selected as string[]).length ? (selected as string[]).join(', ') : 'Màu sắc'
                            }
                            onChange={(e) =>
                                setFilter({
                                    ...filter,
                                    mau: e.target.value as string[]
                                })
                            }>
                            {MAU_OPTIONS.map((item) => (
                                <MenuItem key={item} value={item}>
                                    <Checkbox checked={filter.mau?.includes(item) ?? false} />
                                    <ListItemText primary={item} />
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Stack direction="row" spacing={1}>
                        <Button variant="outlined" fullWidth onClick={handleClose}>
                            Đóng
                        </Button>

                        <Button variant="contained" fullWidth onClick={onApply}>
                            Lọc
                        </Button>
                    </Stack>
                </Stack>
            </Grid>
        </Popover>
    );
}
