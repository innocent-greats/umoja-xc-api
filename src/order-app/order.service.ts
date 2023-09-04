import {  Injectable,  } from '@nestjs/common';

import { TextDecoder } from 'util';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, TransportOrder, WarehouseReceipt } from './entities/order.entity';
import { VehicleDriver } from './entities/offer-item.entity';
import { UsersService } from 'src/users/users.service';
import { PlaceOrderSocketDTO } from 'src/users/dto/create-user.input';
import OfferItemsService from './offer-item.service';
import { WarehouseReceiptDTO } from './dto/order.dto';
import { v4 as uuid } from 'uuid';


const utf8Decoder = new TextDecoder();

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(WarehouseReceipt)
    private readonly WarehouseReceiptRepository: Repository<WarehouseReceipt>,


    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @InjectRepository(VehicleDriver)
    private readonly vehicleDriverRepository: Repository<VehicleDriver>, 

    @InjectRepository(TransportOrder)
    private readonly transportOrderRepository: Repository<TransportOrder>, 

     private readonly usersService: UsersService, private readonly offerItemService: OfferItemsService
  ) { }

  async getAllAccountOrdersByStatus(request: any) {
    console.log('getOrdersByAccountIDAndServiceInRequestStatus Request')
    // console.log(request)
    const orders = await this.orderRepository.find(
      { where: { customer: request.servingAccountID, orderID: request.servingStatus, updatedStatus: 'false' } })

    // console.log('orders')
    // console.log(orders)
    return { status: 200, data: { orders }, err: null }
  }
  async findOrderByCustomerOrVendorId(userID: string): Promise<Order> {
    const queryBuilder = this.orderRepository.createQueryBuilder('order');

    // Join with the Customer and Vendor relations
    queryBuilder
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.provider', 'provider')
      .leftJoinAndSelect('order.offerItem', 'offerItem')
      .leftJoinAndSelect('offerItem.images', 'images');

    // Use OR to match either customer or provider userID
    queryBuilder.where('customer.userID = :userID OR provider.userID = :userID', { userID });

    // Execute the query and return the results
    const order = await queryBuilder.getOne();
    // console.log('@getAccountOrders orders', order)
    return order;
  }

  async findOrdersByCustomerOrVendorId(userID: string): Promise<Order[]> {
    const queryBuilder = this.orderRepository.createQueryBuilder('order');

    // Join with the Customer and Vendor relations
    queryBuilder
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.provider', 'provider')
      .leftJoinAndSelect('order.offerItem', 'offerItem')
      .leftJoinAndSelect('offerItem.images', 'images');

    // Use OR to match either customer or provider userID
    queryBuilder.where('customer.userID = :userID OR provider.userID = :userID', { userID });

    // Execute the query and return the results
    const orders = await queryBuilder.getMany();
    // console.log('@getAccountOrders orders', orders)
    return orders;
  }
  async placeOrder(orderDTO: PlaceOrderSocketDTO
  ) {
    let ord = JSON.parse(orderDTO.order)
    const client = await this.usersService.findOneByUserID(ord['customerID'])
    const provider = await this.usersService.findOneByUserID(ord['providerID'])
    const offerItem = await this.offerItemService.getOfferItemByID(ord['offerItemID'])

    const newOrder = {
      commodityWeight: ord['commodityWeight'],
      customer: client,
      provider: provider,
      orderDate: ord['orderDate'],
      offerItem: offerItem,
      orderTrackerHash: offerItem.publicFootPrint,
      orderStatus: ord['orderStatus'],
      offerItemCategory: ord['offerItemCategory']
    }
    const newOrderSchema = this.orderRepository.create(newOrder);
    const orderItem = await this.orderRepository.save(newOrderSchema);

    let order = await this.orderRepository.findOne({
      where: { orderID: orderItem.orderID },
      relations: { provider: true, customer: true, offerItem: true }
    })

    order['offerItem'] = offerItem;

    return order;
  }


  async placeTransportOrder(orderDTO: PlaceOrderSocketDTO) 
  {
      let ord = JSON.parse(orderDTO.order)
      const assignedVehicle = await this.vehicleDriverRepository.findOne({
        where:{
          vehicleID: ord['vehicleID']
        }
      })
      let order = await this.orderRepository.findOne({
        where: { orderID: ord['orderID'] },
        relations: { provider: true, customer: true, offerItem: true }
      })      
        const newOrder = {
        assignedVehicle: [assignedVehicle],
        order: order,
      }
      const newOrderSchema = this.transportOrderRepository.create(newOrder);
      const orderItem = await this.transportOrderRepository.save(newOrderSchema);

      return orderItem;
    }


    async generateNewWareHouseCertificate(wareHouseCertificateDTO: WarehouseReceiptDTO) {
        let ord = JSON.parse(wareHouseCertificateDTO.warehouseOrder)
        const assignedVehicle = await this.vehicleDriverRepository.findOne({
          where:{
            vehicleID: ord['vehicleID']
          }
        })
        const issuer = await this.usersService.findOneByUserID(ord['driverID'])
        const customer = await this.usersService.findOneByUserID(ord['driverID'])
        const wallet = await this.usersService.findOneByUserID(ord['driverID'])
        const offerItem = await this.offerItemService.getOfferItemByID(ord['offerItemID'])

        let order = await this.orderRepository.findOne({
          where: { orderID: ord['orderID'] },
          relations: { provider: true, customer: true, offerItem: true }
        })      
          const newWareHouseCertificate= {
            issuedDate: ord['orderDate'],
            warehouseReceiptPublicChainTracker :  uuid(),
            warehouseReceiptStatus : ord['warehouseReceiptStatus'],// service specific status  
            commodityWeight: ord['commodityWeight'],
            offerItemCategory: ord['offerItemCategory'],
            tradeableAmount :ord['tradeableAmount'],
            provider: issuer,
            customer: customer,
            offerItem: offerItem,
            warehouseOrder: order,
            wallet: wallet,
        }
        const newWareHouseCertificateSchema = this.WarehouseReceiptRepository.create(newWareHouseCertificate);
        const newWareHouseCertificateSaved = await this.WarehouseReceiptRepository.save(newWareHouseCertificateSchema);
        return newWareHouseCertificateSaved;
      }



    async assignVehicleToDriver(orderDTO: PlaceOrderSocketDTO) {
        let ord = JSON.parse(orderDTO.order)
        const assignedVehicle = await this.WarehouseReceiptRepository.findOne({
          where:{
            warehouseOrder: ord['vehicleID']
          }
        })
        const assignedDriver = await this.usersService.findOneByUserID(ord['driverID'])
        let order = await this.orderRepository.findOne({
          where: { orderID: ord['orderID'] },
          relations: { provider: true, customer: true, offerItem: true }
        })      
          const newAllocation= {
          assignedVehicle: assignedVehicle,
          driver: assignedDriver,
        }
        const newAllocationSchema = this.vehicleDriverRepository.create(newAllocation);
        const newAllocationSaved = await this.vehicleDriverRepository.save(newAllocationSchema);
        return newAllocationSaved;
      }
  
  async acceptChainOrder(orderDTO: PlaceOrderSocketDTO) {
    // console.log('@acceptChainOrder ', orderDTO)
    let ord = JSON.parse(orderDTO.order)
    const oldorder = await this.orderRepository.findOne({
      where: { orderID: ord['orderID'] },
      relations: { provider: true, customer: true, offerItem: true }
    })
    const acceptingProvider = await this.usersService.findOneByUserID(ord['providerID'])
    const chainedProvider = await this.usersService.findOneByUserID(ord['chainedProviderID'])
    const offerItem = await this.offerItemService.getOfferItemByID(ord['offerItemID'])
    let updatedOrder = await this.updateOrder(orderDTO)


    ord["orderStatus"] = 'transport-request-order'
    ord["offerItemID"] = oldorder.offerItem.itemID
    ord["commodityWeight"] = oldorder.offerItem.commodityWeight
    ord["offerItemCategory"] = oldorder.offerItem.itemCategory
    ord["customerID"] = oldorder.customer.userID
    ord["providerID"] = ord['chainedProviderID']
    orderDTO.order =  JSON.stringify(ord)

    const chainedOrder =  await this.placeOrder(orderDTO)
    
    return [updatedOrder, chainedOrder];
  }


  async updateOrder(orderDTO: PlaceOrderSocketDTO) {
      let ord = JSON.parse(orderDTO.order)
      const offerItem = await this.offerItemService.getOfferItemByID(ord['offerItemID'])
      let order = await this.orderRepository.findOne({
        where: { orderID: ord['orderID'] },
        relations: { provider: true, customer: true, offerItem: true }
      })
      
      order.orderStatus = ord['orderStatus']
      order.updatedStatusMessage = ord['updatedStatusMessage']
      await this.orderRepository.update(order.orderID, order);
      let updatedOrder = await this.orderRepository.findOne({
        where: { orderID: order.orderID },
        relations: { provider: true, customer: true, offerItem: true }
      })
  
      order['offerItem'] = offerItem;
  
      return updatedOrder;
    }
}


