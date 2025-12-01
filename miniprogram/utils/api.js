const { calculatePension } = require('./pensionCalc.js');

/**
 * 计算养老金方案（前端计算，无需后端）
 */
function calcPension(data) {
  return new Promise((resolve, reject) => {
    wx.showLoading({
      title: '计算中...',
      mask: true
    });

    // 使用 setTimeout 模拟异步操作，让 loading 显示出来
    setTimeout(() => {
      try {
        const result = calculatePension(data);
        wx.hideLoading();
        resolve(result);
      } catch (err) {
        wx.hideLoading();
        wx.showToast({
          title: err.message || '计算失败',
          icon: 'none',
          duration: 2000
        });
        reject(err);
      }
    }, 300);
  });
}

module.exports = {
  calcPension
};
