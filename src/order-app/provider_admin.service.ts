import { Inject, Injectable, forwardRef } from '@nestjs/common';

import { TextDecoder } from 'util';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, TransportOrder, WarehouseReceipt } from './entities/order.entity';
import { OfferItem, OfferItemImage, Vehicle, VehicleDriver, VehicleImage, WarehouseReceiptImage } from './entities/offer-item.entity';
import { UsersService } from 'src/users/users.service';
import { Employee, User } from 'src/users/entities/user.entity';
import { PlaceOrderSocketDTO } from 'src/users/dto/create-user.input';
import OfferItemsService from './offer-item.service';
import { WarehouseReceiptDTO } from './dto/order.dto';
import { v4 as uuid } from 'uuid';
import { VehicleDTO } from './dto/vehicle.dto';
import { AuthService } from 'src/common/auth/auth.service';
import { WalletTransactionRequest } from 'src/users/dto/wallet-create.dto';


const utf8Decoder = new TextDecoder();

@Injectable()
export class ProviderAdminService {
  constructor(

    @InjectRepository(OfferItem)
    private offerItemRepository: Repository<OfferItem>,

    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,

    @InjectRepository(VehicleImage)
    private VehicleImageRepository: Repository<VehicleImage>,


    @InjectRepository(WarehouseReceiptImage)
    private certificateImageRepository: Repository<WarehouseReceiptImage>,

    private readonly authenticationService: AuthService,
    @InjectRepository(WarehouseReceipt)
    private readonly WarehouseReceiptRepository: Repository<WarehouseReceipt>,

    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @InjectRepository(VehicleDriver)
    private readonly vehicleDriverRepository: Repository<VehicleDriver>, 

     private readonly usersService: UsersService, private readonly offerItemService: OfferItemsService
  ) { }

    async generateNewWareHouseCertificate(wareHouseCertificateDTO: WarehouseReceiptDTO, files: any) {
      let newFiles = [];

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
        
        await Promise.all(files.map(async (file: LocalFileDto) => {
          const image = {
              path: file.path,
              filename: file.filename,
              mimetype: file.mimetype,
              // offerItem: newOfferItem
          }
          const newImageSchema = await this.certificateImageRepository.create(image)
          const newFile = await this.certificateImageRepository.save(newImageSchema);

          newFiles.push(newFile);
      }));
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

      async addNewVehicle(vehicleDTO: VehicleDTO, files: any) {
        const newUser = await this.usersService.decodeUserToken(vehicleDTO.authToken);
        const provider = await this.usersService.findOneByUserID(newUser.userID)
        // console.log('authenticationService.decodeUserToken provider', provider)
        let newFiles = [];
        const newVehicle = new Vehicle()
        newVehicle.vehicleClass =vehicleDTO.vehicleClass, 
        newVehicle.manufacturer =vehicleDTO.manufacturer, 
        newVehicle.carryingWeightMax = vehicleDTO.carryingWeightMax,
        newVehicle.carryingWeightMin = vehicleDTO.carryingWeightMin,
        newVehicle.engineNumber = vehicleDTO.engineNumber,
        newVehicle.gvtRegNumber =vehicleDTO.gvtRegNumber,
        newVehicle.description =vehicleDTO.description,
        newVehicle.provider = provider,
            await Promise.all(files.map(async (file: LocalFileDto) => {
                const image = {
                    path: file.path,
                    filename: file.filename,
                    mimetype: file.mimetype,
                    // offerItem: newOfferItem
                }
                const newImageSchema = await this.VehicleImageRepository.create(image)
                const newFile = await this.VehicleImageRepository.save(newImageSchema);

                newFiles.push(newFile);
            }));
        
        console.log('newFiles', newFiles);
        newVehicle.images = newFiles
        const updatedVehicle = await this.vehicleRepository.save(newVehicle);
        const vehicle = await this.getVehicleByID(updatedVehicle.vehicleID);
        console.log('updatedVehicle', vehicle);

        // }
        return {
            status: 200,
            data: JSON.stringify(vehicle),
            error: null,
            errorMessage: null,
            successMessage: 'success'
        }
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


      async getVehicleByID(vehicleID: string) {
        const vehicle = await this.vehicleRepository.findOne(
            { where: { vehicleID: vehicleID }, relations: { images: true, provider: true, orders: true } }
        )
        if (!vehicle) {
            return null;
        } else {
            return vehicle;
        }
    }

    async findVehiclesByProviderId(userID: string): Promise<Vehicle[]> {
      const queryBuilder = this.vehicleRepository.createQueryBuilder('vehicle');
  
      // Join with the Customer and Vendor relations
      queryBuilder
        .leftJoinAndSelect('vehicle.provider', 'provider')
        .leftJoinAndSelect('vehicle.orders', 'orders')
        .leftJoinAndSelect('vehicle.images', 'images');
  
      // Use OR to match either customer or provider userID
      queryBuilder.where('provider.userID = :userID', { userID });
  
      // Execute the query and return the results
      const vehicles = await queryBuilder.getMany();
      // console.log('@getAccount vehicles', vehicles)
      return vehicles;
    }

}


