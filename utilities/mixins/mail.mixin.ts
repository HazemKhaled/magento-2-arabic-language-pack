import { ServiceSchema } from 'moleculer';
import MailGun from 'mailgun-js';

export const Mail: ServiceSchema = {
  name: 'mail',
  settings: {
    mail: MailGun({apiKey: process.env.MAIL_KEY, domain: process.env.MAIL_DOMAIN}),
  },
  methods: {
    sendMail(to, subject, text) {
      const data = {
        from: process.env.MP_MAIL,
        to,
        subject,
        text,
      };
      return this.settings.mail(data, (err: unknown, body: {message: string; id: string;}) => {
        this.logger.info(err, body);
      });
    },
  },
};
