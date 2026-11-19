// Seed taxonomy: categories -> brands -> item names (newest models first).
// This only seeds the starting catalog — admins can add/edit/delete entries
// from the Category manager at runtime (see store/catalogStore.ts).

export interface SeedItemName {
  category: string;
  brand: string;
  name: string;
}

export const SEED_CATEGORIES = [
  'Phones',
  'Laptops',
  'iPad',
  'Headphones',
  'PlayStation',
  'Audio & Music Equipment',
  'iWatch',
  'Accessories',
  'Other',
] as const;

export const SEED_BRANDS: Record<string, string[]> = {
  Phones: ['iPhone', 'Samsung', 'Google Pixel', 'Tecno', 'Infinix'],
  Laptops: ['MacBook', 'Dell', 'HP', 'Lenovo', 'Asus'],
  iPad: ['Apple'],
  Headphones: ['Apple', 'JBL', 'Sony', 'Beats'],
  PlayStation: ['Sony'],
  'Audio & Music Equipment': ['JBL', 'Sony', 'Marshall'],
  iWatch: ['Apple'],
  Accessories: ['Apple', 'Sony', 'Generic'],
  Other: ['Generic'],
};

const STORAGE_PHONE = ['1TB', '512GB', '256GB', '128GB'];
const STORAGE_LAPTOP = ['2TB', '1TB', '512GB', '256GB'];

function withStorage(models: string[], storages: string[]): string[] {
  const out: string[] = [];
  for (const model of models) {
    for (const s of storages) out.push(`${model} ${s}`);
  }
  return out;
}

const IPHONE_MODELS = [
  'iPhone Duo',
  'iPhone 18 Pro Max',
  'iPhone 18 Pro',
  'iPhone 18',
  'iPhone 17 Pro Max',
  'iPhone 17 Pro',
  'iPhone 17',
  'iPhone 16 Pro Max',
  'iPhone 16 Pro',
  'iPhone 16 Plus',
  'iPhone 16',
  'iPhone 15 Pro Max',
  'iPhone 15 Pro',
  'iPhone 15 Plus',
  'iPhone 15',
  'iPhone 14 Pro Max',
  'iPhone 14',
  'iPhone 13 Pro Max',
  'iPhone 13',
  'iPhone 12',
  'iPhone 11',
];

const SAMSUNG_MODELS = [
  'Galaxy S26 Ultra',
  'Galaxy S26+',
  'Galaxy S26',
  'Galaxy Z Fold 7',
  'Galaxy Z Flip 7',
  'Galaxy S25 Ultra',
  'Galaxy S25+',
  'Galaxy S25',
  'Galaxy Z Fold 6',
  'Galaxy Z Flip 6',
  'Galaxy S24 Ultra',
  'Galaxy S24+',
  'Galaxy S24',
  'Galaxy S23 Ultra',
  'Galaxy A56',
  'Galaxy A36',
];

const PIXEL_MODELS = [
  'Pixel 10 Pro XL',
  'Pixel 10 Pro',
  'Pixel 10',
  'Pixel 9 Pro XL',
  'Pixel 9 Pro',
  'Pixel 9',
  'Pixel 8 Pro',
  'Pixel 8',
  'Pixel 7a',
];
const TECNO_MODELS = ['Camon 40 Pro', 'Camon 30 Pro', 'Camon 20 Premier', 'Spark 30 Pro', 'Phantom V Fold 2'];
const INFINIX_MODELS = ['Zero 50', 'Zero 30', 'Note 50 Pro', 'Note 40 Pro', 'Hot 50i'];

const MACBOOK_MODELS = [
  'MacBook Pro 16" M5',
  'MacBook Pro 14" M5',
  'MacBook Air 15" M4',
  'MacBook Air 13" M4',
  'MacBook Pro 16" M4',
  'MacBook Pro 14" M4',
  'MacBook Air 15" M3',
  'MacBook Air 13" M3',
  'MacBook Pro 16" M3',
  'MacBook Pro 14" M2',
  'MacBook Air 13" M2',
  'MacBook Air M1',
  'MacBook Pro 13" M1',
];

const DELL_MODELS = ['XPS 14', 'XPS 13 Plus', 'XPS 15', 'Inspiron 15 3520', 'Latitude 7450', 'Precision 5680'];
const HP_MODELS = ['OmniBook Ultra 14', 'Spectre x360 14', 'Pavilion 15', 'EliteBook 840 G11', 'Envy 13'];
const LENOVO_MODELS = ['ThinkPad X1 Carbon Gen 13', 'ThinkPad X1 Carbon Gen 12', 'Legion 5 Pro', 'IdeaPad Slim 5', 'Yoga 9i'];
const ASUS_MODELS = ['Zenbook S 14', 'ZenBook 14 OLED', 'ROG Strix G16', 'VivoBook S 15', 'TUF Gaming A15'];

const IPAD_MODELS = [
  'iPad Pro 13" M5',
  'iPad Pro 11" M5',
  'iPad Pro 13" M4',
  'iPad Pro 11" M4',
  'iPad Air 13" M3',
  'iPad Air 11" M3',
  'iPad Air 13" M2',
  'iPad Air 11" M2',
  'iPad 11th Gen',
  'iPad mini 7',
];

const APPLE_HEADPHONES = ['AirPods Pro 3', 'AirPods Max 2', 'AirPods Pro 2', 'AirPods 4', 'AirPods Max', 'AirPods 3'];
const JBL_HEADPHONES = ['JBL Tour One M3', 'JBL Tune 770NC', 'JBL Live 770NC', 'JBL Endurance Peak 3', 'JBL Tune 510BT'];
const SONY_HEADPHONES = ['Sony WH-1000XM6', 'Sony WH-1000XM5', 'Sony WF-1000XM5', 'Sony WH-CH520'];
const BEATS_HEADPHONES = ['Beats Studio Pro', 'Beats Solo 4', 'Beats Fit Pro', 'Beats Flex'];

