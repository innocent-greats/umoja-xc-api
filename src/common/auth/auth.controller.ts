import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CreateUserDTO } from 'src/users/dto/create-user.input';
import { LoginUserDTO, VerifyOTPDTO } from 'src/users/dto/login-user.input';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Post('signup')
  enrollUser(@Body() createUserDTO: CreateUserDTO) {
    return this.usersService.onHandleSignUp(createUserDTO);
  }

  @Post('login')
  async login(@Body() loginUserDTO: LoginUserDTO) {
    let response = await this.authService.loginUser(loginUserDTO);
    console.log('signin response');
    console.log(response);
    return response;
  }

  @Post('signin')
  async signin(@Body() loginData) {
    let response = await this.authService.generateOTP(loginData.phone);
    console.log('signin response');
    console.log(response);
    return response;
  }

  @Post('getUserByToken')
  getUserByToken(@Body() access_token) {
    return this.usersService.decodeUserToken(access_token.access_token);
  }
  @Post('onVerifyOTP')
  onVerifyOTP(@Body() verifyOTPDTO: VerifyOTPDTO) {
    return this.authService.onVerifyOTP(verifyOTPDTO);
  }
}
