
build:
	webpack

watch:
	webpack --watch

.PHONY: build watch

# ARGS=-t [ reactify --es6 --everything --visitors jstransform/visitors/es6-destructuring-visitors ]
# 
# js:
# 	browserify ${ARGS} ${NAME}/index.js -o ${NAME}/build.js -d
# 
# watch:
# 	watchify -v ${ARGS} ${NAME}/index.js -o ${NAME}/build.js -d
# 
# css:
# 	lessc ${NAME}/index.less ${NAME}/build.css
# 
# simple:
# 	browserify ${ARGS} simple.js -o simple/index.js -d
# 
# ix:
# 	browserify ${ARGS} ix.js -o ix/index.js -d
# 
# watch-ix:
# 	watchify -v ${ARGS} ix.js -o ix/index.js -d
# 
# simple-css:
# 	lessc simple.less simple/index.css
# 
# watch-simple:
# 	watchify -v ${ARGS} simple.js -o simple/index.js -d
# 
# plugins:
# 	browserify ${ARGS} plugins.js -o plugins/index.js -d
# 
# watch-plugins:
# 	watchify -v ${ARGS} plugins.js -o plugins/index.js -d
# 
# plugins-css:
# 	lessc plugins.less plugins/index.css
# 
# perf:
# 	browserify ${ARGS} perf.js -o perf/index.js -d
# 
# dual:
# 	browserify ${ARGS} dual.js -o dual/index.js -d
# 
# dual-css:
# 	lessc dual.less dual/index.css
# 
# watch-menu:
# 	watchify  ${ARGS} -x react -x react ../lib/context-menu.js -o menu/build.js -d -s Menu -v
# 
# menu:
# 	browserify ${ARGS} -x react -x react ../lib/context-menu.js -o menu/build.js -d -s Menu
# 
# menu-css:
# 	lessc ../lib/context-menu.less > menu/build.css
# 
# react:
# 	browserify -r react -r react -o react.js
# 
# .PHONY: simple watch-simple perf dual dual-css simple-css ix ix-css menu
