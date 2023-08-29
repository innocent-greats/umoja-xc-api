import { User } from "src/users/entities/user.entity";
import { Order, TransportOrder } from "../entities/order.entity";
import { OfferItemImage } from "./offer-item.dto";
import { Vehicle } from "../entities/offer-item.entity";

export class VehicleDTO {
    authToken: string;
    vehicleClass: string;
    manufacturer: string;
    carryingWeightMax: string;
    carryingWeightMin: string;
    engineNumber: string;
    gvtRegNumber: string;
    description: string;
    routesActive: boolean;
    provider: User;
    driver: User;
    orders: Order[];
    images: OfferItemImage[];
}

export class VehicleDriverDTO {
    driver?: User;
    vehicle?: Vehicle;
    assignedOrders: TransportOrder[];
}
