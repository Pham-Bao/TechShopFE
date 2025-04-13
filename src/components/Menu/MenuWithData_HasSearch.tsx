import { Checkbox, Menu, MenuItem, Stack, TextField, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { IList } from '../../services/dto/IList';
import { CSSProperties } from 'styled-components';
import { useState } from 'react';

type IPropsMenu = {
    open: boolean;
    hasCheckBox?: boolean;
    lstData: IList[];
    anchorEl: HTMLElement | null;
    handleChoseItem?: (item: IList) => void;
    choseMultipleItem?: (arrId: string[]) => void;
    handleClose: () => void;
    style?: CSSProperties;
};
export default function MenuWithDataHasSearch({
    open,
    hasCheckBox,
    lstData,
    anchorEl,
    handleChoseItem,
    choseMultipleItem,
    handleClose
}: IPropsMenu) {
    const [arrIdChosed, setArrIdChosed] = useState<string[]>([]);

    const changeCheckBox = (id: string, isCheck: boolean) => {
        let arrNew: string[];
        if (isCheck) {
            arrNew = [id, ...arrIdChosed];
        } else {
            arrNew = arrIdChosed?.filter((x) => x !== id);
        }
        setArrIdChosed(arrNew);
        if (choseMultipleItem) {
            choseMultipleItem(arrNew);
        }
    };

    const changeCheckAll = (isCheck: boolean) => {
        let arrNew: string[];
        if (isCheck) {
            arrNew = lstData?.map((x) => {
                return x.id;
            });
        } else {
            arrNew = [];
        }
        setArrIdChosed(arrNew);
        if (choseMultipleItem) {
            choseMultipleItem(arrNew);
        }
    };

    return (
        <Menu
            id="menu-with-data-has-search"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            MenuListProps={{
                'aria-labelledby': 'basic-button'
            }}>
            <TextField size="small" InputProps={{ startAdornment: <SearchIcon /> }} variant="standard" />

            {hasCheckBox && (
                <Checkbox
                    sx={{
                        '&.MuiCheckbox-root': {
                            paddingLeft: 0
                        }
                    }}
                    onChange={(e) => changeCheckAll(e.currentTarget.checked)}
                />
            )}
            {lstData?.map((x, index) => (
                <MenuItem
                    key={index}
                    onClick={() => {
                        if (handleChoseItem) handleChoseItem(x);
                    }}>
                    <Stack direction="row" spacing={1} alignItems={'center'}>
                        {hasCheckBox && (
                            <Checkbox
                                sx={{
                                    '&.MuiCheckbox-root': {
                                        paddingLeft: 0
                                    }
                                }}
                                onChange={(e) => changeCheckBox(x.id, e.currentTarget.checked)}
                            />
                        )}
                        <Typography variant="body1"> {x.text}</Typography>
                    </Stack>
                </MenuItem>
            ))}
        </Menu>
    );
}
