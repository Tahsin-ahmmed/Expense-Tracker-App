import { formatPhoneForDisplay, parseIdentifier } from '../identifier';
import { isPinFormat, isWeakPin } from '../pin';
import { forgotPinSchema, newPinSchema, signInSchema, signUpSchema } from '../schema';

describe('parseIdentifier', () => {
  it.each([
    ['01712345678', '+8801712345678'],
    ['01712-345678', '+8801712345678'],
    ['+880 1712 345678', '+8801712345678'],
    ['8801312345678', '+8801312345678'],
    ['(019) 1234-5678', '+8801912345678'],
    ['০১৭১২৩৪৫৬৭৮', '+8801712345678'],
  ])('reads phone %j', (input, phone) => {
    expect(parseIdentifier(input)).toEqual({ kind: 'phone', phone });
  });

  it.each([
    ['Rahim@Example.COM ', 'rahim@example.com'],
    ['a.b+tag@mail.co', 'a.b+tag@mail.co'],
  ])('reads email %j', (input, email) => {
    expect(parseIdentifier(input)).toEqual({ kind: 'email', email });
  });

  it.each([
    '',
    '0171234567', // too short
    '017123456789', // too long
    '01212345678', // operator digit 2 is not a mobile prefix
    '+9101712345678',
    'rahim@',
    'rahim@mail',
    'not an id',
  ])('rejects %j', (input) => {
    expect(parseIdentifier(input)).toBeNull();
  });
});

describe('formatPhoneForDisplay', () => {
  it('shows local format', () => {
    expect(formatPhoneForDisplay('+8801712345678')).toBe('01712-345678');
    expect(formatPhoneForDisplay('8801712345678')).toBe('01712-345678');
    expect(formatPhoneForDisplay('12345')).toBe('12345');
  });
});

describe('PIN rules', () => {
  it('requires exactly six digits', () => {
    expect(isPinFormat('482915')).toBe(true);
    expect(isPinFormat('48291')).toBe(false);
    expect(isPinFormat('4829150')).toBe(false);
    expect(isPinFormat('48a915')).toBe(false);
    expect(isPinFormat('৪৮২৯১৫')).toBe(false);
  });

  it.each([
    '000000',
    '111111',
    '123456',
    '234567',
    '654321',
    '987654',
    '121212',
    '909090',
    '123123',
    '456456',
    '112233',
    '123321',
  ])('treats %s as weak', (pin) => {
    expect(isWeakPin(pin)).toBe(true);
  });

  it.each(['482915', '730184', '159260', '901234'])('accepts %s', (pin) => {
    expect(isWeakPin(pin)).toBe(false);
  });
});

function messages(result: {
  success: boolean;
  error?: { issues: { path: PropertyKey[]; message: string }[] };
}) {
  return Object.fromEntries(
    (result.error?.issues ?? []).map((issue) => [String(issue.path[0]), issue.message]),
  );
}

describe('auth form schemas', () => {
  it('sign in: accepts any 6-digit PIN and returns parsed credentials', () => {
    expect(signInSchema.parse({ identifier: '01712345678', pin: '123456' })).toEqual({
      identifier: { kind: 'phone', phone: '+8801712345678' },
      pin: '123456',
    });
  });

  it('sign in: reports missing and invalid fields', () => {
    expect(messages(signInSchema.safeParse({ identifier: '', pin: '12' }))).toEqual({
      identifier: 'Enter your email or phone number.',
      pin: 'PIN must be exactly 6 digits.',
    });
  });

  it('sign up: rejects weak PINs and mismatched confirmation', () => {
    expect(
      messages(
        signUpSchema.safeParse({ identifier: 'a@b.com', pin: '111111', confirmPin: '111111' }),
      ).pin,
    ).toMatch(/too easy to guess/);
    expect(
      messages(
        signUpSchema.safeParse({ identifier: 'a@b.com', pin: '482915', confirmPin: '482916' }),
      ).confirmPin,
    ).toBe('The PINs do not match.');
    expect(
      signUpSchema.parse({ identifier: 'A@B.com', pin: '482915', confirmPin: '482915' }),
    ).toEqual({ identifier: { kind: 'email', email: 'a@b.com' }, pin: '482915' });
  });

  it('new PIN: returns the PIN when valid', () => {
    expect(newPinSchema.parse({ pin: '730184', confirmPin: '730184' })).toBe('730184');
    expect(newPinSchema.safeParse({ pin: '123456', confirmPin: '123456' }).success).toBe(false);
  });

  it('forgot PIN: only accepts an email', () => {
    expect(forgotPinSchema.parse({ email: ' Me@Mail.com ' })).toBe('me@mail.com');
    expect(forgotPinSchema.safeParse({ email: '01712345678' }).success).toBe(false);
  });
});
