<template lang="pug">
.checkout
  form.checkout-form(
    name='checkoutForm',
    action='https://www.paytr.com/odeme',
    method='post',
  )
    .checkout-body
      .checkout-header
        h2 {{ $t("checkout.payWith") }}

      ul.checkout-cards-list
        template(v-if='isFetchingCards')
          li(v-for='card in 2', :key='card')
            label.checkout-card
              input(type='radio')
              CreditCardPlaceholder(:isLoading="true")

        template(v-else)
          li(v-for='card in cardsList', :key='card.ctoken')
            label.checkout-card
              input(
                type='radio',
                :id='`ctoken-${card.ctoken}`',
                name='payment_type',
                :value='card.ctoken',
                v-model='ctoken'
              )
              CreditCardPlaceholder(:cardData='card', :canDelete='false')

          li.checkout-card
            input#ctoken-none(
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

      .row
        .col-xs-12(v-if='false')
          .checkbox
            label.checkbox-label
              input.checkbox-input(type='checkbox', v-model='useSecurePayment')
              span {{ $t("checkout.secure") }}
        .col-xs-12(v-if='!ctoken')
          .checkbox
            label.checkbox-label
              input.checkbox-input(
                type='checkbox',
                name='store_card',
                v-model='saveCard'
              )
              span {{ $t("checkout.saveCard") }}
        .col-xs-12(v-if='canUseBalance')
          .checkbox
            label.checkbox-label
              input.checkbox-input(
                type='checkbox',
                name='use_balance',
                v-model='useBalance'
              )
              span {{ $t("checkout.useBalance") }} ({{ currency }}{{ balance }})

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

    .checkout-footer
      details.checkout-summary
        summary {{ $t("checkout.summary") }}
        .checkout-summary-list
          template(v-for="unit in purchaseUnites")
            .checkout-summary-description {{ unit.description }}
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
        .checkout-summary-list
          span {{ $t("checkout.total") }}
          span {{ currency }}{{ amount }}
          template(v-if='useBalance')
            span {{ $t("checkout.balanceDeduction") }}
            span -{{ currency }}{{ fixed2(usedBalance) }}

      .checkbox(v-if='!ctoken', :class='{ "has-errors": !hasAgreed && showErrors }')
        label.checkbox-label(for='termsAgree')
          input#termsAgree.checkbox-input(
            type='checkbox',
            name='terms-agree',
            v-model='hasAgreed'
          )
          span(v-html='$t("checkout.agreePrivacyPolicy")')

      dl.checkout-total
        dt {{ $t("checkout.total") }} :
        dd {{ fixed2(paymentTotal) }} {{ currency }}

      button.checkout-submit.btn.btn-block.btn-primary.btn-lg(
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

import { fixed2, round } from '../utils';

export default {
  name: 'Checkout',
  components: {
    CreditCardPlaceholder,
    CreditCard,
  },
  data: () => ({
    useSecurePayment: true,
    hasAgreed: false,
    useBalance: false,
    saveCard: true,
    isLoading: true,
    isFetchingData: true,
    isFetchingCards: true,
    submitting: false,
    showErrors: false,
    currencyRate: 1,
    currency: '',
    cardsList: [],
    ctoken: '',
    card: {},
    paytr: {},
    purchaseUnites: [],
  }),
  computed: {
    utoken() {
      return this.activeStore.external_data?.paytr?.utoken;
    },
    balance() {
      return round((this.activeStore.credit || 0) * this.currencyRate);
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
    activeStore() {
      // TODO: get current store

      return {};
    },
  },
  watch: {
    utoken: {
      handler() {
        this.listCards();
      },
      immediate: true,
    },
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
  mounted() {
    const search = window.location.search?.substring(1);
    const queryParams = qs.parse(search);

    this.purchaseUnites = queryParams['purchase_units'] || [];
    this.currency = this.purchaseUnites[0].amount.currency_code;

    this.updatePaytr();
    this.isLoading = false;
  },
  methods: {
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
        store: this.activeStore.url,
        debug: this.debug,
        gateway: 'paytr',
        status: 0,
      };

      opener?.dataLayer.push({ payment });

      // TODO: add transaction
    },
    listCards() {
      if (!this.utoken) {
        this.cardsList = [];
        this.isFetchingCards = false;
        return;
      }
      this.isFetchingCards = true;
      
      // TODO: List cards
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

.checkout-form
  display: flex
  flex-direction: column
  height: 100%

.checkout-header
  display: flex
  justify-content: space-between
  padding: 10px 20px

.checkout-body
  flex: 1
  overflow: auto
  padding: 0 20px 40px

.checkout-footer
  padding: 10px 20px
  box-shadow: 0 -15px 20px -15px alpha($gray, 0.5)

.checkout-total
  display: flex
  margin-top: 10px
  justify-content: space-between
  color: $red
  >dt
    align-self: flex-start
  >dd
    align-self: flex-end

.checkout-summary
  border: 1px solid $gray
  padding: 10px
  border-radius: 10px

.checkout-summary-list
  display: flex
  justify-content: space-between
  flex-wrap: wrap
  margin: 2px 0
  > span
    align-self: flex-start
    width: 50%

.checkout-card
  display: flex
  margin-bottom: 20px
  >input
    margin-top: 15px
  .credit-card-wrapper
    margin-bottom: 0

.checkbox.has-errors
  color: $red
  .checkbox-input
    border-color: $red

.checkout-cards-list
  margin: 0
  padding: 0
  list-style: none
  li
    display: flex
  label
    width: 100%
  .credit-card-wrapper
    margin: 0 10px
  .btn
    margin: 0 10px
    padding: 15px
    width: 100%
    border: 1px solid $gray
    border-radius: 8px
</style>
