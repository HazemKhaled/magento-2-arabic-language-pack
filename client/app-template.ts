import { GenericObject } from 'moleculer';

const template: GenericObject = {
  name: 'App',
  data: () => ({
    counter: 2,
  }),
  template: `<div id="app">
    <p>Hello from vue: {{counter}}</p>
    <button @click="counter++">+</button>
  </div>
`,
};

export default template;
