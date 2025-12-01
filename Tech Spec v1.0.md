# 📘《养老最优解小程序》技术方案设计文档（Tech Spec v2.0）

---

# 1. 总体架构设计（Architecture）

本小程序采用**纯前端架构**，无需后端服务：

```
WeChat Mini Program (Front-end)
      ↓
本地计算引擎 (pensionCalc.js)
      ↓
配置数据 (cityConfig.js)
      ↓
结果展示
```

**架构优势：**
- ✅ 零部署成本（无需服务器）
- ✅ 极速响应（本地计算）
- ✅ 隐私保护（数据不上传）
- ✅ 离线可用（无网络依赖）

---

## 1.1 前端（小程序）

* 使用 **微信原生小程序**（无需 Taro/uni-app）
* 使用组件化开发方式（按 PRD 已建）
* 状态管理：局部 setData（无需复杂框架）
* **所有计算在前端完成**

### 前端主要职责：

* User input（表单）
* 本地计算引擎
* UI 展示（方案、图表、对比）
* 配置管理
* 错误处理、loading、toast

---

# 2. 数据模型（Data Model）

下面给你**完整字段定义**。

---

## 2.1 用户输入模型（UserInputModel）

```ts
interface UserInput {
  personType: "男职工" | "女干部" | "女工人";
  birthYear: number;
  birthMonth: number;

  city: string;

  employmentStatus:
    | "在职"
    | "失业补贴内"
    | "失业补贴外"
    | "灵活就业";

  paymentBase: number;          // 当前缴费基数
  paidYears: number;            // 累计缴费年限
  accountBalance: number;       // 当前个人账户余额
  is4050: boolean;              // 是否享受4050补贴

  level: 60 | 100 | 200 | 300;  // 缴费指数
}
```

---

## 2.2 城市参数模型（CityConfig）

位置：`miniprogram/config/cityConfig.js`

```javascript
{
  "北京": {
    city: "北京",
    avgSalary: 12049,            // 退休金核算基数（2025年）
    pensionInterestRate: 0.04,   // 个人账户年利率
    baseMin: 7162,               // 缴费基数下限
    baseMax: 35811,              // 缴费基数上限

    companyRate: 0.16,           // 单位缴费比例
    personalRate: 0.08,          // 个人缴费比例

    unemploymentBase: 2286,      // 失业金标准
    unemploymentCutoffMonth: 24, // 失业金最长期限（月）
    subsidy4050: 669.58          // 4050补贴金额
  }
}
```

未来扩展城市，只需在配置文件中添加即可。

---

## 2.3 N表（养老金计发月数）

国家标准表（可配置）：

```javascript
{
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
  63: 73
}
```

---

## 2.4 输出模型（ResultModel）

```ts
interface RetirePlan {
  name: string;                // 方案名称
  age: number;                 // 退休年龄
  recommended: boolean;        // 是否推荐方案

  monthlyPension: number;      // 月养老金
  basePension: number;         // 基础养老金
  accountPension: number;      // 个人账户养老金

  totalPayment: number;        // 用户总缴费金额（万）
  breakEvenMonths: number;     // 回本周期（月）
  accountAtRetire: number;     // 退休时个人账户余额

  totalYears: number;          // 总缴费年限
  N: number;                   // 计发月数

  summary: string;             // 文案总结
}

interface ResultResponse {
  bestPlan: RetirePlan;
  plans: RetirePlan[];
}
```

---

# 3. 计算引擎（核心算法设计）

**养老金计算引擎**是本系统最核心部分，以下给你完整逻辑链。

---

# 3.1 未来缴费模拟（核心）

逐月模拟，从当前日期 → 退休日期：

```
for each month until retire:
    1. 判断就业状态
    2. 判断是否享受失业金
    3. 判断是否享受4050补贴
    4. 计算当月实际缴费金额
    5. 计算个人账户余额增长
    6. 累计缴费年限增加
```

---

### 3.1.1 缴费基数根据 level 动态计算

```
adjustedBase = user.paymentBase * (level / 100)
```

并强制限制：

```
if adjustedBase < baseMin → adjustedBase = baseMin
if adjustedBase > baseMax → adjustedBase = baseMax
```

---

### 3.1.2 每月缴费计算规则

