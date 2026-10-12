import { Guid } from 'guid-typescript';
import HoaDonChiTietDto from './HoaDonChiTietDto';

export default class PageHoaDonChiTietDto extends HoaDonChiTietDto {
    maHangHoa = '';
    tenHangHoa = '';
    giaBan = 0;
    giaVon = 0;
    giaNhap? = 0;
    idNhomHangHoa = null;
    idHangHoa? = null;
    expanded? = false;
    tenNVThucHiens = '';
    soLuongConLai? = 0;
    imel = '';
    mau = '';
    idLoaiHangHoa?: number | null = null;

    constructor({
        id = Guid.create().toString(),
        maHangHoa = '',
        tenHangHoa = '',
        giaBan = 0,
        giaVon = 0,
        giaNhap = 0,
        idNhomHangHoa = null,
        idHangHoa = null,
        idDonViQuyDoi = null,
        soLuong = 1,
        expanded = false,
        trangThai = 3,
        imel = '',
        mau = '',
        soThangBaoHanh = null,
        idLoaiHangHoa = null
    }) {
        super({
            id: id,
            idDonViQuyDoi: idDonViQuyDoi,
            soLuong: soLuong,
            donGiaTruocCK: giaBan,
            giaVon: giaVon,
            trangThai: trangThai,
            soThangBaoHanh: soThangBaoHanh
        });

        this.maHangHoa = maHangHoa;
        this.tenHangHoa = tenHangHoa;
        this.giaBan = giaBan;
        this.giaVon = giaVon;
        this.giaNhap = giaNhap;
        this.idNhomHangHoa = idNhomHangHoa;
        this.idHangHoa = idHangHoa;
        this.expanded = expanded;

        this.imel = imel;
        this.mau = mau;
        this.idLoaiHangHoa = idLoaiHangHoa;
    }
}
