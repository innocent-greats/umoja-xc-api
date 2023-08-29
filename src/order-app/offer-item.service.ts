import { Injectable } from '@nestjs/common';


import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { OfferItem, OfferItemImage, Vehicle } from './entities/offer-item.entity';
import OfferItemsSearchService from 'src/search/search.service';
import { User } from 'src/users/entities/user.entity';
import { OfferItemDTO, OfferItemRequestDTO } from './dto/offer-item.dto';
import { UsersService } from 'src/users/users.service';
import LocalFilesService from 'src/files/localFiles.service';
import { AuthService } from 'src/common/auth/auth.service';
import { v4 as uuid } from 'uuid';
import { VehicleDTO } from './dto/vehicle.dto';



@Injectable()
export default class OfferItemsService {
    constructor(
        @InjectRepository(OfferItem)
        private offerItemRepository: Repository<OfferItem>,

        @InjectRepository(Vehicle)
        private vehicleRepository: Repository<Vehicle>,
        @InjectRepository(OfferItemImage)
        private offerItemImageRepository: Repository<OfferItemImage>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private postsSearchService: OfferItemsSearchService,
        private usersService: UsersService,
        private localFilesService: LocalFilesService,
        private readonly authenticationService: AuthService
    ) { }

    async getOfferItemsNamesByCategory(category: string) {
        const offerItems = await this.offerItemRepository.find(
            { where: { itemCategory: category } })
        const ids = offerItems.map(result => result['itemCategory']);
        // console.log('itmes names', ids)
        return {
            status: 201,
            data: JSON.stringify(offerItems),
            error: null,
            errorMessage: null,
            successMessage: 'success'
        }
    }
    async getOfferItems() {
        const offerItems = await this.offerItemRepository.find(
            { relations: { images: true } }
        )
        const ids = offerItems.map(result => result['itemCategory']);
        // console.log('itmes names', ids)
        return {
            status: 201,
            data: JSON.stringify(offerItems),
            error: null,
            errorMessage: null,
            successMessage: 'success'
        }
    }
    async getOfferItemByID(itemID: string) {
        const offerItem = await this.offerItemRepository.findOne(
            { where: { itemID: itemID }, relations: { images: true, provider: true, orders: true } }
        )
        if (!offerItem) {
            return null;
        } else {
            return offerItem;
        }
    }

    async getAccountOfferItems(providerID: string) {
        const offerItems = await this.offerItemRepository.find(
            { where: { providerID: providerID }, relations: { provider: true, images: true } })

        return {
            status: 201,
            data: JSON.stringify(offerItems),
            error: null,
            errorMessage: null,
            successMessage: 'success'
        }
    }

    async getTradeProviders(trade: any) {
        // console.log('get Trade  Providers', trade)
        try {
            const providers = await this.userRepository
                .find({
                    where: { tradingAs: trade.tradingAs }, relations:{OfferItems:true}
                });
            // console.log('get Trade  Providers', providers)
            return {
                status: 200,
                data: JSON.stringify(providers),
                error: null,
                errorMessage: null,
                successMessage: 'success'
            }
        } catch (error) {
            console.log('results vendors', error)
        }
    }
    async searchForOfferItems(search: any) {
        const searchResult = []
        const text = search.text
        console.log('text', text)
        const results = await this.postsSearchService.search(text.toString());
        const ids = results.map(result => result['providerID']);
        // console.log('results ids', ids)

        if (!ids.length) {
            return {
                status: 200,
                data: JSON.stringify([]),
                error: null,
                errorMessage: null,
                successMessage: 'success'

            };
        }
        const vendors = await this.userRepository
            .find({
                where: { userID: In(ids), accountType: 'vendor' }
            });
        await Promise.all(
            vendors.map(async (vendor) => {
                const offerItems = await this.offerItemRepository.find({
                    where: { providerID: vendor.userID }, relations: {
                        images: true,
                    }
                })
                offerItems.map((itm) => {
                    console.log(itm)
                })
                vendor.OfferItems = offerItems

                searchResult.push(vendor);
            })
        )

        // console.log('results vendors', searchResult)

        return {
            status: 200,
            data: JSON.stringify(vendors),
            error: null,
            errorMessage: null,
            successMessage: 'success'

        }
    }


    async createNewOfferItem(offerItem: OfferItemRequestDTO, files: any) {
        const newUser = await this.usersService.decodeUserToken(offerItem.authToken);
        console.log('authenticationService.decodeUserToken user', newUser)
        let newFiles = [];
        const newOfferItem = new OfferItem()
        newOfferItem.publicFootPrint = uuid();
        newOfferItem.itemName = offerItem.itemName
        newOfferItem.itemCategory = offerItem.itemCategory
        newOfferItem.minimumPrice = offerItem.minimumPrice
        newOfferItem.providerID = newUser.userID
        newOfferItem.provider = newUser
        newOfferItem.quantity = offerItem.quantity
        newOfferItem.offeringStatus = offerItem.offeringStatus
        newOfferItem.commodityWeight = offerItem.commodityWeight
        newOfferItem.quantity = offerItem.quantity
        newOfferItem.description = offerItem.description,
        newOfferItem.trendingStatus = offerItem.trendingStatus,
        newOfferItem.publishStatus = offerItem.publishStatus,
            await Promise.all(files.map(async (file: LocalFileDto) => {
                const image = {
                    path: file.path,
                    filename: file.filename,
                    mimetype: file.mimetype,
                    // offerItem: newOfferItem
                }
                const newImageSchema = await this.offerItemImageRepository.create(image)
                const newFile = await this.offerItemImageRepository.save(newImageSchema);

                newFiles.push(newFile);
            }));
        newOfferItem.images = newFiles

        console.log('newFiles', newFiles);
        newOfferItem.images = newFiles
        const updatedfferItem = await this.offerItemRepository.save(newOfferItem);
        const offer = await this.getOfferItemByID(updatedfferItem.itemID);
        // }
        // const updatedfferItem = await this.offerItemRepository.findOne({ where: { itemID: newOfferItem.itemID } })
        const indexed = await this.postsSearchService.indexOfferItem(offer);
        console.log('indexed', indexed)
        console.log('updatedfferItem', offer)
        return {
            status: 200,
            data: JSON.stringify(offer),
            error: null,
            errorMessage: null,
            successMessage: 'success'
        }


    }

}