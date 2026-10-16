import { LoaiChungTu } from '../../lib/appconst';
import DanhSachPhieuKho from './components/DanhSachPhieuKho';

// Phiếu xuất kho: gồm phiếu tự sinh theo hóa đơn bán (không hủy được ở đây) và phiếu xuất khác / xuất hủy
const XuatHang = () => {
    return (
        <DanhSachPhieuKho
            title="Phiếu xuất kho"
            idLoaiChungTu={LoaiChungTu.PHIEU_XUAT_KHO}
            pathTaoMoi="/xuat-hang/tao-moi"
        />
    );
};

export default XuatHang;
