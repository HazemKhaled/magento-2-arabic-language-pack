<template lang="pug">
.checkout
  .spinner(v-if="isSubmitting")
  form.checkout__form(
    name='checkoutForm',
    @submit.prevent="handleFormSubmit"
  )
    .checkout__body
      .checkout__header
        h2 {{ $t("checkout.payWith") }}

      ul.checkout__cards-list
        template(v-if='isLoading')
          li(v-for='card in 2', :key='card')
            label.checkout__card
              input.checkout__card-input(type='radio')
              CreditCardPlaceholder(:isLoading="true")

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
              button.btn(@click='cardId = ""')
                AppIcon(name='plus')
                | {{ $t("checkout.useNewCreditCard") }}
            template(v-else)
              CreditCard(ref='creditCard', v-model='card')

      .row(v-if='false')
        .checkbox
          label.checkbox__label
            input.checkbox__input(type='checkbox', v-model='useSecurePayment')
            span {{ $t("checkout.secure") }}

      .row(v-if='!cardId')
        .checkbox
          label.checkbox__label
            input.checkbox__input(
              type='checkbox',
              name='store_card',
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
              | {{ $t("checkout.useBalance") }} ({{ currency }} {{ balance }})

    .checkout__footer
      details.checkout__summary
        summary {{ $t("checkout.summary") }}
        .checkout__summary-list
          template(v-for="unit in purchaseUnites")
            .checkout__summary-description {{ unit.description }}
            template(v-if='unit.type === "order"')
              span {{ $t("checkout.orderId") }}
              span {{ unit.data.order }}

            template(v-if='unit.type === "subscription"')
              span {{ $t("membership.plan") }} :
              span {{ unit.data.name }}
              span {{ $t("membership.storeId") }} :
              span {{ unit.data.grantTo || unit.data.storeId }}

            template(v-if='unit.type === "charge"')
              span {{ $t("checkout.charge") }}
              span {{ unit.currency_code }}{{ unit.value }}
        hr
        .checkout__summary-list
          span {{ $t("checkout.total") }}
          span {{ currency }}{{ amount }}
          template(v-if='useBalance')
            span {{ $t("checkout.balanceDeduction") }}
            span -{{ currency }}{{ fixed2(usedBalance) }}

      .checkbox(v-if='!cardId', :class='{ "checkbox--errors": !hasAgreed && showErrors }')
        label.checkbox__label(for='termsAgree')
          input#termsAgree.checkbox__input(
            type='checkbox',
            name='terms-agree',
            v-model='hasAgreed'
          )
          span(v-html='$t("checkout.agreePrivacyPolicy")')

      dl.checkout__total
        dt {{ $t("checkout.total") }} :
        dd {{ fixed2(paymentTotal) }} {{ currency }}

      button.button.button--primary.button--block.checkout__submit(
        type='submit',
        :disable='isSubmitting'
      )
        template(v-if='useBalanceOnly')
          | {{ $t("checkout.confirm") }}
        template(v-else)
          | {{ $t("checkout.payNow") }}
</template>

<script>
import qs from 'qs';
import CreditCardPlaceholder from '@/components/CreditCardPlaceholder';
import CreditCard from '@/components/CreditCard';
import AppIcon from '@/components/AppIcon';

import { fixed2, round } from '../utils';
import { isArray } from 'util';

