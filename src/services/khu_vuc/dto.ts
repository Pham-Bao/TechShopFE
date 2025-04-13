import { ParamSearchDto } from '../dto/ParamSearchDto';

export interface ViTriDto {
    id: string;
    idKhuVuc?: string | null;
    tenViTri: string;
    tenKhuVuc: string;
    trangThai: number;
    donGia?: number | null;
    moTa: string;
    txtTrangThaiHang: string;
}
export class PagedViTriSearchDto extends ParamSearchDto {
    idKhuVuc?: string;
}

export class PagedKhuVucSearchDto extends ParamSearchDto {
    idKhuVucs?: string[];
}

export interface KhuVucDto {
    id?: string;
    maKhuVuc: string;
    tenKhuVuc: string;
    tenKhuVuc_KhongDau: string;
    idParent?: string | null;
    moTa: string;
    isDeleted?: boolean;
    children?: KhuVucDto[];
}
export interface KhuVucCreate {
    maKhuVuc: string;
    tenKhuVuc: string;
    tenKhuVuc_KhongDau: string;
    idParent?: string | null;
    moTa: string;
}
export class ViTriCreate {
    //id?: string | null;
    idKhuVuc?: string | null;
    tenViTri?: string;
    tenViTri_KhongDau?: string;
    tenKhuVuc?: string;
    trangThai?: number;
    donGia?: number | null;
    moTa?: string;
}
export class ViTriUpdate {
    id?: string | null;
    idKhuVuc?: string | null;
    tenViTri?: string;
    tenViTri_KhongDau?: string;
    tenKhuVuc?: string;
    trangThai?: number;
    donGia?: number | null;
    moTa?: string;
}
