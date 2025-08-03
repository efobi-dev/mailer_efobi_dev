# Mail Efobi Dev

This project is a monorepo containing a mailer service and a typesafe client.

## Project Structure

- `apps/mailer`: The mailer service application.
- `packages/typesafe-client`: The typesafe client for the mailer service.

## Getting Started

### Installation

To install the dependencies for the entire project, run the following command in the root directory:

```bash
bun install
```

### Running the Mailer Service

To run the mailer service, run the following command in the root directory:

```bash
bun run --cwd apps/mailer start
```

The mailer service will be available at `http://localhost:3000`.

### Using the Typesafe Client

To use the typesafe client, you can import it in your project like this:

```typescript
import { createClient } from '@mail-efobi/typesafe-client';

const client = createClient('http://localhost:3000');

const emailData = {
  smtpConfig: {
    host: 'smtp.example.com',
    port: 587,
    secure: false,
    auth: {
      user: 'user@example.com',
      pass: 'password',
    },
  },
  from: 'sender@example.com',
  to: 'recipient@example.com',
  subject: 'Test Email',
  text: 'This is a test email.',
};

client.sendEmail(emailData)
  .then((response) => {
    console.log('Email sent successfully:', response);
  })
  .catch((error) => {
    console.error('Failed to send email:', error);
  });
```