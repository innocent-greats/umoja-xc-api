import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business, ConnectedUser, Employee, EmployeeJobs, User } from './entities/user.entity';
import { AuthModule } from 'src/common/auth.module';
import { UsersController } from './users.controller';
import {
  Order,
  TransportOrder,
  WarehouseReceipt,
} from 'src/order-app/entities/order.entity';
import {
  OfferItem,
  OfferItemImage,
  Vehicle,
  VehicleDriver,
  VehicleImage,
  WarehouseReceiptImage,
} from 'src/order-app/entities/offer-item.entity';
import Message, { OTP } from './entities/message.entity';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { OrderController } from 'src/order-app/order.controller';
import { OrderService } from 'src/order-app/order.service';
import OfferItemController from 'src/order-app/offer-item.controller';
import OfferItemsService from 'src/order-app/offer-item.service';
import OfferItemsSearchService from 'src/search/search.service';
import { SearchModule } from 'src/search/search.module';
import LocalFilesService from 'src/files/localFiles.service';
import LocalFile from 'src/files/localFile.entity';
import { ProviderAdminController } from 'src/order-app/provider_admin.controller';
import { ProviderAdminService } from 'src/order-app/provider_admin.service';
import { WalletController } from 'src/order-app/wallet.controller';
import { WalletService } from 'src/order-app/wallet.service';
import { HttpModule } from '@nestjs/axios';
import { Wallet, WalletTransaction } from './entities/wallet.entity';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    forwardRef(() => SearchModule),
    forwardRef(() => HttpModule),

    TypeOrmModule.forFeature([
      User,
      Order,
      OfferItem,
      OfferItemImage,
      Message,
      OTP,
      LocalFile,
      Business,
      ConnectedUser,
      WarehouseReceipt,
      Vehicle,
      VehicleDriver,
      TransportOrder,
      Wallet,
      WalletTransaction,
      VehicleImage,
      WarehouseReceiptImage,
      Employee,
      EmployeeJobs,
      Business,
      
      
    ]),
  ],
  providers: [
    UsersService,
    ChatService,
    ChatGateway,
    OrderService,
    OfferItemsService,
    OfferItemsSearchService,
    LocalFilesService,
    ProviderAdminService,
    WalletService,
    JwtService,
  ],
  exports: [
    UsersService,
    TypeOrmModule,
    OrderService,
    OfferItemsService,
    LocalFilesService,
    WalletService,ProviderAdminService
  ],
  controllers: [
    UsersController,
    OrderController,
    OfferItemController,
    ProviderAdminController,
    WalletController,
  ],
})
export class UsersModule {}
