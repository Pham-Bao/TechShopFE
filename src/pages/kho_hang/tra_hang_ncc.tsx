import { LoaiChungTu } from '../../lib/appconst';
import DanhSachPhieuKho from './components/DanhSachPhieuKho';

const TraHangNCC = () => {
    return (
        <DanhSachPhieuKho
            title="Trả hàng nhà cung cấp"
            idLoaiChungTu={LoaiChungTu.TRA_HANG_NCC}
            pathTaoMoi="/tra-hang-ncc/tao-moi"
            labelDoiTuong="Nhà cung cấp"
        />
    );
};

export default TraHangNCC;
