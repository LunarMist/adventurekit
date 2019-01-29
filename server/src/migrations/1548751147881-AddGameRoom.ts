import {MigrationInterface, QueryRunner} from 'typeorm';

export class AddGameRoom1548751147881 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`CREATE TABLE "game_room" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "ownerId" integer, CONSTRAINT "PK_fa4083cccb79a3e4786a991000b" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "game_room_members_user" ("gameRoomId" integer NOT NULL, "userId" integer NOT NULL, CONSTRAINT "PK_6c007274943d6afcd4e5211efd0" PRIMARY KEY ("gameRoomId", "userId"))`);
    await queryRunner.query(`ALTER TABLE "game_room" ADD CONSTRAINT "FK_a87142ca994830b2f09ef55ecbe" FOREIGN KEY ("ownerId") REFERENCES "user"("id")`);
    await queryRunner.query(`ALTER TABLE "game_room_members_user" ADD CONSTRAINT "FK_3dcc1d71c63c1ec2f285f156ad2" FOREIGN KEY ("gameRoomId") REFERENCES "game_room"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "game_room_members_user" ADD CONSTRAINT "FK_4f54b91316423a5acc4f8893520" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE`);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "game_room_members_user" DROP CONSTRAINT "FK_4f54b91316423a5acc4f8893520"`);
    await queryRunner.query(`ALTER TABLE "game_room_members_user" DROP CONSTRAINT "FK_3dcc1d71c63c1ec2f285f156ad2"`);
    await queryRunner.query(`ALTER TABLE "game_room" DROP CONSTRAINT "FK_a87142ca994830b2f09ef55ecbe"`);
    await queryRunner.query(`DROP TABLE "game_room_members_user"`);
    await queryRunner.query(`DROP TABLE "game_room"`);
  }
}
