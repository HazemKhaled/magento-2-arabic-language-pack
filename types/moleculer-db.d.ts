import { ServiceSchema } from 'moleculer';

declare module 'moleculer-db' {
  export class MemoryAdapter implements ServiceSchema {
    name: 'db';
    constructor(params: { filename: string });
  }
}

declare module 'moleculer-db' {
  export const name: string;
}