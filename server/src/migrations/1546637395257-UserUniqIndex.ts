import {MigrationInterface, QueryRunner} from 'typeorm';

/**
 * typeorm does not support expression-based unique indexes it seems, so we need to create them via migrations
 */
export class UserUniqIndex1546637395257 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`CREATE UNIQUE INDEX "idx_case_insensitive_username" ON "user" (lower("username"))`);
    await queryRunner.query(`CREATE UNIQUE INDEX "idx_case_insensitive_email" ON "user" (lower("email"))`);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`DROP UNIQUE INDEX "idx_case_insensitive_username"`);
    await queryRunner.query(`DROP UNIQUE INDEX "idx_case_insensitive_email"`);
  }
}
