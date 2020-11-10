<template lang="pug">
.cc__wrapper
  template(v-if='isLoading')
    .cc__data
      .text-loader(v-for='n in 3', :key='n')

  template(v-else)
    .cc__data
      button.cc__delete(
        v-if='canDelete',
        @click='handleCardDelete'
      )
        AppIcon(name='delete')
        | {{ $t("checkout.delete") }}

      svg.cc_icon(focusable='false', viewBox='0 0 576 512')
        path(:d='currentIcon')
      .cc__number
        span {{ cNumber }}
      .cc__text
        | {{ $t('checkout.expires') }}:  {{ expires }}
      .cc__title
        | {{ cardData.title }}
</template>

<script>
import AppIcon from '@/components/AppIcon';
import icons from '../icons.ts';

export default {
  name: 'CreditCardPlaceholder',
  components: {
    AppIcon
  },
  props: {
    cardData: {
      type: Object,
      default: () => ({}),
    },
    canDelete: {
      type: Boolean,
      default: false,
    },
    isLoading: {
      type: Boolean,
    },
  },
  computed: {
    cNumber() {
      return `${'*'.repeat(4)} `.repeat(3) + this.cardData.last_4;
    },
    currentIcon() {
      return icons[this.cardData.brand] || icons['unknown'];
    },
    expires() {
      const { exp_month, exp_year } = this.cardData;
      return `${exp_month.toString().padStart(2, '0') }/${ exp_year }`
    }
  },
  methods: {
    handleCardDelete() {
      // TODO:
    }
  }
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

.cc_icon
  position: absolute
  bottom: 15px
  right: 15px
  width: 20px
  color: $dark

.cc__delete
  position: absolute
  top: 15px
  right: 15px
  height: 20px
  border: 0
  background-color: transparent
  color: $red
</style>
