
test:
	@echo "Working on that..."

docs:
	cp -r demo d
	cp -r lib l
	git co gh-pages
	mv d/* ./
	mv l lib
	rm -rf d
	git add .
	git add lib
	git commit -a

.PHONY: docs test
