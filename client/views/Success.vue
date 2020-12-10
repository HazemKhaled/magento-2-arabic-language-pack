<template lang="pug">
.page.page--success
  .success-image
    img(src="/img/online_payments.svg")
  slot
    .success-message
      | {{ $t('toastr.payment__success') }}
</template>

<script>
export default {
  name: 'Success',
  mounted() {
    parent.postMessage(
    `[success]::${JSON.stringify({message: this.$t('toastr.payment__success') })}`,
    '*'
  );
  }
}
</script>


<style lang="stylus">
@import '../styles/colors.styl'
// Error
.success-image
  padding: 50px
  img
    width: 100%
    max-width: 300px

.success-message
  text-align: center
</style>
