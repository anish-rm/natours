const nodemailer = require('nodemailer');
const pug = require('pug');
const { htmlToText } = require('html-to-text');

// the idea is whenever wwe we want to send email we will  import this email class
// use like this new Email(user, url).ssendWelcome(); //it will be sent when new user signup
// we will send diff emails for diff scenarios

module.exports = class Email {
  constructor(user, url) {
    (this.to = user.email), (this.firstName = user.name.split(' ')[0]);
    this.url = url;
    this.from = `Anish <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      //Sendgrid
      return nodemailer.createTransport({
        // we no need to specify the host and port becoz nodemailer byv default recognize this
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }
  // send the actual email

  async send(template, subject) {
    // 1.) Render HTML based on a pug template
    // we need to generate a html from pug
    // now this will take in  file and render the pug code into real html
    // --dirnmae --> currently running scipt that is utilities folder
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });

    // 2) Define email options
    console.log(this.to);
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      // we also want to include text version of email into our email
      // becoz it is better for email delivery rates and also for spam folders
      // some peoople prefers plain text email
      // we need a way to conver our html to text
      // so let us install a package html-to-text
      text: htmlToText(html),
    };

    // 3.Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  // we can just call this sendWelcome then this class will automatically sends the welcome email
  async sendWelcome() {
    await this.send('welcome', 'Welcome to the NATOURS family!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token valid only 10 mins'
    );
  }
};

// const sendEmails = async (options) => {
//   //options - contains where to send, subject line, email content
//   // Three Steps
//   // 1.CREATE A TRANSPORTER
//   //Transporter - A service that sends the mail
//   // Eg. gmail
//   // const transporter = nodemailer.createTransport({
//   //   // service: 'Gmail',
//   //   // auth: {
//   //   //   user: process.env.EMAIL_USERNAME,
//   //   //   auth: process.env.EMAIL_PASSWORD,
//   //   // },
//   //   // now we need to activate gmail less secure option
//   //   // it is not best practice to use gmail service in development

//   //   // so we can use MAILTRAP in which will fakes to send email
//   //   // We can use it to check how  the email will like in production
//   //   host: process.env.EMAIL_HOST,
//   //   port: process.env.EMAIL_PORT,
//   //   auth: {
//   //     user: process.env.EMAIL_USERNAME,
//   //     pass: process.env.EMAIL_PASSWORD,
//   //   },
//   // });

// 2.EMAIL OPTIONS
// const mailOptions = {
//   from: 'Anish <anishmahi946@gmail.com>',
//   to: options.email,
//   subject: options.subject,
//   text: options.message,
//   // html:
// };

//   //   it return as promise
//   // await transporter.sendMail(mailOptions);
// };

// module.exports = sendEmails;
