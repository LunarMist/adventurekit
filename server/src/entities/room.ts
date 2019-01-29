import {
  CreateDateColumn,
  Entity,
  getManager,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import User from './user';

@Entity()
export default class GameRoom {

  @PrimaryGeneratedColumn()
  id?: number;

  @ManyToOne(type => User, owner => owner.rooms_owned)
  owner: User;

  @ManyToMany(type => User, member => member.game_rooms)
  @JoinTable()
  members?: User[];

  @CreateDateColumn()
  created?: Date;

  @UpdateDateColumn()
  updated?: Date;

  private constructor(owner: User) {
    this.owner = owner;
  }

  static async create(owner: User) {
    const newRoom = new GameRoom(owner);
    return getManager().save(newRoom);
  }
}
