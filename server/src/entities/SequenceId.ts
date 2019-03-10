import { Column, CreateDateColumn, Entity, getManager, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import GameRoom from './GameRoom';

@Entity()
@Unique(['room', 'category'])
export default class SequenceId {
  @PrimaryGeneratedColumn()
  id!: number;

  @CreateDateColumn()
  created!: Date;

  @UpdateDateColumn()
  updated!: Date;

  @Column()
  roomId: number;

  @ManyToOne(type => GameRoom, room => room.sequences)
  room!: GameRoom;

  @Column({ length: 40, nullable: false })
  category: string;

  @Column({ nullable: false })
  nextSequenceId: number;

  constructor(room: GameRoom | number, category: string, nextSequenceId: number) {
    if (room instanceof GameRoom) {
      this.roomId = room.id;
    } else {
      this.roomId = room;
    }
    this.category = category;
    this.nextSequenceId = nextSequenceId;
  }

  static async create(room: GameRoom | number, category: string, nextSequenceId: number = 1): Promise<SequenceId> {
    const newSequence = new SequenceId(room, category, nextSequenceId);
    return getManager().save(newSequence);
  }
}
