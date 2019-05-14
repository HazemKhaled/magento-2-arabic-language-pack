declare class agile_crm {
  constructor(domain: string, key: string, email: string);
}
declare module agile_crm {
  export interface Contact {
    id: string;
  }
}
declare module 'agile_crm' {
  export = agile_crm;
}
