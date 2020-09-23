import { GenericObject } from 'moleculer';
import Vue from 'vue';

import App from './app-template';

// export a factory function for creating fresh app, router and store
// instances
export function createApp(): GenericObject {
  const app = new Vue({
    // the root instance simply renders the App component.
    render: (hyperScript: any): any => hyperScript(App),
  });
  return { app };
}
