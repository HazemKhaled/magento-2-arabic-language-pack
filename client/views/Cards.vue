<template lang="pug">
.page.page--cards
  .checkout__form
    .checkout__body
      ul.checkout__cards-list
        template(v-if='isLoading')
          li(v-for='card in 2', :key='card')
            CreditCardPlaceholder(:isLoading="true")

        template(v-else)
          li(v-for='card in cards', :key='card._id')
            CreditCardPlaceholder(:cardData='card', :canDelete='true')
</template>

<script>
import CreditCardPlaceholder from '@/components/CreditCardPlaceholder';

export default {
  name: 'Cards',
  components: {
    CreditCardPlaceholder,
  },
  props: {
    cards: {
      type: Array,
      default: () => [],
    },
  },
  data: () => ({
    isLoading: false,
  }),
  mounted() {
    this.$nextTick(() => (this.isLoading = false));
  },
}
</script>
