// including plugins
var gulp = require('gulp'), 
    uglify = require("gulp-uglify"),
    clean = require("gulp-clean"),
    browserify = require('browserify'),
    babelify = require('babelify'),
    source = require('vinyl-source-stream'),
    sourcemapify = require('sourcemapify'),
    sourcemaps = require('gulp-sourcemaps'),
    buffer = require('vinyl-buffer'),
    concat = require("gulp-concat"),
    zip = require("gulp-zip"),
    sequence = require("gulp-sequence"),
    reload = require("gulp-livereload"),
    {execFile, execFileSync} = require("child_process");

var fs = require('fs');

gulp.task('clean', function() {
  return gulp.src(['build/*'], {read: false})
    .pipe(clean());
});

gulp.task('copy', function(){
    gulp.src(['./res/**/*'])
        .pipe(gulp.dest('build'))
        .pipe(reload());
});

gulp.task('dry-di', function () {

  var b = browserify({
    entries: '../dry-di/dry-di.js',
    debug: true
  });

  b.plugin(sourcemapify, {root:'../'});

  b.transform(babelify, {
      // plugins:[
        // ["transform-class-properties"]
      // ],
      presets:[
        ["env", {targets:{uglify:[]}}
      ]
  ]});

  return b.bundle().pipe(fs.createWriteStream("build/dry-di.js", {encoding:"UTF-8"}));
});

gulp.task( "build-atcore-worker", function () {

  var b = browserify({
    entries: './src/atcore/Atcore.worker.js',
    debug: true
  });

  b.plugin(sourcemapify, {root:'../'});

  b.transform(babelify, {
      plugins:[
        ["transform-class-properties"],
        ["import-glob"]
      ],
      presets:[
        ["env", {targets:{uglify:[]}}]
      ]
  });

  return b
    .bundle()
    .pipe(fs.createWriteStream("build/atcore.worker.js", {create:true, encoding:"UTF-8"}));
});

gulp.task("build-test", ["build-atcore-worker"], function () {

  var b = browserify({
    entries: './src/test.js',
    debug: true
  });

  b.plugin(sourcemapify, {root:'../'});

  b.transform(babelify, {
      plugins:[
        ["transform-class-properties"],
        ["import-glob"]
      ],
      presets:[
        ["env", {targets:{uglify:[]}}]
      ]
  });

  return b
    .bundle()
    .on("end", () => reload.changed("app.js") )
    .pipe(fs.createWriteStream("build/test.js", {create:true, encoding:"UTF-8"}));
});

gulp.task('run-test', ['build-test'], function(){
  execFileSync("node.exe", ["build/test.node.js"], {stdio:[0,1,2]} );
});

gulp.task('test', ['run-test'], function(){
  reload.listen();
  gulp.watch('./src/**/*', ['run-test']);
});

function swallowError (error) {
  console.log(error.toString())
  this.emit('end')
}

gulp.task('build', ["build-atcore-worker"], function () {

  var b = browserify({
    entries: './src/pc.js',
    debug: true
  });

  b.plugin(sourcemapify, {root:'../'});

  b.transform(babelify, {
      plugins:[
        ["transform-class-properties"],
        ["import-glob"]
      ],
      presets:[
        ["env", {targets:{uglify:[]}}
      ]
  ]});

  return b
    .bundle()
    .on("end", () => reload.changed("app.js") )
    .pipe(fs.createWriteStream("build/app.js", {encoding:"UTF-8"}))
    .on("error", swallowError);
});

// gulp.task('pg-build', function(){
//     return gulp.src(['./build/**/*'])
//         .pipe(gulp.dest('./dist/'));
// });


gulp.task('pg-build', ["build-atcore-worker"], function () {
  
  var b = browserify({
    entries: './src/mobile.js',
    debug: true
  });

  b.plugin(sourcemapify, {root:'../'});

  b.transform(babelify, {
      plugins:[
        ["transform-class-properties"],
        ["import-glob"]
      ],
      presets:[
        ["env", {targets:{uglify:[]}}
      ]
  ]});

  return b
    .bundle()
    .pipe(fs.createWriteStream("dist/www/app.js", {encoding:"UTF-8"}))
    .on("error", swallowError);
});

gulp.task('pg-move', function(){
  return gulp.src(["./res/**/*"])
      .pipe(gulp.dest('dist/www'));
})

gulp.task('pg-copy', function(){
    return gulp.src(["./res-pg/**/*"])
        .pipe(gulp.dest('dist'));
})

gulp.task('pg-zip', function(){
    return gulp.src("./dist/**/*", {nodir: true})
      .pipe(zip("app.zip"))
      .pipe(gulp.dest("./"))
});

gulp.task('pg-postclean', function(){
  return gulp.src("./dist/*", {read:false})
    .on("error", swallowError)
    .pipe(clean())
});

gulp.task('package', sequence('pg-postclean', 'pg-move', 'pg-copy', 'pg-build', 'pg-zip'));

gulp.task('watch', ['build', 'copy'], function(){
    gulp.watch('./src/**/*', ['build']);
    gulp.watch('./res/**/*', ['copy']);
});

gulp.task('run', function(){
  gulp.watch('./src/**/*', ['build']);
  gulp.watch('./res/**/*', ['copy']);

  reload.listen();

  execFile("node.exe", [
    "c:\\Users\\felip\\AppData\\Roaming\\npm\\node_modules\\electron\\cli.js",
    "electron.js"
    ], {cwd:"build"}, (err, stdout, stderr)=>{
      process.exit();
    });
})

gulp.task('default', sequence(['build', 'copy'], 'run'));
