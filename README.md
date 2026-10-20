# 메디헬퍼스 폼

의사 헤드헌팅 서비스를 위한 웹 폼 페이지입니다.

## 폼 목록

### 1. 의사 간편 이력서
- **URL:** https://aijunny0604-alt.github.io/medihelpers-form/
- **용도:** 의사 선생님이 이력서를 제출하는 폼
- **항목:** 이름, 성별, 생년, 이메일, 전화번호, 전문 분류(전문의/일반의), 전문 과목, 희망 근무지, 전달 사항

### 2. 의사 초빙 의뢰서
- **URL:** https://aijunny0604-alt.github.io/medihelpers-form/recruit.html
- **용도:** 병원에서 의사 초빙을 의뢰하는 폼
- **항목:** 병의원명, 담당자 정보, 전화번호, 병원 주소, 이메일, 전공과목, 의사 나이/성별, 예상 페이, 세부전공 유무, 경력 유무, 기타 사항

## 게시판 삽입 코드

### 이력서 폼
```html
<iframe src="https://aijunny0604-alt.github.io/medihelpers-form/" width="100%" height="1200" frameborder="0" style="border:none;"></iframe>
```

### 초빙 의뢰서 폼
```html
<iframe src="https://aijunny0604-alt.github.io/medihelpers-form/recruit.html" width="100%" height="1400" frameborder="0" style="border:none;"></iframe>
```

## 폼 제출 동작
- 제출된 데이터는 **hr@medihelpers.co.kr**로 이메일 전송 (FormSubmit.co 사용)
- HTTP 정상 응답과 FormSubmit의 명시적 `success: true` 또는 `"true"`를 모두 확인한 경우만 감사 화면 표시
- 통신·서버·응답 오류 시 입력 내용을 보존하고 오류 안내 및 재시도 제공
- 전송 중 중복 제출 차단, 응답 본문을 포함해 30초 제한, 자동 재전송 없음
- 응답 지연 시 실제 접수 여부가 불확실할 수 있으므로 담당자 확인 안내
- 이력서 폼: 전문의 선택 시에만 전문 과목 입력란 표시 (필수)

## 검증

`node form-submit.test.mjs` — 의뢰서·이력서 연결, 성공 응답 두 형식, 통신 실패, HTTP 500/429, API 거절, 비정상 JSON, 중복 제출, 제한 시간, 늦은 응답, 입력 보존 및 재시도 24개 검사.

2026-10-20 실패 응답과 catch에서도 감사 화면을 표시하던 오류를 수정했다. 수신 주소·폼 항목·랭크업 사이트·DNS·회원·결제 설정은 변경하지 않는다. API 성공은 메일 발송 서비스의 요청 접수를 뜻하며 받은편지함 수신은 별도로 확인해야 한다.

### 2026-10-20 배포 및 실제 발송 검수

- 수정 커밋: `08ede51d51de7a72a5840e2a64f06bfe411a4126`
- [GitHub Pages 배포 성공](https://github.com/aijunny0604-alt/medihelpers-form/actions/runs/39393664989)
- 공개 `index.html`, `recruit.html`, `form-submit.js` HTTP 200 및 로컬 수정본과 내용 일치 확인.
- 자동 회귀검사 24개 통과, JavaScript 구문 검사와 Git 공백 오류 검사 통과.
- 공개 의뢰서·이력서 화면에서 개인정보 없는 합성 검수 자료를 각 1회 제출. 전송 중 버튼 비활성화 후 각 완료 화면으로 전환 확인.
- 검수 식별코드: `MH-QA-20261020-083151` (의뢰서·이력서 각각 구분).
- 실제 수신: 운영자가 `hr@medihelpers.co.kr`에서 **두 건 모두 수신**했다고 직접 확인. 에이전트가 메일함 원문/헤더를 열람한 것은 아니다.
- 기존 랭크업 호스팅·DNS·회원·공고·결제는 변경하지 않았다. 이번 검수는 별도 폼의 전송과 메일 수신 범위이며, 기존 회원 로그인·결제 검수를 대신하지 않는다.

## 호스팅
- GitHub Pages (무료)
- 저장소: https://github.com/aijunny0604-alt/medihelpers-form
