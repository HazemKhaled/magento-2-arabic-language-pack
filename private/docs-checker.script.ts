const openapi = require('../mixins/openapi');
const api = require('../../services/api.service');

const routes = api.settings.routes;
const routesActions: { [key: string]: string[] } = {};
routes.forEach((route: { aliases: { [key: string]: string } }) =>
  Object.values(route.aliases).forEach(alias => {
    const [serviceName, actionName] = alias.split('.');
    if (routesActions[serviceName]) {
      routesActions[serviceName].push(actionName);
    } else {
      routesActions[serviceName] = [actionName];
    }
  })
);
const openapiMixinsNames = Object.keys(openapi);
const noDocActions: string[] = [];
openapiMixinsNames.forEach(doc => {
  routesActions[openapi[doc].name].forEach(action => {
    if (!Object.keys(openapi[doc].actions).includes(action)) {
      noDocActions.push(`${openapi[doc].name}.${action}`);
    }
  });
});
console.log(
  `\u001b[32mThere is ${openapiMixinsNames.length} service within the openapi docs`
);
console.log(
  `There is ${openapiMixinsNames.reduce(
    (a, s) => a + Object.keys(openapi[s].actions).length,
    0
  )} action within the openapi docs`
);
console.log(
  `\x1b[31mThere is ${noDocActions.length} end-points not documented!`
);
console.log(`\x1b[33m${noDocActions.reduce((a, c) => `${a}${c}\n`, '')}`);
