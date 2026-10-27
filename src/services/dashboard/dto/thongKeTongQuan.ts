// thẻ số liệu trang tổng quan: tiền theo sổ quỹ (phiếu thu / chi) + điện thoại
export interface ThongKeTongQuan {
    tongThu: number; // doanh thu = tổng phiếu thu trong kỳ
    tongChi: number;
    thuTruChi: number;
    soMayDangBan: number; // máy chưa bán hiện tại (không theo kỳ)
    soMayDaBan: number; // bán trong kỳ - khách trả lại trong kỳ
    soMayDangSua: number; // check-in sửa chữa đang mở (hiện tại)
    soMayDaSua: number; // hóa đơn sửa hoàn thành trong kỳ
}