const PS_MODELS = ['PS5 Pro', 'PS5 Slim Disc Edition', 'PS5 Slim Digital Edition', 'PS5 Standard', 'PS4 Pro', 'PS4 Slim'];

const JBL_AUDIO = ['JBL PartyBox 320', 'JBL PartyBox 310', 'JBL Xtreme 4', 'JBL Xtreme 3', 'JBL Charge 6', 'JBL Flip 7', 'JBL Clip 5', 'JBL Go 4'];
const SONY_AUDIO = ['Sony SRS-XG500', 'Sony SRS-XB100', 'Sony SRS-XB13'];
const MARSHALL_AUDIO = ['Marshall Middleton', 'Marshall Stanmore III', 'Marshall Emberton III', 'Marshall Willen'];

const APPLE_WATCH = [
  'Apple Watch Ultra 3',
  'Apple Watch Series 11',
  'Apple Watch SE 3',
  'Apple Watch Ultra 2',
  'Apple Watch Series 10',
  'Apple Watch SE (2nd Gen)',
  'Apple Watch Series 9',
  'Apple Watch Series 8',
];

const APPLE_ACCESSORIES = ['Apple Pencil Pro', 'MagSafe Charger', 'Apple 20W USB-C Adapter', 'Smart Folio Keyboard'];
const SONY_ACCESSORIES = ['DualSense Edge Controller', 'PS5 DualSense Controller', 'Pulse 3D Headset'];
const GENERIC_ACCESSORIES = ['Laptop Sleeve 15"', 'Phone Case (Clear)', 'Tempered Glass Screen Protector', '20,000mAh Power Bank', 'Type-C Fast Charger'];

export const SEED_ITEM_NAMES: SeedItemName[] = [
  ...withStorage(IPHONE_MODELS, STORAGE_PHONE).map((name) => ({ category: 'Phones', brand: 'iPhone', name })),
  ...withStorage(SAMSUNG_MODELS, STORAGE_PHONE).map((name) => ({ category: 'Phones', brand: 'Samsung', name })),
  ...withStorage(PIXEL_MODELS, STORAGE_PHONE).map((name) => ({ category: 'Phones', brand: 'Google Pixel', name })),
  ...TECNO_MODELS.map((name) => ({ category: 'Phones', brand: 'Tecno', name })),
  ...INFINIX_MODELS.map((name) => ({ category: 'Phones', brand: 'Infinix', name })),

  ...withStorage(MACBOOK_MODELS, STORAGE_LAPTOP).map((name) => ({ category: 'Laptops', brand: 'MacBook', name })),
  ...DELL_MODELS.map((name) => ({ category: 'Laptops', brand: 'Dell', name })),
  ...HP_MODELS.map((name) => ({ category: 'Laptops', brand: 'HP', name })),
  ...LENOVO_MODELS.map((name) => ({ category: 'Laptops', brand: 'Lenovo', name })),
  ...ASUS_MODELS.map((name) => ({ category: 'Laptops', brand: 'Asus', name })),

  ...withStorage(IPAD_MODELS, STORAGE_PHONE).map((name) => ({ category: 'iPad', brand: 'Apple', name })),

  ...APPLE_HEADPHONES.map((name) => ({ category: 'Headphones', brand: 'Apple', name })),
  ...JBL_HEADPHONES.map((name) => ({ category: 'Headphones', brand: 'JBL', name })),
  ...SONY_HEADPHONES.map((name) => ({ category: 'Headphones', brand: 'Sony', name })),
  ...BEATS_HEADPHONES.map((name) => ({ category: 'Headphones', brand: 'Beats', name })),

  ...PS_MODELS.map((name) => ({ category: 'PlayStation', brand: 'Sony', name })),

  ...JBL_AUDIO.map((name) => ({ category: 'Audio & Music Equipment', brand: 'JBL', name })),
  ...SONY_AUDIO.map((name) => ({ category: 'Audio & Music Equipment', brand: 'Sony', name })),
  ...MARSHALL_AUDIO.map((name) => ({ category: 'Audio & Music Equipment', brand: 'Marshall', name })),

  ...APPLE_WATCH.map((name) => ({ category: 'iWatch', brand: 'Apple', name })),

  ...APPLE_ACCESSORIES.map((name) => ({ category: 'Accessories', brand: 'Apple', name })),
  ...SONY_ACCESSORIES.map((name) => ({ category: 'Accessories', brand: 'Sony', name })),
  ...GENERIC_ACCESSORIES.map((name) => ({ category: 'Accessories', brand: 'Generic', name })),
];

export const COLOR_PALETTE: { name: string; hex: string }[] = [
  { name: 'Black', hex: '#1c1c1e' },
  { name: 'White', hex: '#f5f5f7' },
  { name: 'Midnight', hex: '#2b2d33' },
  { name: 'Starlight', hex: '#ece6dd' },
  { name: 'Silver', hex: '#d6d8db' },
  { name: 'Space Gray', hex: '#4b4c50' },
  { name: 'Natural Titanium', hex: '#9b958c' },
  { name: 'Desert Titanium', hex: '#b3987a' },
  { name: 'Graphite', hex: '#4a4a4c' },
  { name: 'Gold', hex: '#e8d2a6' },
  { name: 'Rose Gold', hex: '#eecfc6' },
  { name: 'Blue', hex: '#3b63f0' },
  { name: 'Green', hex: '#3f6b4f' },
  { name: 'Purple', hex: '#8a7ec8' },
  { name: 'Red', hex: '#c7342e' },
  { name: 'Pink', hex: '#e8b4c0' },
];

export function categoryToSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
