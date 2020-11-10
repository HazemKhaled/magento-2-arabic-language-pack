<template>
  <component
    :is="currentComponent"
    v-bind="$data"
  />
</template>

<script>
import Checkout from '@/views/Checkout';
import Error from '@/views/Error';

export default {
  name: 'App',
  components: { Checkout, Error },
  data: () => ({
    currentComponent: 'Error',
    store: {},
    cards: [],
    error: 'Unknown'
  }),
  created() {
    if (!window.__INITIAL_STATE__) return;
    Object.entries(window.__INITIAL_STATE__).forEach(([key, value]) =>
      (this[key] = value)
    );
  },
}
</script>
