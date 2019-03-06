/* tslint:disable:max-line-length */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class EventSourcingV11551848989930 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query('CREATE TABLE "event_aggregate" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "roomId" integer NOT NULL, "category" character varying(40) NOT NULL, "eventWatermark" integer NOT NULL, "data" bytea NOT NULL, CONSTRAINT "UQ_f54fd4239ad97c5e11d452d03af" UNIQUE ("roomId", "category"), CONSTRAINT "PK_46fbdf8b3fc87781d05fbf11b90" PRIMARY KEY ("id"))');
    await queryRunner.query('CREATE TABLE "sequence_id" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "roomId" integer NOT NULL, "category" character varying(40) NOT NULL, "nextSequenceId" integer NOT NULL, CONSTRAINT "UQ_db89793de9d5320ff2a677ab192" UNIQUE ("roomId", "category"), CONSTRAINT "PK_6ae8a19c0b174add64b3d170bc8" PRIMARY KEY ("id"))');
    await queryRunner.query('CREATE TABLE "event" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "roomId" integer NOT NULL, "category" character varying(40) NOT NULL, "sequenceNumber" integer NOT NULL, "source" integer NOT NULL, "data" bytea NOT NULL, CONSTRAINT "UQ_1bff8f5bb663673f8f377512cec" UNIQUE ("roomId", "category", "sequenceNumber"), CONSTRAINT "PK_30c2f3bbaf6d34a55f8ae6e4614" PRIMARY KEY ("id"))');
    await queryRunner.query('ALTER TABLE "event_aggregate" ADD CONSTRAINT "FK_8a740c34d4dda7cc000f24ed9c1" FOREIGN KEY ("roomId") REFERENCES "game_room"("id") ON DELETE NO ACTION ON UPDATE NO ACTION');
    await queryRunner.query('ALTER TABLE "sequence_id" ADD CONSTRAINT "FK_f68b1cd13fb28597da7ac865a19" FOREIGN KEY ("roomId") REFERENCES "game_room"("id") ON DELETE NO ACTION ON UPDATE NO ACTION');
    await queryRunner.query('ALTER TABLE "event" ADD CONSTRAINT "FK_7053aa43bf50d4f4463c9643999" FOREIGN KEY ("roomId") REFERENCES "game_room"("id") ON DELETE NO ACTION ON UPDATE NO ACTION');
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query('ALTER TABLE "event" DROP CONSTRAINT "FK_7053aa43bf50d4f4463c9643999"');
    await queryRunner.query('ALTER TABLE "sequence_id" DROP CONSTRAINT "FK_f68b1cd13fb28597da7ac865a19"');
    await queryRunner.query('ALTER TABLE "event_aggregate" DROP CONSTRAINT "FK_8a740c34d4dda7cc000f24ed9c1"');
    await queryRunner.query('DROP TABLE "event"');
    await queryRunner.query('DROP TABLE "sequence_id"');
    await queryRunner.query('DROP TABLE "event_aggregate"');
  }
}
