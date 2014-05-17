
mains:
	browserify -d -t reactify setup.js -o bundle/bundle.js && echo "Done"

dev:
	browserify -d -t reactify -t fusion index.jsx -o bundle/dev.js

tree:
	modtree index.jsx bundle/tree.js -p fusion.modtree && echo "Done"

css:
	lessterfy index.jsx bundle/bundle.css

less: index.css
	@echo -n

index.css: index.less
	lessc index.less > index.css

jss := $(wildcard ../../lib/*.js)

build: bundle.js
	@echo -n

bundle.js: ${jss} index.js setup.js
	browserify setup.js -r reactify --debug > bundle.js && echo "Done"

build-test: bundle-test.js
	@echo -n

bundle-test.js: ${jss} index.js test-setup.js
	browserify test-setup.js -r reactify --debug > bundle-test.js && echo "Done"


.PHONY: css mains tree dev
