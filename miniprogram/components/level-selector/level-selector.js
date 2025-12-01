Component({
  properties: {
    defaultLevel: {
      type: Number,
      value: 100
    }
  },

  data: {
    selectedLevel: 100
  },

  lifetimes: {
    attached() {
      this.setData({
        selectedLevel: this.properties.defaultLevel
      });
    }
  },

  methods: {
    selectLevel(e) {
      const level = e.currentTarget.dataset.level;
      this.setData({
        selectedLevel: level
      });

      // 触发父组件事件
      this.triggerEvent('change', { level });
    }
  }
});
