import { Controller, Post, Body } from '@nestjs/common';
import { OrderService } from './order.service';
import { OfferItemDTO } from './dto/offer-item.dto';
import { WalletService } from './wallet.service';
import { TransferToWalletDTO, WalletRegistrationRequest } from 'src/users/dto/wallet-create.dto';


@Controller('wallet-service')
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
  ) { }

  // get-all-account-orders
  @Post('register-new-wallet')
  registerWallet(@Body() createWalletDTO: WalletRegistrationRequest) {
    console.log('requestToTradeCommodityDTO')
    console.log(createWalletDTO)
    return this.walletService.registerWallet(createWalletDTO);
  }
  @Post('make-direct-transfer')
  makeDirectTransfer(@Body() transferToWalletDTO: TransferToWalletDTO) {
    console.log('make Direct Transfer')
    console.log(transferToWalletDTO)
    return this.walletService.makeDirectTransfer(transferToWalletDTO);
  }

  @Post('find-wallet')
  findWallet(@Body() transferToWalletDTO: TransferToWalletDTO) {
    console.log('make Direct Transfer')
    console.log(transferToWalletDTO)
    return this.walletService.findWallet(transferToWalletDTO.senderUserID);
  }
}
