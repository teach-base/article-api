import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Article {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ default: 0 })
  pid: number;

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
