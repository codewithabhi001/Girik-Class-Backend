import nodemailer from 'nodemailer';
import env from './env.js';

const transporter = nodemailer.createTransport({
    host: env.mail.host,
    port: env.mail.port,
    secure: false, // true for 465, false for other ports
    auth: {
        user: env.mail.user,
        pass: env.mail.pass,
    },
});

export default transporter;
