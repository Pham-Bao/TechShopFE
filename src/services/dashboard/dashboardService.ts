import { PagedResultDto } from '../dto/pagedResultDto';
import { RequestFromToDto } from '../dto/ParamSearchDto';
import http from '../httpService';
import { DanhSachLichHen } from './dto/danhSachLichHen';
import { ThongKeTongQuan } from './dto/thongKeTongQuan';

class DashboardService {
    public async thongKeSoLuong(input: RequestFromToDto) {
        const response = await http.post(`api/services/app/Dashboard/ThongKeSoLuong`, input);
        return response.data.result;
    }
    public async danhSachLichHen(input: RequestFromToDto): Promise<PagedResultDto<DanhSachLichHen>> {
        const response = await http.post(`api/services/app/Dashboard/DanhSachLichHen`, input);
        return response.data.result;
    }
    public async thongKeLichHen(input: RequestFromToDto) {
        const response = await http.post(`api/services/app/Dashboard/ThongKeLichHen`, input);
        return response.data.result;
    }
    public async thongKeDoanhThu(input: RequestFromToDto) {
        // doanh thu theo tháng = tổng phiếu thu theo sổ quỹ
        const response = await http.post(`api/services/app/Dashboard/ThongKeDoanhThuTheoThu`, input);
        return response.data.result;
    }
    // thẻ số liệu: tổng thu / chi theo sổ quỹ, số máy đang bày bán / đã bán / đang sửa / đã sửa
    public async thongKeTongQuan(input: RequestFromToDto): Promise<ThongKeTongQuan> {
        const response = await http.post(`api/services/app/Dashboard/ThongKeTongQuan`, input);
        return response.data.result;
    }
    public async thongKeHotService(input: RequestFromToDto | null) {
        try {
            const response = await http.post(`api/services/app/Dashboard/ThongKeHotService`, input);
            return response.data.result;
        } catch {
            return null;
        }
    }
}
export default new DashboardService();
