const fs = require('fs');
const path = require('path');

const sourceHTML = path.join(__dirname, '../source/panel/index.html');
const destinationHTML = path.join(__dirname, '../dist/panels/index.html');

const sourceCSS = path.join(__dirname, '../source/panel/index.css');
const destinationCSS = path.join(__dirname, '../dist/panels/index.css');

// dist/panels 폴더가 없으면 생성
const distPanelDir = path.join(__dirname, '../dist/panels');
if (!fs.existsSync(distPanelDir)) {
  fs.mkdirSync(distPanelDir, { recursive: true });
}

try {
  fs.copyFileSync(sourceHTML, destinationHTML);
  console.log('index.html 파일을 dist/panels 폴더로 복사했습니다.');
} catch (error) {
  console.error('index.html 파일 복사 실패:', error);
}

try {
  if (fs.existsSync(sourceCSS)) {
    fs.copyFileSync(sourceCSS, destinationCSS);
    console.log('index.css 파일을 dist/panels 폴더로 복사했습니다.');
  } else {
    console.log('index.css 파일이 source/panel 폴더에 없습니다.');
  }
} catch (error) {
  console.error('index.css 파일 복사 실패:', error);
}