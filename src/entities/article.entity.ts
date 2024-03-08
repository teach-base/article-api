import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
@Index(['uid', 'id', 'pid', 'like', 'title', 'text'])
export class Article {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  uid: number;

  @Column({ default: 0 })
  pid: number;

  @Column({ default: 0 })
  like: number;

  @Index()
  @Column()
  title: string;

  @Column({ default: false })
  is_folder: boolean;

  @Index()
  @Column({
    nullable: true,
  })
  text: string;

  @Index()
  @Column('json', { default: '[]' })
  tags: number[];
}
