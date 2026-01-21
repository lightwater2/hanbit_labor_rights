#!/usr/bin/env node
/**
 * 빌드 스크립트: 분리된 소스 파일들을 아임웹 코드 위젯용 단일 HTML로 병합
 * CSV 데이터를 인라인 JS 객체로 변환하여 외부 요청 없이 동작
 *
 * 사용법: node build.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');

// 파일 읽기 헬퍼
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf-8');

// CSV 파싱 (간단한 구현)
const parseCSV = (csvText) => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    // 헤더 파싱
    const headers = parseCSVLine(lines[0]);

    // 데이터 파싱
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length === 0 || values.every(v => !v.trim())) continue;

        const row = {};
        headers.forEach((header, idx) => {
            if (header.trim()) {
                row[header.trim()] = (values[idx] || '').trim();
            }
        });
        data.push(row);
    }
    return data;
};

// CSV 라인 파싱 (따옴표 처리)
const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
};

// CSV 파일들을 JS 데이터로 변환
const buildInlineData = () => {
    const dataDir = path.join(ROOT, 'data');

    const categories = parseCSV(fs.readFileSync(path.join(dataDir, 'categories.csv'), 'utf-8'));
    const quotes = parseCSV(fs.readFileSync(path.join(dataDir, 'quotes.csv'), 'utf-8'));
    const stats = parseCSV(fs.readFileSync(path.join(dataDir, 'stats.csv'), 'utf-8'));

    return { categories, quotes, stats };
};

// CSS 파일 병합
const buildCSS = () => {
    const files = ['style.css', 'masonry-gallery.css'];
    let css = files.map(read).join('\n\n');

    // 아임웹용 CSS 변환
    css = transformCSSForImweb(css);

    return css;
};

// 아임웹용 CSS 변환 (rem→px, !important 추가)
const transformCSSForImweb = (css) => {
    // 1. rem을 px로 변환 (1rem = 16px)
    css = css.replace(/(\d*\.?\d+)rem/g, (match, num) => {
        const px = Math.round(parseFloat(num) * 16);
        return `${px}px`;
    });

    // 2. 주요 속성에 !important 추가 (이미 있는 경우 제외)
    const importantProps = [
        'font-size',
        'font-weight',
        'font-family',
        'color',
        'background-color',
        'background',
        'line-height',
        'letter-spacing',
        // 레이아웃 속성 (아임웹 오버라이드 방지)
        'display',
        'flex-direction',
        'align-items',
        'justify-content',
        'gap',
        'text-align'
    ];

    importantProps.forEach(prop => {
        // 속성값 뒤에 !important가 없는 경우만 추가
        const regex = new RegExp(`(${prop}\\s*:\\s*)([^;!]+)(;)`, 'g');
        css = css.replace(regex, (match, prefix, value, semi) => {
            // 이미 !important가 있으면 그대로
            if (value.includes('!important')) return match;
            return `${prefix}${value.trim()} !important${semi}`;
        });
    });

    // 3. 아임웹 오버라이드용 추가 스타일 삽입
    const imwebOverrides = `
/* === 아임웹 오버라이드 스타일 (빌드 시 자동 추가) === */

/* 기본 폰트 크기 리셋 */
#labor-rights-app {
    font-size: 16px !important;
}

/* 전역 폰트 강제 */
#labor-rights-app {
    font-family: 'Outfit', 'Noto Sans KR', sans-serif !important;
    box-sizing: border-box !important;
    line-height: 1.6 !important;
}

#labor-rights-app * {
    font-family: inherit !important;
    box-sizing: border-box !important;
}

#labor-rights-app p,
#labor-rights-app h1,
#labor-rights-app h2,
#labor-rights-app h3,
#labor-rights-app span,
#labor-rights-app div {
    line-height: inherit !important;
}

/* SVG 배경 투명 */
#voice-icon,
.voice-icon-container svg,
.voice-icon-container svg * {
    background-color: transparent !important;
}

