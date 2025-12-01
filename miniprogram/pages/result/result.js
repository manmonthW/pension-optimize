Page({
  data: {
    bestPlan: null,
    plans: [],
    advantages: null,
    baselineName: ''
  },

  onLoad(options) {
    if (options.data) {
      try {
        const result = JSON.parse(decodeURIComponent(options.data));

        // 计算优势数据
        const advantages = this.calculateAdvantages(result.plans, result.bestPlan);

        this.setData({
          bestPlan: result.bestPlan,
          plans: result.plans,
          advantages,
          baselineName: result.plans[0].name
        });
      } catch (err) {
        console.error('解析结果数据失败:', err);
        wx.showToast({
          title: '数据加载失败',
          icon: 'none'
        });
      }
    }
  },

  /**
   * 计算推荐方案相比基准方案的优势
   */
  calculateAdvantages(plans, bestPlan) {
    if (!plans || plans.length === 0 || !bestPlan) {
      return null;
    }

    // 基准方案（第一个方案，即正常退休年龄）
    const baseline = plans[0];

    // 如果推荐方案就是基准方案，不显示优势对比
    if (bestPlan.age === baseline.age) {
      return null;
    }

    // 计算各项差异
    const pensionIncrease = Math.round((bestPlan.monthlyPension - baseline.monthlyPension) * 100) / 100;
    const pensionIncreasePercent = Math.round((pensionIncrease / baseline.monthlyPension) * 10000) / 100;

    const breakEvenImprove = baseline.breakEvenMonths - bestPlan.breakEvenMonths;
    const breakEvenImprovePercent = Math.round((breakEvenImprove / baseline.breakEvenMonths) * 10000) / 100;

    const costDecrease = Math.round((baseline.totalPayment - bestPlan.totalPayment) * 100) / 100;
    const costDecreasePercent = Math.round((costDecrease / baseline.totalPayment) * 10000) / 100;

    const accountIncrease = Math.round((bestPlan.accountAtRetire - baseline.accountAtRetire) * 100) / 100;
    const accountIncreasePercent = Math.round((accountIncrease / baseline.accountAtRetire) * 10000) / 100;

    // 计算综合评分（0-100分）
    let totalScore = 0;

    // 养老金增长贡献分（最高50分）
    if (pensionIncreasePercent > 0) {
      totalScore += Math.min(pensionIncreasePercent * 5, 50);
    }

    // 回本优化贡献分（最高30分）
    if (breakEvenImprovePercent > 0) {
      totalScore += Math.min(breakEvenImprovePercent * 3, 30);
    }

    // 成本节约贡献分（最高20分）
    if (costDecreasePercent > 0) {
      totalScore += Math.min(costDecreasePercent * 2, 20);
    }

    totalScore = Math.round(totalScore * 10) / 10;

    return {
      pensionIncrease: Math.abs(pensionIncrease),
      pensionIncreasePercent: Math.abs(pensionIncreasePercent),
      breakEvenImprove: Math.abs(breakEvenImprove),
      breakEvenImprovePercent: Math.abs(breakEvenImprovePercent),
      costDecrease: Math.abs(costDecrease),
      costDecreasePercent: Math.abs(costDecreasePercent),
      accountIncrease: Math.abs(accountIncrease),
      accountIncreasePercent: Math.abs(accountIncreasePercent),
      totalScore
    };
  },

  onPlanTap(e) {
    const plan = e.detail.plan;
    wx.navigateTo({
      url: `/pages/detail/detail?data=${encodeURIComponent(JSON.stringify(plan))}`
    });
  },

  onBack() {
    wx.navigateBack();
  }
});
