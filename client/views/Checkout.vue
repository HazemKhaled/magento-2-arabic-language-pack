<template lang="pug">
.checkout
  form.checkout__form(
    name='checkoutForm',
    action='https://www.paytr.com/odeme',
    method='post',
  )
    .checkout__body
      .checkout__header
        h2 {{ $t("checkout.payWith") }}

      ul.checkout__cards-list
        template(v-if='isFetchingCards')
          li(v-for='card in 2', :key='card')
            label.checkout__card
              input.checkout__card-input(type='radio')
              CreditCardPlaceholder(:isLoading="true")

        template(v-else)
          li(v-for='card in cards', :key='card.payload.ctoken')
            label.checkout__card
              input.checkout__card-input(
                type='radio',
                :id='`ctoken-${card.payload.ctoken}`',
                name='payment_type',
                :value='card.payload.ctoken',
                v-model='ctoken'
              )
              CreditCardPlaceholder(:cardData='card', :canDelete='false')

          li.checkout__card
            input.checkout__card-input(
              type='radio',
              name='payment_type',
              value='',
              v-model='ctoken',
              @change='handleCardFocus'
            )
            template(v-if='ctoken')
              button.btn(@click='ctoken = ""')
                AppIcon(name='plus')
                | {{ $t("checkout.useNewCreditCard") }}
            template(v-else)
              CreditCard(ref='creditCard', v-model='card')

      .row(v-if='false')
        .checkbox
          label.checkbox__label
            input.checkbox__input(type='checkbox', v-model='useSecurePayment')
            span {{ $t("checkout.secure") }}

      .row(v-if='!ctoken')
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

        template(v-if='paytr')
          input(
            type='hidden',
            v-for='[name, value] in Object.entries(paytr)',
            :name='name',
            :value='value'
          )
        template(v-if='card')
          input(
            type='hidden',
            v-for='[name, value] in Object.entries(card)',
            :name='name',
            :value='value'
          )
        template(v-if='ctoken')
          input(type='hidden', name='ctoken', :value='ctoken')

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

      .checkbox(v-if='!ctoken', :class='{ "checkbox--errors": !hasAgreed && showErrors }')
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
        :class='{ "is-loading": submitting }',
        :disable='isFetchingData || submitting'
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
    isFetchingData: true,
    isFetchingCards: false,
    submitting: false,
    showErrors: false,
    currencyRate: 1,
    currency: '',
    ctoken: '',
    card: {},
    paytr: {},
    purchaseUnites: [],
    cards: [],
    store: {},
  }),
  computed: {
    utoken() {
      return this.store.external_data?.paytr?.utoken;
    },
    balance() {
      return round((this.store.credit || 0) * this.currencyRate);
    },
    canUseBalance() {
      // TODO: handle charging balance
      return this.balance;
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
    paytrParams() {
      return {
        amount: this.paymentTotal,
        purchase_units: this.purchaseUnits,
        useSecurePayment: this.useSecurePayment,
        gateway: 'paytr',
      };
    },
  },
  watch: {
    canUseBalance: {
      handler(val) {
        this.useBalance = val;
      },
      immediate: true,
    },
    ctoken(val) {
      this.useSecurePayment = true;
      if (!val) {
        this.$nextTick(this.handleCardFocus);
      }
    },
    paytrParams() {
      this.updatePaytr();
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

    this.updatePaytr();
    this.isLoading = false;
  },
  methods: {
    fetchInitialState() {
      if (!window.__INITIAL_STATE__) return;
      Object.entries(window.__INITIAL_STATE__).forEach(([key, value]) =>
        (this[key] = value)
      );

      if (this.cards.length) {
        this.ctoken = this.cards[0]?.payload.ctoken;
      }
    },
    updatePaytr() {
      this.isFetchingData = true;
      const params = this.paytrParams;
      // TODO: get paytr params
    },
    handleFormSubmit(event) {
      // If from already submitted do nothing
      if (this.submitting) {
        return event.preventDefault();
      }

      // Handle paying from balance
      // If there is no remaining payment return
      if (this.useBalanceOnly) {
        this.handlePayingFromBalance();
        return event.preventDefault();
      }

      // Handle paying from a new card
      if (!this.ctoken) {
        // Validate the card data
        this.$refs.creditCard.validateAll();

        // check if agreed to terms and conditions
        if (!this.hasAgreed || this.$refs.creditCard.errors.length) {
          this.showErrors = true;
          return event.preventDefault();
        }
      }

      // Submit the form
      this.storePayment();
      this.submitting = true;
    },
    handleCardFocus() {
      this.$refs.creditCard?.$el.scrollIntoView({ behavior: 'smooth' });
    },
    handlePayingFromBalance() {
      this.submitting = true;

      // TODO: handle paying purchase_units

      // TODO: handle payment fail
    },
    storePayment() {
      // Save transaction reference
      const payment = {
        id: this.paytr.merchant_oid,
        requestDateTime: new Date().toISOString(),
        amount: this.paymentTotal,
        purchase_units: this.purchaseUnits,
        store: this.store.url,
        debug: this.debug,
        gateway: 'paytr',
        status: 0,
      };

      opener?.dataLayer.push({ payment });

      // TODO: add transaction
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
