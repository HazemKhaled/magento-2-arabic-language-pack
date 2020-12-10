<template lang="pug">
ErrorComponent(:error="error")
</template>

<script>
import Error from '@/components/Error';

export default {
  name: 'Error',
  components: {
    ErrorComponent: Error
  },
  props: {
    error: {
      type: Object
    }
  },
  mounted() {
    parent.postMessage(
    `[error]::${JSON.stringify(this.error)}`,
    '*'
  },
}
</script>