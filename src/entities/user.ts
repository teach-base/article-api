import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ unique: true })
  username: string;

  @Column({
    select: false,
  })
  password: string;

  // @Index()
  // @Column()
  // uuid: string;

  @CreateDateColumn({ type: 'datetime', nullable: true })
  created_at: Date;
}
