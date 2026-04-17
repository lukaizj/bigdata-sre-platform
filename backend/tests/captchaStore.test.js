const captchaStore = require('../src/captchaStore');

describe('captchaStore', () => {
  test('verify returns valid for correct code', () => {
    captchaStore.set('id1', 'Ab3K');
    expect(captchaStore.verify('id1', 'ab3k')).toEqual({ valid: true });
  });

  test('verify returns wrong for incorrect code', () => {
    captchaStore.set('id2', 'Ab3K');
    expect(captchaStore.verify('id2', 'XXXX')).toEqual({ valid: false, reason: 'wrong' });
  });

  test('verify is one-time: second call returns expired', () => {
    captchaStore.set('id3', 'test');
    captchaStore.verify('id3', 'test');
    expect(captchaStore.verify('id3', 'test')).toEqual({ valid: false, reason: 'expired' });
  });

  test('verify returns expired for unknown id', () => {
    expect(captchaStore.verify('nonexistent', 'abc')).toEqual({ valid: false, reason: 'expired' });
  });

  test('verify returns missing when code is empty', () => {
    captchaStore.set('id4', 'abc');
    expect(captchaStore.verify('id4', '')).toEqual({ valid: false, reason: 'missing' });
  });
});
