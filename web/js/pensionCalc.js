/**
 * 主计算函数
 */
function calculatePension(input) {
  // 验证输入
  validateInput(input);

  // 获取城市配置
  const cityCfg = CITY_CONFIG[input.city];
  if (!cityCfg) {
    throw new Error(`不支持的城市: ${input.city}`);
  }

  // 生成退休年龄场景
  const scenarios = generateScenarios(input);

  // 对每个场景计算养老金
  const results = scenarios.map(age => calculateForAge(input, age, cityCfg));

  // 选择最优方案
  const best = pickBestPlan(results);

  return {
    bestPlan: best,
    plans: results
  };
}

/**
 * 生成退休年龄场景
 */
function generateScenarios(input) {
  const { personType } = input;

  if (personType === "男职工") {
    return [60, 61, 62, 63];
  } else if (personType === "女干部") {
    return [55, 56, 57, 58];
  } else if (personType === "女工人") {
    return [50, 51, 52, 53, 55];
  }

  throw new Error('未知的人员类型');
}

/**
 * 计算指定退休年龄的方案
 */
function calculateForAge(input, retireAge, cityCfg) {
  // 模拟未来缴费
  const simulation = simulateFuturePay(input, retireAge, cityCfg);

  // 获取计发月数
  const N = N_TABLE[retireAge];
  if (!N) {
    throw new Error(`未找到退休年龄 ${retireAge} 对应的计发月数`);
  }

  // 计算基础养老金
  const basePension = cityCfg.avgSalary * 0.01 * simulation.totalYears;

  // 计算个人账户养老金
  const accountPension = simulation.accountBalance / N;

  // 月养老金总额
  const monthlyPension = basePension + accountPension;

  // 回本周期（月）
  const breakEvenMonths = simulation.totalPay > 0
    ? Math.round(simulation.totalPay / monthlyPension)
    : 0;

  // 生成方案名称
  const planName = getPlanName(input.personType, retireAge);

  return {
    name: planName,
    age: retireAge,
    recommended: false,
    monthlyPension: Math.round(monthlyPension * 100) / 100,
    basePension: Math.round(basePension * 100) / 100,
    accountPension: Math.round(accountPension * 100) / 100,
    totalPayment: Math.round(simulation.totalPay / 10000 * 100) / 100, // 转换为万元
    breakEvenMonths,
    accountAtRetire: Math.round(simulation.accountBalance * 100) / 100,
    totalYears: Math.round(simulation.totalYears * 10) / 10,
    N,
    summary: generateSummary(retireAge, monthlyPension, breakEvenMonths)
  };
}

/**
 * 模拟未来缴费（核心算法）
 */
function simulateFuturePay(input, retireAge, cityCfg) {
  const {
    birthYear,
    birthMonth,
    paymentBase,
    paidYears,
    accountBalance,
    employmentStatus,
    is4050,
    level
  } = input;

  // 计算当前年龄和退休日期
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const currentAge = currentYear - birthYear - (currentMonth < birthMonth ? 1 : 0);
  const retireYear = birthYear + retireAge;
  const retireMonth = birthMonth;

  // 如果已经到退休年龄，直接返回
  if (currentAge >= retireAge) {
    return {
      totalPay: 0,
      accountBalance,
      totalYears: paidYears
    };
  }

  // 初始化模拟状态
  let currentAccountBalance = accountBalance;
  let currentTotalYears = paidYears;
  let totalPersonalPay = 0;
  let unemploymentMonthsLeft = employmentStatus === "失业补贴内" ? cityCfg.unemploymentCutoffMonth : 0;

  // 根据level调整缴费基数
  const adjustedBase = Math.min(
    Math.max(paymentBase * (level / 100), cityCfg.baseMin),
    cityCfg.baseMax
  );

  // 逐月模拟
  let simYear = currentYear;
  let simMonth = currentMonth;
  let monthsSimulated = 0;

  while (simYear < retireYear || (simYear === retireYear && simMonth <= retireMonth)) {
    // 计算当月缴费
    let monthlyPersonalPay = 0;
    let monthlyContribution = 0;

    if (employmentStatus === "在职") {
      monthlyPersonalPay = adjustedBase * cityCfg.personalRate;
      monthlyContribution = monthlyPersonalPay;
    } else if (employmentStatus === "灵活就业") {
      // 灵活就业：个人实际支付20%，进入个人账户8%
      monthlyPersonalPay = adjustedBase * 0.2;
      monthlyContribution = adjustedBase * cityCfg.personalRate;
    } else if (employmentStatus === "失业补贴内" && unemploymentMonthsLeft > 0) {
      // 失业金期间不缴费
      monthlyPersonalPay = 0;
      monthlyContribution = 0;
      unemploymentMonthsLeft--;
    } else if (employmentStatus === "失业补贴外") {
      // 补贴外不缴费
      monthlyPersonalPay = 0;
      monthlyContribution = 0;
    } else {
      // 失业金用完后
      monthlyPersonalPay = 0;
      monthlyContribution = 0;
    }

    // 应用4050补贴
    if (is4050 && monthlyPersonalPay > 0) {
      const subsidyAmount = cityCfg.subsidy4050 || 0;
      monthlyPersonalPay = Math.max(monthlyPersonalPay - subsidyAmount, 0);
    }

    // 累计个人实际支付
    totalPersonalPay += monthlyPersonalPay;

    // 个人账户增长（只记录个人缴费部分）
    currentAccountBalance += monthlyContribution;

    // 如果有缴费，增加缴费年限
    if (monthlyContribution > 0) {
      currentTotalYears += 1 / 12;
    }

    monthsSimulated++;

    // 推进到下一个月
    simMonth++;
    if (simMonth > 12) {
      simMonth = 1;
      simYear++;

      // 年底计息
      currentAccountBalance *= (1 + cityCfg.pensionInterestRate);
    }

    // 防止无限循环
    if (monthsSimulated > 600) break;
  }

  return {
    totalPay: totalPersonalPay,
    accountBalance: currentAccountBalance,
    totalYears: currentTotalYears
  };
}

