import { Column, CreateDateColumn, Entity, EntityManager, getRepository, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
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
  data: string;

  getData(): Buffer {
    return Buffer.from(this.data, 'hex');
  }

  constructor(room: GameRoom | number, category: string, eventWatermark: number, data: Buffer) {
    if (room instanceof GameRoom) {
      this.roomId = room.id;
    } else {
      this.roomId = room;
    }
    this.category = category;
    this.eventWatermark = eventWatermark;
    // https://github.com/typeorm/typeorm/issues/2878#issuecomment-432725569
    this.data = `\\x${data ? data.toString('hex') : ''}`;
  }

  static async create(entityManager: EntityManager, room: GameRoom | number, category: string, eventWatermark: number, data: Buffer): Promise<EventAggregate> {
    const newAggregate = new EventAggregate(room, category, eventWatermark, data);
    return entityManager.save(newAggregate);
  }

  static async getForUpdate(entityManager: EntityManager, room: GameRoom | number, category: string): Promise<EventAggregate | undefined> {
    return entityManager
      .getRepository(EventAggregate)
      .createQueryBuilder('agg')
      .setLock('pessimistic_write')
      .where('agg.roomId = :roomId', { roomId: room instanceof GameRoom ? room.id : room })
      .andWhere('agg.category = :category', { category })
      .getOne();
  }

  static async get(room: GameRoom | number, category: string): Promise<EventAggregate | undefined> {
    return getRepository(EventAggregate)
      .createQueryBuilder('agg')
      .where('agg.roomId = :roomId', { roomId: room instanceof GameRoom ? room.id : room })
      .andWhere('agg.category = :category', { category })
      .getOne();
  }

  async update(entityManager: EntityManager, watermark: number, data: Buffer): Promise<EventAggregate> {
    this.eventWatermark = watermark;
    this.data = `\\x${data ? data.toString('hex') : ''}`;
    await entityManager.update(EventAggregate, this.id, { eventWatermark: this.eventWatermark, data: this.data });
    return this;
  }
}
