<template>
  <component
    :is="component"
    v-bind="$data"
  />
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
    error: null
  }),
  created() {
    if (!window.__INITIAL_STATE__) return;
    Object.entries(window.__INITIAL_STATE__).forEach(([key, value]) =>
      (this[key] = value)
    );
  },
}
</script>

<style lang="stylus">
@import './styles/colors.styl'

.page
  position: relative
  display: flex
  flex-direction: column
  margin: 0 auto
  max-width: 700px
  width: 100vw
  max-height: 800px
  height: 100vh
  border: 1px solid $gray
  border-radius: 8px

.page--error,
.page--success
  display: flex
  justify-content: center
  align-items: center

.page--error
  border-color: $red
.page--success
  border-color: $green
</style>