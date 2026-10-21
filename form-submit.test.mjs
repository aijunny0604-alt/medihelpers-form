import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const code = fs.readFileSync(new URL('./form-submit.js', import.meta.url), 'utf8');
test('직접 방문한 옛 완료 페이지는 접수 성공을 단정하지 않는다', () => {
  const html = fs.readFileSync(new URL('./thanks.html', import.meta.url), 'utf8');
  assert.match(html, /이 페이지에서는 전송 결과를 확인할 수 없습니다/);
  assert.doesNotMatch(html, /정상적으로 접수되었습니다|<title>제출 완료/);
  assert.match(html, /중복 제출 전에/);
});
function setup(subject, fetchImpl, overrides = {}) {
  let listener, timeout, calls = 0;
  const data = new Map([['검수', '입력값 유지']]);
  const button = { textContent: '제출하기', disabled: true };
  const loadNotice = { hidden: false };
  const feedback = { hidden: true, textContent: '', focus() { this.focused = true; } };
  const panel = { style: { display: '' } };
  const thanks = { style: { display: 'none' } };
  const title = { setAttribute() {}, focus() { this.focused = true; } };
  const attrs = {};
  const form = {
    querySelector: selector => selector.startsWith('button') ? button : selector === '[data-load-notice]' ? loadNotice : feedback,
    reportValidity: () => true,
    addEventListener: (_, fn) => { listener = fn; },
    getAttribute: () => subject,
    setAttribute: (name, value) => { attrs[name] = value; },
    closest: () => panel
  };
  vm.runInNewContext(code, {
    document: {
      querySelectorAll: () => [form],
      getElementById: () => thanks,
      querySelector: () => title
    },
    window: { scrollTo() {} },
    FormData: class { constructor() { this.values = new Map(data); } append(k, v) { this.values.set(k, v); } },
    AbortController,
    setTimeout: fn => { timeout = fn; return 1; },
    clearTimeout: () => {},
    fetch: (...args) => { calls++; return fetchImpl(...args); },
    ...overrides
  });
  return { submit: () => listener({ preventDefault() {} }), expire: () => timeout(),
    form, button, loadNotice, feedback, panel, thanks, title, attrs, data, get calls() { return calls; } };
}
const response = (success, ok = true, status = ok ? 200 : 500) => ({ ok, status, json: async () => ({ success }) });
for (const [file, id, subject] of [
  ['index.html', 'resumeForm', '[메디헬퍼스] 새 이력서 접수'],
  ['recruit.html', 'recruitForm', '[메디헬퍼스] 새 초빙 의뢰서 접수']
]) {
  test(`${id}: production wiring`, () => {
    const html = fs.readFileSync(new URL(file, import.meta.url), 'utf8');
    assert.ok(html.includes(`id="${id}" data-mail-subject="${subject}"`));
    assert.ok(html.includes('data-submit-feedback role="alert"'));
    assert.equal((html.match(/src="form-submit.js\?v=/g) || []).length, 1);
    assert.ok(!html.includes("fetch('https://formsubmit"));
    assert.match(html, /<form[^>]+method="post"/);
    assert.match(html, /<button[^>]+type="submit"[^>]+disabled/);
    assert.match(html, /data-load-notice/);
  });
  test(`${id}: enables submission only after initialization`, () => {
    const h = setup(subject, async () => response(true));
    assert.equal(h.button.disabled, false);
    assert.equal(h.loadNotice.hidden, true);
    assert.equal(h.calls, 0);
  });
  for (const feature of ['fetch', 'FormData', 'AbortController']) test(`${id}: missing ${feature} keeps submission locked`, () => {
    const h = setup(subject, async () => response(true), { [feature]: undefined });
    assert.equal(h.button.disabled, true);
    assert.equal(h.loadNotice.hidden, false);
    assert.equal(h.calls, 0);
  });
  for (const value of [true, 'true']) test(`${id}: explicit success ${JSON.stringify(value)}`, async () => {
    const h = setup(subject, async (url, options) => {
      assert.equal(url, 'https://formsubmit.co/ajax/hr@medihelpers.co.kr');
      assert.equal(options.body.values.get('_subject'), subject);
      assert.equal(options.body.values.get('검수'), '입력값 유지');
      return response(value);
    });
    await h.submit();
    assert.equal(h.thanks.style.display, 'block');
    assert.equal(h.panel.style.display, 'none');
    assert.equal(h.title.focused, true);
    await h.submit();
    assert.equal(h.calls, 1);
  });
  for (const [name, impl] of [
    ['network', async () => { throw new Error('offline'); }],
    ['HTTP 500 even with success', async () => response(true, false)],
    ['HTTP 429', async () => response(false, false, 429)],
    ['HTTP 400', async () => response(false, false, 400)],
    ['HTTP 408', async () => response(false, false, 408)],
    ['API false', async () => response(false)],
    ['API string false', async () => response('false')],
    ['missing success', async () => response(undefined)],
    ['malformed JSON', async () => ({ok:true, json:async()=>{throw new Error('bad JSON');}})]
  ]) test(`${id}: ${name} stays editable and supports retry`, async () => {
    let failed = true;
    const h = setup(subject, (...args) => failed ? impl(...args) : Promise.resolve(response(true)));
    await h.submit();
    assert.equal(h.thanks.style.display, 'none');
    assert.equal(h.panel.style.display, '');
    assert.equal(h.feedback.hidden, false);
    assert.equal(h.feedback.focused, true);
    assert.match(h.feedback.textContent, /전송/);
    if (['HTTP 429', 'HTTP 400', 'API false', 'API string false'].includes(name)) {
      assert.match(h.feedback.textContent, /거절/);
    } else {
      assert.match(h.feedback.textContent, /결과를 확인하지 못/);
      assert.match(h.feedback.textContent, /중복 제출 전에/);
      assert.doesNotMatch(h.feedback.textContent, /다시 시도해/);
    }
    assert.equal(h.button.disabled, false);
    assert.equal(h.button.textContent, '제출하기');
    assert.equal(h.attrs['aria-busy'], 'false');
    assert.equal(h.data.get('검수'), '입력값 유지');
    failed = false;
    await h.submit();
    assert.equal(h.thanks.style.display, 'block');
    assert.equal(h.feedback.hidden, true);
  });
  test(`${id}: pending duplicate and timeout, late success ignored`, async () => {
    let finish, signal;
    const h = setup(subject, (_, options) => {
      signal = options.signal;
      return new Promise(resolve => { finish = resolve; });
    });
    const request = h.submit();
    await h.submit();
    assert.equal(h.calls, 1);
    assert.equal(h.button.disabled, true);
    h.expire();
    await request;
    assert.equal(signal.aborted, true);
    assert.match(h.feedback.textContent, /결과를 확인하지 못/);
    assert.equal(h.button.disabled, false);
    finish(response(true));
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(h.thanks.style.display, 'none');
  });
  test(`${id}: response body timeout`, async () => {
    const h = setup(subject, async () => ({ok:true, json:()=>new Promise(()=>{})}));
    const request = h.submit();
    await Promise.resolve();
    h.expire();
    await request;
    assert.equal(h.thanks.style.display, 'none');
    assert.equal(h.feedback.hidden, false);
  });
}
