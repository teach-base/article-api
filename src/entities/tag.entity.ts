import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index(['uid', 'name'])
@Index(['uid', 'id'])
@Index(['uid', 'id', 'weight'])
@Entity()
export class Tag {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  uid: number;

  @Index()
  @Column()
  name: string;

  @Index()
  @Column({
    default: 1,
  })
  weight: number;
}
