/* eslint-disable prefer-const */
import AppConsts from './appconst';

declare let abp: any;

export function L(key: string, sourceName?: string): string {
    let localizationSourceName = AppConsts.localization.defaultLocalizationSourceName;
    return abp.localization.localize(key, sourceName ? sourceName : localizationSourceName);
}

export function isGranted(permissionName: string): boolean {
    return abp.auth.isGranted(permissionName);
}
