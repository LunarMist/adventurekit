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
  UpdateDateColumn
} from 'typeorm';
import bcrypt from 'bcrypt';

import User from './user';

@Entity()
export default class GameRoom {

  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(type => User, owner => owner.rooms_owned)
  owner: User;

  @Column({length: 80, nullable: true})
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

  private constructor(owner: User, passwordHash: string | null) {
    this.owner = owner;
    // @ts-ignore
    // typeorm does not support string | null
    // see https://github.com/typeorm/typeorm/issues/2567
    this.password_hash = passwordHash;
  }

  async addMember(userId: number): Promise<void> {
    return getConnection()
      .createQueryBuilder()
      .relation(GameRoom, "members")
      .of(this)
      .add(userId);
  }

  static async create(owner: User, password: string): Promise<GameRoom> {
    let passwordHash = null;
    if (password !== null && password.length > 0) {
      passwordHash = await bcrypt.hash(password, 10);
    }
    const newRoom = new GameRoom(owner, passwordHash);
    return getManager().save(newRoom);
  }

  static async validate(id: number, password: string): Promise<GameRoom | undefined> {
    const room: GameRoom | undefined = await GameRoom.getById(id);

    if (room === undefined) {
      return undefined;
    }

    if (room.password_hash === null) {
      return room;
    }

    const verified: boolean = await bcrypt.compare(password, room.password_hash);
    return verified ? room : undefined;
  }

  static async getById(id: number): Promise<GameRoom | undefined> {
    return getRepository(GameRoom).findOne(id);
  }
}
