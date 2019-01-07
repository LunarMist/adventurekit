import {
  Column,
  CreateDateColumn,
  Entity,
  getManager,
  getRepository,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import bcrypt from 'bcrypt';

@Entity()
@Index('idx_case_insensitive_username', {synchronize: false})
@Index('idx_case_insensitive_email', {synchronize: false})
export default class User {

  @PrimaryGeneratedColumn()
  id?: number;

  @Column({length: 15, nullable: false})
  username: string;

  @Column({length: 120, nullable: false})
  email: string;

  @Column({length: 80, nullable: false})
  password_hash: string;

  @CreateDateColumn()
  created?: Date;

  @UpdateDateColumn()
  updated?: Date;

  @Column({default: false})
  verified_email?: boolean;

  private constructor(username: string, email: string, passwordHash: string) {
    this.username = username;
    this.email = email;
    this.password_hash = passwordHash;
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

    const verified: boolean = await bcrypt.compare(password, user.password_hash);
    return verified ? user : undefined;
  }

  static async getById(id: number): Promise<User | undefined> {
    return getRepository(User).findOne(id);
  }

  static async getByUsername(username: string): Promise<User | undefined> {
    return getRepository(User)
      .createQueryBuilder('user')
      .where('user.username = LOWER(:username)', {username: username})
      .getOne();
  }

  static async getByEmail(email: string): Promise<User | undefined> {
    return getRepository(User)
      .createQueryBuilder('user')
      .where('user.email = LOWER(:email)', {email: email})
      .getOne();
  }

  async setEmailVerified(status: boolean = true): Promise<User> {
    this.verified_email = status;
    return getManager().save(this);
  }
}
