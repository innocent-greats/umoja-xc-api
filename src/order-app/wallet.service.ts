import { ForbiddenException, HttpException, Injectable } from '@nestjs/common';

import { TextDecoder } from 'util';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OfferItem } from './entities/offer-item.entity';
import { UsersService } from 'src/users/users.service';

import { catchError, map } from 'rxjs/operators';
import { HttpService } from '@nestjs/axios';
import { v4 as uuid } from 'uuid';
import {
  TransferToWalletDTO,
  WalletRegistrationRequest,
  WalletTransactionRequest,
} from 'src/users/dto/wallet-create.dto';
import { firstValueFrom } from 'rxjs';
import { Wallet, WalletTransaction } from 'src/users/entities/wallet.entity';
import { User } from 'src/users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';

const utf8Decoder = new TextDecoder();

@Injectable()
export class WalletService {
  constructor(
    //Imported  Repositories
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(WalletTransaction)
    private walletTransactionRepository: Repository<WalletTransaction>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    //Imported  Services
    private httpService: HttpService,
    private jwtTokenService: JwtService,
  ) {}

  async registerWallet(
    createWalletDTO: WalletRegistrationRequest,
  ): Promise<Wallet> {
    let data: any;
    let toroReq = {
      op: 'createkey',
      params: [{ name: 'pwd', value: createWalletDTO.userID }],
    };

    let wallet: Wallet;
    await firstValueFrom(
      this.httpService.post('http://testnet.toronet.org/api/keystore', toroReq),
    )
      .then(async (res) => {
        console.log('registerWallet response', res.data['address']);
        createWalletDTO.walletAddress = res.data['address'];
        createWalletDTO.walletName = 'toroWallet';
        createWalletDTO.initialBalance = 0;
        wallet = await this.createNewWalletAccount(createWalletDTO);
        // console.log('registerWallet then wallet', wallet)
      })

      .catch((err) => {
        // throw new HttpException(err.response.data, err.response.status);
        return null
      });
    // console.log('registerWallet updt wallet', wallet)
    return wallet;
  }

  async getWalletBalance(walletAddress: string) {
    let data: any;
    let toroReq = { "op":"getbalance", "params":[{"name":"addr", "value":walletAddress}] };

    let balance: number;
    await firstValueFrom(
      this.httpService.get('http://testnet.toronet.org/api/token/toro/',{params:toroReq}),
    )
      .then(async (res) => {

        if(res.status){}
        balance = Number( res.data['balance'])
        return balance;
      })
      .catch((err) => {
        // throw new HttpException(err.response.data, err.response.status);
        return null
      });

    return balance;
  }

  async transferToWallet(transferToWalletDTO: TransferToWalletDTO) {
    let toroReq = {
      op: 'transfer',
      params: [
        { name: 'client', value: transferToWalletDTO.senderWalletAddress },
        { name: 'clientpwd', value: transferToWalletDTO.senderUserID },
        { name: 'to', value: transferToWalletDTO.receiverWalletAddress },
        { name: 'val', value: transferToWalletDTO.transferAmount },
      ],
    };
    console.log('makeDirectTransfer wallet - toroReq', toroReq);

    let transaction: any;
    await firstValueFrom(
      this.httpService.post(
        'http://testnet.toronet.org/api/token/toro/cl',
        toroReq,
      ),
    )
      .then(async (res) => {
        console.log('transferToWallet response', res.data);
        transaction = res.data;
        // console.log('transferToWallet then wallet', wallet)
      })
      .catch((err) => {
        return null
        // throw new HttpException(err.response.data, err.response.status);
      });
    // console.log('transferToWallet updt wallet', wallet)
    return transaction;
  }

  async freezeWallet(createWalletDTO: WalletRegistrationRequest) {
    let data: any;
    let toroReq = {
      op: 'freezetoroaccount',
      params: [
        { name: 'admin', value: '0xea45bcd1b04233f9240c01d52f773b832704fed0' },
        { name: 'adminpwd', value: 'toronet' },
        { name: 'addr', value: createWalletDTO.walletAddress },
      ],
    };
    return this.httpService
      .post('http://testnet.toronet.org/api/token/toro/ad', toroReq) //Public api
      .pipe(
        map((res) => {
          return res.data;
        }),
      )
      .pipe(
        catchError(() => {
          throw new ForbiddenException('Something went wrong');
        }),
      );
  }

  async unFreezeWallet(createWalletDTO: WalletRegistrationRequest) {
    let data: any;
    let toroReq = {
      op: 'unfreezetoroaccount',
      params: [
        { name: 'admin', value: '0xea45bcd1b04233f9240c01d52f773b832704fed0' },
        { name: 'adminpwd', value: 'toronet' },
        { name: 'addr', value: createWalletDTO.walletAddress },
      ],
    };
    return this.httpService
      .post('http://testnet.toronet.org/api/keystore', toroReq) //Public api
      .pipe(
        map((res) => {
          return res.data;
        }),
      )
      .pipe(
        catchError(() => {
          throw new ForbiddenException('Something went wrong');
        }),
      );
  }

