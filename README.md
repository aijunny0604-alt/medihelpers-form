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
- 제출 후 같은 페이지에서 감사 화면 표시
- 이력서 폼: 전문의 선택 시에만 전문 과목 입력란 표시 (필수)

## 호스팅
- GitHub Pages (무료)
- 저장소: https://github.com/aijunny0604-alt/medihelpers-form
