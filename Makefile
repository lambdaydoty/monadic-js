PORT=

DB_X=
DB_Y=
DB_Z=

VERSION=$(shell git describe --tag | sed -e 's/^v//')
BASE=monadic
IMAGE=monadic:dev
NAME=monadic-dev
REGISTRY=

ENV_FILE=etc/.env

build:
	docker build --pull -t $(BASE):dev .

run: rm
	@echo ENV_FILE: $(ENV_FILE)
	@echo ''
	docker run \
		--net host \
		--restart unless-stopped \
		--detach \
		--add-host db0:$(DB_X) \
		--add-host db1:$(DB_Y) \
		--add-host db2:$(DB_Z) \
		--env-file $(ENV_FILE) \
		--name $(BASE)-dev \
		$(BASE):dev

stop:
	docker stop $(BASE)-dev || true

log:
	docker logs --follow $(BASE)-dev

rm: stop
	docker rm $(BASE)-dev || true

ping:
	@curl --silent http://localhost:$(PORT)/api/now
	@echo ''
