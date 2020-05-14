import { ServiceSchema } from 'moleculer';
import AppSearchClient from '@elastic/app-search-node';

export const AppSearch = (engine: string): ServiceSchema => ({
  name: 'appSearch',
  settings: {
    client: new AppSearchClient(undefined, process.env.APP_SEARCH_KEY, () => process.env.APP_SEARCH_BASEURL),
  },
  methods: {
    /**
     * Search by ids
     *
     * @param {Array} documentIds
     *
     * @returns Array
     */
    getDocumentsByIds(documentIds) {
      return this.settings.client
        .getDocuments(engine, documentIds)
        .then((res: any) => res.forEach(this.sanitizer) || res);
    },
    /**
     * Search by query
     *
     * @param {Object} options
     *
     * @returns Array
     */
    documentsSearch(query, options) {
      return this.settings.client
        .search(engine, query, options)
        .then((res: any) => res.results.forEach(this.sanitizer) || res);
    },
    /**
     * Update by id
     *
     * @param {Array} documents
     *
     * @returns Array
     */
    updateDocuments(documents) {
      return this.settings.client
        .updateDocuments(engine, documents);
    },
    sanitizer(document) {
      if (!document) return;
      const fields = [
        'archive',
        'id',
        'name_i18n',
        'barcode',
        'images',
        'sku',
        'shipping_terms',
        'seller_id',
        'categories',
        'description_i18n',
        'attributes',
        'brand',
        'source_url',
        'ship_to',
        'updated',
        'description_tr',
        'variations',
        'short_description_i18n',
        'imported',
      ];
      const isRaw = document.sku && document.sku.raw;
      Object.keys(document).forEach(k => {
        let segment = document[k];
        if (isRaw) {
          segment = segment.raw;
        }
        if (segment === undefined || !fields.includes(k)) { delete document[k]; return; }
        try {
          if (Array.isArray(segment)) return document[k] = segment.map(e => JSON.parse(e));
          document[k] = JSON.parse(segment);
        } catch(err) {
          document[k] = segment;
        }
      });
    },
  },
});
