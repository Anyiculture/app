import { useState, useEffect } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { Select } from './Select';

// Comprehensive A-Z country list
export const COUNTRIES = [
  { value: 'Afghanistan', label_en: 'Afghanistan', label_zh: '阿富汗' },
  { value: 'Albania', label_en: 'Albania', label_zh: '阿尔巴尼亚' },
  { value: 'Algeria', label_en: 'Algeria', label_zh: '阿尔及利亚' },
  { value: 'Argentina', label_en: 'Argentina', label_zh: '阿根廷' },
  { value: 'Armenia', label_en: 'Armenia', label_zh: '亚美尼亚' },
  { value: 'Australia', label_en: 'Australia', label_zh: '澳大利亚' },
  { value: 'Austria', label_en: 'Austria', label_zh: '奥地利' },
  { value: 'Azerbaijan', label_en: 'Azerbaijan', label_zh: '阿塞拜疆' },
  { value: 'Bahamas', label_en: 'Bahamas', label_zh: '巴哈马' },
  { value: 'Bahrain', label_en: 'Bahrain', label_zh: '巴林' },
  { value: 'Bangladesh', label_en: 'Bangladesh', label_zh: '孟加拉国' },
  { value: 'Barbados', label_en: 'Barbados', label_zh: '巴巴多斯' },
  { value: 'Belarus', label_en: 'Belarus', label_zh: '白俄罗斯' },
  { value: 'Belgium', label_en: 'Belgium', label_zh: '比利时' },
  { value: 'Belize', label_en: 'Belize', label_zh: '伯利兹' },
  { value: 'Benin', label_en: 'Benin', label_zh: '贝宁' },
  { value: 'Bhutan', label_en: 'Bhutan', label_zh: '不丹' },
  { value: 'Bolivia', label_en: 'Bolivia', label_zh: '玻利维亚' },
  { value: 'Bosnia and Herzegovina', label_en: 'Bosnia and Herzegovina', label_zh: '波黑' },
  { value: 'Botswana', label_en: 'Botswana', label_zh: '博茨瓦纳' },
  { value: 'Brazil', label_en: 'Brazil', label_zh: '巴西' },
  { value: 'Brunei', label_en: 'Brunei', label_zh: '文莱' },
  { value: 'Bulgaria', label_en: 'Bulgaria', label_zh: '保加利亚' },
  { value: 'Burkina Faso', label_en: 'Burkina Faso', label_zh: '布基纳法索' },
  { value: 'Burundi', label_en: 'Burundi', label_zh: '布隆迪' },
  { value: 'Cambodia', label_en: 'Cambodia', label_zh: '柬埔寨' },
  { value: 'Cameroon', label_en: 'Cameroon', label_zh: '喀麦隆' },
  { value: 'Canada', label_en: 'Canada', label_zh: '加拿大' },
  { value: 'Cape Verde', label_en: 'Cape Verde', label_zh: '佛得角' },
  { value: 'Central African Republic', label_en: 'Central African Republic', label_zh: '中非共和国' },
  { value: 'Chad', label_en: 'Chad', label_zh: '乍得' },
  { value: 'Chile', label_en: 'Chile', label_zh: '智利' },
  { value: 'China', label_en: 'China', label_zh: '中国' },
  { value: 'Colombia', label_en: 'Colombia', label_zh: '哥伦比亚' },
  { value: 'Comoros', label_en: 'Comoros', label_zh: '科摩罗' },
  { value: 'Congo', label_en: 'Congo', label_zh: '刚果' },
  { value: 'Costa Rica', label_en: 'Costa Rica', label_zh: '哥斯达黎加' },
  { value: 'Croatia', label_en: 'Croatia', label_zh: '克罗地亚' },
  { value: 'Cuba', label_en: 'Cuba', label_zh: '古巴' },
  { value: 'Cyprus', label_en: 'Cyprus', label_zh: '塞浦路斯' },
  { value: 'Czech Republic', label_en: 'Czech Republic', label_zh: '捷克' },
  { value: 'Denmark', label_en: 'Denmark', label_zh: '丹麦' },
  { value: 'Djibouti', label_en: 'Djibouti', label_zh: '吉布提' },
  { value: 'Dominica', label_en: 'Dominica', label_zh: '多米尼克' },
  { value: 'Dominican Republic', label_en: 'Dominican Republic', label_zh: '多米尼加' },
  { value: 'East Timor', label_en: 'East Timor', label_zh: '东帝汶' },
  { value: 'Ecuador', label_en: 'Ecuador', label_zh: '厄瓜多尔' },
  { value: 'Egypt', label_en: 'Egypt', label_zh: '埃及' },
  { value: 'El Salvador', label_en: 'El Salvador', label_zh: '萨尔瓦多' },
  { value: 'Equatorial Guinea', label_en: 'Equatorial Guinea', label_zh: '赤道几内亚' },
  { value: 'Eritrea', label_en: 'Eritrea', label_zh: '厄立特里亚' },
  { value: 'Estonia', label_en: 'Estonia', label_zh: '爱沙尼亚' },
  { value: 'Eswatini', label_en: 'Eswatini', label_zh: '斯威士兰' },
  { value: 'Ethiopia', label_en: 'Ethiopia', label_zh: '埃塞俄比亚' },
  { value: 'Fiji', label_en: 'Fiji', label_zh: '斐济' },
  { value: 'Finland', label_en: 'Finland', label_zh: '芬兰' },
  { value: 'France', label_en: 'France', label_zh: '法国' },
  { value: 'Gabon', label_en: 'Gabon', label_zh: '加蓬' },
  { value: 'Gambia', label_en: 'Gambia', label_zh: '冈比亚' },
  { value: 'Georgia', label_en: 'Georgia', label_zh: '格鲁吉亚' },
  { value: 'Germany', label_en: 'Germany', label_zh: '德国' },
  { value: 'Ghana', label_en: 'Ghana', label_zh: '加纳' },
  { value: 'Greece', label_en: 'Greece', label_zh: '希腊' },
  { value: 'Grenada', label_en: 'Grenada', label_zh: '格林纳达' },
  { value: 'Guatemala', label_en: 'Guatemala', label_zh: '危地马拉' },
  { value: 'Guinea', label_en: 'Guinea', label_zh: '几内亚' },
  { value: 'Guinea-Bissau', label_en: 'Guinea-Bissau', label_zh: '几内亚比绍' },
  { value: 'Guyana', label_en: 'Guyana', label_zh: '圭亚那' },
  { value: 'Haiti', label_en: 'Haiti', label_zh: '海地' },
  { value: 'Honduras', label_en: 'Honduras', label_zh: '洪都拉斯' },
  { value: 'Hong Kong', label_en: 'Hong Kong', label_zh: '香港' },
  { value: 'Hungary', label_en: 'Hungary', label_zh: '匈牙利' },
  { value: 'Iceland', label_en: 'Iceland', label_zh: '冰岛' },
  { value: 'India', label_en: 'India', label_zh: '印度' },
  { value: 'Indonesia', label_en: 'Indonesia', label_zh: '印度尼西亚' },
  { value: 'Iran', label_en: 'Iran', label_zh: '伊朗' },
  { value: 'Iraq', label_en: 'Iraq', label_zh: '伊拉克' },
  { value: 'Ireland', label_en: 'Ireland', label_zh: '爱尔兰' },
  { value: 'Israel', label_en: 'Israel', label_zh: '以色列' },
  { value: 'Italy', label_en: 'Italy', label_zh: '意大利' },
  { value: 'Ivory Coast', label_en: 'Ivory Coast', label_zh: '科特迪瓦' },
  { value: 'Jamaica', label_en: 'Jamaica', label_zh: '牙买加' },
  { value: 'Japan', label_en: 'Japan', label_zh: '日本' },
  { value: 'Jordan', label_en: 'Jordan', label_zh: '约旦' },
  { value: 'Kazakhstan', label_en: 'Kazakhstan', label_zh: '哈萨克斯坦' },
  { value: 'Kenya', label_en: 'Kenya', label_zh: '肯尼亚' },
  { value: 'Kiribati', label_en: 'Kiribati', label_zh: '基里巴斯' },
  { value: 'Kuwait', label_en: 'Kuwait', label_zh: '科威特' },
  { value: 'Kyrgyzstan', label_en: 'Kyrgyzstan', label_zh: '吉尔吉斯斯坦' },
  { value: 'Laos', label_en: 'Laos', label_zh: '老挝' },
  { value: 'Latvia', label_en: 'Latvia', label_zh: '拉脱维亚' },
  { value: 'Lebanon', label_en: 'Lebanon', label_zh: '黎巴嫩' },
  { value: 'Lesotho', label_en: 'Lesotho', label_zh: '莱索托' },
  { value: 'Liberia', label_en: 'Liberia', label_zh: '利比里亚' },
  { value: 'Libya', label_en: 'Libya', label_zh: '利比亚' },
  { value: 'Liechtenstein', label_en: 'Liechtenstein', label_zh: '列支敦士登' },
  { value: 'Lithuania', label_en: 'Lithuania', label_zh: '立陶宛' },
  { value: 'Luxembourg', label_en: 'Luxembourg', label_zh: '卢森堡' },
  { value: 'Madagascar', label_en: 'Madagascar', label_zh: '马达加斯加' },
  { value: 'Malawi', label_en: 'Malawi', label_zh: '马拉维' },
  { value: 'Malaysia', label_en: 'Malaysia', label_zh: '马来西亚' },
  { value: 'Maldives', label_en: 'Maldives', label_zh: '马尔代夫' },
  { value: 'Mali', label_en: 'Mali', label_zh: '马里' },
  { value: 'Malta', label_en: 'Malta', label_zh: '马耳他' },
  { value: 'Marshall Islands', label_en: 'Marshall Islands', label_zh: '马绍尔群岛' },
  { value: 'Mauritania', label_en: 'Mauritania', label_zh: '毛里塔尼亚' },
  { value: 'Mauritius', label_en: 'Mauritius', label_zh: '毛里求斯' },
  { value: 'Mexico', label_en: 'Mexico', label_zh: '墨西哥' },
  { value: 'Micronesia', label_en: 'Micronesia', label_zh: '密克罗尼西亚' },
  { value: 'Moldova', label_en: 'Moldova', label_zh: '摩尔多瓦' },
  { value: 'Monaco', label_en: 'Monaco', label_zh: '摩纳哥' },
  { value: 'Mongolia', label_en: 'Mongolia', label_zh: '蒙古' },
  { value: 'Montenegro', label_en: 'Montenegro', label_zh: '黑山' },
  { value: 'Morocco', label_en: 'Morocco', label_zh: '摩洛哥' },
  { value: 'Mozambique', label_en: 'Mozambique', label_zh: '莫桑比克' },
  { value: 'Myanmar', label_en: 'Myanmar', label_zh: '缅甸' },
  { value: 'Namibia', label_en: 'Namibia', label_zh: '纳米比亚' },
  { value: 'Nauru', label_en: 'Nauru', label_zh: '瑙鲁' },
  { value: 'Nepal', label_en: 'Nepal', label_zh: '尼泊尔' },
  { value: 'Netherlands', label_en: 'Netherlands', label_zh: '荷兰' },
  { value: 'New Zealand', label_en: 'New Zealand', label_zh: '新西兰' },
  { value: 'Nicaragua', label_en: 'Nicaragua', label_zh: '尼加拉瓜' },
  { value: 'Niger', label_en: 'Niger', label_zh: '尼日尔' },
  { value: 'Nigeria', label_en: 'Nigeria', label_zh: '尼日利亚' },
  { value: 'North Korea', label_en: 'North Korea', label_zh: '朝鲜' },
  { value: 'North Macedonia', label_en: 'North Macedonia', label_zh: '北马其顿' },
  { value: 'Norway', label_en: 'Norway', label_zh: '挪威' },
  { value: 'Oman', label_en: 'Oman', label_zh: '阿曼' },
  { value: 'Pakistan', label_en: 'Pakistan', label_zh: '巴基斯坦' },
  { value: 'Palau', label_en: 'Palau', label_zh: '帕劳' },
  { value: 'Panama', label_en: 'Panama', label_zh: '巴拿马' },
  { value: 'Papua New Guinea', label_en: 'Papua New Guinea', label_zh: '巴布亚新几内亚' },
  { value: 'Paraguay', label_en: 'Paraguay', label_zh: '巴拉圭' },
  { value: 'Peru', label_en: 'Peru', label_zh: '秘鲁' },
  { value: 'Philippines', label_en: 'Philippines', label_zh: '菲律宾' },
  { value: 'Poland', label_en: 'Poland', label_zh: '波兰' },
  { value: 'Portugal', label_en: 'Portugal', label_zh: '葡萄牙' },
  { value: 'Qatar', label_en: 'Qatar', label_zh: '卡塔尔' },
  { value: 'Romania', label_en: 'Romania', label_zh: '罗马尼亚' },
  { value: 'Russia', label_en: 'Russia', label_zh: '俄罗斯' },
  { value: 'Rwanda', label_en: 'Rwanda', label_zh: '卢旺达' },
  { value: 'Saint Kitts and Nevis', label_en: 'Saint Kitts and Nevis', label_zh: '圣基茨和尼维斯' },
  { value: 'Saint Lucia', label_en: 'Saint Lucia', label_zh: '圣卢西亚' },
  { value: 'Saint Vincent and the Grenadines', label_en: 'Saint Vincent and the Grenadines', label_zh: '圣文森特和格林纳丁斯' },
  { value: 'Samoa', label_en: 'Samoa', label_zh: '萨摩亚' },
  { value: 'San Marino', label_en: 'San Marino', label_zh: '圣马力诺' },
  { value: 'Sao Tome and Principe', label_en: 'Sao Tome and Principe', label_zh: '圣多美和普林西比' },
  { value: 'Saudi Arabia', label_en: 'Saudi Arabia', label_zh: '沙特阿拉伯' },
  { value: 'Senegal', label_en: 'Senegal', label_zh: '塞内加尔' },
  { value: 'Serbia', label_en: 'Serbia', label_zh: '塞尔维亚' },
  { value: 'Seychelles', label_en: 'Seychelles', label_zh: '塞舌尔' },
  { value: 'Sierra Leone', label_en: 'Sierra Leone', label_zh: '塞拉利昂' },
  { value: 'Singapore', label_en: 'Singapore', label_zh: '新加坡' },
  { value: 'Slovakia', label_en: 'Slovakia', label_zh: '斯洛伐克' },
  { value: 'Slovenia', label_en: 'Slovenia', label_zh: '斯洛文尼亚' },
  { value: 'Solomon Islands', label_en: 'Solomon Islands', label_zh: '所罗门群岛' },
  { value: 'Somalia', label_en: 'Somalia', label_zh: '索马里' },
  { value: 'South Africa', label_en: 'South Africa', label_zh: '南非' },
  { value: 'South Korea', label_en: 'South Korea', label_zh: '韩国' },
  { value: 'South Sudan', label_en: 'South Sudan', label_zh: '南苏丹' },
  { value: 'Spain', label_en: 'Spain', label_zh: '西班牙' },
  { value: 'Sri Lanka', label_en: 'Sri Lanka', label_zh: '斯里兰卡' },
  { value: 'Sudan', label_en: 'Sudan', label_zh: '苏丹' },
  { value: 'Suriname', label_en: 'Suriname', label_zh: '苏里南' },
  { value: 'Sweden', label_en: 'Sweden', label_zh: '瑞典' },
  { value: 'Switzerland', label_en: 'Switzerland', label_zh: '瑞士' },
  { value: 'Syria', label_en: 'Syria', label_zh: '叙利亚' },
  { value: 'Taiwan', label_en: 'Taiwan', label_zh: '台湾' },
  { value: 'Tajikistan', label_en: 'Tajikistan', label_zh: '塔吉克斯坦' },
  { value: 'Tanzania', label_en: 'Tanzania', label_zh: '坦桑尼亚' },
  { value: 'Thailand', label_en: 'Thailand', label_zh: '泰国' },
  { value: 'Togo', label_en: 'Togo', label_zh: '多哥' },
  { value: 'Tonga', label_en: 'Tonga', label_zh: '汤加' },
  { value: 'Trinidad and Tobago', label_en: 'Trinidad and Tobago', label_zh: '特立尼达和多巴哥' },
  { value: 'Tunisia', label_en: 'Tunisia', label_zh: '突尼斯' },
  { value: 'Turkey', label_en: 'Turkey', label_zh: '土耳其' },
  { value: 'Turkmenistan', label_en: 'Turkmenistan', label_zh: '土库曼斯坦' },
  { value: 'Tuvalu', label_en: 'Tuvalu', label_zh: '图瓦卢' },
  { value: 'Uganda', label_en: 'Uganda', label_zh: '乌干达' },
  { value: 'Ukraine', label_en: 'Ukraine', label_zh: '乌克兰' },
  { value: 'UAE', label_en: 'United Arab Emirates', label_zh: '阿联酋' },
  { value: 'UK', label_en: 'United Kingdom', label_zh: '英国' },
  { value: 'USA', label_en: 'United States', label_zh: '美国' },
  { value: 'Uruguay', label_en: 'Uruguay', label_zh: '乌拉圭' },
  { value: 'Uzbekistan', label_en: 'Uzbekistan', label_zh: '乌兹别克斯坦' },
  { value: 'Vanuatu', label_en: 'Vanuatu', label_zh: '瓦努阿图' },
  { value: 'Vatican City', label_en: 'Vatican City', label_zh: '梵蒂冈' },
  { value: 'Venezuela', label_en: 'Venezuela', label_zh: '委内瑞拉' },
  { value: 'Vietnam', label_en: 'Vietnam', label_zh: '越南' },
  { value: 'Yemen', label_en: 'Yemen', label_zh: '也门' },
  { value: 'Zambia', label_en: 'Zambia', label_zh: '赞比亚' },
  { value: 'Zimbabwe', label_en: 'Zimbabwe', label_zh: '津巴布韦' }
].sort((a, b) => a.label_en.localeCompare(b.label_en));

