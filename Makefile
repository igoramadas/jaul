ifeq ($(OS),Windows_NT)
	MOCHA:= node_modules/.bin/mocha.cmd
	MOCHAEXEC:= node_modules/.bin/_mocha
	ISTANBUL:= node_modules/istanbul/lib/cli.js
	TESTPATH:= test/*.js
else
	MOCHA:= ./node_modules/.bin/mocha
	MOCHAEXEC:= ./node_modules/.bin/_mocha
	ISTANBUL:= ./node_modules/istanbul/lib/cli.js
	TESTPATH:= ./test/*.js
endif

build:
	

test:
	$(MOCHA) --trace-warnings --exit -u tdd -R spec

cover:
	$(ISTANBUL) cover $(MOCHAEXEC) -- -R spec $(TESTPATH)

docs:
	cp CNAME docs/

clean:
	rm -rf ./node_modules

.PHONY: test
.PHONY: docs
