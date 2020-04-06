import { ServiceSchema } from 'moleculer';
import { Store, Tax, OrderItem } from '../../utilities/types';
import { Mail } from './mail.mixin';

type ErrorSchema = {code: number; message: string;};

const TaxCheck: ServiceSchema = {
  name: 'taxCheck',
  mixins: [Mail],
  methods: {
    /**
     *
     * Get Item Tax
     *
     * @param {Store} instance
     * @param {Product} item
     * @returns {{code: number, message: string} | Tax}
     */
    async getItemTax(instance: Store | string, item: OrderItem) {
      // Check if the store billing address country is available
      if (typeof instance !== 'string' && !this.checkAddressCountry(instance)) {
        return {
          code: 1234,
          message: 'Messing Store Address',
        };
      }

      const country = (typeof instance !== 'string' ? instance.address.country : instance).toUpperCase();

      // Get countries that should apply taxes to it
      const taxCountries = process.env.TAX_COUNTRIES
        ? process.env.TAX_COUNTRIES.toUpperCase().trim().split(',') : [];

      // If the country is not listed for taxes return
      if (!taxCountries.includes(country)) {
        return {
          code: 0,
          message: 'No taxes for this country',
        };
      }

      // Check if the item tax class attr. is available
      if (!this.checkItemTaxClass(item)) {
        // Send Email with item sku informing that it doesn't have tax class
        this.sendMail({
          to: process.env.TAX_MISSING_MAIL,
          subject: 'Item missing tax class',
          text: `Item under this sku '${item.sku}' has no tax class.`,
        });

        return {
          code: 3241,
          message: 'Tax Maybe Applied Later',
        };
      }

      const taxClass = item.taxClass;

      // Get tax data from taxes service
      const taxData: Tax | ErrorSchema = await this.broker.call('taxes.tList', {
        country,
        'class': taxClass.toString(),
      }).then((res: {taxes: Tax[]}) => res.taxes[0], (err: any) => ([{
        code: 4444,
        message: err.message,
      }]));

      // Check if no tax data
      if (!taxData) {
        // Send mail if no tax data for this country
        this.sendMail({
          to: process.env.TAX_MISSING_MAIL,
          subject: 'Country missing tax class',
          text: `${country} has no tax data for this tax class '${taxClass}', sku '${item.sku}'.`,
        });

        return {
          code: 2134,
          message: `The item tax class is not listed for this country-code: ${country}`,
        };
      }

      // If no percentage set it to zero
      if(!(taxData as Tax).percentage && !(taxData as ErrorSchema).code) {
        (taxData as Tax).percentage = 0;
      }

      return taxData;
    },

    /**
     *
     * Check Store Address Country
     *
     * @param {Store} instance
     * @returns {boolean}
     */
    checkAddressCountry(instance: Store): boolean {
      return !!(
        instance &&
        instance.address &&
        instance.address.country &&
        /^[A-Z]{2}$/.test(instance.address.country)
      );
    },

    /**
     *
     * Check item tax class availability
     *
     * @param {Product} item
     * @returns {boolean}
     */
    checkItemTaxClass(item: OrderItem): boolean {
      return !!(item && item.taxClass);
    },
  },
};

export = TaxCheck;