// China provinces and major cities
const CHINA_PROVINCES = [
  { value: 'Anhui', label_en: 'Anhui', label_zh: '安徽', cities: ['Hefei', 'Wuhu', 'Bengbu', 'Huainan', 'Ma\'anshan'] },
  { value: 'Beijing', label_en: 'Beijing', label_zh: '北京', cities: ['Beijing'] },
  { value: 'Chongqing', label_en: 'Chongqing', label_zh: '重庆', cities: ['Chongqing'] },
  { value: 'Fujian', label_en: 'Fujian', label_zh: '福建', cities: ['Fuzhou', 'Xiamen', 'Quanzhou', 'Zhangzhou', 'Putian'] },
  { value: 'Gansu', label_en: 'Gansu', label_zh: '甘肃', cities: ['Lanzhou', 'Tianshui', 'Baiyin'] },
  { value: 'Guangdong', label_en: 'Guangdong', label_zh: '广东', cities: ['Guangzhou', 'Shenzhen', 'Dongguan', 'Foshan', 'Zhongshan', 'Zhuhai', 'Huizhou', 'Jiangmen', 'Shantou'] },
  { value: 'Guangxi', label_en: 'Guangxi', label_zh: '广西', cities: ['Nanning', 'Guilin', 'Liuzhou', 'Beihai'] },
  { value: 'Guizhou', label_en: 'Guizhou', label_zh: '贵州', cities: ['Guiyang', 'Zunyi', 'Liupanshui'] },
  { value: 'Hainan', label_en: 'Hainan', label_zh: '海南', cities: ['Haikou', 'Sanya', 'Danzhou'] },
  { value: 'Hebei', label_en: 'Hebei', label_zh: '河北', cities: ['Shijiazhuang', 'Tangshan', 'Baoding', 'Handan', 'Xingtai'] },
  { value: 'Heilongjiang', label_en: 'Heilongjiang', label_zh: '黑龙江', cities: ['Harbin', 'Daqing', 'Qiqihar', 'Mudanjiang'] },
  { value: 'Henan', label_en: 'Henan', label_zh: '河南', cities: ['Zhengzhou', 'Luoyang', 'Kaifeng', 'Anyang', 'Xinxiang', 'Nanyang'] },
  { value: 'Hubei', label_en: 'Hubei', label_zh: '湖北', cities: ['Wuhan', 'Xiangyang', 'Yichang', 'Jingzhou', 'Huanggang'] },
  { value: 'Hunan', label_en: 'Hunan', label_zh: '湖南', cities: ['Changsha', 'Zhuzhou', 'Hengyang', 'Yueyang', 'Changde'] },
  { value: 'Inner Mongolia', label_en: 'Inner Mongolia', label_zh: '内蒙古', cities: ['Hohhot', 'Baotou', 'Chifeng', 'Ordos'] },
  { value: 'Jiangsu', label_en: 'Jiangsu', label_zh: '江苏', cities: ['Nanjing', 'Suzhou', 'Wuxi', 'Changzhou', 'Nantong', 'Xuzhou', 'Yangzhou', 'Yancheng'] },
  { value: 'Jiangxi', label_en: 'Jiangxi', label_zh: '江西', cities: ['Nanchang', 'Ganzhou', 'Jiujiang', 'Yichun'] },
  { value: 'Jilin', label_en: 'Jilin', label_zh: '吉林', cities: ['Changchun', 'Jilin City', 'Siping'] },
  { value: 'Liaoning', label_en: 'Liaoning', label_zh: '辽宁', cities: ['Shenyang', 'Dalian', 'Anshan', 'Fushun', 'Benxi'] },
  { value: 'Ningxia', label_en: 'Ningxia', label_zh: '宁夏', cities: ['Yinchuan', 'Shizuishan'] },
  { value: 'Qinghai', label_en: 'Qinghai', label_zh: '青海', cities: ['Xining', 'Haidong'] },
  { value: 'Shaanxi', label_en: 'Shaanxi', label_zh: '陕西', cities: ['Xi\'an', 'Baoji', 'Xianyang', 'Weinan'] },
  { value: 'Shandong', label_en: 'Shandong', label_zh: '山东', cities: ['Jinan', 'Qingdao', 'Yantai', 'Weifang', 'Zibo', 'Jining', 'Linyi', 'Tai\'an'] },
  { value: 'Shanghai', label_en: 'Shanghai', label_zh: '上海', cities: ['Shanghai'] },
  { value: 'Shanxi', label_en: 'Shanxi', label_zh: '山西', cities: ['Taiyuan', 'Datong', 'Changzhi', 'Linfen'] },
  { value: 'Sichuan', label_en: 'Sichuan', label_zh: '四川', cities: ['Chengdu', 'Mianyang', 'Deyang', 'Nanchong', 'Yibin', 'Zigong'] },
  { value: 'Tianjin', label_en: 'Tianjin', label_zh: '天津', cities: ['Tianjin'] },
  { value: 'Tibet', label_en: 'Tibet', label_zh: '西藏', cities: ['Lhasa', 'Shigatse'] },
  { value: 'Xinjiang', label_en: 'Xinjiang', label_zh: '新疆', cities: ['Urumqi', 'Korla', 'Kashgar'] },
  { value: 'Yunnan', label_en: 'Yunnan', label_zh: '云南', cities: ['Kunming', 'Lijiang', 'Dali', 'Qujing'] },
  { value: 'Zhejiang', label_en: 'Zhejiang', label_zh: '浙江', cities: ['Hangzhou', 'Ningbo', 'Wenzhou', 'Jiaxing', 'Shaoxing', 'Jinhua', 'Taizhou'] },
];

