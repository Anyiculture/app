// Comprehensive Marketplace Categories

export interface Subcategory {
  id: string;
  name_en: string;
  name_zh: string;
}

export interface MarketplaceCategory {
  id: string;
  name_en: string;
  name_zh: string;
  icon: string;
  subcategories?: Subcategory[];
  typical_filters?: string[]; // Category-specific filters
}

export const MARKETPLACE_CATEGORIES: MarketplaceCategory[] = [
  {
    id: 'electronics',
    name_en: 'Electronics',
    name_zh: '电子产品',
    icon: '📱',
    subcategories: [
      { id: 'mobile_phones', name_en: 'Mobile Phones', name_zh: '手机' },
      { id: 'laptops_computers', name_en: 'Laptops & Computers', name_zh: '电脑/笔记本' },
      { id: 'tablets', name_en: 'Tablets', name_zh: '平板电脑' },
      { id: 'cameras', name_en: 'Cameras', name_zh: '相机' },
      { id: 'tv_audio', name_en: 'TV & Audio', name_zh: '电视/音响' },
      { id: 'gaming', name_en: 'Gaming', name_zh: '游戏机' },
      { id: 'wearables', name_en: 'Wearables', name_zh: '智能穿戴' },
      { id: 'accessories', name_en: 'Accessories', name_zh: '配件' }
    ],
    typical_filters: ['brand', 'model', 'condition']
  },
  {
    id: 'furniture',
    name_en: 'Furniture',
    name_zh: '家具',
    icon: '🛋️',
    subcategories: [
      { id: 'living_room', name_en: 'Living Room', name_zh: '客厅家具' },
      { id: 'bedroom', name_en: 'Bedroom', name_zh: '卧室家具' },
      { id: 'kitchen_dining', name_en: 'Kitchen & Dining', name_zh: '餐厅家具' },
      { id: 'office', name_en: 'Office', name_zh: '办公家具' },
      { id: 'outdoor', name_en: 'Outdoor', name_zh: '户外家具' },
      { id: 'storage', name_en: 'Storage', name_zh: '收纳' },
      { id: 'lighting', name_en: 'Lighting', name_zh: '灯具' }
    ],
    typical_filters: ['material', 'dimensions', 'condition']
  },
  {
    id: 'clothing',
    name_en: 'Clothing & Fashion',
    name_zh: '服装时尚',
    icon: '👔',
    subcategories: [
      { id: 'mens_clothing', name_en: "Men's Clothing", name_zh: '男装' },
      { id: 'womens_clothing', name_en: "Women's Clothing", name_zh: '女装' },
      { id: 'kids_clothing', name_en: "Kids' Clothing", name_zh: '童装' },
      { id: 'shoes', name_en: 'Shoes', name_zh: '鞋靴' },
      { id: 'bags_accessories', name_en: 'Bags & Accessories', name_zh: '箱包配饰' },
      { id: 'jewelry', name_en: 'Jewelry', name_zh: '珠宝首饰' },
      { id: 'watches', name_en: 'Watches', name_zh: '手表' }
    ],
    typical_filters: ['size', 'color', 'brand', 'gender']
  },
  {
    id: 'home_appliances',
    name_en: 'Home Appliances',
    name_zh: '家用电器',
    icon: '🏠',
    subcategories: [
      { id: 'kitchen_appliances', name_en: 'Kitchen Appliances', name_zh: '厨房电器' },
      { id: 'laundry', name_en: 'Laundry', name_zh: '洗衣设备' },
      { id: 'heating_cooling', name_en: 'Heating & Cooling', name_zh: '冷暖设备' },
      { id: 'vacuum_cleaners', name_en: 'Vacuum Cleaners', name_zh: '吸尘器' },
      { id: 'small_appliances', name_en: 'Small Appliances', name_zh: '小家电' }
    ],
    typical_filters: ['brand', 'model', 'condition']
  },
  {
    id: 'books_media',
    name_en: 'Books & Media',
    name_zh: '图书影音',
    icon: '📚',
    subcategories: [
      { id: 'books', name_en: 'Books', name_zh: '书籍' },
      { id: 'textbooks', name_en: 'Textbooks', name_zh: '教科书' },
      { id: 'comics_manga', name_en: 'Comics & Manga', name_zh: '漫画' },
      { id: 'music', name_en: 'Music', name_zh: '音乐唱片' },
      { id: 'movies_tv', name_en: 'Movies & TV', name_zh: '影视光盘' },
      { id: 'video_games', name_en: 'Video Games', name_zh: '电子游戏' }
    ],
    typical_filters: ['condition', 'language']
  },
  {
    id: 'sports_outdoors',
    name_en: 'Sports & Outdoors',
    name_zh: '运动户外',
    icon: '⚽',
    subcategories: [
      { id: 'fitness_equipment', name_en: 'Fitness Equipment', name_zh: '健身器材' },
      { id: 'bicycles', name_en: 'Bicycles', name_zh: '自行车' },
      { id: 'camping_hiking', name_en: 'Camping & Hiking', name_zh: '露营徒步' },
      { id: 'sports_gear', name_en: 'Sports Gear', name_zh: '运动装备' },
      { id: 'winter_sports', name_en: 'Winter Sports', name_zh: '冬季运动' },
      { id: 'water_sports', name_en: 'Water Sports', name_zh: '水上运动' }
    ],
    typical_filters: ['brand', 'size', 'condition']
  },
  {
    id: 'baby_kids',
    name_en: 'Baby & Kids',
    name_zh: '母婴儿童',
    icon: '👶',
    subcategories: [
      { id: 'strollers_seats', name_en: 'Strollers & Car Seats', name_zh: '婴儿车/座椅' },
      { id: 'toys', name_en: 'Toys', name_zh: '玩具' },
      { id: 'baby_furniture', name_en: 'Baby Furniture', name_zh: '儿童家具' },
      { id: 'baby_clothing', name_en: 'Baby Clothing', name_zh: '婴儿服装' },
      { id: 'feeding_nursing', name_en: 'Feeding & Nursing', name_zh: '喂养护理' },
      { id: 'diapers_wipes', name_en: 'Diapers & Wipes', name_zh: '尿布湿巾' }
    ],
    typical_filters: ['age_range', 'condition']
  },
  {
    id: 'beauty_health',
    name_en: 'Beauty & Health',
    name_zh: '美容健康',
    icon: '💄',
    subcategories: [
      { id: 'skincare', name_en: 'Skincare', name_zh: '护肤' },
      { id: 'makeup', name_en: 'Makeup', name_zh: '彩妆' },
      { id: 'hair_care', name_en: 'Hair Care', name_zh: '美发' },
      { id: 'fragrances', name_en: 'Fragrances', name_zh: '香水' },
      { id: 'health_supplements', name_en: 'Health Supplements', name_zh: '保健品' },
      { id: 'medical_equipment', name_en: 'Medical Equipment', name_zh: '医疗器械' }
    ],
    typical_filters: ['brand', 'condition']
  },
  {
    id: 'automotive',
    name_en: 'Automotive',
    name_zh: '汽车用品',
    icon: '🚗',
    subcategories: [
      { id: 'car_parts', name_en: 'Car Parts', name_zh: '汽车配件' },
      { id: 'car_accessories', name_en: 'Car Accessories', name_zh: '汽车装饰' },
      { id: 'motorcycles_parts', name_en: 'Motorcycles & Parts', name_zh: '摩托车及配件' },
      { id: 'tools_equipment', name_en: 'Tools & Equipment', name_zh: '维修工具' },
      { id: 'car_care', name_en: 'Car Care Products', name_zh: '汽车养护' }
    ],
    typical_filters: ['brand', 'model', 'compatibility']
  },
  {
    id: 'pets',
    name_en: 'Pet Supplies',
    name_zh: '宠物用品',
    icon: '🐾',
    subcategories: [
      { id: 'pet_food', name_en: 'Pet Food', name_zh: '宠物食品' },
      { id: 'pet_toys', name_en: 'Pet Toys', name_zh: '宠物玩具' },
      { id: 'pet_furniture', name_en: 'Pet Furniture', name_zh: '宠物窝垫' },
      { id: 'pet_carrier', name_en: 'Pet Carrier & Travel', name_zh: '出行箱包' },
      { id: 'pet_grooming', name_en: 'Pet Grooming', name_zh: '清洁美容' },
      { id: 'aquarium', name_en: 'Aquarium & Fish', name_zh: '水族用品' }
    ],
    typical_filters: ['pet_type', 'condition']
  },
  {
    id: 'home_garden',
    name_en: 'Home & Garden',
    name_zh: '家居园艺',
    icon: '🌱',
    subcategories: [
      { id: 'decor', name_en: 'Decor', name_zh: '家居装饰' },
      { id: 'bedding_bath', name_en: 'Bedding & Bath', name_zh: '床上用品/卫浴' },
      { id: 'kitchen_dining_garden', name_en: 'Kitchen & Dining', name_zh: '厨房餐饮' },
      { id: 'plants', name_en: 'Plants', name_zh: '绿植花卉' },
      { id: 'garden_tools', name_en: 'Garden Tools', name_zh: '园艺工具' },
      { id: 'outdoor_furniture', name_en: 'Outdoor Furniture', name_zh: '户外家具' }
    ],
    typical_filters: ['material', 'condition']
  },
  {
    id: 'office_supplies',
    name_en: 'Office & School',
    name_zh: '办公文具',
    icon: '✏️',
    subcategories: [
      { id: 'office_furniture', name_en: 'Office Furniture', name_zh: '办公家具' },
      { id: 'stationery', name_en: 'Stationery', name_zh: '文具' },
      { id: 'school_supplies', name_en: 'School Supplies', name_zh: '学习用品' },
      { id: 'art_supplies', name_en: 'Art Supplies', name_zh: '美术用品' },
      { id: 'calculators', name_en: 'Calculators', name_zh: '计算器' },
      { id: 'printers_scanners', name_en: 'Printers & Scanners', name_zh: '打印/扫描' }
    ],
    typical_filters: ['brand', 'condition']
  },
  {
    id: 'musical_instruments',
    name_en: 'Musical Instruments',
    name_zh: '乐器',
    icon: '🎸',
    subcategories: [
      { id: 'string_instruments', name_en: 'String Instruments', name_zh: '弦乐器' },
      { id: 'keyboards', name_en: 'Keyboards & Pianos', name_zh: '键盘乐器' },
      { id: 'drums', name_en: 'Drums & Percussion', name_zh: '打击乐器' },
      { id: 'wind_instruments', name_en: 'Wind Instruments', name_zh: '管乐器' },
      { id: 'dj_audio', name_en: 'DJ & Audio Equipment', name_zh: '音频设备' },
      { id: 'music_accessories', name_en: 'Music Accessories', name_zh: '乐器配件' }
    ],
    typical_filters: ['brand', 'type', 'condition']
  },
  {
    id: 'collectibles',
    name_en: 'Collectibles & Art',
    name_zh: '收藏艺术',
    icon: '🎨',
    subcategories: [
      { id: 'antiques', name_en: 'Antiques', name_zh: '古董' },
      { id: 'art', name_en: 'Art', name_zh: '艺术品' },
      { id: 'stamps_coins', name_en: 'Stamps & Coins', name_zh: '邮票钱币' },
      { id: 'trading_cards', name_en: 'Trading Cards', name_zh: '集换卡牌' },
      { id: 'memorabilia', name_en: 'Memorabilia', name_zh: '纪念品' },
      { id: 'vintage', name_en: 'Vintage Items', name_zh: '复古物品' }
    ],
    typical_filters: ['year', 'rarity', 'condition']
  },
  {
    id: 'tools_hardware',
    name_en: 'Tools & Hardware',
    name_zh: '工具五金',
    icon: '🔧',
    subcategories: [
      { id: 'power_tools', name_en: 'Power Tools', name_zh: '电动工具' },
      { id: 'hand_tools', name_en: 'Hand Tools', name_zh: '手动工具' },
      { id: 'hardware', name_en: 'Hardware', name_zh: '五金配件' },
      { id: 'building_materials', name_en: 'Building Materials', name_zh: '建筑材料' },
      { id: 'safety_equipment', name_en: 'Safety Equipment', name_zh: '安全防护' },
      { id: 'measurement_tools', name_en: 'Measurement Tools', name_zh: '测量工具' }
    ],
    typical_filters: ['brand', 'condition']
  },
  {
    id: 'other',
    name_en: 'Other',
    name_zh: '其他',
    icon: '📦',
    subcategories: [
      { id: 'miscellaneous', name_en: 'Miscellaneous', name_zh: '杂项' }
    ],
    typical_filters: ['condition']
  }
];

