import { Column, CreateDateColumn, Entity, EntityManager, Generated, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
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

  @Generated() // To trick typeorm to include column in RETURNING list
  @Column({ length: 30, nullable: false })
  sequenceNumber!: string;

  @Column({ nullable: false })
  source: number;

  @Column({ nullable: false })
  dataVersion: number;

  @Column({ type: 'bytea', nullable: false })
  data: Buffer;

  getDataUi8(): Uint8Array {
    return this.data;
  }

  constructor(room: GameRoom | number, category: string, source: number | -1, dataVersion: number, data: Uint8Array) {
    if (room instanceof GameRoom) {
      this.roomId = room.id;
    } else {
      this.roomId = room;
    }
    this.category = category;
    this.source = source;
    this.dataVersion = dataVersion;
    if (data === undefined) {
      this.data = Buffer.allocUnsafe(0);
    } else {
      this.data = Buffer.from(data.buffer, data.byteOffset, data.length);
    }
  }

  static async create(entityManager: EntityManager, room: GameRoom | number, category: string,
                      source: number | -1, dataVersion: number, data: Uint8Array): Promise<Event> {
    const newEvent = new Event(room, category, source, dataVersion, data);
    return entityManager.save(newEvent);
  }
}
