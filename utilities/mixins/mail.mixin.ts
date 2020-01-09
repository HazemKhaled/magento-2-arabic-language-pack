import { ServiceSchema } from 'moleculer';
import nodemailer from 'nodemailer';

export const Mail: ServiceSchema = {
  name: 'mail',
  settings: {
    mail: nodemailer.createTransport({
      host: '',
      port: 465,
      secure: true, // use TLS
      auth: {
        user: 'username',
        pass: 'pass',
      },
      tls: {
        // do not fail on invalid certs
        rejectUnauthorized: false,
      },
    }),
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