/* 로딩 화면 클릭 방지 */
.loading-screen {
    cursor: wait !important;
}

/* 네비게이션 링크 색상 강제 */
.nav-link {
    color: var(--text-light) !important;
}

.nav-link:hover {
    color: var(--text-light) !important;
}

.nav-link.active {
    color: var(--primary) !important;
}

/* 가이드 텍스트 강제 표시 */
.interaction-guide .guide-text,
.guide-text,
#interaction-guide .guide-text,
#interaction-guide p,
.interaction-guide p {
    display: block !important;
    visibility: visible !important;
    color: #f4efe1 !important;
    opacity: 0.8 !important;
    font-size: 14px !important;
    font-weight: 300 !important;
    line-height: 1.5 !important;
    letter-spacing: 0.1em !important;
    text-transform: uppercase !important;
    height: auto !important;
    min-height: 1em !important;
    overflow: visible !important;
    text-indent: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
}

/* 푸터 좌측 정렬 강제 */
.site-footer,
.footer-container,
.footer-info,
.footer-row,
.footer-support {
    text-align: left !important;
}

.footer-row {
    display: flex !important;
    flex-direction: row !important;
    justify-content: flex-start !important;
    align-items: baseline !important;
    gap: 24px !important;
}

.footer-row .label {
    text-align: left !important;
    width: 120px !important;
    min-width: 120px !important;
    max-width: 120px !important;
    flex-shrink: 0 !important;
}

.footer-row .content {
    text-align: left !important;
}

/* 통계 숫자 흔들림 방지 */
.stat-number,
.stat-value,
.counter {
    font-variant-numeric: tabular-nums !important;
    -webkit-font-feature-settings: "tnum" !important;
    font-feature-settings: "tnum" !important;
}

.stat-card {
    overflow: hidden !important;
}

.stat-value {
    min-width: max-content !important;
    white-space: nowrap !important;
}

/* 450px 이하 스탯 카드 정렬 */
@media (max-width: 450px) {
    .stats-grid,
    .stat-card {
        width: 100% !important;
        max-width: 100% !important;
        margin-left: 0 !important;
        margin-right: 0 !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
    }
}

/* 모바일 이야기 본문 좌측 정렬 */
@media (max-width: 768px) {
    .reveal-container,
    .reveal-text,
    .reveal-paragraph {
        text-align: left !important;
    }
}
`;

    return css + imwebOverrides;
};

// JS 파일 읽기
const buildMasonryGalleryJS = () => {
    return read('masonry-gallery.js');
};

// HTML 마크업 (index.html에서 body 내용 추출)
const buildHTML = () => {
    const html = read('index.html');
    // loading-screen부터 interaction-guide까지 추출
    const match = html.match(/<div id="loading-screen"[\s\S]*?<div id="interaction-guide"[\s\S]*?<\/div>/);
    if (!match) {
        console.error('Error: Could not extract content from index.html');
        process.exit(1);
    }
    return match[0];
};

// main.js 읽기
const buildMainJS = () => {
    return read('main.js');
};

// 최종 위젯 HTML 생성
const buildWidget = () => {
    const css = buildCSS();
    const htmlContent = buildHTML();
    const inlineData = buildInlineData();
    const masonryGalleryJS = buildMasonryGalleryJS();
    const mainJS = buildMainJS();

    console.log(`  - quotes: ${inlineData.quotes.length}개`);
    console.log(`  - categories: ${inlineData.categories.length}개`);
    console.log(`  - stats: ${inlineData.stats.length}개`);

    // main.js에서 DataLoader 부분을 인라인 데이터 사용으로 대체
    let modifiedMainJS = mainJS.replace(
        /const DataLoader[\s\S]*?getAllData\(\)[\s\S]*?\}\s*\};/,
        `const DataLoader = {
            async getAllData() {
                return window.INLINE_DATA || null;
            }
        };`
    );

    // 아임웹용 JS 변환: loadingComplete 플래그 추가
    modifiedMainJS = transformJSForImweb(modifiedMainJS);

    const output = `<!--
  아임웹 코드 위젯용 (자동 생성됨)
  생성 시간: ${new Date().toISOString()}
  데이터: 인라인 (외부 CSV 요청 없음)
