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
  },
  render(h: any, context: any): any {
    const { props, data } = context;
    const icon = icons[props.name];
    if (!icon) {
      console.warn(props.name, ' icon not found');
      return;
    }

    const children = [];

    // add empty square
    children.push(
      h('path', {
        attrs: {
          d: 'M0 0h24v24H0z',
          fill: 'none',
        },
      })
    );

    // add icon title
    children.push(h('title', icon.title || props.name));
    children.push(
      h('path', {
        attrs: {
          d: icon,
        },
      })
    );

    h(
      'svg',
      {
        style: data.style,
        staticStyle: data.staticStyle,
        attrs: {
          ...data.attrs,
          class: `icon icon-${props.name} ${data.staticClass || ''} ${
            data.class || ''
          }`,
          viewBox: '0 0 24 24',
        },
      },
      children
    );
  },
};
