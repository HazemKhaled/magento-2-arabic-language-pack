<template lang="pug">
.credit-card-wrapper
  template(v-if='isLoading')
    .credit-card-data
      .text-loader(v-for='n in 3', :key='n')

  template(v-else)
    .credit-card-data
      .credit-card-number
        span {{ cNumber }}
      .credit-card-text
        | {{ $t('checkout.expires') }}: {{ cardData.month }} / {{ cardData.year }}
      .credit-card-name
        | {{ cardData.c_name }}
    button.btn.credit-card-delete(v-if='canDelete', @click='deleteCard')
      AppIcon(name='delete')
</template>

<script>
export default {
  name: 'CreditCardPlaceholder',
  props: {
    cardData: {
      type: Object,
      default: () => ({}),
    },
    isLoading: {
      type: Boolean,
    },
    canDelete: {
      type: Boolean,
      default: true,
    },
  },
  computed: {
    cNumber() {
      return `${'*'.repeat(4)} `.repeat(3) + this.cardData.last_4;
    },
  },
  methods: {
    deleteCard() {
      this.$emit('delete');
    },
  },
};
</script>

<style lang="stylus">
@import '../styles/colors.styl'

.credit-card-wrapper
  position: relative
  flex: 1
  margin: 0 0 10px
  padding: 15px
  width: 100%
  border: 1px solid $gray
  border-radius: 8px
  color: $dark
  display: flex
  justify-content: space-between
  align-items: flex-start

.credit-card-data
  width: 100%
  display: flex
  flex-direction column

.credit-card-number
  font-size: 16px
  font-weight: bold
  line-height: 1.5
  letter-spacing: 0.1em
  margin-bottom: 10px
  text-align: center

.credit-card-name
.credit-card-text
  font-size: 12px
  line-height: 1.5
  text-transform: uppercase

.credit-card-delete
  background-color: transparent
  padding: 0
  &:hover
    color: $red
</style>
