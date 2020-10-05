import Vue from 'vue';

import App from './App.vue';
import i18n from './plugins/vue-i18n';

import './styles/main.styl';
// eslint-disable-next-line no-new
new Vue({
  el: '#app',
  i18n,
  components: { App },
  render: h => h('app'),
});
