import {
    Popover,
    Stack,
    Typography,
    Button,
    Grid,
    TextField,
    FormControl,
    Select,
    MenuItem,
    Checkbox,
    ListItemText
} from '@mui/material';
import { useState, useEffect } from 'react';
import { DienThoaiRequestDto } from '../../services/dto/ParamSearchDto';
import { IPropsPopoverFilter } from '../../services/dto/IPropsComponent';
import { format, addDays } from 'date-fns';
import DateFilterCustom from '../../components/DatetimePicker/DateFilterCustom';
import { DateType } from '../../lib/appconst';

// ===== OPTIONS =====
const TRANG_THAI_OPTIONS = [
    { value: 1, text: 'Đã bán' },
    { value: 2, text: 'Chưa bán' },
    { value: 3, text: 'Cho mượn' },
    { value: 4, text: 'Khách hẹn' },
    { value: 5, text: 'Khác' }
];

const DUNG_LUONG_OPTIONS = ['128GB', '256GB', '512GB', '1TB', '2TB'];
const MAU_OPTIONS = ['Đen', 'Đỏ', 'Hồng', 'Trắng', 'Vàng'];

export default function PopoverFilterDienThoai(props: IPropsPopoverFilter<DienThoaiRequestDto>) {
    const { id, anchorEl, handleClose, handleApply, paramFilter } = props;

    const [anchorDateEl, setAnchorDateEl] = useState<HTMLDivElement | null>(null);
    const openDateFilter = Boolean(anchorDateEl);

    const [filter, setFilter] = useState<DienThoaiRequestDto>({} as DienThoaiRequestDto);

    useEffect(() => {
        const today = new Date();

        setFilter({
            ...paramFilter,
            fromDate: paramFilter?.fromDate ?? format(today, 'yyyy-MM-01'),
            toDate: paramFilter?.toDate ?? format(today, 'yyyy-MM-dd'),
            trangThai: paramFilter?.trangThai ?? [],
            dungLuong: paramFilter?.dungLuong ?? '',
            mau: paramFilter?.mau ?? ''
        });
    }, [paramFilter]);

    const onApply = () => {
        handleApply(filter);
    };

    const onApplyFilterDate = (from: string, to: string, dateType: string) => {
        setAnchorDateEl(null);

        setFilter((prev) => ({
            ...prev,
            fromDate: from,
            toDate: format(addDays(new Date(to), 1), 'yyyy-MM-dd'),
            currentPage: 1,
            dateType: dateType
        }));
    };

    return (
        <Popover
            id={id ?? 'popover-filter'}
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={handleClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
            <Grid p={2} minWidth={280}>
                <Stack spacing={1.5}>
                    <Typography fontWeight={600} fontSize={14}>
                        Bộ lọc
                    </Typography>

                    {/* ===== DATE ===== */}
                    <TextField
                        size="small"
                        fullWidth
                        onClick={(e) => setAnchorDateEl(e.currentTarget)}
                        value={`${format(new Date(filter?.fromDate ?? new Date()), 'dd/MM/yyyy')} - ${format(
                            new Date(filter?.toDate ?? new Date()),
                            'dd/MM/yyyy'
                        )}`}
                    />

                    <DateFilterCustom
                        id="popover-date-filter"
                        open={openDateFilter}
                        anchorEl={anchorDateEl}
                        onClose={() => setAnchorDateEl(null)}
                        onApplyDate={onApplyFilterDate}
                        dateTypeDefault={filter?.dateType ?? DateType.THANG_NAY}
                    />

                    {/* ===== TRẠNG THÁI ===== */}
                    <FormControl size="small" fullWidth>
                        <Select
                            multiple
                            displayEmpty
                            value={filter.trangThai || []}
                            renderValue={(selected) =>
                                selected.length
                                    ? TRANG_THAI_OPTIONS.filter((x) => selected.includes(x.value))
                                          .map((x) => x.text)
                                          .join(', ')
                                    : 'Trạng thái'
                            }
                            onChange={(e) =>
                                setFilter({
                                    ...filter,
                                    trangThai: e.target.value as number[]
                                })
                            }>
                            {TRANG_THAI_OPTIONS.map((item) => (
                                <MenuItem key={item.value} value={item.value}>
                                    <Checkbox size="small" checked={filter.trangThai?.includes(item.value)} />
                                    <ListItemText primary={item.text} />
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* ===== DUNG LƯỢNG ===== */}
                    <FormControl size="small" fullWidth>
                        <Select
                            multiple
                            displayEmpty
                            value={(filter.dungLuong || '').split(',').filter(Boolean)}
                            renderValue={(selected) => (selected.length ? selected.join(', ') : 'Dung lượng')}
                            onChange={(e) =>
                                setFilter({
                                    ...filter,
                                    dungLuong: (e.target.value as string[]).join(',')
                                })
                            }>
                            {DUNG_LUONG_OPTIONS.map((item) => (
                                <MenuItem key={item} value={item}>
                                    <Checkbox
                                        size="small"
                                        checked={(filter.dungLuong || '').split(',').includes(item)}
                                    />
                                    <ListItemText primary={item} />
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* ===== MÀU ===== */}
                    <FormControl size="small" fullWidth>
                        <Select
                            multiple
                            displayEmpty
                            value={(filter.mau || '').split(',').filter(Boolean)}
                            renderValue={(selected) => (selected.length ? selected.join(', ') : 'Màu sắc')}
                            onChange={(e) =>
                                setFilter({
                                    ...filter,
                                    mau: (e.target.value as string[]).join(',')
                                })
                            }>
                            {MAU_OPTIONS.map((item) => (
                                <MenuItem key={item} value={item}>
                                    <Checkbox size="small" checked={(filter.mau || '').split(',').includes(item)} />
                                    <ListItemText primary={item} />
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* ===== BUTTON ===== */}
                    <Stack direction="row" spacing={1} mt={1}>
                        <Button size="small" variant="outlined" fullWidth onClick={handleClose}>
                            Đóng
                        </Button>

                        <Button size="small" variant="contained" fullWidth onClick={onApply}>
                            Lọc
                        </Button>
                    </Stack>
                </Stack>
            </Grid>
        </Popover>
    );
}