const PROVINCE_MAP: Record<string, any[]> = {
  'China': CHINA_PROVINCES,
  'USA': [
    { value: 'Alabama', label_en: 'Alabama', cities: ['Birmingham', 'Montgomery', 'Huntsville'] },
    { value: 'Alaska', label_en: 'Alaska', cities: ['Anchorage', 'Juneau'] },
    { value: 'Arizona', label_en: 'Arizona', cities: ['Phoenix', 'Tucson', 'Mesa'] },
    { value: 'Arkansas', label_en: 'Arkansas', cities: ['Little Rock', 'Fort Smith'] },
    { value: 'California', label_en: 'California', cities: ['Los Angeles', 'San Francisco', 'San Diego', 'San Jose', 'Sacramento', 'Fresno', 'Oakland'] },
    { value: 'Colorado', label_en: 'Colorado', cities: ['Denver', 'Colorado Springs', 'Aurora'] },
    { value: 'Connecticut', label_en: 'Connecticut', cities: ['Bridgeport', 'New Haven', 'Stamford'] },
    { value: 'Delaware', label_en: 'Delaware', cities: ['Wilmington', 'Dover'] },
    { value: 'Florida', label_en: 'Florida', cities: ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Fort Lauderdale', 'Tallahassee'] },
    { value: 'Georgia', label_en: 'Georgia', cities: ['Atlanta', 'Savannah', 'Augusta'] },
    { value: 'Hawaii', label_en: 'Hawaii', cities: ['Honolulu'] },
    { value: 'Idaho', label_en: 'Idaho', cities: ['Boise', 'Meridian'] },
    { value: 'Illinois', label_en: 'Illinois', cities: ['Chicago', 'Aurora', 'Naperville', 'Joliet', 'Rockford', 'Springfield'] },
    { value: 'Indiana', label_en: 'Indiana', cities: ['Indianapolis', 'Fort Wayne'] },
    { value: 'Iowa', label_en: 'Iowa', cities: ['Des Moines', 'Cedar Rapids'] },
    { value: 'Kansas', label_en: 'Kansas', cities: ['Wichita', 'Overland Park'] },
    { value: 'Kentucky', label_en: 'Kentucky', cities: ['Louisville', 'Lexington'] },
    { value: 'Louisiana', label_en: 'Louisiana', cities: ['New Orleans', 'Baton Rouge'] },
    { value: 'Maine', label_en: 'Maine', cities: ['Portland', 'Lewiston'] },
    { value: 'Maryland', label_en: 'Maryland', cities: ['Baltimore', 'Columbia'] },
    { value: 'Massachusetts', label_en: 'Massachusetts', cities: ['Boston', 'Worcester', 'Cambridge'] },
    { value: 'Michigan', label_en: 'Michigan', cities: ['Detroit', 'Grand Rapids'] },
    { value: 'Minnesota', label_en: 'Minnesota', cities: ['Minneapolis', 'Saint Paul'] },
    { value: 'Mississippi', label_en: 'Mississippi', cities: ['Jackson', 'Gulfport'] },
    { value: 'Missouri', label_en: 'Missouri', cities: ['Kansas City', 'Saint Louis'] },
    { value: 'Montana', label_en: 'Montana', cities: ['Billings', 'Missoula'] },
    { value: 'Nebraska', label_en: 'Nebraska', cities: ['Omaha', 'Lincoln'] },
    { value: 'Nevada', label_en: 'Nevada', cities: ['Las Vegas', 'Reno'] },
    { value: 'New Hampshire', label_en: 'New Hampshire', cities: ['Manchester', 'Nashua'] },
    { value: 'New Jersey', label_en: 'New Jersey', cities: ['Newark', 'Jersey City', 'Paterson'] },
    { value: 'New Mexico', label_en: 'New Mexico', cities: ['Albuquerque', 'Las Cruces'] },
    { value: 'New York', label_en: 'New York', cities: ['New York City', 'Buffalo', 'Rochester', 'Albany', 'Syracuse'] },
    { value: 'North Carolina', label_en: 'North Carolina', cities: ['Charlotte', 'Raleigh', 'Greensboro'] },
    { value: 'North Dakota', label_en: 'North Dakota', cities: ['Fargo', 'Bismarck'] },
    { value: 'Ohio', label_en: 'Ohio', cities: ['Columbus', 'Cleveland', 'Cincinnati'] },
    { value: 'Oklahoma', label_en: 'Oklahoma', cities: ['Oklahoma City', 'Tulsa'] },
    { value: 'Oregon', label_en: 'Oregon', cities: ['Portland', 'Salem', 'Eugene'] },
    { value: 'Pennsylvania', label_en: 'Pennsylvania', cities: ['Philadelphia', 'Pittsburgh', 'Allentown'] },
    { value: 'Rhode Island', label_en: 'Rhode Island', cities: ['Providence', 'Warwick'] },
    { value: 'South Carolina', label_en: 'South Carolina', cities: ['Charleston', 'Columbia'] },
    { value: 'South Dakota', label_en: 'South Dakota', cities: ['Sioux Falls', 'Rapid City'] },
    { value: 'Tennessee', label_en: 'Tennessee', cities: ['Nashville', 'Memphis', 'Knoxville'] },
    { value: 'Texas', label_en: 'Texas', cities: ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth', 'El Paso'] },
    { value: 'Utah', label_en: 'Utah', cities: ['Salt Lake City', 'West Valley City'] },
    { value: 'Vermont', label_en: 'Vermont', cities: ['Burlington', 'South Burlington'] },
    { value: 'Virginia', label_en: 'Virginia', cities: ['Virginia Beach', 'Norfolk', 'Chesapeake'] },
    { value: 'Washington', label_en: 'Washington', cities: ['Seattle', 'Spokane', 'Tacoma'] },
    { value: 'West Virginia', label_en: 'West Virginia', cities: ['Charleston', 'Huntington'] },
    { value: 'Wisconsin', label_en: 'Wisconsin', cities: ['Milwaukee', 'Madison', 'Green Bay'] },
    { value: 'Wyoming', label_en: 'Wyoming', cities: ['Cheyenne', 'Casper'] },
  ],
  'Canada': [
    { value: 'Ontario', label_en: 'Ontario', label_zh: '安大略', cities: ['Toronto', 'Ottawa', 'Mississauga', 'Hamilton', 'Brampton'] },
    { value: 'Quebec', label_en: 'Quebec', label_zh: '魁北克', cities: ['Montreal', 'Quebec City', 'Laval', 'Gatineau'] },
    { value: 'British Columbia', label_en: 'British Columbia', label_zh: '不列颠哥伦比亚', cities: ['Vancouver', 'Victoria', 'Surrey', 'Burnaby', 'Richmond'] },
    { value: 'Alberta', label_en: 'Alberta', label_zh: '艾伯塔', cities: ['Calgary', 'Edmonton', 'Red Deer', 'Lethbridge'] },
    { value: 'Manitoba', label_en: 'Manitoba', label_zh: '曼尼托巴', cities: ['Winnipeg', 'Brandon'] },
    { value: 'Saskatchewan', label_en: 'Saskatchewan', label_zh: '萨斯喀彻温', cities: ['Saskatoon', 'Regina'] },
    { value: 'Nova Scotia', label_en: 'Nova Scotia', label_zh: '新斯科舍', cities: ['Halifax'] },
    { value: 'New Brunswick', label_en: 'New Brunswick', label_zh: '新不伦瑞克', cities: ['Moncton', 'Fredericton'] },
    { value: 'Newfoundland and Labrador', label_en: 'Newfoundland and Labrador', label_zh: '纽芬兰与拉布拉多', cities: ['St. John\'s'] },
    { value: 'Prince Edward Island', label_en: 'Prince Edward Island', label_zh: '爱德华王子岛', cities: ['Charlottetown'] },
  ],
  'Philippines': [
    { value: 'Metro Manila', label_en: 'Metro Manila', cities: ['Manila', 'Quezon City', 'Makati', 'Taguig', 'Pasig'] },
    { value: 'Cebu', label_en: 'Cebu', cities: ['Cebu City', 'Mandaue', 'Lapu-Lapu'] },
    { value: 'Davao del Sur', label_en: 'Davao del Sur', cities: ['Davao City'] },
    { value: 'Pampanga', label_en: 'Pampanga', cities: ['Angeles', 'San Fernando'] },
    { value: 'Cavite', label_en: 'Cavite', cities: ['Dasmarinas', 'Bacoor', 'Imus'] },
    { value: 'Laguna', label_en: 'Laguna', cities: ['Calamba', 'Santa Rosa', 'San Pedro'] },
    { value: 'Rizal', label_en: 'Rizal', cities: ['Antipolo'] },
    { value: 'Batangas', label_en: 'Batangas', cities: ['Batangas City', 'Lipa'] },
    { value: 'Iloilo', label_en: 'Iloilo', cities: ['Iloilo City'] },
  ],
   'South Africa': [
    { value: 'Gauteng', label_en: 'Gauteng', cities: ['Johannesburg', 'Pretoria', 'Centurion', 'Sandton'] },
    { value: 'Western Cape', label_en: 'Western Cape', cities: ['Cape Town', 'Stellenbosch', 'George'] },
    { value: 'KwaZulu-Natal', label_en: 'KwaZulu-Natal', cities: ['Durban', 'Pietermaritzburg'] },
    { value: 'Eastern Cape', label_en: 'Eastern Cape', cities: ['Port Elizabeth (Gqeberha)', 'East London'] },
    { value: 'Free State', label_en: 'Free State', cities: ['Bloemfontein'] },
    { value: 'Limpopo', label_en: 'Limpopo', cities: ['Polokwane'] },
    { value: 'Mpumalanga', label_en: 'Mpumalanga', cities: ['Nelspruit (Mbombela)'] },
    { value: 'North West', label_en: 'North West', cities: ['Rustenburg', 'Mahikeng'] },
    { value: 'Northern Cape', label_en: 'Northern Cape', cities: ['Kimberley'] },
  ],
  'UK': [
    { value: 'England', label_en: 'England', label_zh: '英格兰', cities: ['London', 'Manchester', 'Birmingham', 'Liverpool', 'Leeds'] },
    { value: 'Scotland', label_en: 'Scotland', label_zh: '苏格兰', cities: ['Edinburgh', 'Glasgow', 'Aberdeen', 'Dundee'] },
    { value: 'Wales', label_en: 'Wales', label_zh: '威尔士', cities: ['Cardiff', 'Swansea', 'Newport'] },
    { value: 'Northern Ireland', label_en: 'Northern Ireland', label_zh: '北爱尔兰', cities: ['Belfast', 'Derry'] },
  ],
  'Australia': [
    { value: 'New South Wales', label_en: 'New South Wales', label_zh: '新南威尔士', cities: ['Sydney', 'Newcastle', 'Wollongong', 'Central Coast'] },
    { value: 'Victoria', label_en: 'Victoria', label_zh: '维多利亚', cities: ['Melbourne', 'Geelong', 'Ballarat', 'Bendigo'] },
    { value: 'Queensland', label_en: 'Queensland', label_zh: '昆士兰', cities: ['Brisbane', 'Gold Coast', 'Sunshine Coast', 'Townsville'] },
    { value: 'Western Australia', label_en: 'Western Australia', label_zh: '西澳大利亚', cities: ['Perth', 'Fremantle', 'Mandurah'] },
    { value: 'South Australia', label_en: 'South Australia', label_zh: '南澳大利亚', cities: ['Adelaide'] },
    { value: 'Tasmania', label_en: 'Tasmania', label_zh: '塔斯马尼亚', cities: ['Hobart', 'Launceston'] },
    { value: 'Australian Capital Territory', label_en: 'Australian Capital Territory', label_zh: '澳大利亚首都领地', cities: ['Canberra'] },
    { value: 'Northern Territory', label_en: 'Northern Territory', label_zh: '北领地', cities: ['Darwin', 'Alice Springs'] },
  ],
  'Germany': [
     { value: 'Bavaria', label_en: 'Bavaria', label_zh: '巴伐利亚', cities: ['Munich', 'Nuremberg', 'Augsburg'] },
    { value: 'Berlin', label_en: 'Berlin', label_zh: '柏林', cities: ['Berlin'] },
    { value: 'Hamburg', label_en: 'Hamburg', label_zh: '汉堡', cities: ['Hamburg'] },
    { value: 'Hesse', label_en: 'Hesse', label_zh: '黑森', cities: ['Frankfurt', 'Wiesbaden', 'Kassel'] },
    { value: 'North Rhine-Westphalia', label_en: 'North Rhine-Westphalia', label_zh: '北莱茵-威斯特法伦', cities: ['Cologne', 'Düsseldorf', 'Dortmund', 'Essen'] },
    { value: 'Baden-Württemberg', label_en: 'Baden-Württemberg', label_zh: '巴登-符腾堡', cities: ['Stuttgart', 'Karlsruhe', 'Mannheim'] },
  ],
};

const COUNTRIES_WITHOUT_PROVINCES: Record<string, string[]> = {
  'Singapore': ['Singapore'],
  'Hong Kong': ['Hong Kong Island', 'Kowloon', 'New Territories'],
  'Ireland': ['Dublin', 'Cork', 'Galway', 'Limerick', 'Waterford'],
  'New Zealand': ['Auckland', 'Wellington', 'Christchurch', 'Hamilton'],
  'Japan': ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama', 'Sapporo', 'Nagoya', 'Fukuoka'], // Simplified for cascade (Japan uses Prefectures which act like provinces, simplified here)
  'South Korea': ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon', 'Gwangju'],
};

interface LocationCascadeProps {
  country: string;
  province: string;
  city: string;
  onCountryChange: (value: string) => void;
  onProvinceChange: (value: string) => void;
  onCityChange: (value: string) => void;
  required?: boolean;
  language?: 'en' | 'zh';
  disabled?: boolean;
}

export function LocationCascade({
  country,
  province,
  city,
  onCountryChange,
  onProvinceChange,
  onCityChange,
  required = false,
  language: propLanguage,
  disabled = false
}: LocationCascadeProps) {
  const { t, language: contextLanguage } = useI18n();
  const language = propLanguage || contextLanguage || 'en';
  
  const [availableProvinces, setAvailableProvinces] = useState<any[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [showCustomCity, setShowCustomCity] = useState(false);

  // Check if country has provinces or direct cities
  const hasProvinces = country && PROVINCE_MAP[country];
  const hasDirectCities = country && COUNTRIES_WITHOUT_PROVINCES[country];

  // Update provinces when country changes
  useEffect(() => {
    if (country) {
      const provinces = PROVINCE_MAP[country] || [];
      setAvailableProvinces(provinces);
      setShowCustomCity(false);

      // If country has no provinces, load direct cities
      if (COUNTRIES_WITHOUT_PROVINCES[country]) {
        setAvailableCities(COUNTRIES_WITHOUT_PROVINCES[country]);
        onProvinceChange('N/A'); // Mark as not applicable
        if (!COUNTRIES_WITHOUT_PROVINCES[country].includes(city)) {
          onCityChange('');
        }
      } else {
        // Reset province and city if country changed
        if (provinces.length > 0 && !provinces.find(p => p.value === province)) {
          onProvinceChange('');
          onCityChange('');
        } else if (provinces.length === 0) {
           // No provinces mapped, allow free text? or just hide?
           // Current design hides province selector.
           // For city, we might need free text if no provinces or cities mapped.
           setAvailableCities([]); 
        }
      }
    } else {
      setAvailableProvinces([]);
      setAvailableCities([]);
      onProvinceChange('');
      onCityChange('');
    }
  }, [country]);

  // Update cities when province changes
  useEffect(() => {
    if (province && province !== 'N/A' && availableProvinces.length > 0) {
      const selectedProvince = availableProvinces.find(p => p.value === province);
      if (selectedProvince) {
        setAvailableCities(selectedProvince.cities || []);

        // Reset city if province changed
        if (!selectedProvince.cities?.includes(city)) {
          onCityChange('');
        }
      }
    } else if (province === 'N/A') {
      return;
    } else {
      setAvailableCities([]);
      if (!hasDirectCities) {
        onCityChange('');
      }
    }
  }, [province, availableProvinces]);

  const handleCityChange = (val: string) => {
    if (val === 'Other') {
      setShowCustomCity(true);
      onCityChange('');
    } else {
      setShowCustomCity(false);
      onCityChange(val);
    }
  };

  return (
    <div className="space-y-4">
      <Select
        label={t('onboarding.country')}
        value={country}
        onChange={(e) => onCountryChange(e.target.value)}
        required={required}
        disabled={disabled}
      >
        <option value="">{t('onboarding.selectCountry')}</option>
        {COUNTRIES.map((c) => (
          <option key={c.value} value={c.value}>
            {language === 'zh' ? c.label_zh : c.label_en}
          </option>
        ))}
      </Select>

      {/* Only show province selector if country has provinces */}
      {hasProvinces && !hasDirectCities && (
        <Select
          label={t('onboarding.province')}
          value={province}
          onChange={(e) => onProvinceChange(e.target.value)}
          disabled={!country || availableProvinces.length === 0 || disabled}
          required={required}
        >
          <option value="">{t('onboarding.selectProvince')}</option>
          {availableProvinces.map((p) => (
            <option key={p.value} value={p.value}>
              {language === 'zh' ? p.label_zh : p.label_en}
            </option>
          ))}
        </Select>
      )}

      <div className="space-y-2">
         {availableCities.length > 0 ? (
           <>
             <Select
                label={t('onboarding.city')}
                value={availableCities.includes(city) ? city : (showCustomCity || (city && !availableCities.includes(city)) ? 'Other' : '')}
                onChange={(e) => handleCityChange(e.target.value)}
                disabled={!country || disabled}
                required={required}
            >
                <option value="">{t('onboarding.selectCity')}</option>
                {availableCities.map((c) => (
                <option key={c} value={c}>
                    {c}
                </option>
                ))}
                <option value="Other">{t('onboarding.otherCity')}</option>
            </Select>
            
            {((city && !availableCities.includes(city)) || showCustomCity) && (
                <input 
                  type="text"
                  value={city}
                  onChange={(e) => onCityChange(e.target.value)}
                  placeholder={t('onboarding.enterCityName')}
                  className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm h-10 px-3 border disabled:bg-gray-100 disabled:text-gray-500"
                  required={required}
                  disabled={disabled}
                />
            )}
           </>
         ) : (
           /* No cities available for selected country, show free text input directly */
           country && (
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('onboarding.city')} {required && '*'}
                </label>
                <input 
                  type="text"
                  value={city}
                  onChange={(e) => onCityChange(e.target.value)}
                  placeholder={t('onboarding.enterCityName')}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm h-10 px-3 border disabled:bg-gray-100 disabled:text-gray-500"
                  required={required}
                  disabled={disabled}
                />
             </div>
           )
         )}
      </div>
    </div>
  );
}
