<template>
  <section class="CustomScroll" ref="scroll">
    <div class="scrollbar">
      <div class="track">
        <div class="thumb">
          <div class="end"></div>
        </div>
      </div>
    </div>
    <div class="viewport">
      <div class="overview">
        <slot></slot>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import Tinyscrollbar from '../../';

@Component
export default class CustomScroll extends Vue {
  private mounted() {
    const $scrollbar = this.$refs.scroll as HTMLElement;
    if ($scrollbar) {
      const scrollbar = new Tinyscrollbar($scrollbar);
    }
  }
}
</script>

<style lang="scss">
  $width: 4px;

  .CustomScroll {
    position: relative;
    width: 100%;
    
    .viewport {
      height: 100%;
      overflow: hidden;
      position: relative;
    }
    .overview {
      list-style: none;
      position: relative;
      left: 0;
      top: 0;
      padding: 0;
      margin: 0;
    }
    .scrollbar {
      position: absolute;
      top: 0 !important;
      right: 0;
      width: $width;
      height: 100%;
      background-color: #e6e6e6;
      border-radius: 5px;
      user-select: none;
    }
    .track {
      height: 100%;
      width: $width;
      position: relative;
      padding: 0 1px;
    }
    .thumb {
      position: absolute;
      top: 0;
      left: 0px;
      width: $width;
      height: 20px;
      overflow: hidden;
      background-color: #a7a7a7;
      border-radius: 5px;
      cursor: pointer;
      z-index: 5000;
    }
    .thumb .end {
      width: $width;
      height: 5px;
      background-color: #a7a7a7;
      overflow: hidden;
    }
    .disable {
      display: none;
    }
  }
</style>