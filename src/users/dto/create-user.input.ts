import { Order } from "src/order-app/entities/order.entity";

export class CreateUserDTO {
  authToken: string
  firstName?: string;
  lastName?: string;
  password?: string;
  phone: string;
  neighbourhood?: string;
  city: string;
  role: string;
  accountType: string;
  specialization: string;
  searchTerm: string;
  tradingAs: string;
  salary: string;
  department: string;
  jobRole: string;
  deploymentStatus: string;
  streetAddress: string;
}                  

export class MessageDTO {
  content: string;
  senderID: string;
  recieverID: string;
  senderPhone: string;
  recieverPhone: string;
}


export class PlaceOrderSocketDTO {
  socketID: string;
  order: string;
  clientID: string;
  clientPhone: string;
  vendorPhone: string;
  providerID: string;
  chainedProviderID: string;
}