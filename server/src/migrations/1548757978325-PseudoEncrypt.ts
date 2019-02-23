import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * We want room IDs to appear "random", but still be unique
 *
 * https://wiki.postgresql.org/wiki/Pseudo_encrypt
 * https://medium.com/@emerson_lackey/postgres-randomized-primary-keys-123cb8fcdeaf
 */
export class PseudoEncrypt1548757978325 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION pseudo_encrypt(VALUE int) returns int AS $$
      DECLARE
      l1 int;
      l2 int;
      r1 int;
      r2 int;
      i int:=0;
      BEGIN
       l1:= (VALUE >> 16) & 65535;
       r1:= VALUE & 65535;
       WHILE i < 3 LOOP
         l2 := r1;
         r2 := l1 # ((((1366 * r1 + 150889) % 714025) / 714025.0) * 32767)::int;
         l1 := l2;
         r1 := r2;
         i := i + 1;
       END LOOP;
       RETURN ((r1 << 16) + l1);
      END;
      $$ LANGUAGE plpgsql strict immutable;
    `);

    await queryRunner.query(`ALTER TABLE game_room ALTER COLUMN id SET DEFAULT pseudo_encrypt(nextval('game_room_id_seq')::int)`);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE game_room ALTER COLUMN id SET DEFAULT nextval('game_room_id_seq')`);
    await queryRunner.query(`DROP FUNCTION pseudo_encrypt(VALUE int)`);
  }
}
