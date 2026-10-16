import { LoaiChungTu } from '../../lib/appconst';
import DanhSachPhieuKho from './components/DanhSachPhieuKho';

const KhachTraHang = () => {
    return (
        <DanhSachPhieuKho
            title="Khách trả hàng"
            idLoaiChungTu={LoaiChungTu.KHACH_TRA_HANG}
            pathTaoMoi="/khach-tra-hang/tao-moi"
            labelDoiTuong="Khách hàng"
        />
    );
};

export default KhachTraHang;
