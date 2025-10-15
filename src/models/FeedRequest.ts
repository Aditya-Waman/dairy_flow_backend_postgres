import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';

export type RequestStatus = 'Pending' | 'Approved' | 'Rejected';

@Entity('feed_requests')
@Index(['farmerId'])
@Index(['feedId'])
@Index(['status'])
@Index(['createdAt'])
export class FeedRequest {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', name: 'farmer_id' })
  farmerId!: number;

  @Column({ type: 'int', name: 'feed_id' })
  feedId!: number;

  @Column({ type: 'int', name: 'qty_bags' })
  qtyBags!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'feed_price' })
  feedPrice!: number;

  @Column({ type: 'varchar', length: 20, default: 'Pending' })
  status!: RequestStatus;

  // Historical prices stored at approval time
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'selling_price_at_approval' })
  sellingPriceAtApproval?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'purchase_price_at_approval' })
  purchasePriceAtApproval?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'total_profit_at_approval' })
  totalProfitAtApproval?: number;

  @Column({ type: 'varchar', length: 255, name: 'created_by' })
  createdBy!: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'approved_by' })
  approvedBy?: string;

  @Column({ type: 'timestamp', nullable: true, name: 'approved_at' })
  approvedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne('Farmer')
  @JoinColumn({ name: 'farmer_id' })
  farmer!: any;

  @ManyToOne('Stock')
  @JoinColumn({ name: 'feed_id' })
  feed!: any;
}

