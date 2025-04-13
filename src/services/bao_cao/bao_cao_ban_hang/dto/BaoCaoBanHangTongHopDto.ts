export interface BaoCaoBanHangTongHopDto extends IBaoCaoBanHang_SumFooterDto {
    tenHangHoa: string;
    maHangHoa: string;
    tenNhomHang: string;
    soLuong: number;
    tienChietKhau?: number;
    thanhTienTruocCK?: number;
    thanhTienSauCK: number; // sau ck, truoc VAT
    giaVon: number;
    loiNhuan: number;
}

export interface IBaoCaoBanHang_SumFooterDto {
    sumSoLuong?: number;
    sumTienChietKhau?: number;
    sumThanhTienTruocCK?: number;
    sumThanhTienSauCK?: number;
    sumGiaVon?: number;
    sumLoiNhuan?: number;
}
