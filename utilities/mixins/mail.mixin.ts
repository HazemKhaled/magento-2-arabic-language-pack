import { ServiceSchema } from 'moleculer';
import nodemailer from 'nodemailer';

export const Mail: ServiceSchema = {
  name: 'mail',
  settings: {
    mail: nodemailer.createTransport({
      // @ts-ignore
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    }),
  },
  methods: {
    sendMail({to, subject, text}) {
      const data = {
        from: process.env.MP_MAIL,
        to,
        subject,
        text,
      };
      return this.schema.settings.mail.sendMail(data, (err: unknown, body: {message: string; id: string;}) => {
        this.logger.info(err, body);
      });
    },
  },
};
