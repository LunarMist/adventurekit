import { Column, CreateDateColumn, Entity, getManager, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
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
  sequenceNumber: number;

  @Column({ nullable: false })
  source: number;

  @Column({ type: 'bytea', nullable: false })
  data: Uint8Array;

  constructor(room: GameRoom | number, category: string, sequenceNumber: number, source: number | -1, data: Uint8Array) {
    if (room instanceof GameRoom) {
      this.roomId = this.room.id;
    } else {
      this.roomId = room;
    }
    this.category = category;
    this.sequenceNumber = sequenceNumber;
    this.source = source;
    this.data = data;
  }

  static async create(room: GameRoom | number, category: string, sequenceNumber: number, source: number | -1, data: Uint8Array): Promise<Event> {
    const newEvent = new Event(room, category, sequenceNumber, source, data);
    return getManager().save(newEvent);
  }
}
