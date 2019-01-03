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
export default class User {

  @PrimaryGeneratedColumn()
  id?: number;

  @Index({unique: true})
  @Column({length: 25, nullable: false})
  username: string;

  @Index({unique: true})
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

  constructor(username: string, email: string, passwordHash: string) {
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
    const usernameLower = username.toLowerCase();
    return getRepository(User)
      .createQueryBuilder('user')
      .where('LOWER(user.username) = :usernameLower', {usernameLower: usernameLower})
      .getOne();
  }

  static async getByEmail(email: string): Promise<User | undefined> {
    const emailLower = email.toLowerCase();
    return getRepository(User)
      .createQueryBuilder('user')
      .where('LOWER(user.email) = :emailLower', {emailLower: emailLower})
      .getOne();
  }

  async setEmailVerified(status: boolean = true): Promise<User> {
    this.verified_email = status;
    return getManager().save(this);
  }
}
