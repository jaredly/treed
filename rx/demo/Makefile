
ARGS=-t [ reactify --es6 --everything ]

simple:
	browserify ${ARGS} simple.js -o simple/index.js -d

watch-simple:
	watchify -v ${ARGS} simple.js -o simple/index.js -d

watch-wf:
	watchify -v ${ARGS} workflowy.js -o workflowy/index.js -d

wf-css:
	lessc workflowy.less workflowy/index.css

perf:
	browserify ${ARGS} perf.js -o perf/index.js -d

.PHONY: simple watch-simple perf
