
ARGS=-t [ reactify --es6 --everything --visitors jstransform/visitors/es6-destructuring-visitors ]


simple:
	browserify ${ARGS} simple.js -o simple/index.js -d

simple-css:
	lessc simple.less simple/index.css

watch-simple:
	watchify -v ${ARGS} simple.js -o simple/index.js -d

wf:
	browserify ${ARGS} workflowy.js -o workflowy/index.js -d

watch-wf:
	watchify -v ${ARGS} workflowy.js -o workflowy/index.js -d

wf-css:
	lessc workflowy.less workflowy/index.css

perf:
	browserify ${ARGS} perf.js -o perf/index.js -d

dual:
	browserify ${ARGS} dual.js -o dual/index.js -d

dual-css:
	lessc dual.less dual/index.css

.PHONY: simple watch-simple perf dual dual-css simple-css
