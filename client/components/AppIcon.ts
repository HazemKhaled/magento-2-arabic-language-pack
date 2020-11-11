import { GenericObject } from 'moleculer';

import icons from '../icons';

export default {
  name: 'AppIcon',
  functional: true,
  inheritAttrs: true,
  props: {
    name: {
      type: String,
      required: true,
    },
    fallback: {
      type: String,
    },
    viewBox: {
      type: String,
    },
  },
  render(createElement: any, context: any): GenericObject {
    const { props, data } = context;
    const icon = icons[props.name] || icons[props.fallback];

    if (!icon) {
      console.warn(props.name, ' icon not found');
      return;
    }

    const children = [];

    // add empty square
    children.push(
      createElement('path', {
        attrs: {
          d: 'M0 0h24v24H0z',
          fill: 'none',
        },
      })
    );

    // add icon title
    children.push(createElement('title', icon.title || props.name));
    children.push(
      createElement('path', {
        attrs: {
          d: icon,
        },
      })
    );

    return createElement(
      'svg',
      {
        style: data.style,
        staticStyle: data.staticStyle,
        attrs: {
          ...data.attrs,
          class: `icon icon-${props.name} ${data.staticClass || ''} ${
            data.class || ''
          }`,
          viewBox: props.viewBox || '0 0 24 24',
        },
      },
      children
    );
  },
  icons,
};
