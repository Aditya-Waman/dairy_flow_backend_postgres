import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

@Entity('feed_history')
export class FeedHistory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', name: 'farmer_id' })
  farmerId!: number;

  @Column({ type: 'timestamp' })
  date!: Date;

  @Column({ type: 'varchar', length: 255, name: 'feed_type' })
  feedType!: string;

  @Column({ type: 'int' })
  bags!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({ type: 'varchar', length: 255, name: 'approved_by' })
  approvedBy!: string;

  @ManyToOne('Farmer', 'feedHistory')
  @JoinColumn({ name: 'farmer_id' })
  farmer!: any;
}
