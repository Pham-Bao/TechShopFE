import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    TextField,
    List,
    ListItem,
    ListItemAvatar,
    Avatar,
    ListItemText,
    Checkbox,
    Typography,
    Divider,
    IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import NhanVienService from '../../../../../services/nhan-vien/nhanVienService';
import { PagedNhanSuRequestDto } from '../../../../../services/nhan-vien/dto/PagedNhanSuRequestDto';
import chietKhauDichVuService from '../../../../../services/hoa_hong/chiet_khau_dich_vu/chietKhauDichVuService';
import SnackbarAlert from '../../../../../components/AlertDialog/SnackbarAlert';

interface CommissionCopyDialogProps {
    open: boolean;
    onClose: () => void;
    employeeId: string | null; // Thêm prop để nhận ID nhân viên
}

const CommissionCopyDialog: React.FC<CommissionCopyDialogProps> = ({ open, onClose, employeeId }) => {
    const [selectedDepartment, setSelectedDepartment] = useState<string>('Tất cả');
    const [appliedEmployees, setAppliedEmployees] = useState<string[]>([]); // Lưu danh sách nhân viên đã chọn
    const [employees, setEmployees] = useState<any[]>([]); // Lưu danh sách nhân viên
    const [departments, setDepartments] = useState<string[]>([]); // Lưu danh sách phòng ban từ API
    const [searchTerm, setSearchTerm] = useState<string>(''); // Dùng để lọc tìm kiếm nhân viên
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [defaultEmployee, setDefaultEmployee] = useState<any | null>(null); // Lưu nhân viên sao chép từ
    const [objAlert, setObjAlert] = useState({ show: false, type: 1, mes: '' });

    const GetListNhanVien = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await NhanVienService.getAll({
                skipCount: 0,
                maxResultCount: 100
            } as PagedNhanSuRequestDto);

            const employeeData = data.items;
            setEmployees(employeeData);
            const uniqueDepartments = Array.from(new Set(employeeData.map((e) => e.tenChucVu)));
            setDepartments(['Tất cả', ...uniqueDepartments]);

            if (employeeId) {
                const foundEmployee = employeeData.find((emp) => emp.id === String(employeeId));
                setDefaultEmployee(foundEmployee);
            }
        } catch (err) {
            setError('Không thể tải dữ liệu nhân viên. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            GetListNhanVien();
        }
    }, [open, employeeId]);

    const handleToggleApplyEmployee = (id: string) => {
        setAppliedEmployees((prev) => (prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]));
    };
    const filteredEmployees = employees.filter((employee) => {
        const matchesDepartment = selectedDepartment === 'Tất cả' || employee.tenChucVu === selectedDepartment;
        const matchesSearchTerm = employee.tenNhanVien.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesDepartment && matchesSearchTerm;
    });
    const handleApplyCommissions = async () => {
        try {
            if (!employeeId) {
                alert('Không có nhân viên nguồn để sao chép.');
                return;
            }

            if (!appliedEmployees || appliedEmployees.length === 0) {
                alert('Vui lòng chọn ít nhất một nhân viên để sao chép.');
                return;
            }

            const employeeIdNumber = employeeId;
            const appliedEmployeesNumbers = appliedEmployees.map((id) => id);

            // Chia thành các nhóm 5 phần tử
            const chunkSize = 20;
            const chunkedAppliedEmployees = chunkArray(appliedEmployeesNumbers, chunkSize);

            // Lặp qua các nhóm và gọi CopyCommissions cho từng nhóm
            for (let i = 0; i < chunkedAppliedEmployees.length; i++) {
                const result = await chietKhauDichVuService.CopyCommissions(
                    employeeIdNumber,
                    chunkedAppliedEmployees[i]
                );

                if (!result) {
                    setObjAlert({ ...objAlert, show: true, mes: 'Cài đặt hoa hồng dịch vụ thất bại', type: 2 });
                    return;
                }
            }

            setObjAlert({ ...objAlert, show: true, mes: 'Cài đặt hoa hồng dịch vụ thành công', type: 1 });
            onClose();
        } catch (error) {
            if (error instanceof Error) {
                console.error('Lỗi:', error.message);
            } else {
                console.error('Lỗi không xác định:', error);
            }
        }
    };

    // Hàm hỗ trợ chia mảng thành các nhóm
    const chunkArray = (arr: string[], chunkSize: number): string[][] => {
        const result: string[][] = [];
        for (let i = 0; i < arr.length; i += chunkSize) {
            result.push(arr.slice(i, i + chunkSize));
        }
        return result;
    };

    return (
        <>
            <SnackbarAlert
                showAlert={objAlert.show}
                type={objAlert.type}
                title={objAlert.mes}
                handleClose={() => setObjAlert({ show: false, mes: '', type: 1 })}></SnackbarAlert>
            <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
                <DialogTitle>
                    Sao chép cài đặt hoa hồng
                    <IconButton
                        aria-label="close"
                        onClick={onClose}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                            color: 'red'
                        }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        height: '70vh',
                        overflow: 'hidden'
                    }}>
                    <Box sx={{ mb: 2 }}>
                        {defaultEmployee ? (
                            <Typography variant="body1">
                                <strong>Nhân viên sao chép từ:</strong> {defaultEmployee.tenNhanVien} - Bộ phận:{' '}
                                {defaultEmployee.tenChucVu}
                            </Typography>
                        ) : (
                            <Typography variant="body1">Đang tải thông tin nhân viên...</Typography>
                        )}
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, flex: 1 }}>
                        <Box sx={{ flex: 3, overflowY: 'auto', maxHeight: '100%' }}>
                            <Typography variant="h6">Phòng ban</Typography>
                            <Divider sx={{ my: 1 }} />
                            <List>
                                {departments.map((dept, index) => (
                                    <ListItem
                                        key={index}
                                        button
                                        selected={selectedDepartment === dept}
                                        onClick={() => setSelectedDepartment(dept)}
                                        sx={
                                            dept === 'Tất cả'
                                                ? { pl: 1, fontWeight: 'bold' }
                                                : { pl: 3, fontWeight: 'bold' }
                                        }>
                                        <ListItemText primary={dept} primaryTypographyProps={{ fontWeight: 'bold' }} />
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                        <Box sx={{ flex: 7, display: 'flex', flexDirection: 'column', overflowY: 'hidden' }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="h6">Nhân viên áp dụng</Typography>
                                <Checkbox
                                    indeterminate={
                                        appliedEmployees.length > 0 && appliedEmployees.length < employees.length
                                    }
                                    checked={appliedEmployees.length === employees.length}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setAppliedEmployees(employees.map((employee) => employee.id));
                                        } else {
                                            setAppliedEmployees([]);
                                        }
                                    }}
                                />
                            </Box>
                            <Divider sx={{ my: 1 }} />
                            <TextField
                                fullWidth
                                variant="outlined"
                                placeholder="Tìm nhân viên"
                                size="small"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                sx={{ mb: 2 }}
                            />
                            <Box sx={{ flex: 1, overflowY: 'auto', maxHeight: '70%' }}>
                                <List>
                                    {filteredEmployees.map((employee) => (
                                        <ListItem
                                            key={employee.id}
                                            button
                                            onClick={() => handleToggleApplyEmployee(employee.id)}>
                                            <ListItemAvatar>
                                                <Avatar>{employee.tenNhanVien[0]}</Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={employee.tenNhanVien}
                                                secondary={employee.tenChucVu}
                                            />
                                            <Checkbox checked={appliedEmployees.includes(employee.id)} />
                                        </ListItem>
                                    ))}
                                </List>
                            </Box>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button variant="outlined" onClick={onClose} color="error">
                        Bỏ qua
                    </Button>
                    <Button variant="contained" onClick={handleApplyCommissions}>
                        Áp dụng
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default CommissionCopyDialog;
