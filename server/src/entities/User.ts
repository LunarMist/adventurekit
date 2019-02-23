import {
  Column,
  CreateDateColumn,
  Entity,
  getManager,
  getRepository,
  Index,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import bcrypt from 'bcrypt';

import GameRoom from './GameRoom';

@Entity()
@Index('idx_case_insensitive_username', { synchronize: false })
@Index('idx_case_insensitive_email', { synchronize: false })
export default class User {

  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 15, nullable: false })
  username: string;

  @Column({ length: 120, nullable: false })
  email: string;

  @Column({ length: 80, nullable: false })
  passwordHash: string;

  @CreateDateColumn()
  created!: Date;

  @UpdateDateColumn()
  updated!: Date;

  @Column({ default: false })
  verifiedEmail: boolean;

  @ManyToMany(type => GameRoom, gameRoom => gameRoom.members)
  gameRooms?: GameRoom[];

  @OneToMany(type => GameRoom, gameRoom => gameRoom.owner)
  roomsOwned?: GameRoom[];

  @ManyToOne(type => GameRoom, gameRoom => gameRoom.defaultedRooms)
  defaultRoom: GameRoom | null;

  private constructor(username: string, email: string, passwordHash: string) {
    this.username = username;
    this.email = email;
    this.passwordHash = passwordHash;
    this.verifiedEmail = false;
    this.defaultRoom = null;
  }

  async setEmailVerified(status: boolean = true): Promise<User> {
    this.verifiedEmail = status;
    return getManager().save(this);
  }

  async setDefaultRoom(room: GameRoom): Promise<User> {
    this.defaultRoom = room;
    return getManager().save(this);
  }

  static async create(username: string, email: string, password: string): Promise<User> {
    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = new User(username, email, passwordHash);
    return getManager().save(newUser);
  }

  static async validate(email: string, password: string): Promise<User | undefined> {
    const user: User | undefined = await User.getByEmail(email);
    if (user === undefined) {
      return undefined;
    }
    const verified: boolean = await bcrypt.compare(password, user.passwordHash);
    return verified ? user : undefined;
  }

  static async getById(id: number): Promise<User | undefined> {
    return getRepository(User).findOne(id, { relations: ['default_room'] });
  }

  static async getByUsername(username: string): Promise<User | undefined> {
    return getRepository(User)
      .createQueryBuilder('user')
      .where('LOWER(user.username) = LOWER(:username)', { username })
      .leftJoinAndSelect('user.default_room', 'default_room')
      .getOne();
  }

  static async getByEmail(email: string): Promise<User | undefined> {
    return getRepository(User)
      .createQueryBuilder('user')
      .where('LOWER(user.email) = LOWER(:email)', { email })
      .leftJoinAndSelect('user.default_room', 'default_room')
      .getOne();
  }
}