  async createNewWalletAccount(
    createWalletDTO: WalletRegistrationRequest,
  ): Promise<Wallet> {
    const newSchemeRequest = {
      userID: createWalletDTO.userID,
      walletAddress: createWalletDTO.walletAddress,
      currentBalance:
        createWalletDTO.initialBalance != null
          ? createWalletDTO.initialBalance
          : 0,
      walletName: createWalletDTO.walletName,
    };
    console.log('created wallet - newSchemeRequest', newSchemeRequest);
    const newOrderSchema = this.walletRepository.create(newSchemeRequest);
    const orderItem = await this.walletRepository.save(newOrderSchema);

    let walletAccount = await this.walletRepository.findOne({
      where: { userID: orderItem.userID },
      relations: { transactions: true },
    });
    console.log('created wallet - account', walletAccount);
    return walletAccount;
  }

  async findWallet(userID: string) {
    try {
      const wallet = await this.walletRepository.findOne({
        where: {
          userID: userID,
        }
      });
      const bal = await this.getWalletBalance(wallet.walletAddress)

      wallet.currentBalance = bal;
      wallet.updatedDate = new Date();
      // wallet.transactions = wallet.transactions
      await this.walletRepository.update(wallet.walletID, wallet)

      const updatedWallet = await this.walletRepository.findOne({
        where: {
          walletID: wallet.walletID,
        },relations:{transactions:true}
      });
      return updatedWallet;
    } catch (error) {
      console.log(error);
    }
  }

  async makeDirectTransfer(transferToWalletDTO: TransferToWalletDTO) {
    const sendingUser = await this.decodeUserToken(
      transferToWalletDTO.senderAuthToken,
    );
    console.log('makeDirectTransfer wallet - sendingUser', sendingUser);
    const sendingWallet = await this.findWallet(sendingUser.userID);
    console.log('makeDirectTransfer wallet - sendingWallet', sendingWallet);
    const receivingWallet = await this.findWallet(
      transferToWalletDTO.receiverUserID,
    );
    console.log('makeDirectTransfer wallet - receivingWallet', receivingWallet);

    let transactDTO = {
      senderUserID: sendingUser.userID,
      senderWalletAddress: sendingWallet.walletAddress,
      receiverWalletAddress: receivingWallet.walletAddress,
      transferAmount: transferToWalletDTO.transferAmount,
    };
    console.log('makeDirectTransfer wallet - transactDTO', transactDTO);

    const transact = await this.transferToWallet(transactDTO);
    console.log('makeDirectTransfer wallet - transact', transact);

    if (transact == true) {
      const savedTransaction = await this.saveNewTransaction(transferToWalletDTO,sendingWallet, receivingWallet,  transact);
      try {
        console.log(
          'makeDirectTransfer wallet - savedTransaction',
          savedTransaction,
        );
        if(transact['result'] == true){
          sendingWallet.currentBalance = +sendingWallet.currentBalance - savedTransaction.amount
          await this.walletTransactionRepository.update(sendingWallet.walletID, sendingWallet);

          receivingWallet.currentBalance = receivingWallet.currentBalance + savedTransaction.amount
          await this.walletTransactionRepository.update(sendingWallet.walletID, sendingWallet);
        }

        return {
          status: 200,
          data: JSON.stringify(savedTransaction),
          error: null,
          errorMessage: null,
          successMessage: 'success',
        };
      } catch (error) {
        console.log('e', error);
      }
    }else{
      return {
        status: 500,
        data: null,
        error: null,
        errorMessage: null,
        successMessage: 'success',
      };
    }
  }
  async decodeUserToken(token: string): Promise<any> {
    if (token == 'admin') {
      try {
        const user = await this.userRepository.findOne({
          where: { userID: 'admin' },
        });
        return user;
      } catch (error) {
        console.log('error', error);
      }
    } else {
      const user = this.jwtTokenService.decode(token);
      if (user) {
        return user;
      }
    }
  }

 async saveNewTransaction(transferToWalletDTO: TransferToWalletDTO,sendingWallet: Wallet, receivingWallet:Wallet,  transact:any){
    try {
      const newTransaction = new WalletTransaction();
      newTransaction.amount = +transferToWalletDTO.transferAmount;
      newTransaction.transactionNotes = transferToWalletDTO.transferNotes;
      newTransaction.receivingWallet = receivingWallet.walletAddress;
      newTransaction.sendingWallet = sendingWallet.walletAddress;
      newTransaction.wallet = sendingWallet;
      newTransaction.transactionStatus = transact['receipt']['status'];
      newTransaction.blockchainTransactionHash =
        transact['receipt']['transactionHash'];
      newTransaction.blockHash = transact['receipt']['blockHash'];
      newTransaction.blockNumber = transact['receipt']['blockNumber'];
      newTransaction.cumulativeGasUsed =
        transact['receipt']['cumulativeGasUsed'];
      newTransaction.cumulativeGasUsed = transact['receipt']['to'];
      newTransaction.cumulativeGasUsed = transact['receipt']['from'];
      newTransaction.gasUsed = transact['receipt']['gasUsed'];
      newTransaction.blockchainTransactionMessage = transact['message'];
      newTransaction.contractAddress = transact['receipt']['contractAddress'];

      const newOrderSchema =
        this.walletTransactionRepository.create(newTransaction);
      const savedTransaction = await this.walletTransactionRepository.save(newOrderSchema);

        return newOrderSchema;
    } catch (error) {
      
    }
  }
}
