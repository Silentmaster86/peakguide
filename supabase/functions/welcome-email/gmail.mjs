export function createGmailSender({ gmailUser, appPassword, createTransport }) {
  if (typeof gmailUser !== 'string' || !/^[^\s<>@,;]+@gmail\.com$/i.test(gmailUser)
      || typeof appPassword !== 'string' || !appPassword.trim()) throw new Error('Invalid Gmail configuration');
  const transport = createTransport({
    host: 'smtp.gmail.com', port: 465, secure: true,
    auth: { user: gmailUser, pass: appPassword.replace(/\s/g, '') },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000,
    disableFileAccess: true, disableUrlAccess: true,
  });
  return async ({ to, subject, html, text, replyTo }) => {
    const result = await transport.sendMail({
      from: { name: 'Przemysław — PeakGuide', address: gmailUser },
      to: [{ address: to }], replyTo: [{ address: replyTo }], subject, html, text,
    });
    if (!result.accepted?.includes(to)) throw new Error('SMTP acceptance not confirmed');
  };
}
