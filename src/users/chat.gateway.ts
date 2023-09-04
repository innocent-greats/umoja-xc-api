
import {
  ConnectedSocket,
  MessageBody, OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import Message from './entities/message.entity';
import { MessageDTO, PlaceOrderSocketDTO } from './dto/create-user.input';
import { UsersService } from './users.service';
import { InjectRepository } from '@nestjs/typeorm';
import { ConnectedUser, User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { Order } from 'src/order-app/entities/order.entity';
import { OfferItem } from 'src/order-app/entities/offer-item.entity';
import { ClassSerializerInterceptor, Controller, UseInterceptors } from '@nestjs/common';
import OfferItemsService from 'src/order-app/offer-item.service';
import { OrderService } from 'src/order-app/order.service';
import { WalletService } from 'src/order-app/wallet.service';
const connectUsers = []


@Controller('offer-items')
@UseInterceptors(ClassSerializerInterceptor)
export default class OfferItemController {
  constructor(
    private readonly offerItemsService: OfferItemsService
  ) { }


}

@WebSocketGateway({ transports: ['websocket'] })
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ConnectedUser)
    private readonly connectedUserRepository: Repository<ConnectedUser>,
    @InjectRepository(Order)
    private readonly OrderRepository: Repository<Order>,
    @InjectRepository(OfferItem)
    private readonly OfferItemRepository: Repository<OfferItem>,
    private readonly chatService: ChatService,
    private readonly userService: UsersService,
    private readonly ordersService: OrderService,
    private readonly walletService: WalletService
  ) {
  }

  async socketRegisterUser(user, socket: Socket, status: string) {
    try {
      // console.log('socketRegisterUser. socket.user', user);
      const userConnected = await this.connectedUserRepository.findOne({ where: { userID: user.userID } })
      if (userConnected) {
        // console.log('socketRegisterUser. userExist', userConnected);
        // console.log('socketRegisterUser. socket.id', socket.id);
       

        if (status == 'offline') {
          // console.log('user connection status', status);
          userConnected.currentConnectionStatus = 'offline'
          userConnected.isOnline = false
          userConnected.socketID = null
          await this.connectedUserRepository.update(userConnected.connectionID, userConnected);
          const data = await this.connectedUserRepository.findOne({ where: { connectionID: userConnected.connectionID } })
          // console.log('updated socketRegisterUser. connection', data);
          return data;
        } else {
          // console.log('user connection status', status);
          if(userConnected.socketID != socket.id){
            // console.log(`updating socketRegisterUser. from ${userConnected.socketID} to ${ socket.id}`);
            userConnected.currentConnectionStatus = 'online'
            userConnected.isOnline = true
            userConnected.socketID = socket.id
            await this.connectedUserRepository.update(userConnected.connectionID, userConnected);
            const data = await this.connectedUserRepository.findOne({ where: { userID: user.userID } })
            // console.log('updated socketRegisterUser. connection', data);
            return data;
          }
          return userConnected;

        }
      } else {
        // console.log('socketRegisterUser. user does not exist');
        const connection = {
          socketID: socket.id,
          userID: user.userID,
          currentConnectionStatus: 'online',
          isOnline: true
        }
        // console.log('socketRegisterUser. user does not Exist connection',connection);
        const newConnection = this.connectedUserRepository.create(connection);
                              await this.connectedUserRepository.save(newConnection);
        const savedConnection = await this.connectedUserRepository.findOne({ where: { userID: user.userID } })
        // console.log('socketRegisterUser. savedConnection socket.id', savedConnection);
        return savedConnection;
      }
    } catch (error) {

    }
  }
  async handleConnection(socket: Socket) {
    const user = await this.chatService.getUserFromSocket(socket);
    if (user) {
      await this.socketRegisterUser(user, socket, 'online')
    }
  }

  @SubscribeMessage('send_message')
  async listenForMessages(
    @MessageBody() messageDTO: MessageDTO,
    @ConnectedSocket() socket: Socket,
  ) {
    const reciever = await connectUsers.find(userConnected => {
      if (userConnected.userPhone == messageDTO.recieverPhone) {
        return userConnected
      }
    })
    const data = {
      "reciever": reciever.socketID,
      "sender": '',
      "message": true,
    }

    this.server.sockets.to(reciever.socketID).emit('receive_message', JSON.stringify(data))
    // this.server.sockets.emit('receive_message', messageDTO.content);

    return messageDTO;
  }

  @SubscribeMessage('request_all_messages')
  async requestAllMessages(
    @MessageBody() messageDTO: MessageDTO,
    @ConnectedSocket() socket: Socket,
  ) {
    await this.chatService.getUserFromSocket(socket);
    const messages = await this.chatService.getAllMessages();

    socket.emit('send_all_messages', messages);
  }

  @SubscribeMessage('notify-online-status')
  async notifyOnlineStatus(
    @MessageBody() messageDTO: MessageDTO,
    @ConnectedSocket() socket: Socket,
  ) {
    let sender: any;
    console.log('@notifyOnlineStatus', messageDTO.senderID)
    const user = await this.userService.findOneByUserID(messageDTO.senderID);
    // console.log('user', user)
    if(user){
      sender = await this.socketRegisterUser(user, socket, messageDTO.content)
      const data = {
        socketID: sender.socketID,
        data: sender,
      }
      this.server.sockets.to(sender.socketID).emit('update-online-status', JSON.stringify(data))
    }

  }
  


  @SubscribeMessage('get-wallet-balance')
  async getWalletbalance(
    @MessageBody() messageDTO: MessageDTO,
    @ConnectedSocket() socket: Socket,
  ) {
    let sender: any;
    const user = await this.chatService.getUserFromSocket(socket);
    sender = await this.socketRegisterUser(user, socket, messageDTO.content)
    const fetchWallet = await this.walletService.findWallet(messageDTO.senderID);
    const data = {
      data: fetchWallet,
    }
    this.server.sockets.to(sender.socketID).emit('recieve-wallet-update', JSON.stringify(data))
  }

  @SubscribeMessage('get-providers')
  async getproviders(
    @MessageBody() messageDTO: MessageDTO,
    @ConnectedSocket() socket: Socket,
  ) {
    let providers = await this.userRepository.find({ where: { accountType: 'provider' } })
    providers.map(async (user) => {
      let matchingObject = await this.connectedUserRepository.findOne({ where: { userID: user.userID } });
      if (matchingObject) {
        user.onlineStatus = true;
      } else {
        user.onlineStatus = false;
      }
    })
    providers.sort((a, b) => (a.onlineStatus === b.onlineStatus ? 0 : a.onlineStatus ? -1 : 1));

    const sender = await this.connectedUserRepository.findOne({ where: { userID: messageDTO.senderID } })

    const data = {
      "to": sender.socketID,
      "message": 'success',
      "providers": JSON.stringify(providers),
    }
    // this.server.sockets.to(sender.socketID).emit('receive-providers', JSON.stringify(data))
  }

  @SubscribeMessage('get-account-orders')
  async getOrders(
    @MessageBody() messageDTO: any,
    @ConnectedSocket() socket: Socket,
  ) {
    const user = await this.chatService.getUserFromSocket(socket);
    if(user){
      const account = await this.socketRegisterUser(user, socket, messageDTO.content)
      const orders = await this.ordersService.findOrdersByCustomerOrVendorId(user.userID);
      const data = {
        "orders": JSON.stringify(orders),
      }
      this.server.sockets.to(account.socketID).emit('receive-account_orders', JSON.stringify(data))
    }

  }

  @SubscribeMessage('get-account-offer-items')
  async getOfferItems(
    @MessageBody() messageDTO: any,
    @ConnectedSocket() socket: Socket,
  ) {
    const user = await this.chatService.getUserFromSocket(socket);
    const provider = await this.socketRegisterUser(user, socket, messageDTO.content)
    const orders = await this.OfferItemRepository.find({
      relations: { orders: true },
      where: {
        provider: {
          userID: messageDTO.clientID
        }
      }, take: 20,
    });

    const data = {
      "orders": JSON.stringify(orders),
    }
    this.server.sockets.to(provider.socketID).emit('account-orders', JSON.stringify(data))
  }

  @SubscribeMessage('place-order')
  async placeOrder(
    @MessageBody() orderDTO: PlaceOrderSocketDTO,
    @ConnectedSocket() socket: Socket,
  ) {
    console.log('orderDTO', orderDTO)
    let ord = JSON.parse(orderDTO.order)
    let order = await this.ordersService.placeOrder(orderDTO)
    const data = {
      "order": JSON.stringify(order),
    }
    
    console.log(' orderDTO.providerID', ord.providerID)
    const userConnection = await this.connectedUserRepository.findOne({ where: { userID:ord.providerID, currentConnectionStatus: 'online' } })
    if (userConnection) {
      console.log('userConnection',userConnection)
      this.server.sockets.to(userConnection.socketID).emit('receive-order-request', JSON.stringify(data))
    }
    return order;
  }
  @SubscribeMessage('respond-grading-order')
  async respondToGradingOrder(
    @MessageBody() orderDTO: PlaceOrderSocketDTO,
    @ConnectedSocket() socket: Socket,
  ) {
    let ord = JSON.parse(orderDTO.order)

    if(ord['state'] == 'accepted'){
      let order = await this.ordersService.acceptChainOrder(orderDTO)
      // console.log('acceptChainOrder order', )
      if(order && ord['chainedProviderID']){
        const data = {
          "order": JSON.stringify(order[1]),
        }
        const userConnection = await this.connectedUserRepository.findOne({ where: { userID: ord['chainedProviderID'], currentConnectionStatus: 'online' } })
        if (userConnection) {
          // console.log('sending to chainedProviderID order',userConnection )
          this.server.sockets.to(userConnection.socketID).emit('receive_order-request', JSON.stringify(data))
        }
      }
      const userConnection = await this.connectedUserRepository.findOne({ where: { userID: ord['customerID'], currentConnectionStatus: 'online' } })
      if (userConnection) {
        // console.log('sending to customerID order',userConnection )
        const data = {
          "order": JSON.stringify(order[0]),
        }
        this.server.sockets.to(userConnection.socketID).emit('order-request-accepted', JSON.stringify(data))
      }
      return order;
    }
    
    if(ord['state'] == 'rejected'){
      let order = await this.ordersService.updateOrder(orderDTO)
      const userConnection = await this.connectedUserRepository.findOne({ where: { userID: ord['customerID'], currentConnectionStatus: 'online' } })
      if (userConnection) {
        const data = {
          "order": JSON.stringify(order),
        }
        this.server.sockets.to(userConnection.socketID).emit('order-request-accepted', JSON.stringify(data))
      }
    }
  }
  @SubscribeMessage('accept-order')
  async acceptorder(
    @MessageBody() messageDTO: any,
    @ConnectedSocket() socket: Socket,
  ) {
    console.log('@connectUsers messageDTO 1 ', messageDTO.clientID)
    const provider = await connectUsers.find(userConnected => {
      if (userConnected.userID == messageDTO.clientID) {
        return userConnected
      }
    })
    const order = await this.OrderRepository.findOne({ where: { orderID: messageDTO.orderID }, relations: { customer: true, provider: true, offerItem: true } });

    order.orderStatus = 'provider-accepted'
    order.provider = await this.userRepository.findOne({ where: { userID: messageDTO.providerID } })

    await this.OrderRepository.update(order.orderID, order);
    const updatedorder = await this.OrderRepository.findOne({ where: { orderID: messageDTO.orderID }, relations: { customer: true, provider: true, offerItem: true } });
    const data = {
      "order": JSON.stringify(updatedorder),
    }
    this.server.sockets.to(provider.socketID).emit('order-request-accepted', JSON.stringify(data))
  }

}