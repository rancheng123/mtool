var fs = require('fs');
var gulp = require('gulp');
var path = require('path');
var current_path = path.resolve(__dirname);
var src_path = path.resolve(current_path, './static');
var dist_path = path.resolve(current_path, './dist');


var staticSource = src_path+'/**/*.*';



fs.watch(src_path, (eventType, filename) => {

    //debugger

    compileStaticSource();
});

// gulp.watch(staticSource, function(){
//
// });
compileStaticSource();


//编译静态资源
function compileStaticSource(){
    console.log("compile staticSource  start")
    gulp.src(staticSource)
        .pipe(gulp.dest(dist_path));
    console.log("compile staticSource  end")

}





