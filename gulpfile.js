//initialize all of our variables
var app, base, concat, directory, gulp, gutil, hostname, path, refresh, sass, uglify, imagemin, minifyCSS, del, browserSync, autoprefixer, gulpSequence, shell, sourceMaps, plumber;

var autoPrefixBrowserList = ['last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'];

//load all of our dependencies
//add more here if you want to include more libraries
gulp         = require('gulp');
gutil        = require('gulp-util');
concat       = require('gulp-concat');
uglify       = require('gulp-uglify');
sass         = require('gulp-sass');
sourceMaps   = require('gulp-sourcemaps');
imagemin     = require('gulp-imagemin');
minifyCSS    = require('gulp-clean-css');
browserSync  = require('browser-sync');
autoprefixer = require('gulp-autoprefixer');
gulpSequence = require('gulp-sequence').use(gulp);
shell        = require('gulp-shell');
plumber      = require('gulp-plumber');

gulp.task('browserSync', function() {
    browserSync({
        server: {
            baseDir: "src/"
        },
        options: {
            reloadDelay: 250
        },
        notify: false
    });
});


//compressing images & handle SVG files
gulp.task('images', function(tmp) {
    gulp.src(['src/images/*.jpg', 'src/images/*.png'])
        //prevent pipe breaking caused by errors from gulp plugins
        .pipe(plumber())
        .pipe(imagemin({ optimizationLevel: 5, progressive: true, interlaced: true }))
        .pipe(gulp.dest('src/images'));
});

//compressing images & handle SVG files
gulp.task('images-deploy', function() {
    gulp.src(['src/images/**/*', '!src/images/README'])
        //prevent pipe breaking caused by errors from gulp plugins
        .pipe(plumber())
        .pipe(gulp.dest('demo/images'));
});

//compiling our Javascripts
gulp.task('scripts', function() {
    //this is where our dev JS scripts are
    return gulp.src(['src/scripts/src/_includes/**/*.js', 'src/scripts/src/**/*.js'])
                //prevent pipe breaking caused by errors from gulp plugins
                .pipe(plumber())
                //this is the filename of the compressed version of our JS
                .pipe(concat('app.js'))
                //catch errors
                .on('error', gutil.log)
                //where we will store our finalized, compressed script
                .pipe(gulp.dest('src/scripts'))
                //notify browserSync to refresh
                .pipe(browserSync.reload({stream: true}));
});

//compiling our Javascripts for deployment
gulp.task('scripts-deploy', function() {
    //this is where our dev JS scripts are
    return gulp.src(['src/scripts/src/_includes/**/*.js', 'src/scripts/src/**/*.js'])
                //prevent pipe breaking caused by errors from gulp plugins
                .pipe(plumber())
                //this is the filename of the compressed version of our JS
                .pipe(concat('app.js'))
                //compress :D
                .pipe(uglify())
                //where we will store our finalized, compressed script
                .pipe(gulp.dest('demo/scripts'));
});

function styleSetting(filename) {
    //the initializer / master SCSS file, which will just be a file that imports everything
    return gulp.src('src/styles/scss/'+filename+'.scss')
                //prevent pipe breaking caused by errors from gulp plugins
                .pipe(plumber({
                  errorHandler: function (err) {
                    console.log(err);
                    this.emit('end');
                  }
                }))
                //get sourceMaps ready
                .pipe(sourceMaps.init())
                //include SCSS and list every "include" folder
                .pipe(sass({
                      errLogToConsole: true,
                      includePaths: [
                          'src/styles/scss/'
                      ]
                }))
                .pipe(autoprefixer({
                   browsers: autoPrefixBrowserList,
                   cascade:  true
                }))
                //catch errors
                .on('error', gutil.log)
                //the final filename of our combined css file
                .pipe(concat(''+filename+'.css'))
                //get our sources via sourceMaps
                .pipe(sourceMaps.write())
                //where to save our final, compressed css file
                .pipe(gulp.dest('src/styles'))
                //notify browserSync to refresh
                .pipe(browserSync.reload({stream: true}));
}

