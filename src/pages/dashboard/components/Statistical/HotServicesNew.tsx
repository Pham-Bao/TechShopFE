import React from 'react';
import './hotServicesNew.css';
import dashboardStore from '../../../../stores/dashboardStore';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { observer } from 'mobx-react';
import { Box, Typography } from '@mui/material';
const HotServicesNew: React.FC = () => {
    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('vi-VN').format(num);
    };

    const CustomTooltip = ({ payload, label }: any) => {
        if (!payload || payload.length === 0) return null;
        const value = payload[0].value;
        const color = payload[0].color;

        return (
            <div style={{ padding: '8px', backgroundColor: 'white' }}>
                <p style={{ whiteSpace: 'nowrap' }}>{label}</p>
                <p
                    style={{
                        color: color,
                        fontSize: 16,
                        marginTop: '4px'
                    }}>{`* Giá trị: ${formatNumber(value)}`}</p>{' '}
            </div>
        );
    };

    if (dashboardStore.danhSachDichVuHot?.length == 0)
        return (
            <Box height={300}>
                <Typography variant="body1"> Không có dữ liệu</Typography>
            </Box>
        );

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart layout="vertical" data={dashboardStore.danhSachDichVuHot} margin={{ right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: '12px', fill: '#8884d8' }} tickFormatter={formatNumber} />
                <YAxis
                    type="category"
                    dataKey="tenHangHoa"
                    width={400}
                    tick={{
                        style: {
                            whiteSpace: 'nowrap', // Đảm bảo văn bản không xuống dòng
                            overflow: 'hidden', // Ẩn phần văn bản vượt quá
                            textOverflow: 'ellipsis', // Thêm dấu ba chấm khi văn bản quá dài
                            maxWidth: '100px', // Giới hạn chiều rộng của nhãn trục Y
                            paddingRight: '5px'
                        }
                    }}
                />
                <Tooltip formatter={(value: number) => formatNumber(value)} content={<CustomTooltip />} />
                <Legend />

                <Bar dataKey="giaTri" fill="#8884d8" barSize={20} />
            </BarChart>
        </ResponsiveContainer>
    );
};
export default observer(HotServicesNew);