```javascript
if (employmentStatus === "在职") {
    // 在职：个人支付8%，全部进入个人账户
    monthlyPersonalPay = adjustedBase * 0.08
    monthlyContribution = adjustedBase * 0.08
}

else if (employmentStatus === "灵活就业") {
    // 灵活就业：个人支付20%，只有8%进入个人账户
    monthlyPersonalPay = adjustedBase * 0.2
    monthlyContribution = adjustedBase * 0.08
}

else if (employmentStatus === "失业补贴内" && unemploymentMonthsLeft > 0) {
    // 失业金期间：不缴费，享受失业金
    monthlyPersonalPay = 0
    monthlyContribution = 0
    unemploymentMonthsLeft--
}

else if (employmentStatus === "失业补贴外") {
    // 失业补贴外：不缴费
    monthlyPersonalPay = 0
    monthlyContribution = 0
}
```

**关键说明：**
- `monthlyPersonalPay`：个人实际支付金额
- `monthlyContribution`：进入个人账户的金额
- 灵活就业人员支付20%，但只有8%进入个人账户，12%进入统筹账户

---

### 3.1.3 4050 补贴抵扣逻辑

```javascript
if (is4050 && monthlyPersonalPay > 0) {
    monthlyPersonalPay = Math.max(monthlyPersonalPay - subsidy4050, 0)
}
```

补贴规则由城市配置决定（避免写死）。

---

### 3.1.4 个人账户余额增长

每月：

```
accountBalance += monthlyContribution
```

每年底按复利：

```
accountBalance = accountBalance * (1 + pensionInterestRate)
```

**注意：** 只有进入个人账户的金额（`monthlyContribution`）才计入余额。

---

# 3.2 养老金计算公式（权威）

### **基础养老金（统筹部分）**

```
基础养老金 = avgSalary × 0.01 × 缴费年限
```

其中：
- `avgSalary`：城市退休金核算基数（从配置读取）
- 缴费年限：包含视同缴费年限和实际缴费年限

---

### **个人账户养老金**

```
个人账户养老金 = 个人账户余额 ÷ N值
```

N值来自 **N表**，根据退休年龄确定。

---

### **最终月养老金**

```
月养老金 = 基础养老金 + 个人账户养老金
```

---

# 3.3 回本周期（投资回收分析）

```
回本周期（月） = 总缴费金额 ÷ 月养老金
```

---

# 3.4 推荐方案算法

使用三指标加权：

```
score =
  月养老金增长率 * 0.5 +
  回本周期缩短比例 * 0.3 +
  缴费成本减少比例 * 0.2
```

**score 最大 → 推荐方案**

---

# 4. 前端实现

## 4.1 小程序目录结构

```
miniprogram/
  app.js
  app.json
  app.wxss

  /config                    # 配置文件
    cityConfig.js           # 城市参数 + N表

  /components               # 公共组件
    /level-selector         # 缴费等级选择器
    /plan-card             # 方案卡片

  /pages                    # 页面
    /index                  # 首页（输入页）
    /result                 # 结果页
    /detail                 # 详情页

  /utils                    # 工具函数
    api.js                  # API封装
    pensionCalc.js         # 养老金计算引擎 ⭐核心
```

---

## 4.2 核心计算引擎（pensionCalc.js）

位置：`miniprogram/utils/pensionCalc.js`

主要函数：

### 4.2.1 主计算函数

```javascript
function calculatePension(input) {
  // 验证输入
  validateInput(input);

  // 获取城市配置
  const cityCfg = CITY_CONFIG[input.city];

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
```

---

### 4.2.2 生成退休场景

```javascript
function generateScenarios(input) {
  if (input.personType === "男职工") return [60, 61, 62, 63];
  if (input.personType === "女干部") return [55, 56, 57, 58];
  if (input.personType === "女工人") return [50, 51, 52, 53, 55];
}
```

---

### 4.2.3 计算指定退休年龄收益

```javascript
function calculateForAge(input, retireAge, cityCfg) {
  // 模拟未来缴费
  const simulation = simulateFuturePay(input, retireAge, cityCfg);

  // 获取计发月数
  const N = N_TABLE[retireAge];

  // 计算基础养老金
  const basePension = cityCfg.avgSalary * 0.01 * simulation.totalYears;

  // 计算个人账户养老金
  const accountPension = simulation.accountBalance / N;

  // 月养老金总额
  const monthlyPension = basePension + accountPension;

  // 回本周期
  const breakEvenMonths = Math.round(simulation.totalPay / monthlyPension);

  return {
    name: getPlanName(input.personType, retireAge),
    age: retireAge,
    recommended: false,
    monthlyPension: Math.round(monthlyPension * 100) / 100,
    basePension: Math.round(basePension * 100) / 100,
    accountPension: Math.round(accountPension * 100) / 100,
    totalPayment: Math.round(simulation.totalPay / 10000 * 100) / 100,
    breakEvenMonths,
    accountAtRetire: Math.round(simulation.accountBalance * 100) / 100,
    totalYears: Math.round(simulation.totalYears * 10) / 10,
    N,
    summary: generateSummary(retireAge, monthlyPension, breakEvenMonths)
  };
}
```

