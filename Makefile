
all: build css

lint:
	jshint lib

build:
	browserify lib/index.js -o build/build.js -d -s nm

watch:
	watchify lib/index.js -v -o build/build.js -d -s nm

demo:
	watchify demo/tpl/demo.js -v -o demo/tpl/demo-bundle.js -d -s demo

test:
	@echo "Working on that..."

docs:
	cp -r demo d
	cp -r lib l
	cp -r css c
	git co gh-pages
	rm d/lib d/css
	rm -rf css lib
	mv d/* ./
	mv l lib
	mv c css
	rm -rf d
	git add .
	git add lib css
	git commit -a

css:
	lessc index.less build/build.css
	lessc skins/workflowy/index.less build/workflowy.css
	lessc skins/whiteboard/index.less build/whiteboard.css

.PHONY: docs test build css watch demo
