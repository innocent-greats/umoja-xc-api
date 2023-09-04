import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Exclude } from '@nestjs/class-transformer';
import { OfferItem } from '../../order-app/entities/offer-item.entity';
import { Order, WarehouseReceipt } from 'src/order-app/entities/order.entity';
import PublicFile from 'src/files/localFile.entity';
import LocalFile from 'src/files/localFile.entity';
import { Wallet } from './wallet.entity';



@Entity()
export class ConnectedUser {
  @PrimaryGeneratedColumn('uuid')
  connectionID: string;
  @CreateDateColumn()
  createdDate: Date;
  @UpdateDateColumn()
  updatedDate: Date;
  @DeleteDateColumn()
  deletedDate: Date;
  @Column({ nullable: true })
  userID?: string;
  @Column({ nullable: true })
  socketID?: string;
  @Column({ nullable: true })
  currentConnectionStatus: string;
  @Column({ default: false })
  isOnline: boolean;
}


@Entity()
export class Business {
  @PrimaryGeneratedColumn('uuid')
  businessID: string;
  @Column({ nullable: true })
  adminID: string;
  @CreateDateColumn()
  createdDate: Date;
  @UpdateDateColumn()
  updatedDate: Date;
  @DeleteDateColumn()
  deletedDate: Date;
  @Column({ nullable: true })
  tradingName?: string;
  @Column({ nullable: true })
  tradingAs: string;
  @Column({ nullable: true })
  walletAddress?: string;
  @OneToOne(() => Wallet)
  @JoinColumn()
  wallet: Wallet
  @Column({ nullable: true })
  profileImage: string;
  @Column({ nullable: true })
  city: string;
  @Column({ nullable: true })
  neighbourhood: string;
  @Column({ nullable: true })
  businessType: string;
  @Column({ nullable: true })
  streetAddress: string;
  @OneToMany(() => OfferItem, (offerItem: OfferItem) => offerItem.provider)
  OfferItems: OfferItem[];
  @OneToMany(() => Order, (order: Order) => order.provider)
  orders: Order[];
  @OneToMany(() => Employee, (employees: Employee) => employees.business)
  employees: Employee[];
}

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  userID: string;
  @CreateDateColumn()
  createdDate: Date;
  @UpdateDateColumn()
  updatedDate: Date;
  @DeleteDateColumn()
  deletedDate: Date;
  @Column({ nullable: true })
  firstName?: string;
  @Column({ nullable: true })
  lastName?: string;
  @Column({ nullable: true })
  phone: string;
  @Column({ nullable: true })
  @Exclude()
  public password: string;
  @Column({ nullable: true })
  email?: string;
  @Column({ nullable: true })
  role: string;
  @Column({ nullable: true })
  profileImage: string;
  @Column({ nullable: true })
  city: string;
  @Column({ nullable: true })
  neighbourhood: string;
  @Column({ nullable: true })
  walletAddress: string;
  @Column({ nullable: true })
  onlineStatus: boolean;
  @Column({ nullable: true })
  streetAddress: string;
  @Column({ nullable: true })
  accountType: string;
  @Column({ nullable: true })
  tradingAs: string;
  @JoinColumn({ name: 'walletID' })
  @OneToOne(() => Wallet)
  wallet: Wallet
  @OneToOne(() => Business)
  @JoinColumn()
  business: Business
  @OneToMany(() => OfferItem, (offerItem: OfferItem) => offerItem.provider)
  offerItems: OfferItem[];
  @JoinColumn({ name: 'avatarId' })
  @OneToOne(() => LocalFile,{nullable: true})
  public avatar?: LocalFile;
  @Column({ nullable: true })
  public avatarId?: string;
  @OneToMany(() => Order, (order: Order) => order.customer)
  orders: Order[];
  @OneToMany(() => WarehouseReceipt, (warehouseReceipts: WarehouseReceipt) => warehouseReceipts.customer)
  warehouseReceipts: WarehouseReceipt[];
}



@Entity()
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  employeeID: string;
  @CreateDateColumn()
  createdDate: Date;
  @UpdateDateColumn()
  updatedDate: Date;
  @DeleteDateColumn()
  deletedDate: Date;
  @ManyToOne(() => User)
  @JoinColumn()
  employeer: User
  @OneToOne(() => User)
  @JoinColumn()
  profile: User
  @Column({ nullable: true })
  role: string;
  @Column({ nullable: true })
  specialization: string;
  @Column({ nullable: true })
  onlineStatus: boolean;
  @Column({ nullable: true })
  department: string;
  @Column({nullable: true , default: '0' })
  salary : string
  @Column({ nullable: true })
  deploymentStatus: string;
  @Column({ nullable: true })
  jobRole: string;
  @ManyToOne(() => Business)
  @JoinColumn()
  business: Business
  @OneToMany(() => EmployeeJobs, (performedAssignments: EmployeeJobs) => performedAssignments.employee)
  performedAssignments: EmployeeJobs[];

}

@Entity()
export class EmployeeJobs {
  @PrimaryGeneratedColumn('uuid')
  userID: string;
  @CreateDateColumn()
  createdDate: Date;
  @UpdateDateColumn()
  updatedDate: Date;
  @DeleteDateColumn()
  deletedDate: Date;
  @OneToOne(() => User)
  @JoinColumn()
  employee: User
  @OneToOne(() => User)
  @JoinColumn()
  supervisor: User
  @Column({ nullable: true })
  taskName: string;
  @Column({ nullable: true })
  timeTaken: string;
  @Column({ nullable: true })
  department: string;
  @Column({nullable: true , default: '0' })
  hourlyRate : string
  @OneToOne(() => Business)
  @JoinColumn()
  business: Business
  @OneToMany(() => Order, (order: Order) => order.provider)
  performedAssignments: Order[];

}

