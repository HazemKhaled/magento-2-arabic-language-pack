<template lang="pug">
Error(v-if="!cards.length" :error="{ code: 404 }")
  p You don't have any payment credit cards

.page.page--cards(v-else)
  .checkout__form
    .checkout__body
      ul.checkout__cards-list
        template(v-if='isLoading')
          li(v-for='card in 2', :key='card')
            CreditCardPlaceholder(:isLoading="true")

        template(v-else)
          li(v-for='card in cards', :key='card._id')
            CreditCardPlaceholder(:cardData='card', :canDelete='true')
              AppIcon(name='plus')
</template>

<script>
import Error from '@/components/Error';
import AppIcon from '@/components/AppIcon';
import CreditCardPlaceholder from '@/components/CreditCardPlaceholder';

export default {
  name: 'Cards',
  components: {
    Error,
    AppIcon,
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
