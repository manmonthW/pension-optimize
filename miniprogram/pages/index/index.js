import { calcPension } from '../../utils/api.js';
const { CITY_CONFIG } = require('../../config/cityConfig.js');

Page({
  data: {
    personTypes: ['男职工', '女干部', '女工人'],
    personTypeIndex: 0,

    years: [],
    yearIndex: 0,
    months: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    monthIndex: 6,

    cities: ['北京'],
    cityIndex: 0,

    employmentStatusList: ['在职', '失业补贴内', '失业补贴外', '灵活就业'],
    employmentStatusIndex: 0,

    baseHint: '', // 缴费基数范围提示

    formData: {
      personType: '男职工',
      birthYear: 1985,
      birthMonth: 7,
      city: '北京',
      employmentStatus: '在职',
      paymentBase: 8500,
      paidYears: 13.2,
      accountBalance: 82300,
      is4050: false,
      level: 100
    }
  },

  onLoad() {
    this.initYears();
    this.updateBaseHint();
  },

  initYears() {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 1950; i <= currentYear; i++) {
      years.push(i.toString());
    }
    const defaultYearIndex = years.indexOf('1985');

    this.setData({
      years,
      yearIndex: defaultYearIndex >= 0 ? defaultYearIndex : 0
    });
  },

  onPersonTypeChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      personTypeIndex: index,
      'formData.personType': this.data.personTypes[index]
    });
  },

  onYearChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      yearIndex: index,
      'formData.birthYear': parseInt(this.data.years[index])
    });
  },

  onMonthChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      monthIndex: index,
      'formData.birthMonth': parseInt(this.data.months[index])
    });
  },

  onCityChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      cityIndex: index,
      'formData.city': this.data.cities[index]
    });
    this.updateBaseHint();
  },

  onEmploymentStatusChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      employmentStatusIndex: index,
      'formData.employmentStatus': this.data.employmentStatusList[index]
    });
  },

  onPaymentBaseInput(e) {
    this.setData({
      'formData.paymentBase': parseFloat(e.detail.value) || 0
    });
  },

  onPaidYearsInput(e) {
    this.setData({
      'formData.paidYears': parseFloat(e.detail.value) || 0
    });
  },

  onAccountBalanceInput(e) {
    this.setData({
      'formData.accountBalance': parseFloat(e.detail.value) || 0
    });
  },

  on4050Change(e) {
    this.setData({
      'formData.is4050': e.detail.value === 'true'
    });
  },

  onLevelChange(e) {
    this.setData({
      'formData.level': e.detail.level
    });
  },

  // 更新缴费基数范围提示
  updateBaseHint() {
    const currentCity = this.data.formData.city;
    const cityConfig = CITY_CONFIG[currentCity];

    if (cityConfig) {
      const hint = `${currentCity}2025基数范围 ${cityConfig.baseMin} - ${cityConfig.baseMax} 元`;
      this.setData({
        baseHint: hint
      });
    }
  },

  async onSubmit() {
    if (!this.validateForm()) {
      return;
    }

    try {
      const result = await calcPension(this.data.formData);

      wx.navigateTo({
        url: `/pages/result/result?data=${encodeURIComponent(JSON.stringify(result))}`
      });
    } catch (err) {
      console.error('计算失败:', err);
    }
  },

  validateForm() {
    const { paymentBase, paidYears, accountBalance, city } = this.data.formData;
    const cityConfig = CITY_CONFIG[city];

    if (!paymentBase || paymentBase <= 0) {
      wx.showToast({
        title: '请输入有效的缴费基数',
        icon: 'none'
      });
      return false;
    }

    if (cityConfig && (paymentBase < cityConfig.baseMin || paymentBase > cityConfig.baseMax)) {
      wx.showToast({
        title: `缴费基数超出${city}范围`,
        icon: 'none'
      });
      return false;
    }

    if (paidYears < 0 || paidYears > 50) {
      wx.showToast({
        title: '请输入有效的缴费年限',
        icon: 'none'
      });
      return false;
    }

    if (accountBalance < 0) {
      wx.showToast({
        title: '请输入有效的账户余额',
        icon: 'none'
      });
      return false;
    }

    return true;
  }
});
