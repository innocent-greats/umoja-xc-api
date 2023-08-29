import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { parse } from 'cookie';
import { WsException } from '@nestjs/websockets';
import { AuthService } from 'src/common/auth/auth.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import Message from './entities/message.entity';
import { MessageDTO } from './dto/create-user.input';
import { UsersService } from './users.service';
@Injectable()
export class ChatService {
  constructor(
    private readonly authenticationService: AuthService,
    private readonly usersService: UsersService,
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
  ) {
  }

  async getUserFromSocket(socket: Socket) {
    // console.log('authenticationService.decodeUserToken user', socket.id)
    // console.log('getUserFromSocket socket.handshake.headers.cookie', socket.handshake.headers.cookie)
    // console.log('getUserFromSocket socket.handshake.query token', socket.handshake)
    let newUser;

    let token = socket.handshake.headers.cookie != null ? socket.handshake.headers.cookie : socket.handshake.query['token']
    if (token) {
      newUser = await this.usersService.decodeUserToken(token.toString());

    }
    // console.log('authenticationService.decodeUserToken user', newUser)
    return newUser;
  }


  async saveMessage(messageDTO: MessageDTO, author: User) {
    const newMessage = await this.messagesRepository.create(messageDTO);
    await this.messagesRepository.save(newMessage);
    return newMessage;
  }

  async getAllMessages() {
    return this.messagesRepository.find({
      relations: ['author']
    });
  }
}