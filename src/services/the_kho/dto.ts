import { RequestFromToDto } from '../dto/ParamSearchDto';

export class DM_TheKhoDto {
    id!: string;

    tenantId?: number;

    idHangHoa?: string;

    idLoaiChungTu?: number;

    idHoaDon?: string;

    soLuong?: number;

    tonTruoc?: number;

    tonSau?: number;

    ghiChu?: string;

    creationTime?: string;

    creatorUserId?: number;

    lastModificationTime?: string;

    isDeleted?: boolean;

    constructor(init?: Partial<DM_TheKhoDto>) {
        Object.assign(this, init);
    }
}

export class DM_TheKhoViewDto extends DM_TheKhoDto {
    maHoaDon?: string;

    maHangHoa?: string;

    tenHangHoa?: string;

    tenLoaiChungTu?: string;

    tenNhanVien?: string;

    txtLoaiNhapXuat?: string;

    txtTonKho?: string;

    constructor(init?: Partial<DM_TheKhoViewDto>) {
        super(init);

        Object.assign(this, init);
    }
}
export default class CreateOrEditDM_TheKhoDto {
    id?: string;

    idHangHoa?: string;

    idHoaDon?: string;

    idLoaiChungTu?: number;

    soLuong?: number;

    tonTruoc?: number;

    tonSau?: number;

    ghiChu?: string;

    creationTime?: string;

    constructor(init?: Partial<CreateOrEditDM_TheKhoDto>) {
        Object.assign(this, init);
    }
}
export class KiemKeRequestDto extends RequestFromToDto {
    idLoaiChungTu?: number;

    constructor({
        idChiNhanhs = [],
        textSearch = '',
        currentPage = 0,
        pageSize = 10,
        columnSort = '',
        typeSort = 'DESC',
        fromDate = null,
        toDate = null,
        idLoaiChungTu = null
    }) {
        super({
            idChiNhanhs: idChiNhanhs,
            textSearch: textSearch,
            currentPage: currentPage,
            pageSize: pageSize,
            columnSort: columnSort,
            typeSort: typeSort,
            fromDate: fromDate,
            toDate: toDate
        });

        this.idLoaiChungTu;
    }
}
