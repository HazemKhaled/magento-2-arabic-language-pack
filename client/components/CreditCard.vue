<template lang="pug">
form.vc-card(novalidate, autocomplete='on')
  .vc-row
    .vc-column
      .vc-number-wrapper
        input.vc-number(
          name='cc-number',
          :class='{ "has-errors": errors.includes("cardNumber") }',
          @blur='dirtyFields.cardNumber = true',
          v-model='number',
          ref='cardNumber',
          :placeholder='$t("checkout.cardNumber")',
          pattern='\d*',
          x-autocompletetype='cc-number',
          required
        )
        svg.vc-icon(focusable='false', viewBox='0 0 576 512')
          path(:d='currentIcon')
  .vc-row
    .vc-column
      input.vc-name(
        name='cc-name',
        :class='{ "has-errors": errors.includes("cardName") }',
        v-model='name',
        @blur='dirtyFields.cardName = true',
        :placeholder='$t("checkout.cardName")',
        x-autocompletetype='cc-name',
        required
      )
  .vc-row
    .vc-column
      input.vc-expiry(
        name='cc-expiry',
        :class='{ "has-errors": errors.includes("expiry") }',
        @blur='dirtyFields.expiry = true',
        v-model='expiry',
        ref='cardExpiry',
        :placeholder='$t("checkout.expiry")',
        size='5',
        maxlength='9',
        x-autocompletetype='cc-exp',
        required
      )
    .vc-column
      input.vc-cvc(
        name='cc-cvc',
        :class='{ "has-errors": errors.includes("cvc") }',
        @blur='dirtyFields.cvc = true',
        v-model='cvc',
        ref='cardCVC',
        :placeholder='$t("checkout.cvc")',
        size='5',
        x-autocompletetype='cc-csc',
        required,
        autocomplete='off'
      )
  .vc-row(v-if='errors.length')
    .vc-column
      span.vc-errors
        | {{ $t("checkout.errors") }}
</template>

<script>
import Payment from 'payment';

import icons from '../icons.ts';

export default {
  name: 'CreditCard',
  props: {
    value: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      number: '',
      name: '',
      expiry: '',
      cvc: '',
      type: 'unknown',
      dirtyFields: {
        cardNumber: false,
        cardName: false,
        expiry: false,
        cvc: false,
      },
      invalidFields: [],
    };
  },
  computed: {
    currentIcon() {
      return icons[this.type] || icons.unknown;
    },
    card() {
      const [month = '', year = ''] = this.expiry.split('/');
      return {
        card_number: this.number.replace(/\s/g, ''),
        cc_owner: this.name,
        expiry_month: month.trim(),
        expiry_year: year.trim(),
        cvv: this.cvc,
      };
    },
    errors() {
      return this.invalidFields.filter(field => this.dirtyFields[field]);
    },
  },
  watch: {
    number(val) {
      this.type = Payment.fns.cardType(val) || 'unknown';
      this.validate(this.number, 'cardNumber', Payment.fns.validateCardNumber);
    },
    name() {
      this.validate(this.name, 'cardName', val => val.length >= 3);
    },
    expiry() {
      this.validate(this.expiry, 'expiry', Payment.fns.validateCardExpiry);
    },
    cvc() {
      this.validate(this.cvc, 'cvc', Payment.fns.validateCardCVC);
    },
    card() {
      this.$emit('input', this.card);
    },
  },
  mounted() {
    Payment.formatCardNumber(this.$refs.cardNumber);
    Payment.formatCardExpiry(this.$refs.cardExpiry);
    Payment.formatCardCVC(this.$refs.cardCVC);
  },
  methods: {
    submit() {
      this.$emit('checkout');
    },
    validate(val, name, method) {
      const isValid = val && method(val);
      const inErrors = this.invalidFields.includes(name);

      if ((!isValid && inErrors) || (isValid && !inErrors)) {
        return;
      }
      if (!isValid) {
        this.invalidFields.push(name);
        return;
      }
      if (isValid) {
        this.invalidFields.splice(this.invalidFields.indexOf(name), 1);
      }
    },
    validateAll() {
      Object.keys(this.dirtyFields).forEach(
        key => (this.dirtyFields[key] = true)
      );
      this.validate(this.number, 'cardNumber', Payment.fns.validateCardNumber);
      this.validate(this.name, 'cardName', val => Boolean(val.length));
      this.validate(this.expiry, 'expiry', Payment.fns.validateCardExpiry);
      this.validate(this.cvc, 'cvc', Payment.fns.validateCardCVC);
    },
  },
};
</script>

<style lang="stylus">
@import '../styles/colors.styl'

.vc-card
  position: relative
  display: flex
  flex-direction: column
  margin-bottom: 10px
  padding: 20px
  border: 1px solid $gray
  border-radius: 8px
  background-color: $white
  width: 100%

.vc-close
  position: absolute
  top: 0
  right: 0
  padding: 0
  width: 30px
  height: 30px
  border: 0
  border-radius: 50%
  background-color: $dark
  transform: translate(10px, -10px)
  fill: $white

.vc-number,
.vc-name,
.vc-expiry,
.vc-cvc
  display: inline-block
  padding: 10px 20px
  width: 100%
  border: 1px solid $light
  border-radius: 6px
  box-shadow: 0 0 5px $color-shadow
  direction: ltr
  .rtls &
    text-align: right

.vc-expiry,
.vc-cvc
  min-width: 110px

.vc-number,
.vc-name
  min-width: 220px

.vc-number-wrapper
  position: relative

.vc-number
  &:not(.identified) + .vc-icon
    fill: $gray
  &:focus + .vc-icon
    fill: $dark

.vc-icon
  position: absolute
  top: 50%
  right: 15px
  width: 20px
  height: 20px
  transform: translateY(-50%)
  fill: $dark
  .rtls &
    right: auto
    left: 15px

.vc-row
  position: relative
  display: flex
  flex-wrap: wrap

.vc-column
  flex: 1
  padding: 5px

.vc-column-2
  flex: 2

.vc-errors
  color: $red

.has-errors
  border-color: $red
</style>
