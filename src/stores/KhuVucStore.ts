import { action, makeAutoObservable, observable, toJS } from 'mobx';
import { ModelNhomHangHoa } from '../services/product/dto';
import GroupProductService from '../services/product/GroupProductService';
import { TypeAction } from '../lib/appconst';
import { KhuVucDto } from '../services/khu_vuc/dto';
import KhuVucService from '../services/khu_vuc/KhuVucService';

class KhuVucStore {
    listAllKhuVuc: KhuVucDto[] = [];
    constructor() {
        makeAutoObservable(this, {
            listAllKhuVuc: observable,
            changeListKhuVuc: action
        });
    }

    getAllKhuVuc = async () => {
        const data = await KhuVucService.GetDM_KhuVuc();
        this.listAllKhuVuc = data?.items;
    };

    changeListKhuVuc = (objNhom: KhuVucDto, typeAction = TypeAction.INSEART) => {
        switch (typeAction) {
            case TypeAction.INSEART:
                {
                    this.listAllKhuVuc = [objNhom, ...this.listAllKhuVuc];
                }
                break;
            case TypeAction.UPDATE:
                {
                    this.listAllKhuVuc = this.listAllKhuVuc.map((item: KhuVucDto) => {
                        if (item.id === objNhom.id) {
                            return {
                                ...item,
                                tenNhomHang: objNhom?.tenKhuVuc,
                                tenNhomHang_KhongDau: objNhom?.tenKhuVuc_KhongDau,
                                idParent: objNhom?.idParent
                            };
                        } else {
                            return item;
                        }
                    });
                }
                break;
            case TypeAction.DELETE:
                {
                    this.listAllKhuVuc = this.listAllKhuVuc.filter((x) => x.id !== objNhom.id);
                }
                break;
        }
    };
}

export default new KhuVucStore();
