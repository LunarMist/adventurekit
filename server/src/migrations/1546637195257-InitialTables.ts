/* tslint:disable:max-line-length */

import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Initial tables migration
 */
export class InitialTables1546637195257 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query('CREATE TABLE "user" ("id" SERIAL NOT NULL, "username" character varying(15) NOT NULL, "email" character varying(120) NOT NULL, "password_hash" character varying(80) NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "verified_email" boolean NOT NULL DEFAULT false, "defaultRoomId" integer, CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))');
    await queryRunner.query('CREATE TABLE "game_room" ("id" SERIAL NOT NULL, "password_hash" character varying(80) NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "ownerId" integer, CONSTRAINT "PK_fa4083cccb79a3e4786a991000b" PRIMARY KEY ("id"))');
    await queryRunner.query('CREATE TABLE "game_room_members_user" ("gameRoomId" integer NOT NULL, "userId" integer NOT NULL, CONSTRAINT "PK_6c007274943d6afcd4e5211efd0" PRIMARY KEY ("gameRoomId", "userId"))');
    await queryRunner.query('ALTER TABLE "user" ADD CONSTRAINT "FK_b924b3c593dc47861cc793b3bb3" FOREIGN KEY ("defaultRoomId") REFERENCES "game_room"("id")');
    await queryRunner.query('ALTER TABLE "game_room" ADD CONSTRAINT "FK_a87142ca994830b2f09ef55ecbe" FOREIGN KEY ("ownerId") REFERENCES "user"("id")');
    await queryRunner.query('ALTER TABLE "game_room_members_user" ADD CONSTRAINT "FK_3dcc1d71c63c1ec2f285f156ad2" FOREIGN KEY ("gameRoomId") REFERENCES "game_room"("id") ON DELETE CASCADE');
    await queryRunner.query('ALTER TABLE "game_room_members_user" ADD CONSTRAINT "FK_4f54b91316423a5acc4f8893520" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE');
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query('ALTER TABLE "game_room_members_user" DROP CONSTRAINT "FK_4f54b91316423a5acc4f8893520"');
    await queryRunner.query('ALTER TABLE "game_room_members_user" DROP CONSTRAINT "FK_3dcc1d71c63c1ec2f285f156ad2"');
    await queryRunner.query('ALTER TABLE "game_room" DROP CONSTRAINT "FK_a87142ca994830b2f09ef55ecbe"');
    await queryRunner.query('ALTER TABLE "user" DROP CONSTRAINT "FK_b924b3c593dc47861cc793b3bb3"');
    await queryRunner.query('DROP TABLE "game_room_members_user"');
    await queryRunner.query('DROP TABLE "game_room"');
    await queryRunner.query('DROP TABLE "user"');
  }
}
