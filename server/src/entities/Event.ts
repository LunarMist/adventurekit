import { Column, CreateDateColumn, Entity, EntityManager, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import GameRoom from './GameRoom';

@Entity()
@Unique(['room', 'category', 'sequenceNumber'])
export default class Event {
  @PrimaryGeneratedColumn()
  id!: number;

  @CreateDateColumn()
  created!: Date;

  @UpdateDateColumn()
  updated!: Date;

  @Column()
  roomId: number;

  @ManyToOne(type => GameRoom, room => room.events)
  room!: GameRoom;

  @Column({ length: 40, nullable: false })
  category: string;

  @Column({ nullable: false })
  sequenceNumber!: number;

  @Column({ nullable: false })
  source: number;

  @Column({ type: 'bytea', nullable: false })
  data: string;

  getData(): Buffer {
    return Buffer.from(this.data, 'hex');
  }

  constructor(room: GameRoom | number, category: string, source: number | -1, data: Buffer) {
    if (room instanceof GameRoom) {
      this.roomId = room.id;
    } else {
      this.roomId = room;
    }
    this.category = category;
    this.source = source;
    // https://github.com/typeorm/typeorm/issues/2878#issuecomment-432725569
    this.data = `\\x${data ? data.toString('hex') : ''}`;
  }

  static async create(entityManager: EntityManager, room: GameRoom | number, category: string, source: number | -1, data: Buffer): Promise<Event> {
    const newEvent = new Event(room, category, source, data);
    const newObj = await entityManager.save(newEvent);
    // This re-select is because sequenceNumber is generated via a trigger, and not auto-reloaded by the orm
    // TODO: Do not use a re-select
    const reloaded = await entityManager.getRepository(Event).findOne(newObj.id);
    if (reloaded === undefined) {
      throw Error('Reloaded entity does not exist -- this should not happen');
    }
    return reloaded;
  }
}
