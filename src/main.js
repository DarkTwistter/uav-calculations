import Vue from 'vue'
import VueIziToast from "vue-izitoast";
import App from './App.vue'

import "izitoast/dist/css/iziToast.css";

Vue.use(VueIziToast);

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
