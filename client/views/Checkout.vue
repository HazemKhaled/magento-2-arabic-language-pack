<template lang="pug">
.page.page--checkout
  .spinner(v-if='isSubmitting')
  form.checkout__form(
    name='checkoutForm',
    method='POST',
    :action='formUrl',
  )
    .checkout__body
      .checkout__header
        h2 {{ $t("checkout.payWith") }}

      ul.checkout__cards-list(v-if="!useBalanceOnly")
        template(v-if='isLoading')
          li(v-for='card in 2', :key='card')
            label.checkout__card
              input.checkout__card-input(type='radio')
              CreditCardPlaceholder(:isLoading='true')

        template(v-else)
          li(v-for='card in cards', :key='card._id')
            label.checkout__card
              input.checkout__card-input(
                type='radio',
                :id='`cardId-${card._id}`',
                name='payment_type',
                :value='card._id',
                v-model='cardId'
              )
              CreditCardPlaceholder(:cardData='card', :canDelete='false')

          li.checkout__card
            input.checkout__card-input(
              type='radio',
              name='payment_type',
              value='',
              v-model='cardId',
              @change='handleCardFocus'
            )
            template(v-if='cardId')
              button.button(@click='cardId = ""')
                AppIcon(name='plus')
                | {{ $t("checkout.useNewCreditCard") }}
            template(v-else)
              CreditCard(ref='creditCard', v-model='card')

      .row(v-if='false')
        .checkbox
          label.checkbox__label
            input.checkbox__input(
              type='checkbox',
              name='non_3d',
              :value='!useSecurePayment',
              @input='e => (useSecurePayment = e.target.value)'
            )
            span {{ $t("checkout.secure") }}

      .row(v-if='!cardId && !useBalanceOnly')
        .checkbox
          label.checkbox__label
            input.checkbox__input(
              type='checkbox',
              name='store_card',
              :value="1"
              v-model='saveCard'
            )
            span {{ $t("checkout.saveCard") }}

      .row(v-if='canUseBalance')
        .checkbox
          label.checkbox__label
            input.checkbox__input(
              type='checkbox',
              name='use_balance',
              v-model='useBalance'
            )
            span.checkbox__label
              | {{ $t("checkout.useBalance") }} ({{ fixed2(balance * currency.rate) }} {{ currency.currencyCode }})

      .row(v-if='useBalanceOnly')
        .checkout__alert
           | {{ $t("checkout.useBalanceOnly__alert") }}

      //- Form data
      .row(v-show='false')
        input(name='balance_only', type="number", :value='useBalanceOnly ? 1 : 0')
        input(name='is_new', type="number", :value='!cardId ? 1 : 0')
        input(name='card_id', type="text", :value='cardId')
        input(v-for="[key, value] in Object.entries(card)", :name="key", :value="value")

    .checkout__footer
      details.checkout__summary
        summary {{ $t("checkout.summary") }}
        template(v-for='unit in purchaseUnites')
          .checkout__summary-description(v-if='unit.description')
            | {{ unit.description }}
          .checkout__summary-list
            template(v-if='unit.type === "order"')
              span
                | {{ $t("checkout.orderId") }}:
                b {{ unit.data.externalId }}
              span {{ unit.amount.value }} {{ unit.amount.currency_code }}

            template(v-if='unit.type === "subscription"')
              span {{ $t("membership.plan") }} :
              span {{ unit.data.name }}
              span {{ $t("membership.storeId") }} :
              span {{ unit.data.grantTo || unit.data.storeId }}

            template(v-if='unit.type === "charge"')
              span {{ $t("checkout.charge") }}
              span {{ unit.amount.value }} {{ unit.amount.currency_code }}
        hr
        .checkout__summary-list
          span {{ $t("checkout.total") }}
          span {{ fixed2(amount * currency.rate) }} {{ currency.currencyCode }}
        .checkout__summary-list(v-if='useBalance')
          span {{ $t("checkout.balanceDeduction") }}
          span -{{ fixed2(usedBalance * currency.rate) }} {{ currency.currencyCode }}

      .checkbox(:class='{ "checkbox--errors": !hasAgreed && showErrors }')
        label.checkbox__label(for='termsAgree')
          input#termsAgree.checkbox__input(
            type='checkbox',
            name='terms-agree',
            v-model='hasAgreed'
          )
          span(v-html='$t("checkout.agreePrivacyPolicy")')

      dl.checkout__total
        dt {{ $t("checkout.total") }} :
        dd {{ fixed2(paymentTotal * currency.rate) }} {{ currency.currencyCode }}

      button.button.button--primary.button--block.checkout__submit(
        type='submit',
        :disable='isSubmitting',
        @click='handleFormSubmit'
      )
        template(v-if='!paymentTotal')
          | {{ $t("checkout.confirm") }}
        template(v-else)
          | {{ $t("checkout.payNow") }}
</template>

<script>
import qs from 'qs';
import CreditCardPlaceholder from '@/components/CreditCardPlaceholder';
import CreditCard from '@/components/CreditCard';
import AppIcon from '@/components/AppIcon';

import { fixed2 } from '../utils';

