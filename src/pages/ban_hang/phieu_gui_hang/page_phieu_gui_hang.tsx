/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Box, Grid, TextField, Typography, Button, Stack, Autocomplete } from '@mui/material';
import { PagedRequestDto } from '../../../services/dto/pagedRequestDto';
import chiNhanhService from '../../../services/chi_nhanh/chiNhanhService';

interface ChiNhanh {
    id: string;
    tenChiNhanh: string;
    soDienThoai: string;
    diaChi: string;
}

const PhieuGuiHang: React.FC = () => {
    const [formData, setFormData] = useState({
        senderName: '',
        senderPhone: '',
        senderAddress: '',
        receiverName: '',
        receiverPhone: '',
        receiverAddress: '',
        productName: '',
        quantity: '',
        weight: '',
        note: ''
    });

    const [allChiNhanh, setAllChiNhanh] = useState<ChiNhanh[]>([]);

    useEffect(() => {
        const getAllChiNhanh = async () => {
            const data = await chiNhanhService.GetAll({
                keyword: '',
                maxResultCount: 100,
                skipCount: 0
            } as PagedRequestDto);

            const list = data.items.map((item: any) => ({
                id: item.id,
                tenChiNhanh: item.tenChiNhanh,
                soDienThoai: item.soDienThoai,
                diaChi: item.diaChi
            }));
            setAllChiNhanh(list);
            if (list.length > 0) {
                setFormData((prev) => ({
                    ...prev,
                    senderName: list[0].tenChiNhanh,
                    senderPhone: list[0].soDienThoai,
                    senderAddress: list[0].diaChi
                }));
            }
        };

        getAllChiNhanh();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = () => {
        printTem();
    };

    const printTem = () => {
        const {
            senderName,
            senderPhone,
            senderAddress,
            receiverName,
            receiverPhone,
            receiverAddress,
            productName,
            quantity,
            weight,
            note
        } = formData;

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
          @page {
            size: 80mm 60mm;
            margin: 0;
          }

          body {
            font-family: Arial, sans-serif;
            font-size: 10px;
            margin: 0;
            padding: 6px;
            box-sizing: border-box;
            width: 80mm;
            height: 60mm;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
          }

          .header {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            margin-bottom: 4px;
          }

          .info-line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
          }

          .columns {
            display: flex;
            justify-content: space-between;
            gap: 8px;
          }

          .column {
            width: 48%;
            line-height: 1.2;
          }

          .section {
            margin-top: 4px;
            line-height: 1.2;
          }

          .line {
            border-bottom: 1px dashed #000;
            margin: 4px 0;
          }

          .bold {
            font-weight: bold;
          }

        </style>
      </head>
      <body>
        <div class="header">
          <div>TECHSHOP</div>
          <div>Mã: <span class="bold">EGSQA56FLX</span></div>
        </div>

        <div class="info-line">
          <div>Ngày in: ${new Date().toLocaleDateString()}</div>
          <div>Khối lượng: ${weight}kg</div>
        </div>

        <div class="columns">
          <div class="column">
            <div class="bold">Người gửi:</div>
            <div>${senderName}</div>
            <div>${senderPhone}</div>
            <div>${senderAddress}</div>
          </div>
          <div class="column">
            <div class="bold">Người nhận:</div>
            <div>${receiverName}</div>
            <div>${receiverPhone}</div>
            <div>${receiverAddress}</div>
          </div>
        </div>

        <div class="line"></div>

        <div class="section">
          <span class="bold">Hàng:</span> ${productName} | SL: ${quantity}
        </div>

        <div class="section">
          <span class="bold">Ghi chú:</span> ${note || '-'}
        </div>

        <script>
          window.onload = function() {
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

    return (
        <Box p={3}>
            <Typography variant="h5" gutterBottom>
                Phiếu Gửi Hàng
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Typography variant="h6">Người Gửi</Typography>
                    <Stack spacing={2}>
                        <Autocomplete
                            freeSolo
                            options={allChiNhanh}
                            getOptionLabel={(option) => (typeof option === 'string' ? option : option.tenChiNhanh)}
                            value={allChiNhanh.find((cn) => cn.tenChiNhanh === formData.senderName) || null}
                            onChange={(event, value) => {
                                if (value && typeof value !== 'string') {
                                    setFormData((prev) => ({
                                        ...prev,
                                        senderName: value.tenChiNhanh,
                                        senderPhone: value.soDienThoai,
                                        senderAddress: value.diaChi
                                    }));
                                } else if (typeof value === 'string') {
                                    setFormData((prev) => ({
                                        ...prev,
                                        senderName: value
                                    }));
                                }
                            }}
                            onInputChange={(event, newInputValue) => {
                                setFormData((prev) => ({ ...prev, senderName: newInputValue }));
                            }}
                            renderInput={(params) => <TextField {...params} label="Tên người gửi" fullWidth />}
                        />
                        <TextField
                            label="Số điện thoại người gửi"
                            name="senderPhone"
                            value={formData.senderPhone}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, senderPhone: e.target.value.replace(/[^0-9]/g, '') }))
                            }
                            fullWidth
                            inputProps={{ maxLength: 11 }}
                        />
                        <TextField
                            label="Địa chỉ người gửi"
                            name="senderAddress"
                            value={formData.senderAddress}
                            onChange={handleChange}
                            fullWidth
                        />
                    </Stack>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Typography variant="h6">Người Nhận</Typography>
                    <Stack spacing={2}>
                        <TextField
                            label="Tên người nhận"
                            name="receiverName"
                            value={formData.receiverName}
                            onChange={handleChange}
                            fullWidth
                        />
                        <TextField
                            label="Số điện thoại người nhận"
                            name="receiverPhone"
                            value={formData.receiverPhone}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    receiverPhone: e.target.value.replace(/[^0-9]/g, '')
                                }))
                            }
                            fullWidth
                            inputProps={{ maxLength: 11 }}
                        />
                        <TextField
                            label="Địa chỉ người nhận"
                            name="receiverAddress"
                            value={formData.receiverAddress}
                            onChange={handleChange}
                            fullWidth
                        />
                    </Stack>
                </Grid>

                <Grid item xs={12}>
                    <Typography variant="h6">Thông Tin Hàng Hóa</Typography>
                    <Stack spacing={2}>
                        <TextField
                            label="Tên hàng hóa"
                            name="productName"
                            value={formData.productName}
                            onChange={handleChange}
                            fullWidth
                        />
                        <TextField
                            label="Số lượng"
                            name="quantity"
                            value={formData.quantity}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, quantity: e.target.value.replace(/[^0-9]/g, '') }))
                            }
                            fullWidth
                        />
                        <TextField
                            label="Trọng lượng (kg)"
                            name="weight"
                            value={formData.weight}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, weight: e.target.value.replace(/[^0-9.]/g, '') }))
                            }
                            fullWidth
                        />
                        <TextField
                            label="Ghi chú"
                            name="note"
                            value={formData.note}
                            onChange={handleChange}
                            fullWidth
                            multiline
                            rows={3}
                        />
                    </Stack>
                </Grid>

                <Grid item xs={12}>
                    <Button variant="contained" color="primary" onClick={handleSubmit}>
                        Lưu & In Ngay
                    </Button>
                </Grid>
            </Grid>
        </Box>
    );
};

export default PhieuGuiHang;
