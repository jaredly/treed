
less: index.css
	@echo -n

index.css: index.less
	lessc index.less > index.css

build: bundle.js
	@echo -n

jss := $(wildcard "lib/*.js")

bundle.js: ${jss} index.js setup.js
	browserify setup.js > bundle.js


