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
    {execFile, execFileSync} = require("child_process"),
    asar = require('asar');

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

gulp.task('build', function () {

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
	.on("end", () => {
	    asar.createPackage( './build', './dist/resources/app.asar', function() {
	    reload.changed("app.asar");
	    })
	})
    .pipe(fs.createWriteStream("build/app.js", {encoding:"UTF-8"}))
    .on("error", swallowError);
});


gulp.task('web-build', function () {

  var b = browserify({
    entries: './src/web.js',
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


gulp.task('pg-build', function () {
  
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
    .pipe(fs.createWriteStream("build/www/app.js", {encoding:"UTF-8"}))
    .on("error", swallowError);
});

gulp.task('pg-move', function(){
  return gulp.src(["./res/**/*"])
      .pipe(gulp.dest('build/www'));
})

gulp.task('pg-copy', function(){
    return gulp.src(["./res-pg/**/*"])
        .pipe(gulp.dest('build'));
})

gulp.task('cordova', function( cb ){
    let cordova = require("cordova-lib").cordova;
    process.env.PWD = __dirname + "/build"; 
    cordova.build({
        "platforms": ["android"],
        "options": {
            argv: ["--release","--gradleArg=--no-daemon"]
        }
    }, cb);
});

gulp.task('android', sequence('clean', 'pg-copy', 'pg-move', 'pg-build', 'cordova'))

gulp.task('watch', ['build', 'copy'], function(){
    gulp.watch('./src/**/*', ['build']);
    gulp.watch('./res/**/*', ['copy']);
});

gulp.task('web-watch', ['web-build', 'copy'], function(){
    gulp.watch('./src/**/*', ['web-build']);
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
