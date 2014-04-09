
test:
	@echo "Working on that..."

docs:
	cp -r demo d
	git co gh-pages
	mv d/* ./
	rm -rf d
	git add .
	git commit -a

.PHONY: docs test
