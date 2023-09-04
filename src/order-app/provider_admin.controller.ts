import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Req,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { ProviderAdminService } from './provider_admin.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { RequestWithOfferItem } from 'src/users/dto/requestWithUser.interface';
import { VehicleDTO } from './dto/vehicle.dto';
import { WarehouseReceiptDTO } from './dto/order.dto';
import { UsersService } from 'src/users/users.service';

@Controller('provider-admin')
export class ProviderAdminController {
  constructor(
    private readonly providerAdminService: ProviderAdminService,
    private readonly usersService: UsersService,
  ) {}

  @Get('offerItems/:fileId')
  async serveOfferItemImage(@Param('fileId') fileId, @Res() res): Promise<any> {
    res.sendFile(fileId, { root: 'uploadedFiles/offerItems' });
  }

  @Post('add-new-vehicle')
  // @UseGuards(JwtAuthenticationGuard)
  @UseInterceptors(
    FilesInterceptor('file', 5, {
      storage: diskStorage({
        destination: './uploadedFiles/vehicles',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(
            null,
            `${randomName}${extname(file.originalname + '.jpeg')}`,
          );
        },
      }),
    }),
  )
  async addNewVehicle(
    @Req() request: RequestWithOfferItem,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    console.log(
      'AddNewTruck vehicle request',
      request.body['new-vehicle-request'],
    );
    const req: VehicleDTO = JSON.parse(request.body['new-vehicle-request']);
    console.log('AddNewTruck vehicle', req);
    return this.providerAdminService.addNewVehicle(req, files);
  }
  @Post('add-new-vehicle')
  // @UseGuards(JwtAuthenticationGuard)
  @UseInterceptors(
    FilesInterceptor('file', 5, {
      storage: diskStorage({
        destination: './uploadedFiles/warehouse-receipts',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(
            null,
            `${randomName}${extname(file.originalname + '.jpeg')}`,
          );
        },
      }),
    }),
  )
  async generateNewWareHouseCertificate(
    @Req() request: RequestWithOfferItem,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    console.log('AddNewTruck vehicle request', request.body['vehicle']);
    const req: WarehouseReceiptDTO = JSON.parse(request.body['vehicle']);
    console.log('AddNewTruck vehicle', req);
    return this.providerAdminService.generateNewWareHouseCertificate(
      req,
      files,
    );
  }
  @Get('get-account-vehicles/:providerId')
  async getAccountVehicles(@Param('providerId') providerId): Promise<any> {
    console.log('getAccountVehicles providerId', providerId);
    const vehicles = await this.providerAdminService.findVehiclesByProviderId(
      providerId,
    );
    return {
      status: 200,
      data: JSON.stringify(vehicles),
      error: null,
      errorMessage: null,
      successMessage: 'success',
    };
  }

  @Get('get-all-employees/:providerId')
  async getAllEmployees(@Param('providerId') providerId): Promise<any> {
    console.log('getAllEmployees providerId', providerId);
    const vehicles = await this.usersService.findEmployeesByEmployeerId(
      providerId,
    );
    return {
      status: 200,
      data: JSON.stringify(vehicles),
      error: null,
      errorMessage: null,
      successMessage: 'success',
    };
  }
  // @Post('get-all-employees')
  // async getAllEmployees(@Body() providerId) {
  //   console.log('getAllEmployees providerId', providerId);
  //   const employees = await this.usersService.findEmployeesByEmployeerId(
  //     providerId,
  //   );
  //   console.log('getAllEmployees employees', employees);

  //   return {
  //     status: 200,
  //     data: JSON.stringify(employees),
  //     error: null,
  //     errorMessage: null,
  //     successMessage: 'success',
  //   };
  // }

  @Get('get-account-employee/:providerId')
  async getAccountEmployees(@Param('providerId') providerId): Promise<any> {
    console.log('getAccountVehicles providerId', providerId);
    const vehicles = await this.providerAdminService.findVehiclesByProviderId(
      providerId,
    );
    return {
      status: 200,
      data: JSON.stringify(vehicles),
      error: null,
      errorMessage: null,
      successMessage: 'success',
    };
  }
}
