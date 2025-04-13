import http from '../httpService';
import { ViTriDto, KhuVucDto, PagedViTriSearchDto, ViTriCreate, ViTriUpdate } from './dto';
import { PagedResultDto } from '../../services/dto/pagedResultDto';

class KhuVucService {
    GetDM_KhuVuc = async (): Promise<PagedResultDto<KhuVucDto>> => {
        const xx = await http
            .get(`api/services/app/KhuVucAppservice/GetKhuVuc`)
            .then((res: { data: { result: any } }) => {
                return res.data.result;
            });
        return xx;
    };
    GetDMViTriById = async (id: string): Promise<ViTriCreate> => {
        const data = await http.get(`api/services/app/ViTri/GetDMViTriById?id=${id}`).then((res) => {
            return res.data.result;
        });
        return data;
    };
    GetDM_TreeKhuVuc = async (): Promise<PagedResultDto<KhuVucDto>> => {
        const xx = await http
            .get(`api/services/app/KhuVucAppservice/GetTreeKhuVuc`)
            .then((res: { data: { result: any } }) => {
                return res.data.result;
            });
        return xx;
    };
    Get_DMViTri = async (input: PagedViTriSearchDto): Promise<PagedResultDto<ViTriDto>> => {
        const xx = await http
            .post(`api/services/app/ViTri/GetDMViTri`, input)
            .then((res: { data: { result: any } }) => {
                return res.data.result;
            });
        return xx;
    };
    InsertKhuVuc = async (param: KhuVucDto) => {
        const xx = await http.post(`api/services/app/KhuVucAppservice/CreateKhuVuc`, param).then((res) => {
            return res.data.result;
        });
        return xx;
    };
    UpdateKhuVuc = async (param: KhuVucDto) => {
        const xx = await http.post(`api/services/app/KhuVucAppservice/UpdateKhuVuc`, param).then((res) => {
            return res.data.result;
        });
        return xx;
    };
    CreateOrUpdateViTri = async (input: ViTriUpdate) => {
        const xx = await http
            .post(`api/services/app/ViTri/CreateOrEdit`, input)
            .then((res: { data: { result: any } }) => {
                return res.data.result;
            });
        return xx;
    };
    XoaKhuVuc = async (idKhuVuc: string) => {
        const xx = await http.post(`api/services/app/KhuVucAppservice/XoaKhuVuc?id=${idKhuVuc}`).then((res) => {
            return res.data.result;
        });
        return xx;
    };
    XoaViTri = async (idViTRi: string) => {
        const xx = await http.post(`api/services/app/ViTri/Delete?id=${idViTRi}`).then((res) => {
            return res.data.result;
        });
        return xx;
    };
}
export default new KhuVucService();
