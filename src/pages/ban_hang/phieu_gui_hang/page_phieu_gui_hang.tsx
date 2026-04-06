/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Box, Grid, TextField, Typography, Button, Stack } from '@mui/material';

import { PagedRequestDto } from '../../../services/dto/pagedRequestDto';
import chiNhanhService from '../../../services/chi_nhanh/chiNhanhService';

import MenuWithDataFromDB from '../../../components/Menu/MenuWithData_fromDB';
import { TypeSearchfromDB } from '../../../enum/TypeSearch_fromDB';

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

    const [allChiNhanh, setAllChiNhanh] = useState<any[]>([]);

    // ===== MENU CONTROL =====
    const [anchorElReceiver, setAnchorElReceiver] = useState<HTMLElement | null>(null);
    const openReceiver = Boolean(anchorElReceiver);

    // ===== LOAD CHI NHÁNH =====
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

    // ===== HANDLE CHANGE =====
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // ===== PRINT =====
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
            <Typography variant="h5">Phiếu Gửi Hàng</Typography>

            <Grid container spacing={3}>
                {/* ===== NGƯỜI GỬI ===== */}
                <Grid item xs={12} md={6}>
                    <Typography variant="h6">Người Gửi</Typography>

                    <Stack spacing={2}>
                        <TextField label="Tên chi nhánh" value={formData.senderName} fullWidth />

                        <TextField
                            label="SĐT"
                            value={formData.senderPhone}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    senderPhone: e.target.value.replace(/[^0-9]/g, '')
                                }))
                            }
                        />

                        <TextField label="Địa chỉ" value={formData.senderAddress} onChange={handleChange} />
                    </Stack>
                </Grid>

                {/* ===== NGƯỜI NHẬN ===== */}
                <Grid item xs={12} md={6}>
                    <Typography variant="h6">Người Nhận</Typography>

                    <Stack spacing={2}>
                        <TextField
                            label="Tên người nhận"
                            value={formData.receiverName}
                            fullWidth
                            onClick={(e) => setAnchorElReceiver(e.currentTarget)}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    receiverName: e.target.value
                                }))
                            }
                        />

                        <TextField
                            label="SĐT"
                            value={formData.receiverPhone}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    receiverPhone: e.target.value.replace(/[^0-9]/g, '')
                                }))
                            }
                        />

                        <TextField label="Địa chỉ" value={formData.receiverAddress} onChange={handleChange} />
                    </Stack>
                </Grid>

                {/* ===== HÀNG ===== */}
                <Grid item xs={12}>
                    <Stack spacing={2}>
                        <TextField
                            label="Tên hàng"
                            name="productName"
                            value={formData.productName}
                            onChange={handleChange}
                        />

                        <TextField
                            label="Số lượng"
                            value={formData.quantity}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    quantity: e.target.value.replace(/[^0-9]/g, '')
                                }))
                            }
                        />

                        <TextField
                            label="Khối lượng"
                            value={formData.weight}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    weight: e.target.value.replace(/[^0-9.]/g, '')
                                }))
                            }
                        />

                        <TextField label="Ghi chú" name="note" value={formData.note} onChange={handleChange} />
                    </Stack>
                </Grid>

                <Grid item xs={12}>
                    <Button variant="contained" onClick={handleSubmit}>
                        Lưu & In
                    </Button>
                </Grid>
            </Grid>

            {/* ===== MENU SEARCH CUSTOMER ===== */}
            <MenuWithDataFromDB
                open={openReceiver}
                anchorEl={anchorElReceiver}
                typeSearch={TypeSearchfromDB.CUSTOMER}
                handleClose={() => setAnchorElReceiver(null)}
                handleChoseItem={(item: any) => {
                    setFormData((prev) => ({
                        ...prev,
                        receiverName: item.text,
                        receiverPhone: item.text2 || '',
                        receiverAddress: item.diaChi || ''
                    }));

                    setAnchorElReceiver(null);
                }}
                style={{ width: anchorElReceiver?.clientWidth }}
            />
        </Box>
    );
};

export default PhieuGuiHang;
