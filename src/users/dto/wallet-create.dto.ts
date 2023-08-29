export class WalletRegistrationRequest {
  walletID?: string;
  userID: string;
  walletAddress?: string;
  walletName?: string;
  initialBalance: number;
}

export class WalletRegistrationResponse {
  result: boolean;
  address: string;
  message: string;
}
export class TransferToWalletDTO {
  senderAuthToken?: string;
  senderUserID?: string;
  receiverUserID?: string;
  senderWalletAddress?: string;
  receiverWalletAddress?: string;
  transferAmount?: string;
  transferNotes?: string;
}



export class WalletTransactionRequest {
  authToken: string;
  walletName: string;
  transactionNotes?: string;
  transactionStatus: string;
  smartContractInvoked: boolean;
  sendingWallet: string;
  receivingWallet: string;
  amount: number;
  order?: string
}