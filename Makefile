JS_MIN = uglifyjs
JS_MIN_FLAGS = --unsafe

BASE_PATH = .

SRC_FILE = ${BASE_PATH}/events.js
MIN_FILE = ${BASE_PATH}/events.min.js

build:
	cat ${SRC_FILE} | ${JS_MIN} ${JS_MIN_FLAGS} > ${MIN_FILE}

clean:
	rm -f ${MIN_FILE}

