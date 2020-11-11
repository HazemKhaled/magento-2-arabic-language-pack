import { GenericObject } from 'moleculer';

export interface ElasticQuery {
  bool: {
    filter: {
      term?: GenericObject;
    }[];
    must: must[];
    must_not: must[];
  };
}

interface must {
  term?: GenericObject;
  exists?: GenericObject;
  range?: GenericObject;
}
