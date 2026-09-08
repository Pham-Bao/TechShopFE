import PageHoaDonDto from '../ban_hang/PageHoaDonDto';
import { HoaDonRequestDto } from '../dto/ParamSearchDto';
import { PagedResultDto } from '../dto/pagedResultDto';
import http from '../httpService';
import CreateOrEditDM_TheKhoDto, { DM_TheKhoViewDto, KiemKeRequestDto } from './dto';

class TheKhoService {
    CreateTheKho = (input: CreateOrEditDM_TheKhoDto[]) => {
        return http.post('/api/services/app/HoaDon/CreateTheKho', input);
    };

    GetList = async (input: KiemKeRequestDto): Promise<PagedResultDto<DM_TheKhoViewDto>> => {
        const result = await http.post('/api/services/app/Kiemke/GetAll', input);

        return result.data.result;
    };
    GetListHoaDonKiemKe = async (input: KiemKeRequestDto): Promise<PagedResultDto<PageHoaDonDto>> => {
        const result = await http.post('api/services/app/HoaDon/GetListHoaDonKiemKe', input);
        return result.data.result;
    };
}

export default new TheKhoService();
