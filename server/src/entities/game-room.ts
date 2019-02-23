import {
  Column,
  CreateDateColumn,
  Entity,
  getConnection,
  getManager,
  getRepository,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import bcrypt from 'bcrypt';

import User from './user';

@Entity()
export default class GameRoom {

  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(type => User, owner => owner.rooms_owned)
  owner: User;

  @Column({ length: 80, nullable: false })
  password_hash: string;

  @ManyToMany(type => User, member => member.game_rooms)
  @JoinTable()
  members?: User[];

  @CreateDateColumn()
  created!: Date;

  @UpdateDateColumn()
  updated!: Date;

  @OneToMany(type => User, user => user.default_room)
  defaulted_rooms?: User[];

  private constructor(owner: User, passwordHash: string) {
    this.owner = owner;
    this.password_hash = passwordHash;
  }

  async addMember(userId: number): Promise<void> {
    return getConnection()
      .createQueryBuilder()
      .relation(GameRoom, 'members')
      .of(this)
      .add(userId)
      .catch(e => {
        if (e.message.includes('duplicate key value')) {
          return;
        } else {
          throw e;
        }
      });
  }

  static async create(owner: User, password: string): Promise<GameRoom> {
    const passwordHash = await bcrypt.hash(password || '', 10);
    const newRoom = new GameRoom(owner, passwordHash);
    return getManager().save(newRoom);
  }

  static async validate(id: number, password: string): Promise<GameRoom | undefined> {
    const room: GameRoom | undefined = await GameRoom.getById(id);
    if (room === undefined) {
      return undefined;
    }
    const verified: boolean = await bcrypt.compare(password, room.password_hash);
    return verified ? room : undefined;
  }

  static async getById(id: number): Promise<GameRoom | undefined> {
    return getRepository(GameRoom).findOne(id, { relations: ['owner'] });
  }
}
