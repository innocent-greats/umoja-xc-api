import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import {OfferItem, Vehicle, VehicleDriver, WarehouseReceiptImage} from "./offer-item.entity";
import { Business, User } from "src/users/entities/user.entity";
import { Wallet } from "src/users/entities/wallet.entity";
  
@Entity()
export class Order {
    @PrimaryGeneratedColumn('uuid')
    orderID :  string;
    @CreateDateColumn()
    orderDate: Date;
    @CreateDateColumn()
    createdDate: Date;
    @UpdateDateColumn()
    updatedDate: Date;
    @DeleteDateColumn()
    deletedDate: Date;
    @Column({nullable: true})
    bookedServiceDate: Date;
    @Column({nullable: true})
    orderTrackerHash :  string;
    @Column({nullable: true})
    orderStatus : string; // service specific status 
    @Column({nullable: true}) 
    updatedStatus: string
    @Column({nullable: true})
    updatedStatusMessage : string; // service specific status 
    @Column({nullable: true})
    quantity : number;
    @Column({nullable: true})
    commodityWeight: number;
    @Column({nullable: true})
    offerItemCategory: string;
    @Column({nullable: true})
    totalAmount : number;
    @ManyToOne(() => User, (provider: User) => provider.orders)
    provider: User;
    @ManyToOne(() => User, (customer: User) => customer.orders)
    customer: User;
    @ManyToOne(() => OfferItem, (offerItem: OfferItem) => offerItem.orders)
    offerItem: OfferItem;
    @ManyToOne(() => Wallet, (wallet: Wallet) => wallet.transactions)
    wallet: Wallet;
}


@Entity()
export class TransportOrder {
  @PrimaryGeneratedColumn('uuid')
  transportOrderID :  string;
  @CreateDateColumn()
  createdDate: Date;
  @UpdateDateColumn()
  updatedDate: Date;
  @DeleteDateColumn()
  deletedDate: Date;
  @ManyToOne(() => Vehicle, (assignedVehicle: Vehicle) => assignedVehicle.orders)
  assignedVehicle: Vehicle[];
  @JoinColumn({ name: 'orderID' })
  @OneToOne(() => Order,{ nullable: true})
  public salesOrder?: Order;
}
@Entity()
export class WarehouseReceipt {
    @PrimaryGeneratedColumn('uuid')
    warehouseReceiptID :  string;
    @CreateDateColumn()
    warehouseReceiptDate: Date;
    @CreateDateColumn()
    createdDate: Date;
    @UpdateDateColumn()
    updatedDate: Date;
    @DeleteDateColumn()
    deletedDate: Date;
    @Column({nullable: true})
    bookedServiceDate: Date;
    @Column({nullable: true})
    warehouseReceiptPublicChainTracker :  string;
    @Column({nullable: true})
    warehouseReceiptStatus : string; // service specific status 
    @Column({nullable: true}) 
    updatedStatus: string
    @Column({nullable: true})
    updatedStatusMessage : string; // service specific status 
    @Column({nullable: true})
    commodityWeight: number;
    @Column({nullable: true})
    offerItemCategory: string;
    @Column({nullable: true})
    tradeableAmount : number;
    @ManyToOne(() => Business, (issuer: Business) => issuer.orders)
    issuer: Business;
    @ManyToOne(() => User, (customer: User) => customer.warehouseReceipts)
    customer: User;
    @ManyToOne(() => OfferItem, (offerItem: OfferItem) => offerItem.orders)
    offerItem: OfferItem;
    @ManyToOne(() => Wallet, (wallet: Wallet) => wallet.transactions)
    wallet: Wallet;
    @JoinColumn({ name: 'orderID' })
    @OneToOne(() => Order,{ nullable: true})
    public warehouseOrder?: Order;
    @OneToMany(() => WarehouseReceiptImage, (image: WarehouseReceiptImage) => image.warehouseReceipt)
    images: WarehouseReceiptImage[];
}



