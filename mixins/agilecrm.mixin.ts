import AgileCRMManager, { Contact } from 'agile_crm';

export const AgileCRM = {
  name: 'agilecrm',

  /**
   * Service settings
   */
  settings: {
    agileDomain: process.env.AGILECRM_DOMAIN,
    agileKey: process.env.AGILECRM_KEY,
    agileEmail: process.env.AGILECRM_EMAIL
  },

  /**
   * Methods
   */
  methods: {
    /**
     * Get Contact ID by Email
     *
     * @param {string} email
     * @returns contact
     */
    async getContactIdByEmail(email: string) {
      try {
        const contact: Contact = await new Promise((resolve, reject) => {
          this.agile.contactAPI.getContactByEmail(
            email,
            (response: Contact) => {
              resolve(response);
            },
            (err: Error) => {
              reject(err);
            }
          );
        });

        if (contact && contact.id) {
          return contact.id;
        }
      } catch (err) {
        this.logger.error(err);
      }
    },

    /**
     * Agile Update Last Sync Date on agile CRM
     *
     * @param {string} userEmail
     * @returns
     */
    async updateLastSyncDate(userEmail: string) {
      if (userEmail !== '') {
        const contactId = await this.getContactIdByEmail(userEmail);
        if (typeof contactId === 'undefined') {
          this.logger.error('[Agile][UpdateLastSync]', 'User not Found on agileCRM');
          return false;
        }

        let today = new Date()
          .toISOString()
          .substr(0, 10)
          .split('-');

        const [year, month, date] = today;
        today = [month, date, year];

        const properties = [
          {
            type: 'CUSTOM',
            name: 'Last Sync Date',
            value: today.join('/')
          }
        ];
        const updateContact = {
          id: contactId,
          properties
        };

        // Update Last Sync Date.
        try {
          this.agile.contactAPI.update(
            updateContact,
            (response: Contact) => {
              this.logger.info(
                '[Agile][UpdateLastSync] Last Sync Date Updated successfully. ID:',
                response.id
              );
            },
            (err: Error) => {
              this.logger.error('[Agile][UpdateLastSync]', err);
            }
          );
        } catch (err) {
          this.logger.error(err);
        }
      }
    }
  },

  /**
   * Service created lifecycle event handler
   */
  created() {
    this.agile = new AgileCRMManager(
      this.settings.agileDomain,
      this.settings.agileKey,
      this.settings.agileEmail
    );
  }
};
