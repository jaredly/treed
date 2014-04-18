
less: index.css
	@echo -n

index.css: index.less
	lessc index.less > index.css

jss := $(wildcard ../../lib/*.js)

build: bundle.js
	@echo -n


bundle.js: ${jss} index.js setup.js
	browserify setup.js --debug > bundle.js


