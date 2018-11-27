const AgileCRMManager = require('agile_crm');

module.exports = {
  name: 'agilecrm',

  /**
   * Service settings
   */
  settings: {
    agileDomain: process.env.AGILECRM_DOMAIN || 'testknawat',
    agileKey: process.env.AGILECRM_KEY || 'rcffatjd9p3mjesj4clt76eql9',
    agileEmail: process.env.AGILECRM_EMAIL || 'abdullah@knawat.com'
  },

  /**
   * Methods
   */
  methods: {
    /**
     * Get Contact ID by Email
     *
     * @param {String} email
     * @returns contact
     * @memberof AgileLib
     */
    async getContactIdByEmail(email) {
      try {
        const contact = await new Promise((resolve, reject) => {
          this.agile.contactAPI.getContactByEmail(
            email,
            response => {
              resolve(response);
            },
            err => {
              reject(err);
            }
          );
        });
        if (typeof contact === 'object' && contact.id) {
          return contact.id;
        }
      } catch (err) {
        this.logger.error(err);
      }
    },

    /**
     * Agile Update Last Sync Date on agile CRM
     *
     * @param {String} userEmail
     * @returns
     */
    async updateLastSyncDate(userEmail) {
      if (userEmail !== '') {
        const contactId = await this.getContactIdByEmail(userEmail);
        if (typeof contactId === 'undefined') {
          this.logger.error('[Agile][UpadateLastSync]', 'User not Found on agileCRM');
          return false;
        }

        let today = new Date()
          .toISOString()
          .substr(0, 10)
          .split('-');
        const [year, month, date] = today;
        today = [month, date, year];
        today = today.join('/');
        const properties = [
          {
            type: 'CUSTOM',
            name: 'Last Sync Date',
            value: today
          }
        ];
        const updateContact = {
          id: contactId,
          properties: properties
        };

        // Update Last Sync Date.
        try {
          this.agile.contactAPI.update(
            updateContact,
            response => {
              this.logger.info(
                '[Agile][UpadateLastSync] Last Sync Date Updated sucessfully. ID:',
                response.id
              );
            },
            err => {
              this.logger.error('[Agile][UpadateLastSync]', err);
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
  },

  /**
   * Service started lifecycle event handler
   */
  started() {},

  /**
   * Service stopped lifecycle event handler
   */
  stopped() {}
};