export const CONDITION_OPTIONS = [
  { value: 'new', label_en: 'Brand New', label_zh: '全新' },
  { value: 'like_new', label_en: 'Like New', label_zh: '几乎全新' },
  { value: 'excellent', label_en: 'Excellent', label_zh: '极好' },
  { value: 'good', label_en: 'Good', label_zh: '良好' },
  { value: 'fair', label_en: 'Fair', label_zh: '一般' },
  { value: 'poor', label_en: 'For Parts', label_zh: '配件处理' }
];

export const SIZE_OPTIONS = {
  clothing: [
    'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL',
    // Chinese sizes
    '155/80A', '160/84A', '165/88A', '170/92A', '175/96A', '180/100A'
  ],
  shoes: [
    // US sizes
    '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12',
    // Chinese sizes
    '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'
  ],
  electronics: [
    '32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB', '4TB', '8TB'
  ]
};

export const GENDER_OPTIONS = [
  { value: 'male', label_en: 'Men', label_zh: '男' },
  { value: 'female', label_en: 'Women', label_zh: '女' },
  { value: 'unisex', label_en: 'Unisex', label_zh: '中性' },
  { value: 'kids', label_en: 'Kids', label_zh: '儿童' }
];

export const PET_TYPE_OPTIONS = [
  { value: 'dog', label_en: 'Dog', label_zh: '狗' },
  { value: 'cat', label_en: 'Cat', label_zh: '猫' },
  { value: 'bird', label_en: 'Bird', label_zh: '鸟' },
  { value: 'fish', label_en: 'Fish', label_zh: '鱼' },
  { value: 'other', label_en: 'Other', label_zh: '其他' }
];

