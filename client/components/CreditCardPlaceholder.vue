<template lang="pug">
.cc__wrapper
  template(v-if='isLoading')
    .cc__data
      .text-loader(v-for='n in 3', :key='n')

  template(v-else)
    .cc__data
      .cc__number
        span {{ cNumber }}
      .cc__text
        | {{ $t('checkout.expires') }}: {{ cardData.expires }}
      .cc__title
        | {{ cardData.title }}
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
  },
  computed: {
    cNumber() {
      return this.cardData.number || `${'*'.repeat(4)} `.repeat(4);
    },
  },
};
</script>

<style lang="stylus">
@import '../styles/colors.styl'

.cc__wrapper
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

.cc__data
  width: 100%
  display: flex
  flex-direction column

.cc__number
  font-size: 16px
  font-weight: bold
  line-height: 1.5
  letter-spacing: 0.1em
  margin-bottom: 10px
  text-align: center

.cc__title
.cc__text
  font-size: 12px
  line-height: 1.5
  text-transform: uppercase
</style>
