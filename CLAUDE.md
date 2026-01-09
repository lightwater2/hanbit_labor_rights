# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

노동인권 관련 인터랙티브 원페이지 웹사이트. 아임웹(imweb) 코드 위젯으로 배포.

## 배포 환경: 아임웹 코드 위젯

**참고**: https://imweb.me/faq?mode=view&category=29&category2=38&idx=329

- **단일 코드 위젯**에 HTML + CSS + JS 모두 인라인으로 삽입
- 클라이언트 사이드만 지원 (HTML, JavaScript, CSS)
- jQuery, Bootstrap 이미 로드됨 (중복 선언 불필요)
- 미리보기 모드에서만 코드 확인 가능

## 폴더 구조

```
hanbit_exam/
├── index.html              # 로컬 개발용 (분리된 파일 참조)
├── main.js                 # 메인 로직 소스
├── dome-gallery.js         # 3D 구체 갤러리 클래스
├── data-loader.js          # CSV 데이터 로더
├── style.css               # 메인 스타일
├── dome-gallery.css        # 갤러리 스타일
├── data/                   # 배포용 CSV 데이터 (영문 파일명)
│   ├── categories.csv
│   ├── quotes.csv
│   └── stats.csv
├── dist/                   # 배포용
│   ├── imweb-widget.html   # ★ 아임웹 코드 위젯에 삽입 (올인원)
│   └── data/               # CSV 파일 (외부 스토리지 업로드용)
└── _client-source/         # 클라이언트 제공 원본 (배포 제외)
```

## 개발 명령어

```bash
npm run dev      # 로컬 개발 서버 (루트에서)
npm run build    # dist/imweb-widget.html 생성
npm run preview  # 빌드 후 dist에서 미리보기
```

## 배포 절차

### 1. 빌드
```bash
npm run build
```
CSV 데이터가 JS 객체로 인라인 변환됨 (외부 요청 없음)

### 2. 아임웹에 삽입
1. 디자인 모드 → 위젯 추가(+) → 코드 위젯
2. 위젯 설정 클릭
3. `dist/imweb-widget.html` 전체 내용 붙여넣기
4. 저장 → 미리보기에서 확인

## 외부 의존성 (CDN)

- **Google Fonts**: Outfit, Noto Sans KR (폰트만)

## 소스 수정 시

로컬에서 개발 후 `dist/imweb-widget.html`에 반영:
- CSS 변경 → `<style>` 블록 업데이트
- JS 변경 → `<script>` 블록 업데이트
- HTML 변경 → `#labor-rights-app` 내부 업데이트

## CSS 변수

```css
--bg-dark: #2A2A2A
--bg-light: #f8f9fa
--text-dark: #3C3733
--text-light: #ffffff
--accent: #E62E2D
--brand-yellow: #FFCD21
```
