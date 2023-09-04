import {
    Controller,
    Get,
    UseInterceptors,
    ClassSerializerInterceptor, Body, Post, Req, UploadedFiles, Param, Res,
  } from '@nestjs/common';
import OfferItemsService from './offer-item.service';
import {  OfferItemRequestDTO } from './dto/offer-item.dto';
import {  FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import  { RequestWithOfferItem } from 'src/users/dto/requestWithUser.interface';

   
  @Controller('offer-items')
  @UseInterceptors(ClassSerializerInterceptor)
  export default class OfferItemController {
    constructor(
      private readonly offerItemsService: OfferItemsService
    ) {}


    @Get('offerItems/:fileId')
    async serveOfferItemImage(@Param('fileId') fileId, @Res() res): Promise<any> {
      res.sendFile(fileId, { root: 'uploadedFiles/offerItems'});
    }
    
    @Post('create-new-offer-item')
    // @UseGuards(JwtAuthenticationGuard)
    @UseInterceptors(FilesInterceptor('file', 5, {
      storage: diskStorage({
        destination: './uploadedFiles/offerItems',
        filename: (req, file, cb) => {
          const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('')
          return cb(null, `${randomName}${extname(file.originalname+'.jpeg')}`)
        }

      })
    }))
    async createNewOfferItem(@Req() request: RequestWithOfferItem, @UploadedFiles() files:  Array<Express.Multer.File>) {
        console.log('addOfferItemImages offerItem request',request.body['offer-item']) 
        const req = JSON.parse(request.body['offer-item'])
        console.log('addOfferItemImages offerItem',req) 
        return this.offerItemsService.createNewOfferItem(req, files);
    }

    @Post('get-offer-items-names-by-category')
    async getOfferItemsNamesByCategory(@Body() category: string) {
      return this.offerItemsService.getOfferItemsNamesByCategory(category);
    }
    
    @Post('get-account-offer-items')
    getAccountOfferItems(@Body() vendor: any) {
      console.log('get-account-offer-items') 
    return this.offerItemsService.getAccountOfferItems(vendor.vendorID);
    }  

    @Post('get-marketplace-offer-items')
    getMarketplaceOfferItems(@Body() vendor: any) {
      console.log('get-marketplace-offer-items') 
    return this.offerItemsService.getMarketplaceOfferItems(vendor.vendorID);
    } 

    @Post('get-marketplace-providers')
    getMarketplaceProviders(@Body() vendor: any) {
      console.log('get-marketplace-providers') 
    return this.offerItemsService.findProvidersForMarketplaceCustomer('customer');
    } 
    @Post('get-offer-items')
    async getOfferItems(@Body() category: string) {
      return this.offerItemsService.getOfferItemsNamesByCategory(category);
    }

    @Post('search-for-stylists')
    async searchForOfferItems(@Body() search: string) {
      return this.offerItemsService.searchForOfferItems(search);
    }

    

    @Post('get-trade-providers')
    async getTradeProviders(@Body() search: string) {
      return this.offerItemsService.getTradeProviders(search);
    }
  }