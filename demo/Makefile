
ARGS=-t [ reactify --es6 --everything --visitors jstransform/visitors/es6-destructuring-visitors ]

watch:
	watchify -v ${ARGS} ${NAME}.js -o ${NAME}/index.js -d

css:
	lessc ${NAME}.less ${NAME}/index.css

simple:
	browserify ${ARGS} simple.js -o simple/index.js -d

ix:
	browserify ${ARGS} ix.js -o ix/index.js -d

watch-ix:
	watchify -v ${ARGS} ix.js -o ix/index.js -d

simple-css:
	lessc simple.less simple/index.css

watch-simple:
	watchify -v ${ARGS} simple.js -o simple/index.js -d

plugins:
	browserify ${ARGS} plugins.js -o plugins/index.js -d

watch-plugins:
	watchify -v ${ARGS} plugins.js -o plugins/index.js -d

plugins-css:
	lessc plugins.less plugins/index.css

perf:
	browserify ${ARGS} perf.js -o perf/index.js -d

dual:
	browserify ${ARGS} dual.js -o dual/index.js -d

dual-css:
	lessc dual.less dual/index.css

watch-menu:
	watchify  ${ARGS} -x react -x react/addons ../lib/context-menu.js -o menu/build.js -d -s Menu -v

menu:
	browserify ${ARGS} -x react -x react/addons ../lib/context-menu.js -o menu/build.js -d -s Menu

menu-css:
	lessc ../lib/context-menu.less > menu/build.css

react:
	browserify -r react -r react/addons -o react.js

.PHONY: simple watch-simple perf dual dual-css simple-css ix ix-css menu
