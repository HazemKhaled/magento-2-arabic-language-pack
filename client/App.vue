<template>
  <component :is="component" ref="page" v-bind="$data" />
</template>

<script>
import Checkout from '@/views/Checkout';
import Cards from '@/views/Cards';
import Error from '@/views/Error';
import Success from '@/views/Success';

export default {
  name: 'App',
  components: { Checkout, Cards, Error, Success },
  data: () => ({
    component: 'Error',
    store: {},
    currency: {},
    cards: [],
    error: null,
  }),
  created() {
    if (!window.__INITIAL_STATE__) return;
    Object.entries(window.__INITIAL_STATE__).forEach(
      ([key, value]) => (this[key] = value)
    );
  },
  mounted() {
    const el = this.$refs.page.$el;

    el.addEventListener('resize', this.resizeCallback);
    window.addEventListener('load', this.resizeCallback);
  },
  beforeDestroy() {
    const el = this.$refs.page.$el;

    el.removeEventListener('resize', this.resizeCallback);
    window.removeEventListener('load', this.resizeCallback);
  },
  methods: {
    resizeCallback() {
      const el = this.$refs.page.$el;
      const rect = el.getBoundingClientRect();
      parent.postMessage(`[resize]::${JSON.stringify(rect)}`, '*');
    },
  },
};
</script>

<style lang="stylus">
@import './styles/colors.styl'

.page
  position: relative
  display: flex
  flex-direction: column
  margin: 0 auto
  border: 1px solid $gray
  border-radius: 8px
  min-height: 100vh
  max-width: 700px
  width: 100vw

.page--error,
.page--success
  display: flex
  justify-content: center
  align-items: center

.page--error
  border-color: $red
.page--success
  border-color: $green

.page--checkout
  max-height: 800px
</style>
