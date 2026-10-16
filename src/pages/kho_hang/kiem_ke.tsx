import { LoaiChungTu } from '../../lib/appconst';
import DanhSachPhieuKho from './components/DanhSachPhieuKho';

// Phiếu kiểm kê: phiếu tạm lưu chưa ảnh hưởng tồn kho, bấm vào để kiểm tiếp và hoàn thành
const PhieuKiemKe = () => {
    return (
        <DanhSachPhieuKho
            title="Phiếu kiểm kê"
            idLoaiChungTu={LoaiChungTu.PHIEU_KIEM_KE}
            pathTaoMoi="/kiem-ke/tao-moi"
            coTamLuu
        />
    );
};

export default PhieuKiemKe;
