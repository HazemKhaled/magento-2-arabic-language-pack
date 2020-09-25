<template lang="pug">
  <div>
    <h1>{{ title }}</h1>
    <h2>{{ subTitle }}</h2>
  </div>
</template>

<script>
  export default {
    data() {
      return {
        title: "Hello Webpack!!",
        subTitle: "Hello Moleculer!"
      }
    }
  }
</script>

<style>
body {
  background: red;
}
</style>