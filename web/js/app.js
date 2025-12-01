// DOM元素
const pensionForm = document.getElementById('pensionForm');
const inputSection = document.getElementById('inputSection');
const resultsSection = document.getElementById('resultsSection');
const citySelect = document.getElementById('city');
const baseHint = document.getElementById('baseHint');
const levelSelector = document.getElementById('levelSelector');
const levelInput = document.getElementById('level');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  updateBaseHint();
  citySelect.addEventListener('change', updateBaseHint);
  initLevelSelector();
});

// 初始化缴费指数选择器
function initLevelSelector() {
  const options = levelSelector.querySelectorAll('.level-option');
  options.forEach(option => {
    option.addEventListener('click', () => {
      // 移除所有选项的active类
      options.forEach(opt => opt.classList.remove('active'));
      // 添加当前选项的active类
      option.classList.add('active');
      // 更新隐藏输入框的值
      const level = parseInt(option.getAttribute('data-level'));
      levelInput.value = level;
    });
  });
}

// 更新缴费基数提示
function updateBaseHint() {
  const currentCity = citySelect.value;
  const cityConfig = CITY_CONFIG[currentCity];
  if (cityConfig) {
    baseHint.textContent = `${currentCity}2025基数范围 ${cityConfig.baseMin} - ${cityConfig.baseMax} 元`;
  }
}

// 表单提交处理
pensionForm.addEventListener('submit', (e) => {
  e.preventDefault();

  try {
    // 获取表单数据
    const formData = new FormData(pensionForm);
    const input = {
      city: formData.get('city'),
      currentAge: parseInt(formData.get('currentAge')),
      gender: formData.get('gender'),
      normalRetireAge: parseInt(formData.get('normalRetireAge')),
      maxRetireAge: parseInt(formData.get('maxRetireAge')),
      paymentYears: parseFloat(formData.get('paymentYears')),
      currentAccount: parseFloat(formData.get('currentAccount')),
      paymentBase: parseFloat(formData.get('paymentBase')),
      employmentStatus: formData.get('employmentStatus'),
      eligible4050: formData.get('eligible4050') === 'true',
      level: parseInt(formData.get('level'))
    };

    // 显示加载状态
    const submitBtn = pensionForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '计算中...';
    submitBtn.disabled = true;

    // 执行计算（使用setTimeout模拟异步，让UI有时间更新）
    setTimeout(() => {
      try {
        const result = calculatePension(input);
        displayResults(result);

        // 隐藏输入表单，显示结果
        inputSection.classList.add('hidden');
        resultsSection.classList.remove('hidden');

        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (error) {
        alert('计算失败：' + error.message);
      } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    }, 100);

  } catch (error) {
    alert('表单验证失败：' + error.message);
  }
});

// 显示结果
function displayResults(result) {
  const { bestPlan, plans } = result;

  // 显示最优方案
  document.getElementById('bestPlanName').textContent = bestPlan.name;
  document.getElementById('bestPlanAmount').textContent = bestPlan.monthlyPension;
  document.getElementById('bestBasePension').textContent = bestPlan.basePension + '元';
  document.getElementById('bestAccountPension').textContent = bestPlan.accountPension + '元';
  document.getElementById('bestBreakEven').textContent = bestPlan.breakEvenMonths + '个月';

  // 计算优势
  const advantages = calculateAdvantages(plans, bestPlan);
  const advantageCard = document.getElementById('advantageCard');

  if (advantages) {
    advantageCard.classList.remove('hidden');

    // 更新副标题
    const baseline = plans[0];
    document.getElementById('advantageSubtitle').textContent =
      `相比正常退休方案（${baseline.name}），本方案具有以下优势：`;

    // 生成优势列表
    const advantageList = document.getElementById('advantageList');
    advantageList.innerHTML = '';

    if (advantages.pensionIncrease > 0) {
      advantageList.innerHTML += `
        <div class="advantage-item">
          <div class="advantage-icon increase">▲</div>
          <div class="advantage-content">
            <div class="advantage-title">月养老金提升</div>
            <div class="advantage-value">+${advantages.pensionIncrease}元/月</div>
            <div class="advantage-percent">增幅 ${advantages.pensionIncreasePercent}%</div>
          </div>
        </div>
      `;
    }

    if (advantages.breakEvenImprove > 0) {
      advantageList.innerHTML += `
        <div class="advantage-item">
          <div class="advantage-icon improve">✓</div>
          <div class="advantage-content">
            <div class="advantage-title">回本时间缩短</div>
            <div class="advantage-value">快 ${advantages.breakEvenImprove}个月</div>
            <div class="advantage-percent">提前 ${advantages.breakEvenImprovePercent}%</div>
          </div>
        </div>
      `;
    }

    if (advantages.costDecrease > 0) {
      advantageList.innerHTML += `
        <div class="advantage-item">
          <div class="advantage-icon save">↓</div>
          <div class="advantage-content">
            <div class="advantage-title">总缴费节省</div>
            <div class="advantage-value">省 ${advantages.costDecrease}万元</div>
            <div class="advantage-percent">节省 ${advantages.costDecreasePercent}%</div>
          </div>
        </div>
      `;
    }

    if (advantages.accountIncrease > 0) {
      advantageList.innerHTML += `
        <div class="advantage-item">
          <div class="advantage-icon account">📈</div>
          <div class="advantage-content">
            <div class="advantage-title">个人账户余额</div>
            <div class="advantage-value">多 ${advantages.accountIncrease}元</div>
            <div class="advantage-percent">增加 ${advantages.accountIncreasePercent}%</div>
          </div>
        </div>
      `;
    }

    document.getElementById('totalScore').textContent = advantages.totalScore;
  } else {
    advantageCard.classList.add('hidden');
  }

  // 显示所有方案对比
  const plansList = document.getElementById('plansList');
  plansList.innerHTML = '';

  plans.forEach(plan => {
    const planCard = document.createElement('div');
    planCard.className = 'plan-card' + (plan.recommended ? ' best' : '');
    planCard.innerHTML = `
      <div class="plan-header">
        <div class="plan-name">${plan.name}</div>
        ${plan.recommended ? '<div class="plan-badge">推荐</div>' : ''}
      </div>
      <div class="plan-pension">${plan.monthlyPension}元/月</div>
      <div class="plan-details">
        <div class="detail-item">
          <span class="detail-label">基础养老金</span>
          <span class="detail-value">${plan.basePension}元</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">账户养老金</span>
          <span class="detail-value">${plan.accountPension}元</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">总缴费</span>
          <span class="detail-value">${plan.totalPayment}万元</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">回本时间</span>
          <span class="detail-value">${plan.breakEvenMonths}个月</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">退休账户余额</span>
          <span class="detail-value">${plan.accountAtRetire}元</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">累计缴费年限</span>
          <span class="detail-value">${plan.totalYears}年</span>
        </div>
      </div>
    `;
    plansList.appendChild(planCard);
  });
}

// 重新计算
function resetCalculation() {
  resultsSection.classList.add('hidden');
  inputSection.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
