import {MigrationInterface, QueryRunner} from 'typeorm';

export class AddDefaultRoom1549185928274 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "user" ADD "defaultRoomId" integer`);
    await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_b924b3c593dc47861cc793b3bb3" FOREIGN KEY ("defaultRoomId") REFERENCES "game_room"("id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_b924b3c593dc47861cc793b3bb3"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "defaultRoomId"`);
  }
}