---

### 4.2.4 推荐方案选择器

```javascript
function pickBestPlan(plans) {
  let best = plans[0];
  let bestScore = -Infinity;

  const baseline = plans[0];

  for (const plan of plans) {
    // 计算得分
    const pensionIncrease =
      (plan.monthlyPension - baseline.monthlyPension) / baseline.monthlyPension;
    const breakEvenImprove =
      (baseline.breakEvenMonths - plan.breakEvenMonths) / baseline.breakEvenMonths;
    const costDecrease =
      (baseline.totalPayment - plan.totalPayment) / baseline.totalPayment;

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
```

---

## 4.3 API 封装（api.js）

```javascript
const { calculatePension } = require('./pensionCalc.js');

function calcPension(data) {
  return new Promise((resolve, reject) => {
    wx.showLoading({
      title: '计算中...',
      mask: true
    });

    setTimeout(() => {
      try {
        const result = calculatePension(data);
        wx.hideLoading();
        resolve(result);
      } catch (err) {
        wx.hideLoading();
        wx.showToast({
          title: err.message || '计算失败',
          icon: 'none'
        });
        reject(err);
      }
    }, 300);
  });
}
```

---

# 5. 开发所需全部常量

### ✔ N_TABLE（国家标准）

50岁～63岁对应的计发月数。

### ✔ 城市参数（2025年北京最新）

- 退休金核算基数：12049元
- 缴费基数范围：7162 - 35811元
- 失业金标准：2286元/月
- 失业金期限：24个月
- 4050补贴：669.58元/月

### ✔ 缴费比例

- 在职个人：8%
- 灵活就业：20%（其中8%进个人账户）
- 单位缴费：16%（统筹）

### ✔ 人员类型 → 退休年龄规则

- 男职工：60岁（可延迟至63岁）
- 女干部：55岁（可延迟至58岁）
- 女工人：50岁（可延迟至55岁）

### ✔ 缴费指数 level

60% / 100% / 200% / 300%

---

# 6. 核心计算逻辑示例

## 示例：女工人，50岁退休

**输入：**
```json
{
  "personType": "女工人",
  "birthYear": 1985,
  "birthMonth": 7,
  "city": "北京",
  "employmentStatus": "在职",
  "paymentBase": 8500,
  "paidYears": 13.2,
  "accountBalance": 82300,
  "is4050": false,
  "level": 100
}
```

**计算过程：**

1. **调整缴费基数**
   - adjustedBase = 8500 * (100/100) = 8500元
   - 在范围内（7162～35811），无需调整

2. **模拟未来缴费**
   - 当前年龄：40岁（2025 - 1985）
   - 退休年龄：50岁
   - 需模拟：10年（120个月）
   - 每月缴费：8500 * 0.08 = 680元
   - 每月进账户：680元
   - 年底计息：4%

3. **计算退休时状态**
   - 总缴费年限：13.2 + 10 = 23.2年
   - 个人账户余额：约168,000元（含利息）
   - 总个人缴费：约8.16万元

4. **计算养老金**
   - 基础养老金 = 12049 * 0.01 * 23.2 = 2795元
   - 个人账户养老金 = 168000 / 195 = 862元
   - 月养老金 = 2795 + 862 = 3657元

5. **回本周期**
   - 回本月数 = 81600 / 3657 = 22个月

---

# 7. 未来可扩展性

* ✅ 多城市配置（只需在 cityConfig.js 中添加）
* ✅ 年度政策更新（修改配置文件即可）
* 📋 结果分享图片生成
* 📋 养老金增长预测（未来10年）
* 📋 历史计算记录保存（使用小程序本地存储）
* 📋 多方案对比图表（ECharts）

---

# 8. 技术栈

- **微信原生小程序**：无第三方框架
- **纯JavaScript**：ES6+
- **模块化设计**：CommonJS规范
- **配置驱动**：参数化管理

---

# 9. 性能优化

- ✅ 本地计算，毫秒级响应
- ✅ 无网络请求，无延迟
- ✅ 配置文件轻量化
- ✅ 组件按需加载

---

# 10. 数据安全

- ✅ 所有数据本地处理
- ✅ 不上传任何用户信息
- ✅ 无需用户登录
- ✅ 隐私完全保护

---

**更新日志：v2.0**
- 采用纯前端架构
- 更新2025年北京最新参数
- 优化灵活就业计算逻辑
- 完善失业金处理（24个月）
