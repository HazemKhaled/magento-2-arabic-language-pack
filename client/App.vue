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

export default {
  name: 'App',
  components: { Checkout, Cards, Error },
  data: () => ({
    component: 'Error',
    store: {},
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
