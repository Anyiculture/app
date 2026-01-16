// China Provinces and Cities Data

export interface CityOption {
  name_en: string;
  name_zh: string;
}

export interface ProvinceOption {
  name_en: string;
  name_zh: string;
  type: 'province' | 'municipality' | 'autonomous_region' | 'sar';
  cities: CityOption[];
}

export const CHINA_LOCATIONS: ProvinceOption[] = [
  // Municipalities (直辖市)
  {
    name_en: 'Beijing',
    name_zh: '北京',
    type: 'municipality',
    cities: [
      { name_en: 'Dongcheng', name_zh: '东城区' },
      { name_en: 'Xicheng', name_zh: '西城区' },
      { name_en: 'Chaoyang', name_zh: '朝阳区' },
      { name_en: 'Haidian', name_zh: '海淀区' },
      { name_en: 'Fengtai', name_zh: '丰台区' },
      { name_en: 'Shijingshan', name_zh: '石景山区' },
      { name_en: 'Other', name_zh: '其它区' }
    ]
  },
  {
    name_en: 'Shanghai',
    name_zh: '上海',
    type: 'municipality',
    cities: [
      { name_en: 'Pudong', name_zh: '浦东新区' },
      { name_en: 'Huangpu', name_zh: '黄浦区' },
      { name_en: 'Xuhui', name_zh: '徐汇区' },
      { name_en: 'Changning', name_zh: '长宁区' },
      { name_en: 'Jing\'an', name_zh: '静安区' },
      { name_en: 'Putuo', name_zh: '普陀区' },
      { name_en: 'Hongkou', name_zh: '虹口区' },
      { name_en: 'Yangpu', name_zh: '杨浦区' },
      { name_en: 'Minhang', name_zh: '闵行区' },
      { name_en: 'Other', name_zh: '其它区' }
    ]
  },
  {
    name_en: 'Tianjin',
    name_zh: '天津',
    type: 'municipality',
    cities: [
      { name_en: 'Heping', name_zh: '和平区' },
      { name_en: 'Hedong', name_zh: '河东区' },
      { name_en: 'Hexi', name_zh: '河西区' },
      { name_en: 'Nankai', name_zh: '南开区' },
      { name_en: 'Hebei', name_zh: '河北区' },
      { name_en: 'Hongqiao', name_zh: '红桥区' },
      { name_en: 'Binhai', name_zh: '滨海新区' },
      { name_en: 'Other', name_zh: '其它区' }
    ]
  },
  {
    name_en: 'Chongqing',
    name_zh: '重庆',
    type: 'municipality',
    cities: [
      { name_en: 'Yuzhong', name_zh: '渝中区' },
      { name_en: 'Jiangbei', name_zh: '江北区' },
      { name_en: 'Nan\'an', name_zh: '南岸区' },
      { name_en: 'Yubei', name_zh: '渝北区' },
      { name_en: 'Shapingba', name_zh: '沙坪坝区' },
      { name_en: 'Jiulongpo', name_zh: '九龙坡区' },
      { name_en: 'Beibei', name_zh: '北碚区' },
      { name_en: 'Other', name_zh: '其它区' }
    ]
  },

  // Major Provinces (省)
  {
    name_en: 'Guangdong',
    name_zh: '广东',
    type: 'province',
    cities: [
      { name_en: 'Guangzhou', name_zh: '广州' },
      { name_en: 'Shenzhen', name_zh: '深圳' },
      { name_en: 'Dongguan', name_zh: '东莞' },
      { name_en: 'Foshan', name_zh: '佛山' },
      { name_en: 'Zhuhai', name_zh: '珠海' },
      { name_en: 'Zhongshan', name_zh: '中山' },
      { name_en: 'Huizhou', name_zh: '惠州' },
      { name_en: 'Jiangmen', name_zh: '江门' },
      { name_en: 'Shantou', name_zh: '汕头' },
      { name_en: 'Zhanjiang', name_zh: '湛江' },
      { name_en: 'Other', name_zh: '其它市' }
    ]
  },
  {
    name_en: 'Jiangsu',
    name_zh: '江苏',
    type: 'province',
    cities: [
      { name_en: 'Nanjing', name_zh: '南京' },
      { name_en: 'Suzhou', name_zh: '苏州' },
      { name_en: 'Wuxi', name_zh: '无锡' },
      { name_en: 'Changzhou', name_zh: '常州' },
      { name_en: 'Nantong', name_zh: '南通' },
      { name_en: 'Xuzhou', name_zh: '徐州' },
      { name_en: 'Yangzhou', name_zh: '扬州' },
      { name_en: 'Zhenjiang', name_zh: '镇江' },
      { name_en: 'Other', name_zh: '其它市' }
    ]
  },
  {
    name_en: 'Zhejiang',
    name_zh: '浙江',
    type: 'province',
    cities: [
      { name_en: 'Hangzhou', name_zh: '杭州' },
      { name_en: 'Ningbo', name_zh: '宁波' },
      { name_en: 'Wenzhou', name_zh: '温州' },
      { name_en: 'Jiaxing', name_zh: '嘉兴' },
      { name_en: 'Shaoxing', name_zh: '绍兴' },
      { name_en: 'Jinhua', name_zh: '金华' },
      { name_en: 'Taizhou', name_zh: '台州' },
      { name_en: 'Other', name_zh: '其它市' }
    ]
  },
  {
    name_en: 'Shandong',
    name_zh: '山东',
    type: 'province',
    cities: [
      { name_en: 'Jinan', name_zh: '济南' },
      { name_en: 'Qingdao', name_zh: '青岛' },
      { name_en: 'Yantai', name_zh: '烟台' },
      { name_en: 'Weifang', name_zh: '潍坊' },
      { name_en: 'Zibo', name_zh: '淄博' },
      { name_en: 'Weihai', name_zh: '威海' },
      { name_en: 'Linyi', name_zh: '临沂' },
      { name_en: 'Other', name_zh: '其它市' }
    ]
  },
  {
    name_en: 'Henan',
    name_zh: '河南',
    type: 'province',
    cities: [
      { name_en: 'Zhengzhou', name_zh: '郑州' },
      { name_en: 'Luoyang', name_zh: '洛阳' },
      { name_en: 'Kaifeng', name_zh: '开封' },
      { name_en: 'Nanyang', name_zh: '南阳' },
      { name_en: 'Xinxiang', name_zh: '新乡' },
      { name_en: 'Other', name_zh: '其它市' }
    ]
  },
  {
    name_en: 'Sichuan',
    name_zh: '四川',
    type: 'province',
    cities: [
      { name_en: 'Chengdu', name_zh: '成都' },
      { name_en: 'Mianyang', name_zh: '绵阳' },
      { name_en: 'Deyang', name_zh: '德阳' },
      { name_en: 'Nanchong', name_zh: '南充' },
      { name_en: 'Yibin', name_zh: '宜宾' },
      { name_en: 'Other', name_zh: '其它市' }
    ]
  },
  {
    name_en: 'Hubei',
    name_zh: '湖北',
    type: 'province',
    cities: [
      { name_en: 'Wuhan', name_zh: '武汉' },
      { name_en: 'Yichang', name_zh: '宜昌' },
      { name_en: 'Xiangyang', name_zh: '襄阳' },
      { name_en: 'Jingzhou', name_zh: '荆州' },
      { name_en: 'Other', name_zh: '其它市' }
    ]
  },
  {
    name_en: 'Hunan',
    name_zh: '湖南',
    type: 'province',
    cities: [
      { name_en: 'Changsha', name_zh: '长沙' },
      { name_en: 'Zhuzhou', name_zh: '株洲' },
      { name_en: 'Xiangtan', name_zh: '湘潭' },
      { name_en: 'Hengyang', name_zh: '衡阳' },
      { name_en: 'Yueyang', name_zh: '岳阳' },
      { name_en: 'Other', name_zh: '其它市' }
    ]
  },
  {
    name_en: 'Anhui',
    name_zh: '安徽',
    type: 'province',
    cities: [
      { name_en: 'Hefei', name_zh: '合肥' },
      { name_en: 'Wuhu', name_zh: '芜湖' },
      { name_en: 'Bengbu', name_zh: '蚌埠' },
      { name_en: 'Anqing', name_zh: '安庆' },
      { name_en: 'Other', name_zh: '其它市' }
    ]
  },
  {
    name_en: 'Fujian',
    name_zh: '福建',
    type: 'province',
    cities: [
      { name_en: 'Fuzhou', name_zh: '福州' },
      { name_en: 'Xiamen', name_zh: '厦门' },
      { name_en: 'Quanzhou', name_zh: '泉州' },
      { name_en: 'Zhangzhou', name_zh: '漳州' },
      { name_en: 'Putian', name_zh: '莆田' },
      { name_en: 'Other', name_zh: '其它市' }
    ]
  },
  {
    name_en: 'Jiangxi',
    name_zh: '江西',
    type: 'province',
    cities: [
      { name_en: 'Nanchang', name_zh: '南昌' },
      { name_en: 'Ganzhou', name_zh: '赣州' },
      { name_en: 'Jiujiang', name_zh: '九江' },
      { name_en: 'Jingdezhen', name_zh: '景德镇' },
      { name_en: 'Other', name_zh: '其它市' }
    ]
  },
  {
    name_en: 'Liaoning',
    name_zh: '辽宁',
    type: 'province',
    cities: [
      { name_en: 'Shenyang', name_zh: '沈阳' },
      { name_en: 'Dalian', name_zh: '大连' },
      { name_en: 'Anshan', name_zh: '鞍山' },
      { name_en: 'Fushun', name_zh: '抚顺' },
      { name_en: 'Other', name_zh: '其它市' }
    ]
  },
  {
    name_en: 'Shaanxi',
    name_zh: '陕西',
    type: 'province',
    cities: [
      { name_en: 'Xi\'an', name_zh: '西安' },
      { name_en: 'Baoji', name_zh: '宝鸡' },
      { name_en: 'Xianyang', name_zh: '咸阳' },
      { name_en: 'Weinan', name_zh: '渭南' },
      { name_en: 'Other', name_zh: '其它市' }
    ]
  },
  {
    name_en: 'Yunnan',
    name_zh: '云南',
    type: 'province',
    cities: [
      { name_en: 'Kunming', name_zh: '昆明' },
      { name_en: 'Qujing', name_zh: '曲靖' },
      { name_en: 'Dali', name_zh: '大理' },
      { name_en: 'Lijiang', name_zh: '丽江' },
      { name_en: 'Other', name_zh: '其它市' }
    ]
  },
  {
    name_en: 'Hebei',
    name_zh: '河北',
    type: 'province',
    cities: [
      { name_en: 'Shijiazhuang', name_zh: '石家庄' },
      { name_en: 'Tangshan', name_zh: '唐山' },
      { name_en: 'Qinhuangdao', name_zh: '秦皇岛' },
      { name_en: 'Baoding', name_zh: '保定' },
      { name_en: 'Other', name_zh: '其它市' }
    ]
  },
  {
    name_en: 'Shanxi',
    name_zh: '山西',
    type: 'province',
    cities: [
      { name_en: 'Taiyuan', name_zh: '太原' },
      { name_en: 'Datong', name_zh: '大同' },
      { name_en: 'Yangquan', name_zh: '阳泉' },
      { name_en: 'Changzhi', name_zh: '长治' },
      { name_en: 'Other', name_zh: '其它市' }
    ]
  },
  {
    name_en: 'Heilongjiang',
    name_zh: '黑龙江',
    type: 'province',
    cities: [
      { name_en: 'Harbin', name_zh: '哈尔滨' },
      { name_en: 'Qiqihar', name_zh: '齐齐哈尔' },
      { name_en: 'Daqing', name_zh: '大庆' },
      { name_en: 'Mudanjiang', name_zh: '牡丹江' },
      { name_en: 'Other', name_zh: '其它市' }
    ]
  },
  {
    name_en: 'Jilin',
    name_zh: '吉林',
    type: 'province',
    cities: [
      { name_en: 'Changchun', name_zh: '长春' },
      { name_en: 'Jilin City', name_zh: '吉林市' },
      { name_en: 'Siping', name_zh: '四平' },
      { name_en: 'Liaoyuan', name_zh: '辽源' },
      { name_en: 'Other', name_zh: '其它市' }
    ]
  },
  {
    name_en: 'Gansu',
    name_zh: '甘肃',
    type: 'province',
    cities: [
      { name_en: 'Lanzhou', name_zh: '兰州' },
      { name_en: 'Tianshui', name_zh: '天水' },
      { name_en: 'Jiuquan', name_zh: '酒泉' },
      { name_en: 'Other', name_zh: '其它市' }
    ]
  },
  {
    name_en: 'Guizhou',
    name_zh: '贵州',
    type: 'province',
    cities: [
      { name_en: 'Guiyang', name_zh: '贵阳' },
      { name_en: 'Zunyi', name_zh: '遵义' },
      { name_en: 'Liupanshui', name_zh: '六盘水' },
      { name_en: 'Other', name_zh: '其它市' }
    ]
  },
  {
    name_en: 'Hainan',
    name_zh: '海南',
    type: 'province',
    cities: [
      { name_en: 'Haikou', name_zh: '海口' },
      { name_en: 'Sanya', name_zh: '三亚' },
      { name_en: 'Sansha', name_zh: '三沙' },
      { name_en: 'Other', name_zh: '其它市' }
    ]
  },
  {
    name_en: 'Qinghai',
    name_zh: '青海',
    type: 'province',
    cities: [
      { name_en: 'Xining', name_zh: '西宁' },
      { name_en: 'Haidong', name_zh: '海东' },
      { name_en: 'Other', name_zh: '其它市' }
    ]
  },

  // Autonomous Regions (自治区)
  {
    name_en: 'Guangxi',
    name_zh: '广西',
    type: 'autonomous_region',
    cities: [
      { name_en: 'Nanning', name_zh: '南宁' },
      { name_en: 'Liuzhou', name_zh: '柳州' },
      { name_en: 'Guilin', name_zh: '桂林' },
      { name_en: 'Wuzhou', name_zh: '梧州' },
      { name_en: 'Other', name_zh: '其它市' }
    ]
  },
  {
    name_en: 'Inner Mongolia',
    name_zh: '内蒙古',
    type: 'autonomous_region',
    cities: [
      { name_en: 'Hohhot', name_zh: '呼和浩特' },
      { name_en: 'Baotou', name_zh: '包头' },
      { name_en: 'Ordos', name_zh: '鄂尔多斯' },
      { name_en: 'Other', name_zh: '其它市' }
    ]
  },
  {
    name_en: 'Ningxia',
    name_zh: '宁夏',
    type: 'autonomous_region',
    cities: [
      { name_en: 'Yinchuan', name_zh: '银川' },
      { name_en: 'Shizuishan', name_zh: '石嘴山' },
      { name_en: 'Wuzhong', name_zh: '吴忠' },
      { name_en: 'Other', name_zh: '其它市' }
    ]
  },
  {
    name_en: 'Tibet',
    name_zh: '西藏',
    type: 'autonomous_region',
    cities: [
      { name_en: 'Lhasa', name_zh: '拉萨' },
      { name_en: 'Shigatse', name_zh: '日喀则' },
      { name_en: 'Other', name_zh: '其它市' }
    ]
  },
  {
    name_en: 'Xinjiang',
    name_zh: '新疆',
    type: 'autonomous_region',
    cities: [
      { name_en: 'Urumqi', name_zh: '乌鲁木齐' },
      { name_en: 'Karamay', name_zh: '克拉玛依' },
      { name_en: 'Turpan', name_zh: '吐鲁番' },
      { name_en: 'Other', name_zh: '其它市' }
    ]
  },

  // Special Administrative Regions (特别行政区)
  {
    name_en: 'Hong Kong',
    name_zh: '香港',
    type: 'sar',
    cities: [
      { name_en: 'Hong Kong Island', name_zh: '香港岛' },
      { name_en: 'Kowloon', name_zh: '九龙' },
      { name_en: 'New Territories', name_zh: '新界' }
    ]
  },
  {
    name_en: 'Macau',
    name_zh: '澳门',
    type: 'sar',
    cities: [
      { name_en: 'Macau Peninsula', name_zh: '澳门半岛' },
      { name_en: 'Taipa', name_zh: '氹仔' },
      { name_en: 'Coloane', name_zh: '路环' }
    ]
  }
];

// Helper function to get cities for a province
export function getCitiesForProvince(provinceName: string): CityOption[] {
  const province = CHINA_LOCATIONS.find(
    p => p.name_en === provinceName || p.name_zh === provinceName
  );
  return province?.cities || [];
}

// Get all province names for display
export function getAllProvinces() {
  return CHINA_LOCATIONS;
}
