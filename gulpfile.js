(function() {

var gulp = require('gulp'),
    webserver = require('gulp-webserver'),
    runSequence = require('run-sequence'),
    del = require('del'),
    stylus = require('gulp-stylus'),
    rename = require("gulp-rename"),
    concat = require('gulp-concat'),
    sourcemaps = require('gulp-sourcemaps'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    uglify = require('gulp-uglify'),
    gutil = require('gulp-util'),
    htmlreplace = require('gulp-html-replace'),
    open = require('gulp-open'),
    CacheBuster = require('gulp-cachebust'),
    cachebust = new CacheBuster(),
    imagemin = require('gulp-imagemin'),
    cache = require('gulp-cache'),
    mainBowerFiles = require('main-bower-files'),
    less = require('gulp-less'),
    cssmin = require('gulp-cssmin'),
    spritesmith = require('gulp.spritesmith'),
    merge = require('merge-stream');

  // Define app file path variables
  var paths = {
    root: './app/',                               // App root path
    css: './app/css/',                            // CSS path
    js: './app/js/',                              // JS path
    img: './app/img/',                            // Img path
    fonts: './app/fonts/',                        // Fonts path
    templates: './app/templates/',                // Templates path
    preGulpBower: './bower_comp/',                // Bower path when project starts
    bower: './bower_components/',                 // Bower path after gulp replacing
    stylus: './stylus/',                          // Stylus path
    bs_variables: './bs_variables/',              // Bootstrap variables
    sprite_images: './sprite_images/'             // Sprite images for build
  };

/////////////////////////////////////////////////////////////////////////////////////
//
// cleans the dev/prod output
//
/////////////////////////////////////////////////////////////////////////////////////

  gulp.task('clean', function () {
    return del([
      paths.css,
      paths.img + 'sprite*.*', // sprite image
      paths.js + 'bower_vendors/',
      paths.bower,
      paths.stylus + 'sprites/'
    ]);
  });

/////////////////////////////////////////////////////////////////////////////////////
//
// replace main Bower files
//
/////////////////////////////////////////////////////////////////////////////////////

  gulp.task('mainBowerFiles', function() {
    return gulp
      .src(mainBowerFiles(), {
        base: paths.preGulpBower
      })
      .pipe(gulp.dest( paths.bower ));
  });

/////////////////////////////////////////////////////////////////////////////////////
//
// prepare variables.less and compile bs css file
//
/////////////////////////////////////////////////////////////////////////////////////

  gulp.task('bs:prepareLess', function() {
    return gulp
      .src( paths.bs_variables + 'variables.less' )
      .pipe(gulp.dest( paths.bower + 'bootstrap/less/'));
  });

  gulp.task('bs:compileLess', function() {
    return gulp
      .src( paths.bower + 'bootstrap/less/bootstrap.less' )
      .pipe(less().on('error', function (err) {
        console.log(err);
      }))
      .pipe(cssmin().on('error', function(err) {
        console.log(err);
      }))
      .pipe(rename({
        suffix: '.min'
      }))
      .pipe(gulp.dest( paths.bower + 'bootstrap/dist/css/' ));
  });

/////////////////////////////////////////////////////////////////////////////////////
//
// replace twitter bootstrap from bower components to the app folder
//
/////////////////////////////////////////////////////////////////////////////////////

  gulp.task('bs:css', function() {
    return gulp
      .src([
        paths.bower + 'bootstrap/dist/css/bootstrap.min.css'
      ])
      .pipe(gulp.dest( paths.css + 'bootstrap/css/' ));
  });

  gulp.task('bs:fonts', function() {
    return gulp
      .src([
        paths.bower + 'bootstrap/dist/fonts/**'
      ])
      .pipe(gulp.dest( paths.css + 'bootstrap/fonts/' ));
  });

/////////////////////////////////////////////////////////////////////////////////////
//
// replace modernizr from bower components to the app folder
//
/////////////////////////////////////////////////////////////////////////////////////

  gulp.task('modernizr', function() {
    return gulp
      .src([
        paths.bower + 'modernizr/node_modules/Modernizr/modernizr.custom.js'
      ])
      .pipe(rename({
        basename: 'modernizr.min'
      }))
      .pipe(gulp.dest( paths.js + 'bower_vendors/' ));
  });

/////////////////////////////////////////////////////////////////////////////////////
//
// replace bower components to the app folder
//
/////////////////////////////////////////////////////////////////////////////////////

  gulp.task('bwr_comp:css', function() {
    return gulp
      .src([
        paths.bower + 'zoomove/dist/zoomove.min.css',
        paths.bower + 'flickity/dist/flickity.min.css',
        paths.bower + 'normalize-css/normalize.css'
      ])
      .pipe(gulp.dest( paths.css ));
  });

  gulp.task('bwr_comp:js', ['bwr_comp:css'], function() {
    return gulp
      .src([
        paths.bower + 'zoomove/dist/zoomove.min.js',
        paths.bower + 'flickity/dist/flickity.pkgd.min.js',
        paths.bower + 'jquery/dist/jquery.min.js',
        paths.bower + 'bootstrap/dist/js/*min.js'
      ])
      .pipe(gulp.dest( paths.js + 'bower_vendors/' ));
  });

/////////////////////////////////////////////////////////////////////////////////////
//
// create sprite of icons
//
/////////////////////////////////////////////////////////////////////////////////////

  gulp.task('sprite', function () {
    // Generate our spritesheet
    var spriteData = gulp
      .src( paths.sprite_images + '*.*' )
      .pipe(spritesmith({
        imgName: 'sprite.png',
        cssName: 'sprite.styl',
        algorithm: 'top-down',
        padding: 2,
        cssOpts: {
          functions: false // omit creating mixins
        }
      }));

    // Pipe image stream through image optimizer and onto disk
    var imgStream = spriteData.img
      // DEV: We must buffer our stream into a Buffer for `imagemin`
      .pipe(buffer())
      .pipe(imagemin())
      .pipe(gulp.dest( paths.img ));

    // Pipe CSS stream through CSS optimizer and onto disk
    var cssStream = spriteData.css
      .pipe(gulp.dest( paths.stylus + 'sprites' ));

    // Return a merged stream to handle both `end` events
    return merge(imgStream, cssStream);
  });

/////////////////////////////////////////////////////////////////////////////////////
//
// compile *.styl, stylus' errors are processed properly
//
/////////////////////////////////////////////////////////////////////////////////////

  gulp.task('styl', function (done) {
    gulp.src( paths.stylus + 'MAIN.styl' )
      .pipe(sourcemaps.init())
      .pipe(stylus()
        .on('error', function(err) {
          done(err);
        }))
      .pipe(rename({
        basename: 'styles'
      }))
      .pipe(sourcemaps.write( '.' ))
      .pipe(gulp.dest( paths.css ))
      .on('end', function() {
        done();
      });
  });

/////////////////////////////////////////////////////////////////////////////////////
//
// watches *.styl files and triggers separate tasks when a modification is detected
//
/////////////////////////////////////////////////////////////////////////////////////

  gulp.task('watch', function() {

    var files = [
      paths.stylus + '**/*',
      paths.root + '*.html',
      paths.js + 'main.js',
      paths.bs_variables + 'variables.less'
    ];

    gulp.watch( files[0] || files[1] || files[2], ['styl'] );
    gulp.watch( files[3], ['updateBS'] );
  });

  gulp.task('updateBS', function(callback) {
    // run tasks sync
    runSequence(
      'bs:prepareLess',
      'bs:compileLess',
      'bs:css',
      callback
    );
  });

/////////////////////////////////////////////////////////////////////////////////////
//
// launches a web server with livereload and open app in browser
//
/////////////////////////////////////////////////////////////////////////////////////

  gulp.task('webserver', function() {
    gulp.src('.')
      .pipe(webserver({
        livereload: true,
        directoryListing: true,
        open: 'http://localhost:8000/app/cart.html'
      }));
  });

/////////////////////////////////////////////////////////////////////////////////////
//
// dev build
//
/////////////////////////////////////////////////////////////////////////////////////

  gulp.task('dev', function(callback) {
    // run tasks sync
    runSequence(
      'mainBowerFiles',
      'bs:prepareLess',
      'bs:compileLess',
      'bs:css',
      'bs:fonts',
      'modernizr',
      'bwr_comp:js',
      'sprite',
      'styl',
      'webserver',
      'watch',
      callback
    );
  });

})();