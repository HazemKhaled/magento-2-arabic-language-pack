<template lang="pug">
.toaster(
  :class='[`toaster--${data.type}`]',
  :style='draggedStyle',
  @mousedown='handelSelect',
  @touchstart='handelSelect',
  @transitionend='handleTransitionEnd'
)
  .toaster__loader
    .toaster__loader-fill(:style='loaderStyle')
  .toaster__info
    h2.toaster__title(v-if='data.title')
      template(v-if='data.translate') {{ data.title | TAPi18n }}
      template(v-else) {{ data.title }}

    p.toaster__body(v-if='$slots.default')
      slot

  button.toaster__dismiss(@click.stop='dismiss')
    AppIcon(name='close')
</template>

<script>
import Timer from './Timer.ts';
import AppIcon from '@/components/AppIcon';

export default {
  name: 'Toastr',
  components: { AppIcon },
  props: {
    time: {
      type: Number,
      default: 5000,
    },
    data: {
      type: Object,
      required: true,
    },
  },
  data: () => ({
    dragValue: 0,
    initPosition: 0,
    timeLoaded: 0,
    status: 'normal',
  }),
  computed: {
    draggedStyle() {
      if (!this.dragValue) return '';
      return `transform: translateX(${this.dragValue}px); opacity: ${
        1 - Math.abs(this.dragValue) / 200
      };`;
    },
    loaderStyle() {
      if (!this.time) `transform: scaleX(0)`;
      const loadedPercentage = this.timeLoaded / this.time;
      return `transform: scaleX(${loadedPercentage})`;
    },
  },
  mounted() {
    if (this.time) {
      this.initTimer();
    }
  },
  beforeDestroy() {
    if (this.timer) {
      this.timer.destroy();
    }
  },
  methods: {
    dismiss() {
      if (this.timer) {
        this.timer.destroy();
      }
      this.$emit('remove');
    },

    timerInterval(remainingTime) {
      this.timeLoaded = this.time - remainingTime;
    },

    handelHover() {
      this.timer.pause();
    },

    handelMouseOut() {
      this.timer.play();
    },

    handelSelect(event) {
      this.status = 'dragging';
      this.$el.style.transition = '';
      this.initPosition = this.getClientX(event);

      document.addEventListener('mousemove', this.dragging);
      document.addEventListener('touchmove', this.dragging, { passive: false });
      document.addEventListener('touchend', this.release);
      document.addEventListener('mouseup', this.release);
    },

    dragging(event) {
      if (this.ticking) return;
      const dragged = this.getClientX(event);
      window.requestAnimationFrame(() => {
        this.dragValue = dragged - this.initPosition;
        this.ticking = false;
      });
      this.ticking = true;
    },

    release() {
      this.status = 'release';
      document.removeEventListener('mousemove', this.dragging);
      document.removeEventListener('touchmove', this.dragging);
      document.removeEventListener('mouseup', this.release);
      document.removeEventListener('touchend', this.release);

      if (Math.abs(this.dragValue) > 100) {
        this.dismiss();
        return;
      }
      this.$el.style.transition = '0.2s';
      this.dragValue = 0;
    },

    handleTransitionEnd() {
      this.$el.style.transition = '';
    },

    getClientX(event) {
      return event.type.includes('mouse')
        ? event.clientX
        : event.type.includes('touch')
        ? event.touches[0].clientX
        : event;
    },

    initTimer() {
      this.$el.addEventListener('mouseover', this.handelHover);
      this.$el.addEventListener('mouseout', this.handelMouseOut);
      this.timer = new Timer(this.time);
      this.timer.on('interval', this.timerInterval);
      this.timer.on('stop', this.dismiss);
      this.timer.play();
    },
  },
};
</script>

<style lang="stylus">
@import '../styles/colors.styl'

.toaster
  position: absolute
  top: 0
  z-index: 9999
  display: flex
  justify-content: space-between
  align-items: flex-start
  margin: 20px
  padding: 18px
  width: 100%
  max-width: calc(100% - 40px)
  border-radius: 8px
  overflow: hidden
  a
    color: inherit
    font-weight: bold
    text-decoration: underline
    &:hover
      color: $dark

.toaster--success
  background-color: $green
  color: $white

.toaster--error
  background-color: $red
  color: $white
.toaster--info
  background-color: $cyan
  color: $white
.toaster--warning
  background-color: $yellow
  color: $black

.toaster__loader
  position: absolute
  top: 0
  left: 0
  right: 0

.toaster__loader-fill
  height: 3px
  background-color: $dark
  opacity: 0.5
  transform-origin: left center

.toaster__info
  display: flex
  flex-direction: column
  align-items: flex-start
  white-space: pre-wrap

.toaster__button
  margin-top: 7px
  padding: 5px 15px
  border: 0
  border-radius: 8px
  background: $white
  color: $dark

.toaster__body
  margin: 0
  white-space: pre-wrap
  font-size: 16px

.toaster__title
  margin-top: 0
  margin-bottom: 0
  font-weight: bold
  font-size: 18px
  &:not(:last-child)
    margin-bottom: 7px

.toaster__dismiss
  display: flex
  display: block
  flex-grow: 0
  flex-shrink: 0
  justify-content: center
  align-items: center
  padding: 0
  width: 20px
  height: 20px
  outline: none
  border: none
  border-radius: 20px
  background-color: $black-alpha
  font-size: 1rem
  cursor: pointer
  transition: 0.5s
  color: $white
  &:hover
    background-color: $black
</style>
