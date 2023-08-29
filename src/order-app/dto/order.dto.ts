
import { User } from "src/users/entities/user.entity";
import { Wallet } from "src/users/entities/wallet.entity";
import { OfferItem } from "../entities/offer-item.entity";
import { Order } from "../entities/order.entity";

export class OrderDTO {
    orderTrackerHash :  string;
    orderStatus : string; // service specific status 
    quantity : number;
    totalAmount : number; 
    updatedStatus: string
}

export class WarehouseReceiptDTO {
    issuedDate: Date;
    warehouseReceiptPublicChainTracker :  string;
    warehouseReceiptStatus : string; // service specific status  
    updatedStatus: string
    updatedStatusMessage : string; // service specific status 
    commodityWeight: number;
    offerItemCategory: string;
    tradeableAmount : number;
    provider: User;
    customer: User;
    offerItem: OfferItem;
    warehouseOrder: string;
    wallet: Wallet;
}