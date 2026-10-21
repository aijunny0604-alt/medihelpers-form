(function () {
  'use strict';

  document.querySelectorAll('form[data-mail-subject]').forEach(function (form) {
    var button = form.querySelector('button[type="submit"]');
    var feedback = form.querySelector('[data-submit-feedback]');
    var loadNotice = form.querySelector('[data-load-notice]');
    if (!button || !feedback || typeof fetch !== 'function' ||
        typeof FormData !== 'function' || typeof AbortController !== 'function') return;
    var originalLabel = button.textContent;
    var pending = false;
    var completed = false;

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (pending || completed || !form.reportValidity()) return;

      pending = true;
      feedback.hidden = true;
      feedback.textContent = '';
      button.disabled = true;
      button.textContent = '전송 중…';
      form.setAttribute('aria-busy', 'true');
      var controller = new AbortController();
      var timedOut = false;
      var confirmedRejected = false;
      var timer;

      try {
        var data = new FormData(form);
        data.append('_subject', form.getAttribute('data-mail-subject'));
        data.append('_template', 'table');
        data.append('_captcha', 'false');

        // 응답 본문까지 제한 시간을 적용한다. 자동 재전송은 하지 않는다.
        var send = (async function () {
          var response = await fetch('https://formsubmit.co/ajax/hr@medihelpers.co.kr', {
            method: 'POST',
            body: data,
            headers: { Accept: 'application/json' },
            signal: controller.signal
          });
          if (!response.ok) {
            confirmedRejected = response.status >= 400 && response.status < 500 && response.status !== 408;
            throw new Error('http-error');
          }
          var result = await response.json();
          if (!result || (result.success !== true && result.success !== 'true')) {
            confirmedRejected = !!result && (result.success === false || result.success === 'false');
            throw new Error('submission-rejected');
          }
        })();

        await Promise.race([
          send,
          new Promise(function (_, reject) {
            timer = setTimeout(function () {
              timedOut = true;
              controller.abort();
              reject(new Error('timeout'));
            }, 30000);
          })
        ]);

        completed = true;
        form.closest('.form-container').style.display = 'none';
        document.getElementById('thanksScreen').style.display = 'block';
        var title = document.querySelector('#thanksScreen h1');
        title.setAttribute('tabindex', '-1');
        title.focus();
        window.scrollTo(0, 0);
      } catch (_) {
        feedback.textContent = timedOut
          ? '응답이 지연되어 전송 결과를 확인하지 못했습니다. 입력 내용은 유지됩니다. 중복 접수를 피하려면 hr@medihelpers.co.kr로 접수 여부를 확인해 주세요.'
          : confirmedRejected
            ? '전송이 거절되었습니다. 입력 내용은 유지됩니다. 잠시 후 다시 시도해 주세요. 계속 실패하면 hr@medihelpers.co.kr로 문의해 주세요.'
            : '전송 결과를 확인하지 못했습니다. 입력 내용은 유지됩니다. 이미 접수되었을 수 있으므로 중복 제출 전에 hr@medihelpers.co.kr로 접수 여부를 확인해 주세요.';
        feedback.hidden = false;
        feedback.focus();
      } finally {
        clearTimeout(timer);
        pending = false;
        form.setAttribute('aria-busy', 'false');
        button.disabled = completed;
        button.textContent = originalLabel;
      }
    });
    // 전송 코드가 준비되기 전에는 HTML의 제출 버튼을 잠근 상태로 유지한다.
    if (loadNotice) loadNotice.hidden = true;
    button.disabled = false;
  });
})();
