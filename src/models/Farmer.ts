import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';

export type FarmerStatus = 'Active' | 'Inactive';

@Entity('farmers')
@Index(['status'])
@Index(['code'])
@Index(['mobile'])
export class Farmer {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255, name: 'full_name' })
  fullName!: string;

  @Column({ type: 'varchar', length: 10, unique: true })
  mobile!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 20, default: 'Active' })
  status!: FarmerStatus;

  @Column({ type: 'varchar', length: 255, name: 'created_by' })
  createdBy!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany('FeedHistory', 'farmer')
  feedHistory!: any[];
}

