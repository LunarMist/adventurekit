dev quickstart
--------------
Install redis, postgres

Setup postgres dev account:
```
CREATE DATABASE rpgcore_dev;
CREATE USER rpgcore_dev WITH ENCRYPTED PASSWORD 'xY<9msv?9_PD?)mk';
GRANT ALL PRIVILEGES ON DATABASE rpgcore_dev TO rpgcore_dev;
```

Within common, frontend, server: `npm install`

Within common: `npm link`

Within frontend & server: `npm link rpgcore-common`

Run common watcher: `cd common && npm run watch`

Run frontend watcher: `cd frontend && npm run watch`

Run server watcher: `cd server && npm run watch`

Run server-dev: `cd server && npm run serve-dev`

db/migration commands
---------------------
Ensure typeorm is installed globally: `npm install -g typeorm`

Sync schemas (dev): `typeorm schema:sync -f ormconfig-dev.json`

Migrate to latest (dev): `typeorm migration:run -f ormconfig-dev.json`

Create new migration (dev): `typeorm migration:create -f ormconfig-dev.json `