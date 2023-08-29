export class LoginUserDTO {
  phone?: string;
  email?: string;
  password?: string;
}

export class VerifyOTPDTO {
  phone: string;
  email: string;
  otp: string;
}