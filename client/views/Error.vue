<template lang="pug">
.page.page--error(
  :class="{'has-errors': error}"
)
  .error-image
    img(:src="errorImage")
  .error-code
    | {{ error.code }}
  .error-message
    | {{ error.message }}
</template>

<script>
export default {
  name: 'Error',
  props: {
    error: {
      type: Object
    }
  },
  computed: {
    errorImage() {
      const { code } = this.error;
      const mapper = {
        401: 'not_found',
        422: 'notify',
      }

      return `/img/${mapper[code] || 'online_payments'}.svg`
    },
  },
  mounted() {
    if (this.error) {
      console.error({ ...this.error });
    }
  },
}
</script>

<style lang="stylus">
@import '../styles/colors.styl'
// Error
.error-image
  padding: 50px
  img
    max-width: 100%

.error-code
  text-align: center
  color: $red
  font-size: 40px
  margin-bottom: 20px

.error-message
  text-align: center
</style>