-->

<!-- 외부 의존성 -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;700&family=Noto+Sans+KR:wght@300;400;700&display=swap" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>

<!-- 인라인 데이터 및 DataLoader -->
<script>
window.INLINE_DATA = ${JSON.stringify(inlineData, null, 2)};

// 인라인 DataLoader (전역)
window.DataLoader = {
    async getAllData() {
        return window.INLINE_DATA || null;
    }
};
</script>

<!-- 스타일 -->
<style>
${css}
</style>

<!-- 마크업 -->
${htmlContent}

<!-- MasonryGallery -->
<script>
${masonryGalleryJS}
</script>

<!-- 메인 스크립트 -->
<script>
${modifiedMainJS}
</script>
`;

    return output;
};

// 아임웹용 JS 변환 (로딩 완료 전 클릭 방지)
const transformJSForImweb = (js) => {
    // 이미 loadingComplete가 있으면 변환 생략
    if (js.includes('loadingComplete')) {
        return js;
    }

    // 1. loadingComplete 플래그 추가
    js = js.replace(
        /let experienceStarted = false;/,
        `let experienceStarted = false;
    let loadingComplete = false; // 아임웹용: 로딩 완료 전 클릭 방지`
    );

    // 2. startExperience에서 loadingComplete 체크 추가
    js = js.replace(
        /const startExperience = async \(\) => \{\s*if \(experienceStarted\) return;/,
        `const startExperience = async () => {
        if (experienceStarted) return;
        if (!loadingComplete) return; // 로딩 완료 전 클릭 무시`
    );

    // 3. hideLoadingScreen 전에 loadingComplete = true 설정
    js = js.replace(
        /\/\/ Hide loading screen\s*hideLoadingScreen\(\);/,
        `// Mark loading as complete
        loadingComplete = true;

        // Hide loading screen
        hideLoadingScreen();`
    );

    return js;
};

// 이미지 경로를 FTP URL로 변환
const replaceImagePaths = (html) => {
    const FTP_BASE = 'https://hanbitcenter.dothome.co.kr/src/';
    const replacements = [
        ['src="logo.png"', `src="${FTP_BASE}logo.png"`],
        ['src="logo-loading.png"', `src="${FTP_BASE}logo-loading.png"`],
        ['src="picture1.jpg"', `src="${FTP_BASE}picture1.jpg"`],
        ['src="picture2.jpg"', `src="${FTP_BASE}picture2.jpg"`],
        ['src="picture3.jpg"', `src="${FTP_BASE}picture3.jpg"`],
        ['src="picture4.jpg"', `src="${FTP_BASE}picture4.jpg"`],
        ['src="picture5.jpg"', `src="${FTP_BASE}picture5.jpg"`],
        ['src="picture6.jpg"', `src="${FTP_BASE}picture6.jpg"`],
    ];

    let result = html;
    replacements.forEach(([from, to]) => {
        result = result.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
    });
    return result;
};

// 메인 실행
const main = () => {
    console.log('Building imweb-widget.html...');
    console.log('CSV 데이터 인라인 변환 중...');

    // dist 폴더 확인
    if (!fs.existsSync(DIST)) {
        fs.mkdirSync(DIST, { recursive: true });
    }

    // 위젯 HTML 생성
    let widget = buildWidget();

    // 이미지 경로 변환
    widget = replaceImagePaths(widget);
    console.log('✓ 이미지 경로 FTP URL로 변환 완료');

    fs.writeFileSync(path.join(DIST, 'imweb-widget.html'), widget);
    console.log('✓ dist/imweb-widget.html 생성 완료');

    console.log('\n외부 CSV 요청 없이 동작합니다. 바로 아임웹에 붙여넣기 하세요.');
};

main();
