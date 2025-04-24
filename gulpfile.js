// @ts-check

const path = require('path');
const gulp = require('gulp');
const modifyFile = require('gulp-modify-file');
const concat = require('gulp-concat');

const yamlFilesPath = './src-data/';
const yamlFiles = [
  '00-root.yaml',
  '01-hoodies.yaml',
  '02-sweatshirts.yaml',
  '03-t-shirts.yaml',
  '04-longsleeves.yaml',
].map((f) => yamlFilesPath + f);

/**
 * @param {string} content
 * @param {string} fileName
 * @param {File} _file
 */
function modifyContent(content, fileName, _file) {
  const baseName = path.basename(fileName);
  const isRoot = baseName.startsWith('00');
  if (!isRoot) {
    const changed = content.replace(/^/gm, '  ');
    return changed;
  }
  return content;
}

gulp.task('combineData', () => {
  return gulp
    .src(yamlFiles)
    .pipe(modifyFile(modifyContent))
    .pipe(concat('data.yaml'))
    .pipe(gulp.dest('./src/data/'));
});

gulp.task('combineDataWatchOnly', () => {
  gulp.watch(yamlFiles, gulp.series('combineData'));
});

gulp.task('combineDataWatch', gulp.series('combineData', 'combineDataWatchOnly'));