//compiling our SCSS files
gulp.task('styles', function() {
    return styleSetting('gridflex')
});

//compiling our SCSS files
gulp.task('styles2', function() {
    return styleSetting('demo-layout')
});

function styleDeploySetting(filename) {
    //the initializer / master SCSS file, which will just be a file that imports everything
    return gulp.src('src/styles/scss/'+filename+'.scss')
                .pipe(plumber())
                //include SCSS includes folder
                .pipe(sass({
                      includePaths: [
                          'src/styles/scss',
                      ]
                }))
                .pipe(autoprefixer({
                  browsers: autoPrefixBrowserList,
                  cascade:  true
                }))
                //the final filename of our combined css file
                .pipe(concat(''+filename+'.css'))
                .pipe(minifyCSS())
                //where to save our final, compressed css file
                .pipe(gulp.dest('demo/styles'))
                .pipe(gulp.dest('lib'));
}

//compiling our SCSS files for deployment
gulp.task('styles-deploy', function() {
    return styleDeploySetting('gridflex')
});

//compiling our SCSS files for deployment
gulp.task('styles-deploy2', function() {
    return styleDeploySetting('demo-layout')
});

//basically just keeping an eye on all HTML files
gulp.task('html', function() {
    //watch any and all HTML files and refresh when something changes
    return gulp.src('src/*.html')
        .pipe(plumber())
        .pipe(browserSync.reload({stream: true}))
        //catch errors
        .on('error', gutil.log);
});

//migrating over all HTML files for deployment
gulp.task('html-deploy', function() {
    //grab everything, which should include htaccess, robots, etc
    gulp.src('src/*')
        //prevent pipe breaking caused by errors from gulp plugins
        .pipe(plumber())
        .pipe(gulp.dest('demo'));

    //grab any hidden files too
    gulp.src('src/.*')
        //prevent pipe breaking caused by errors from gulp plugins
        .pipe(plumber())
        .pipe(gulp.dest('demo'));

    gulp.src('src/fonts/**/*')
        //prevent pipe breaking caused by errors from gulp plugins
        .pipe(plumber())
        .pipe(gulp.dest('demo/fonts'));

    //grab all of the styles
    gulp.src(['src/styles/*.css', '!src/styles/demo-layout.css', '!src/styles/gridflex.css'])
        //prevent pipe breaking caused by errors from gulp plugins
        .pipe(plumber())
        .pipe(gulp.dest('demo/styles'))
        .pipe(gulp.dest('lib'));
});

//cleans our gridflex directory in case things got deleted
gulp.task('clean', function() {
    return shell.task([
      'rm -rf demo',
      'rm -rf lib'
    ]);
});

//create folders using shell
gulp.task('scaffold', function() {
  return shell.task([
      'mkdir demo',
      'mkdir lib',
      // 'mkdir demo/fonts',
      // 'mkdir demo/images',
      // 'mkdir demo/scripts',
      'mkdir demo/styles'
    ]
  );
});

//this is our master task when you run `gulp` in CLI / Terminal
//this is the main watcher to use when in active development
//  this will:
//  startup the web server,
//  start up browserSync
//  compress all scripts and SCSS files
gulp.task('default', ['browserSync', 'styles', 'styles2'], function() {
    //a list of watchers, so it will watch all of the following files waiting for changes
    gulp.watch('src/scripts/src/**', ['scripts']);
    gulp.watch('src/styles/scss/**', ['styles', 'styles2']);
    // gulp.watch('src/images/**', ['images']);
    gulp.watch('src/*.html', ['html']);
    // gulp.watch('src/*.md', ['md']);
});

//this is our deployment task, it will set everything for deployment-ready files
gulp.task('build', gulpSequence('clean', 'scaffold', ['styles-deploy', 'styles-deploy2'], 'html-deploy'));
