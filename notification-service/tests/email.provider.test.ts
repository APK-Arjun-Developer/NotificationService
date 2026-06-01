import { sendEmail } from '../src/channels/email.provider';
import nodemailer from 'nodemailer';

jest.mock('nodemailer');

const mockSendMail = jest.fn();
const mockVerify = jest.fn();

(nodemailer.createTransport as jest.Mock).mockReturnValue({
  sendMail: mockSendMail,
  verify: mockVerify,
});

describe('sendEmail', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns success with messageId on successful send', async () => {
    mockSendMail.mockResolvedValueOnce({
      messageId: '<test-id@gmail.com>',
      response: '250 OK',
    });

    const result = await sendEmail({
      channel: 'email',
      to: 'user@example.com',
      subject: 'Test',
      html: '<p>Hello</p>',
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('<test-id@gmail.com>');
    expect(result.channel).toBe('email');
  });

  it('returns failure with error message when send throws', async () => {
    mockSendMail.mockRejectedValueOnce(new Error('SMTP connection refused'));

    const result = await sendEmail({
      channel: 'email',
      to: 'user@example.com',
      subject: 'Test',
      html: '<p>Hello</p>',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('SMTP connection refused');
  });

  it('handles array of recipients', async () => {
    mockSendMail.mockResolvedValueOnce({ messageId: '<abc@test>', response: '250 OK' });

    const result = await sendEmail({
      channel: 'email',
      to: ['a@test.com', 'b@test.com'],
      subject: 'Bulk',
      html: '<p>Hi all</p>',
    });

    expect(result.success).toBe(true);
    const callArgs = mockSendMail.mock.calls[0][0];
    expect(callArgs.to).toContain('a@test.com');
  });
});