export default {
  name: 'Checkout',
  components: {
    CreditCardPlaceholder,
    CreditCard,
    AppIcon,
  },
  data: () => ({
    useSecurePayment: true,
    hasAgreed: false,
    useBalance: false,
    saveCard: true,
    isLoading: true,
    isSubmitting: false,
    showErrors: false,
    currencyRate: 1,
    currency: '',
    cardId: '',
    card: {},

    // Will get it from query params
    purchaseUnites: [],

    // Will fetched from the server
    cards: [],
    store: {},
  }),
  computed: {
    balance() {
      return round((this.store.credit || 0) * this.currencyRate);
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
      return !this.paymentTotal;
    },
    amount() {
      return this.purchaseUnites.reduce((acc, crr) => {
        acc += Number(crr.amount.value);
        return acc;
      }, 0)
    },
    paymentTotal() {
      return this.amount - this.usedBalance;
    },
    subscriptionDisclaimer() {
      const subscription = this.purchaseUnites.find(({ type }) => type === 'subscription');
      if (!subscription) return '';

      const { frequencyType, originalPrice } = subscription;

      return this.$t('checkout.subscriptionDisclaimer', {
        currentPrice: `${this.currency}${fixed2(this.paymentTotal)}`,
        frequency: this.$t(`checkout.paymentType__${frequencyType}`),
        originalPrice: `${this.currency}${fixed2(originalPrice)}`,
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
  created() {
    this.fetchInitialState();
  },
  mounted() {
    const search = window.location.search?.substring(1);
    const queryParams = qs.parse(search);

    this.purchaseUnites = queryParams['purchase_units'] || [];
    this.currency = this.purchaseUnites[0].amount.currency_code;
    this.useBalance = this.canUseBalance

    this.$nextTick(() => (this.isLoading = false));
  },
  methods: {
    fetchInitialState() {
      if (!window.__INITIAL_STATE__) return;
      Object.entries(window.__INITIAL_STATE__).forEach(([key, value]) =>
        (this[key] = value)
      );

      if (this.cards.length) {
        this.cardId = this.cards[0]?._id;
      }
    },
    handleFormSubmit(event) {
      // If from already submitted do nothing
      if (this.isSubmitting) return;

      // Handle paying from balance
      // If there is no remaining payment return
      if (this.useBalanceOnly) {
        return this.handlePayingFromBalance();
      }

      // Handle paying from a new card
      if (!this.cardId) {
        // Validate the card data
        this.$refs.creditCard.validateAll();

        // check if agreed to terms and conditions
        if (!this.hasAgreed || this.$refs.creditCard.errors.length) {
          this.showErrors = true;
          return;
        }
      }

      // Submit the form
      this.handlePayment();
      this.isSubmitting = true;
    },
    handleCardFocus() {
      this.$refs.creditCard?.$el.scrollIntoView({ behavior: 'smooth' });
    },
    handlePayingFromBalance() {
      this.isSubmitting = true;

      // TODO: handle paying purchase_units

      // TODO: handle payment fail
    },
    handlePayment() {
      const { origin, search } = window.location;
      const url = `${origin}/api/paymentGateway/checkout${search}`;

      const payload = {
        card: !this.cardId ?
          {
            isNew: true,
            store_card: this.saveCard ? 1 : 0,
            ...this.card,
          } : {
            isNew: false,
            id: this.cardId,
          },
      };

      return fetch(url, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json'
        }
      })
        .then(res => res.json())
        .then(() => {
          // TODO
        })
        .finally(() => (this.isSubmitting = false))
    },
    fixed2,
  },
}
</script>

<style lang="stylus">
@import '../styles/colors.styl'

.checkout
  position: relative
  display: flex
  flex-direction: column
  margin: 0 auto
  max-width: 500px
  max-height: 100vh
  height: 650px
  border: 1px solid $gray
  border-radius: 8px

.checkout__form
  display: flex
  flex-direction: column
  height: 100%

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
  margin-top: 10px
  justify-content: space-between
  color: $red
  >dt
    align-self: flex-start
  >dd
    align-self: flex-end

.checkout__summary
  border: 1px solid $gray
  padding: 10px
  border-radius: 10px

.checkout__summary-list
  display: flex
  justify-content: space-between
  flex-wrap: wrap
  margin: 2px 0
  > span
    align-self: flex-start
    width: 50%

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
  .btn
    padding: 10px
    width: 100%
    border: 1px solid $gray
    background-color: $gray
    color: $dark
    border-radius: 8px
</style>
