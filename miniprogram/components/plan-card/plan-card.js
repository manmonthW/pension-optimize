Component({
  properties: {
    plan: {
      type: Object,
      value: {}
    }
  },

  methods: {
    onTap() {
      this.triggerEvent('tap', { plan: this.properties.plan });
    }
  }
});
