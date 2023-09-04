
import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Employee, User } from '../../users/entities/user.entity';
import { Order, TransportOrder, WarehouseReceipt } from './order.entity';

@Entity()
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  vehicleID :  string;
  @CreateDateColumn()
  createdDate: Date;
  @UpdateDateColumn()
  updatedDate: Date;
  @DeleteDateColumn()
  deletedDate: Date;
  @Column({nullable: true})
  vehicleClass: string;
  @Column({nullable: true})
  manufacturer: string;
  @Column({nullable: true})
  carryingWeightMax: string;
  @Column({nullable: true})
  carryingWeightMin: string;
  @Column({nullable: true})
  engineNumber: string;
  @Column({nullable: true})
  gvtRegNumber: string;
  @Column({nullable: true})
  description: string;
  @Column({nullable: true})
  routesActive: boolean;
  @Column({nullable: true})
  onSale :  boolean;
  @ManyToOne(() => User, (provider: User) => provider.offerItems)
  provider: User;
  // @OneToOne(() => VehicleDriver, (provider: VehicleDriver) => provider.vehicle)
  // driver: VehicleDriver;
  @OneToMany(() => TransportOrder, (order: TransportOrder) => order.assignedVehicle)
  orders: TransportOrder[];
  @OneToMany(() => VehicleImage, (image: VehicleImage) => image.vehicle)
  images: VehicleImage[];
}

@Entity()
export class VehicleDriver {
  @PrimaryGeneratedColumn('uuid')
  vehicleID :  string;
  @CreateDateColumn()
  createdDate: Date;
  @UpdateDateColumn()
  updatedDate: Date;
  @DeleteDateColumn()
  deletedDate: Date;
  @JoinColumn({ name: 'userID' })
  @OneToOne(() => Employee,{ nullable: true})
  driver: Employee;
  @JoinColumn({ name: 'vehicleID' })
  @OneToOne(() => Vehicle,{ nullable: true})
  vehicle: Vehicle;
  @OneToMany(() => TransportOrder, (assignedOrders: TransportOrder) => assignedOrders.assignedVehicle)
  assignedOrders: TransportOrder[];
}


@Entity()
export class OfferItem {
  @PrimaryGeneratedColumn('uuid')
  itemID :  string;
  @CreateDateColumn()
  createdDate: Date;
  @UpdateDateColumn()
  updatedDate: Date;
  @DeleteDateColumn()
  deletedDate: Date;
  @Column({nullable: true})
  itemName:string 
  @Column({nullable: true})
  itemCategory:string 
  @Column({nullable: true})
  providerID :  string;
  @Column({nullable: true})
  offeringStatus : string; 
  @Column({nullable: true})
  trendingStatus : string; 
  @Column({nullable: true})
  description : string; 
  @Column({nullable: true})
  publishStatus : string; 
  @Column({nullable: true})
  publicFootPrint :  string;
  @Column({nullable: true})
  quantity : string;
  @Column({nullable: true})
  commodityWeight: string;
  @Column({nullable: true})
  minimumPrice : string;
  @ManyToOne(() => User, (provider: User) => provider.offerItems)
  provider: User;
  @OneToMany(() => Order, (order: Order) => order.offerItem)
  orders: Order[];
  @OneToMany(() => OfferItemImage, (image: OfferItemImage) => image.offerItem)
  images: OfferItemImage[];
}
 

@Entity()
export class OfferItemImage {
  @PrimaryGeneratedColumn('uuid')
  imageID :  string;

  @Column()
  filename: string;
 
  @Column()
  path: string;
 
  @Column()
  mimetype: string;

  @ManyToOne(() => OfferItem, (offerItem: OfferItem) => offerItem.images)
  public offerItem: OfferItem;

  @ManyToOne(() => Vehicle, (vehicle: Vehicle) => vehicle.images)
  public vehicle: Vehicle;
}

@Entity()
export class VehicleImage {
  @PrimaryGeneratedColumn('uuid')
  imageID :  string;

  @Column()
  filename: string;
 
  @Column()
  path: string;
 
  @Column()
  mimetype: string;
  
  @ManyToOne(() => Vehicle, (vehicle: Vehicle) => vehicle.images)
  public vehicle: Vehicle;
}



@Entity()
export class WarehouseReceiptImage {
  @PrimaryGeneratedColumn('uuid')
  imageID :  string;

  @Column()
  filename: string;
 
  @Column()
  path: string;
 
  @Column()
  mimetype: string;
  
  @ManyToOne(() => WarehouseReceipt, (warehouseReceipt: WarehouseReceipt) => warehouseReceipt.images)
  public warehouseReceipt: WarehouseReceipt;
}