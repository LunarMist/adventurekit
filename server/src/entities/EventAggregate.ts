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

  @Column({ length: 30, nullable: false })
  eventWatermark: string;

  @Column({ nullable: false })
  dataVersion: number;

  @Column({ type: 'bytea', nullable: false })
  data: Buffer;

  getDataUi8(): Uint8Array {
    return this.data;
  }

  constructor(room: GameRoom | number, category: string, eventWatermark: string, dataVersion: number, data: Uint8Array) {
    if (room instanceof GameRoom) {
      this.roomId = room.id;
    } else {
      this.roomId = room;
    }
    this.category = category;
    this.eventWatermark = eventWatermark;
    this.dataVersion = dataVersion;
    if (data === undefined) {
      this.data = Buffer.allocUnsafe(0);
    } else {
      this.data = Buffer.from(data.buffer, data.byteOffset, data.length);
    }
  }

  static async create(entityManager: EntityManager, room: GameRoom | number, category: string,
                      eventWatermark: string, dataVersion: number, data: Uint8Array): Promise<EventAggregate> {
    const newAggregate = new EventAggregate(room, category, eventWatermark, dataVersion, data);
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

  async update(entityManager: EntityManager, watermark: string, data: Uint8Array): Promise<EventAggregate> {
    this.eventWatermark = watermark;
    if (data === undefined) {
      this.data = Buffer.allocUnsafe(0);
    } else {
      this.data = Buffer.from(data.buffer, data.byteOffset, data.length);
    }
    await entityManager.update(EventAggregate, this.id, { eventWatermark: this.eventWatermark, data: this.data });
    return this;
  }

  static async getMany(room: GameRoom | number): Promise<EventAggregate[]> {
    return getRepository(EventAggregate)
      .createQueryBuilder('agg')
      .where('agg.roomId = :roomId', { roomId: room instanceof GameRoom ? room.id : room })
      .getMany();
  }
}