export const CURRENCY_OPTIONS = [
  { value: 'CNY', label: '¥ CNY', symbol: '¥' },
  { value: 'USD', label: '$ USD', symbol: '$' },
  { value: 'EUR', label: '€ EUR', symbol: '€' },
  { value: 'HKD', label: 'HK$ HKD', symbol: 'HK$' }
];

// Helper function to get category
export function getCategoryById(id: string) {
  return MARKETPLACE_CATEGORIES.find(cat => cat.id === id);
}

// Get subcategories for a category
// Updated to return Subcategory[]
export function getSubcategories(categoryId: string): Subcategory[] {
  const category = MARKETPLACE_CATEGORIES.find(cat => cat.id === categoryId);
  return category?.subcategories || [];
}

// Get typical filters for a category
export function getTypicalFiltersForCategory(categoryId: string): string[] {
  const category = MARKETPLACE_CATEGORIES.find(cat => cat.id === categoryId);
  return category?.typical_filters || [];
}

export const POPULAR_BRANDS: Record<string, string[]> = {
  electronics: ['Apple', 'Samsung', 'Huawei', 'Xiaomi', 'Sony', 'Dell', 'HP', 'Lenovo', 'Asus', 'Nintendo', 'Canon', 'Nikon', 'Bose', 'LG'],
  furniture: ['IKEA', 'Nitori', 'Ashley', 'Herman Miller', 'Steelcase', 'West Elm', 'Pottery Barn', 'Muji'],
  clothing: ['Nike', 'Adidas', 'Uniqlo', 'Zara', 'H&M', 'Lululemon', 'Under Armour', 'Gucci', 'Louis Vuitton', 'Chanel', 'Hermes', 'Dior', 'Ralph Lauren', 'Levi\'s'],
  home_appliances: ['Dyson', 'Philips', 'Midea', 'Haier', 'Panasonic', 'Samsung', 'LG', 'Whirlpool', 'KitchenAid', 'Nespresso'],
  automotive: ['Bosch', 'Michelin', '3M', 'Castrol', 'Mobil 1', 'Bridgestone'],
  sports_outdoors: ['Decathlon', 'The North Face', 'Columbia', 'Patagonia', 'Arc\'teryx', 'Salomon', 'Wilson', 'Yonex'],
  baby_kids: ['Lego', 'Fisher-Price', 'Babyzen', 'Bugaboo', 'Stokke', 'Pampers', 'Huggies', 'Carter\'s', 'Gap Kids'],
  beauty_health: ['L\'Oreal', 'Estée Lauder', 'Shiseido', 'SK-II', 'La Mer', 'Lancôme', 'Mac', 'Sephora', 'Dyson'],
  musical_instruments: ['Yamaha', 'Fender', 'Gibson', 'Roland', 'Korg', 'Steinway', 'Casio', 'Taylor', 'Martin'],
  tools_hardware: ['Bosch', 'DeWalt', 'Makita', 'Milwaukee', 'Stanley', 'Black+Decker'],
  books_media: ['Penguin', 'HarperCollins', 'Sony Music', 'Nintendo', 'PlayStation', 'Xbox'],
  pets: ['Royal Canin', 'Purina', 'Acana', 'Orijen', 'Pedigree', 'Whiskas'],
  office_supplies: ['3M', 'Pilot', 'Moleskine', 'Hp', 'Canon', 'Epson'],
  collectibles: ['Funko', 'Lego', 'Hot Toys', 'Pokemon', 'Bandai'],
  home_garden: ['IKEA', 'Home Depot', 'Scotts', 'Miracle-Gro'],
  other: []
};

// Get brands for a category
export function getBrands(categoryId: string): string[] {
  return POPULAR_BRANDS[categoryId] || [];
}