export default {
  name: 'Checkout',
  components: {
    CreditCardPlaceholder,
    CreditCard,
    AppIcon,
  },
  props: {
    cards: {
      type: Array,
      default: () => [],
    },
    store: {
      type: Object,
      default: () => ({}),
    },
    currency: {
      type: Object,
      default: () => ({
        currencyCode: 'USD',
        rate: 1,
      }),
    },
  },
  data: () => ({
    useSecurePayment: true,
    hasAgreed: false,
    useBalance: false,
    saveCard: true,
    isLoading: true,
    isSubmitting: false,
    showErrors: false,
    cardId: '',
    card: {},

    // Will get it from query params
    purchaseUnites: [],
  }),
  computed: {
    balance() {
      return this.store.credit || 0;
    },
    canUseBalance() {
      // Can use balance only if there's no any charge unit
      if (this.purchaseUnites.some(({ type }) => type === 'charge')) {
        return false;
      }

      return this.balance > 0;
    },
    usedBalance() {
      return this.useBalance ? Math.min(this.balance, this.amount) : 0;
    },
    useBalanceOnly() {
      return this.useBalance && !this.paymentTotal;
    },
    formUrl() {
      const { origin, search } = window.location;
      return `${origin}/api/paymentGateway/checkout${search}`;
    },
    amount() {
      return this.purchaseUnites.reduce((acc, crr) => {
        acc += Number(crr.amount.value);
        return acc;
      }, 0);
    },
    paymentTotal() {
      return this.amount - this.usedBalance;
    },
    subscriptionDisclaimer() {
      const subscription = this.purchaseUnites.find(
        ({ type }) => type === 'subscription'
      );
      if (!subscription) return '';

      const { frequencyType, originalPrice } = subscription;
      const { currencyCode, rate } = this.currency;

      return this.$t('checkout.subscriptionDisclaimer', {
        currentPrice: `${currencyCode}${fixed2(this.paymentTotal * rate)}`,
        frequency: this.$t(`checkout.paymentType__${frequencyType}`),
        originalPrice: `${currencyCode}${fixed2(originalPrice * rate)}`,
      });
    },
  },
  watch: {
    cardId(val) {
      this.useSecurePayment = true;
      if (!val) {
        this.$nextTick(this.handleCardFocus);
      }
    },
  },
  mounted() {
    const search = window.location.search?.substring(1);
    const queryParams = qs.parse(search);

    this.purchaseUnites = queryParams.purchase_units || [];
    this.useBalance = this.canUseBalance;

    if (this.cards?.length) {
      this.cardId = this.cards[0]?._id;
    }

    this.$nextTick(() => (this.isLoading = false));
  },
  methods: {
    handleFormSubmit(event) {
      // If from already submitted do nothing
      if (this.isSubmitting) {
        event.preventDefault();
        return;
      }

      // Handle paying from a new card
      if (!this.cardId && !this.useBalanceOnly) {
        // Validate the card data
        this.$refs.creditCard.validateAll();
        if (!this.$refs.creditCard.errors.length) {
          this.showErrors = true;
          event.preventDefault();
          return;
        }
      }

      // check if agreed to terms and conditions
      if (!this.hasAgreed) {
        this.showErrors = true;
        event.preventDefault();
        return;
      }
      this.isSubmitting = true;
    },
    handleCardFocus() {
      this.$refs.creditCard?.$el.scrollIntoView({ behavior: 'smooth' });
    },
    fixed2,
  },
};
</script>

<style lang="stylus">
@import '../styles/colors.styl'

.checkout__form
  display: flex
  flex-direction: column
  flex: 1
  height: 100%

.checkout__alert
  padding: 10px 20px
  border-radius: 8px
  border: 1px solid $slategray
  color: $dark
  margin: 20px 0

.checkout__header
  display: flex
  justify-content: space-between
  margin-bottom: 20px
  h2
    margin: 0

.checkout__body
  flex: 1
  overflow: auto
  padding: 20px

.checkout__footer
  padding: 20px
  box-shadow: 0 -15px 20px -15px $color-shadow

.checkout__total
  display: flex
  justify-content: space-between
  margin-top: 10px
  color: $red
  >dt
    align-self: flex-start
  >dd
    align-self: flex-end

.checkout__summary
  padding: 10px
  border: 1px solid $gray
  border-radius: 10px

.checkout__summary-list
  display: flex
  flex-wrap: wrap
  justify-content: space-between
  margin: 2px 0

.checkout__card
  display: flex
  margin-bottom: 20px

.checkout__card-input,
.checkbox__input
  margin: 0
  margin-inline-end: 10px

.checkout__card-input
  margin-top: 10px

.checkbox--errors
  color: $red
  .checkbox__input
    border-color: $red

.checkout__cards-list
  margin: 0
  padding: 0
  list-style: none
  li
    display: flex
  label
    width: 100%
  .button
    padding: 15px 10px
    width: 100%
    border: 1px solid $gray
    border-radius: 8px
    background-color: $gray
    color: $dark

// Errors
.checkout-errors-image
  padding: 50px
  img
    max-width: 100%

.checkout-errors-code
  margin-bottom: 20px
  color: $red
  text-align: center
  font-size: 40px

.checkout-errors-message
  text-align: center
</style>
