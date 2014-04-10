
test:
	@echo "Working on that..."

docs:
	cp -r demo d
	cp -r lib l
	cp -r css c
	git co gh-pages
	rm d/lib d/css
	mv d/* ./
	mv l lib
	mv c css
	rm -rf d
	git add .
	git add lib css
	git commit -a

.PHONY: docs test
