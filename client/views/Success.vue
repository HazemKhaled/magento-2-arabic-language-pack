<template lang="pug">
.page.page--success
  .success-image
    img(src="/img/online_payments.svg")
  slot
    .success-message
      | {{ error.message }}
</template>

<script>
export default {
  name: 'Success',
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
