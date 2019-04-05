import { Column, CreateDateColumn, Entity, getManager, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import GameRoom from './GameRoom';

@Entity()
@Unique(['room'])
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

  @Column({ nullable: false })
  nextSequenceId: number;

  constructor(room: GameRoom | number, nextSequenceId: number) {
    if (room instanceof GameRoom) {
      this.roomId = room.id;
    } else {
      this.roomId = room;
    }
    this.nextSequenceId = nextSequenceId;
  }

  static async create(room: GameRoom | number, nextSequenceId: number = 1): Promise<SequenceId> {
    const newSequence = new SequenceId(room, nextSequenceId);
    return getManager().save(newSequence);
  }
}
