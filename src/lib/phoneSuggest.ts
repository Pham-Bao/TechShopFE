export const PHONE_SUGGEST = [
    // iPhone
    'iPhone 5',
    'iPhone 5C',
    'iPhone 5S',
    'iPhone SE',
    'iPhone 6',
    'iPhone 6 Plus',
    'iPhone 6S',
    'iPhone 6S Plus',
    'iPhone 7',
    'iPhone 7 Plus',
    'iPhone 8',
    'iPhone 8 Plus',
    'iPhone X',
    'iPhone XR',
    'iPhone XS',
    'iPhone XS Max',
    'iPhone 11',
    'iPhone 11 Pro',
    'iPhone 11 Pro Max',
    'iPhone SE 2020',
    'iPhone 12 Mini',
    'iPhone 12',
    'iPhone 12 Pro',
    'iPhone 12 Pro Max',
    'iPhone 13 Mini',
    'iPhone 13',
    'iPhone 13 Pro',
    'iPhone 13 Pro Max',
    'iPhone 14',
    'iPhone 14 Plus',
    'iPhone 14 Pro',
    'iPhone 14 Pro Max',
    'iPhone 15',
    'iPhone 15 Plus',
    'iPhone 15 Pro',
    'iPhone 15 Pro Max',
    'iPhone 16',
    'iPhone 16 Plus',
    'iPhone 16 Pro',
    'iPhone 16 Pro Max',
    'iPhone 17',
    'iPhone 17 Air',
    'iPhone 17 Plus',
    'iPhone 17 Pro',
    'iPhone 17 Pro Max',

    // Samsung
    'Samsung Galaxy S8',
    'Samsung Galaxy S9',
    'Samsung Galaxy S10',
    'Samsung Galaxy S10 Plus',
    'Samsung Galaxy S20',
    'Samsung Galaxy S20 Plus',
    'Samsung Galaxy S20 Ultra',
    'Samsung Galaxy S21',
    'Samsung Galaxy S21 Ultra',
    'Samsung Galaxy S22',
    'Samsung Galaxy S22 Ultra',
    'Samsung Galaxy S23',
    'Samsung Galaxy S23 Ultra',
    'Samsung Galaxy S24',
    'Samsung Galaxy S24 Ultra',
    'Samsung Galaxy Note 8',
    'Samsung Galaxy Note 9',
    'Samsung Galaxy Note 10',
    'Samsung Galaxy Note 10 Plus',
    'Samsung Galaxy Note 20',
    'Samsung Galaxy Note 20 Ultra',
    'Samsung Galaxy Z Fold 4',
    'Samsung Galaxy Z Fold 5',
    'Samsung Galaxy Z Flip 4',
    'Samsung Galaxy Z Flip 5',
    'Samsung Galaxy A52',
    'Samsung Galaxy A54',
    'Samsung Galaxy A55',

    // Xiaomi
    'Xiaomi Mi 10',
    'Xiaomi Mi 11',
    'Xiaomi 12',
    'Xiaomi 13',
    'Xiaomi 14',
    'Redmi Note 10',
    'Redmi Note 11',
    'Redmi Note 12',
    'Redmi Note 13',
    'POCO X3',
    'POCO X5 Pro',
    'POCO F5',

    // Oppo
    'Oppo Reno 5',
    'Oppo Reno 6',
    'Oppo Reno 7',
    'Oppo Reno 8',
    'Oppo Reno 10',
    'Oppo Find X5',
    'Oppo Find X6',
    'Oppo Find X7',

    // Vivo
    'Vivo V20',
    'Vivo V23',
    'Vivo V27',
    'Vivo V29',
    'Vivo X90',
    'Vivo X100',

    // Realme
    'Realme 8',
    'Realme 9 Pro',
    'Realme 10',
    'Realme 11 Pro',
    'Realme GT Neo 5',

    // Huawei
    'Huawei P30',
    'Huawei P40',
    'Huawei Mate 30',
    'Huawei Mate 40',

    // Google Pixel
    'Google Pixel 6',
    'Google Pixel 7',
    'Google Pixel 8',
    'Google Pixel 8 Pro',

    // Asus
    'Asus ROG Phone 5',
    'Asus ROG Phone 6',
    'Asus ROG Phone 7',

    // Sony
    'Sony Xperia 1',
    'Sony Xperia 5',

    // Nokia
    'Nokia X20',
    'Nokia G21'
];

export const searchPhoneSuggest = (keyword: string) => {
    if (!keyword) return PHONE_SUGGEST;

    return PHONE_SUGGEST.filter((x) => x.toLowerCase().includes(keyword.toLowerCase()));
};
