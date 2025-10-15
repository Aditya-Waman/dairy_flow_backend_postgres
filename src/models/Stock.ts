import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BeforeUpdate, Index } from 'typeorm';
import { getCurrentISTTime } from '../utils/timezone.js';

@Entity('stock')
@Index(['name'])
@Index(['type'])
export class Stock {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255 })
  type!: string;

  @Column({ type: 'int', default: 0, name: 'quantity_bags' })
  quantityBags!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 50, name: 'bag_weight' })
  bagWeight!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'purchase_price' })
  purchasePrice!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'selling_price' })
  sellingPrice!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'last_updated' })
  lastUpdated!: Date;

  @Column({ type: 'varchar', length: 255, name: 'updated_by' })
  updatedBy!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @BeforeUpdate()
  updateLastUpdated() {
    this.lastUpdated = getCurrentISTTime();
  }
}

