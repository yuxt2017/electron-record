<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
  export default {
    name: 'weather-app'
  }
</script>

<style>
  /* CSS */
  * {
    margin: 0;
  }
  #app {
    cursor: pointer;
  }
</style>
