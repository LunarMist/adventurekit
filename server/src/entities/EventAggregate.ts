import { Column, CreateDateColumn, Entity, getManager, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import GameRoom from './GameRoom';

@Entity()
@Unique(['room', 'category'])
export default class EventAggregate {
  @PrimaryGeneratedColumn()
  id!: number;

  @CreateDateColumn()
  created!: Date;

  @UpdateDateColumn()
  updated!: Date;

  @Column()
  roomId: number;

  @ManyToOne(type => GameRoom, room => room.eventAggregates)
  room!: GameRoom;

  @Column({ length: 40, nullable: false })
  category: string;

  @Column({ nullable: false })
  eventWatermark: number;

  @Column({ type: 'bytea', nullable: false })
  data: Uint8Array;

  constructor(room: GameRoom | number, category: string, eventWatermark: number, data: Uint8Array) {
    if (room instanceof GameRoom) {
      this.roomId = this.room.id;
    } else {
      this.roomId = room;
    }
    this.category = category;
    this.eventWatermark = eventWatermark;
    this.data = data;
  }

  static async create(room: GameRoom | number, category: string, eventWatermark: number, data: Uint8Array): Promise<EventAggregate> {
    const newAggregate = new EventAggregate(room, category, eventWatermark, data);
    return getManager().save(newAggregate);
  }
}
