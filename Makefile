
docs:
	cp -r demo d
	git co gh-pages
	mv d/* ./
	git add .
	git commit -a

