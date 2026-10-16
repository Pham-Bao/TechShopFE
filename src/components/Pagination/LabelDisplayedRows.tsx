import { Typography } from '@mui/material';
export const LabelDisplayedRows = ({ currentPage, pageSize, totalCount }: any) => {
    return (
        <>
            <Typography variant="body2" style={{ paddingTop: '6px' }} className="label-displayed-rows">
                <span className="label-rows-full">
                    Hiển thị {(currentPage - 1) * pageSize + 1} -{' '}
                    {currentPage * pageSize > totalCount ? totalCount : currentPage * pageSize} của {totalCount} bản ghi
                </span>
                {/* điện thoại: rút gọn dạng 1-10/19 */}
                <span className="label-rows-short">
                    {(currentPage - 1) * pageSize + 1}-
                    {currentPage * pageSize > totalCount ? totalCount : currentPage * pageSize}/{totalCount}
                </span>
            </Typography>
        </>
    );
};
