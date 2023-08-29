import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from 'src/order-app/entities/order.entity';
import { User } from './user.entity';

@Entity()
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  walletID: string;
  @CreateDateColumn()
  createdDate: Date;
  @UpdateDateColumn()
  updatedDate: Date;
  @DeleteDateColumn()
  deletedDate: Date;
  @Column({ nullable: true })
  userID?: string;
  @Column({ nullable: true })
  walletName?: string;
  @Column({ nullable: true })
  walletAddress?: string;
  @Column({ nullable: true })
  currentBalance: number;
  @OneToMany(() => WalletTransaction,
  (transactions: WalletTransaction) => transactions.wallet,)
  transactions: WalletTransaction[];
  @OneToOne(() => User)
  @JoinColumn({ name: 'userID' })
  user: User;
}

@Entity()
export class WalletTransaction {
  @PrimaryGeneratedColumn('uuid')
  walletTransactionID: string;
  @CreateDateColumn()
  createdDate: Date;
  @UpdateDateColumn()
  updatedDate: Date;
  @DeleteDateColumn()
  deletedDate: Date;
  @Column({ nullable: true })
  walletName: string;
  @Column({ nullable: true })
  transactionNotes: string;
  @Column({ nullable: true })
  transactionStatus: string;
  @Column({ nullable: true })
  smartContractInvoked: boolean;
  @Column({ nullable: true })
  sendingWallet: string;
  @ManyToOne(() => Wallet, (wallet: Wallet) => wallet.transactions)
  wallet: Wallet;
  // @OneToOne(() 3=> Wallet)
  // @JoinColumn({ name: 'walletID' })
  // sendingWallet: Wallet;
  // @OneToOne(() => Wallet)
  // @JoinColumn()
  @Column({ nullable: true })
  receivingWallet: string;
  @Column({ nullable: true })
  amount: number;
  @OneToOne(() => Order)
  @JoinColumn({ name: 'orderID' })
  order?: Order;
  @Column({ nullable: true })
  blockchainTransactionHash: string;
  @Column({ nullable: true })
  blockHash: string;
  @Column({ nullable: true })
  blockNumber: string;
  @Column({ nullable: true })
  cumulativeGasUsed: string;
  @Column({ nullable: true })
  gasUsed: string;
  @Column({ nullable: true })
  blockchainTransactionMessage: string;
  @Column({ nullable: true })
  contractAddress: string;
}
