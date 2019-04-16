import { MigrationInterface, QueryRunner } from 'typeorm';

export class EventSourcingSeqId1551852570091 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION gen_event_seq_id()
        RETURNS trigger AS
      $$
      DECLARE
        nextSeqId int;
        rowId     int;
      BEGIN
        -- Create sequence id row if it does not currently exist for the given (room)
        INSERT INTO sequence_id("roomId", "nextSequenceId")
        VALUES (NEW."roomId", 1)
        ON CONFLICT DO NOTHING;

        -- Fetch the sequence id
        SELECT "id", "nextSequenceId" INTO rowId, nextSeqId
        FROM sequence_id
        WHERE "roomId" = NEW."roomId"
        FOR UPDATE;

        -- Set the column
        NEW."sequenceNumber" = nextSeqId;

        -- Update for next seq id
        UPDATE sequence_id SET "nextSequenceId" = nextSeqId + 1, "updated" = now() WHERE "id" = rowId;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    await queryRunner.query('CREATE TRIGGER trigger_gen_event_seq_id BEFORE INSERT ON event FOR EACH ROW EXECUTE PROCEDURE gen_event_seq_id();');
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query('DROP TRIGGER trigger_gen_event_seq_id ON event;');
    await queryRunner.query('DROP FUNCTION gen_event_seq_id();');
  }
}
