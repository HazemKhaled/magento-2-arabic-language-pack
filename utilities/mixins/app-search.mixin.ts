import { ServiceSchema } from 'moleculer';
import AppSearchClient from '@elastic/app-search-node';

export const AppSearch = (engine: string): ServiceSchema => ({
  name: 'appSearch',
  settings: {
    client: new AppSearchClient(
      undefined,
      process.env.APP_SEARCH_KEY,
      () => `${process.env.APP_SEARCH_BASEURL}/api/as/v1/`
    ),
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
      return this.settings.client.getDocuments(engine, documentIds);
    },
    /**
     * Update by id
     *
     * @param {Array} documents
     *
     * @returns Array
     */
    updateDocuments(documents) {
      return this.settings.client.updateDocuments(engine, documents);
    },
  },
});
