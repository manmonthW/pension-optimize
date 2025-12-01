// 城市配置
const CITY_CONFIG = {
  北京: {
    city: "北京",
    avgSalary: 12049, // 退休金核算基数
    pensionInterestRate: 0.04, // 个人账户年利率
    baseMin: 7162, // 缴费基数下限
    baseMax: 35811, // 缴费基数上限
    companyRate: 0.16, // 单位缴费比例
    personalRate: 0.08, // 个人缴费比例
    unemploymentBase: 2286, // 失业金标准
    unemploymentCutoffMonth: 24, // 失业金最长期限
    subsidy4050: 669.58, // 4050补贴金额
  },
  // 可以在这里添加更多城市
};

// 计发月数表（N表）
const N_TABLE = {
  50: 195,
  51: 183,
  52: 171,
  53: 160,
  54: 150,
  55: 139,
  56: 129,
  57: 119,
  58: 110,
  59: 101,
  60: 93,
  61: 86,
  62: 79,
  63: 73,
};
