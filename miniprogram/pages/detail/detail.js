Page({
  data: {
    plan: null,
    breakEvenYears: 0
  },

  onLoad(options) {
    if (options.data) {
      try {
        const plan = JSON.parse(decodeURIComponent(options.data));
        const breakEvenYears = (plan.breakEvenMonths / 12).toFixed(1);

        this.setData({
          plan,
          breakEvenYears
        });
      } catch (err) {
        console.error('解析方案数据失败:', err);
        wx.showToast({
          title: '数据加载失败',
          icon: 'none'
        });
      }
    }
  },

  onBack() {
    wx.navigateBack();
  }
});
