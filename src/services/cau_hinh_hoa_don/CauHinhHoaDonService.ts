import http from '../httpService';

class CauHinhHoaDonService {
    GetAll = async () => {
        const xx = await http.get(`api/services/app/CauHinhHoaDon/GetAll`).then((res: { data: { result: any } }) => {
            return res.data.result;
        });
        return xx;
    };
    UpdateBatTat = async (loaiHoaDon: number, batTat: boolean) => {
        const xx = await http
            .post(`api/services/app/CauHinhHoaDon/UpdateBatTat`, { loaiHoaDon, batTat })
            .then((res: { data: { result: any } }) => {
                return res.data.result;
            });
        return xx;
    };
}

export default new CauHinhHoaDonService();