/**
 * 选择最优方案
 */
function pickBestPlan(plans) {
  if (plans.length === 0) {
    throw new Error('没有可用的退休方案');
  }

  let best = plans[0];
  let bestScore = -Infinity;

  // 使用基准方案（第一个方案）计算增长率
  const baseline = plans[0];

  for (const plan of plans) {
    // 计算得分
    const pensionIncrease = (plan.monthlyPension - baseline.monthlyPension) / baseline.monthlyPension;
    const breakEvenImprove = baseline.breakEvenMonths > 0
      ? (baseline.breakEvenMonths - plan.breakEvenMonths) / baseline.breakEvenMonths
      : 0;
    const costDecrease = baseline.totalPayment > 0
      ? (baseline.totalPayment - plan.totalPayment) / baseline.totalPayment
      : 0;

    // 加权评分
    const score = pensionIncrease * 0.5 + breakEvenImprove * 0.3 + costDecrease * 0.2;

    if (score > bestScore) {
      bestScore = score;
      best = plan;
    }
  }

  best.recommended = true;
  return best;
}

/**
 * 生成方案名称
 */
function getPlanName(personType, retireAge) {
  let normalAge;
  if (personType === "男职工") normalAge = 60;
  else if (personType === "女干部") normalAge = 55;
  else if (personType === "女工人") normalAge = 50;

  if (retireAge === normalAge) {
    return `方案A (正常退休 ${retireAge}岁)`;
  } else if (retireAge > normalAge) {
    const delay = retireAge - normalAge;
    return `方案 (延迟${delay}年退休 ${retireAge}岁)`;
  } else {
    return `方案 (${retireAge}岁退休)`;
  }
}

/**
 * 生成方案总结
 */
function generateSummary(retireAge, monthlyPension, breakEvenMonths) {
  const pensionStr = Math.round(monthlyPension);
  const yearsToBreakEven = Math.round(breakEvenMonths / 12 * 10) / 10;

  return `${retireAge}岁退休，月领${pensionStr}元，${yearsToBreakEven}年回本`;
}

/**
 * 输入验证
 */
function validateInput(input) {
  const required = ['personType', 'birthYear', 'birthMonth', 'paymentBase', 'paidYears', 'accountBalance', 'level'];

  for (const field of required) {
    if (input[field] === undefined || input[field] === null) {
      throw new Error(`缺少必填字段: ${field}`);
    }
  }

  // 验证人员类型
  if (!['男职工', '女干部', '女工人'].includes(input.personType)) {
    throw new Error('无效的人员类型');
  }

  // 验证出生年份
  const currentYear = new Date().getFullYear();
  if (input.birthYear < 1950 || input.birthYear > currentYear) {
    throw new Error('出生年份无效');
  }

  // 验证出生月份
  if (input.birthMonth < 1 || input.birthMonth > 12) {
    throw new Error('出生月份必须在1-12之间');
  }

  // 验证缴费基数
  if (input.paymentBase < 0) {
    throw new Error('缴费基数不能为负数');
  }

  // 验证缴费年限
  if (input.paidYears < 0 || input.paidYears > 50) {
    throw new Error('缴费年限无效');
  }

  // 验证个人账户余额
  if (input.accountBalance < 0) {
    throw new Error('个人账户余额不能为负数');
  }

  // 验证缴费指数
  if (![60, 100, 200, 300].includes(input.level)) {
    throw new Error('缴费指数level必须是60、100、200或300');
  }
}

/**
 * 计算优势对比
 */
function calculateAdvantages(plans, bestPlan) {
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
}
