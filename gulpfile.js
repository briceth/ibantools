"use strict";

const gulp = require("gulp");
const ts = require("gulp-typescript");
const shell = require("gulp-shell");
const mocha = require("gulp-mocha");
const merge = require("merge2");
const rename = require("gulp-rename");
const Server = require("karma").Server;

// Run karma tests only one time
gulp.task("karma", function(done) {
  new Server(
    {
      configFile: __dirname + "/karma.conf.js",
      singleRun: true
    },
    done
  ).start();
});

// generate coverage report
gulp.task(
  "istanbul",
  shell.task([
    "istanbul cover ./node_modules/mocha/bin/_mocha --report lcovonly -- -R spec && cat ./coverage/lcov.info | ./node_modules/coveralls/bin/coveralls.js && rm -rf ./coverage"
  ])
);

// Create JSDoc documentation
gulp.task(
  "doc",
  shell.task([
    "./node_modules/.bin/jsdoc dist/ibantools.js -d docs -r README.md -t node_modules/docdash"
  ])
);

// Compile typescript sources - for bower - amd
gulp.task("build-bower", function() {
  let build_result = gulp
    .src(["src/**/*.ts"])
    .pipe(ts({ module: "amd", target: "ES5", declaration: true }));
  return merge([
    build_result.dts.pipe(rename("ibantools.d.ts")).pipe(gulp.dest("./dist")),
    build_result.js.pipe(rename("ibantools.js")).pipe(gulp.dest("./dist"))
  ]);
});

// Compile typescript sources - node package - commonjs es5
gulp.task("build", function() {
  let build_result = gulp
    .src(["src/**/*.ts"])
    .pipe(ts({ module: "commonjs", target: "ES5", declaration: true }));
  return merge([
    build_result.dts.pipe(rename("ibantools.d.ts")).pipe(gulp.dest("./build")),
    build_result.js.pipe(rename("ibantools.js")).pipe(gulp.dest("./build"))
  ]);
});

// compile es5 module - both bower and node, for "module" part of `package.json`
gulp.task("build-module", function() {
  return gulp
    .src(["src/**/*.ts"])
    .pipe(ts({ module: "ES2015", target: "ES5" }))
    .js.pipe(rename("ibantools.js"))
    .pipe(gulp.dest("./jsnext"));
});

// Compile typescript tests, umd, I'll run tests from node and "browser"
gulp.task("build-tests", function() {
  return gulp
    .src(["test/**/*.ts"])
    .pipe(ts({ module: "umd", target: "ES5" }))
    .js.pipe(gulp.dest("./test"));
});

// Run tests
gulp.task("test", function() {
  return gulp.src(["test/**/*.js"], { read: false }).pipe(mocha());
});

// Watch for changes
gulp.task("watch", function() {
  gulp.watch("./src/**/*.ts", ["test-it"]);
  gulp.watch("./test/**/*.ts", ["test-it"]);
});

// Default task
gulp.task("default", gulp.series("watch"));

// All build tasks and documentation generation
gulp.task(
  "all",
  gulp.series("build", "build-tests", "build-bower", "build-module", "doc")
);

// "all" build tasks, documentation and all tests
gulp.task("all-with-tests", gulp.series("all", "test", "karma", "istanbul"));

// "compile" and run tests
gulp.task("test-it", gulp.series("build", "build-tests", "test"));

// Build from source, build tests and run coverage task
gulp.task("coverage", gulp.series("build", "build-tests", "istanbul"));
