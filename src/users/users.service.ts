import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateUserInput } from './dto/update-user.input';
import { Employee, EmployeeJobs, User } from './entities/user.entity';
import { AuthService } from 'src/common/auth/auth.service';
import LocalFilesService from 'src/files/localFiles.service';
import { CreateUserDTO } from './dto/create-user.input';
import LocalFile from 'src/files/localFile.entity';
import { OfferItem } from 'src/order-app/entities/offer-item.entity';
import { WalletService } from 'src/order-app/wallet.service';
import { WalletRegistrationRequest } from './dto/wallet-create.dto';
import { JwtService } from '@nestjs/jwt';
import { ProviderAdminService } from 'src/order-app/provider_admin.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    private localFilesService: LocalFilesService,
    @InjectRepository(LocalFile)
    private localFilesRepository: Repository<LocalFile>,
    @InjectRepository(OfferItem)
    private offerItemRepository: Repository<OfferItem>,
    private readonly walletService: WalletService,
    private jwtTokenService: JwtService,
  ) {}

  async generateWalletAccount(newUser: User) {
    // generate wallet account
    const walletSchema: WalletRegistrationRequest = {
      userID: newUser.userID,
      initialBalance: 0,
    };

    try {
      const walletAccount = await this.walletService.registerWallet(
        walletSchema,
      );
      console.log('registered walletAccount', walletAccount);
      if (walletAccount) {
        const walletAddress = walletAccount.walletAddress.toString();
        newUser.walletAddress = walletAddress;
        newUser.wallet = walletAccount;
        await this.userRepository.update(newUser.userID, newUser);
        const updatedUser = await this.userRepository.findOne({
          where: { userID: newUser.userID },
          relations: { wallet: true },
        });
        console.log('User', updatedUser);
      }
    } catch (error) {
      console.log('wallet creation eerr', error);
    }
  }

  async register(createUserDTO: CreateUserDTO) {
    try {
      console.log('create User AccountDTO');
      console.log(createUserDTO);

      try {
        const userSchema = this.userRepository.create(createUserDTO);
        const newUser = await this.userRepository.save(userSchema);
        if (newUser) {
          console.log('registered newUser', newUser);
          await this.generateWalletAccount(newUser);
          return newUser;
        }
      } catch (error) {
        return null;
      }
    } catch (error) {
      console.log('error exists', error);
      return {
        status: 404,
        data: '',
        error: true,
        errorMessage: 'User #00000 not found',
        successMessage: null,
      };
    }
    return null;
  }
  async getServiceProviders(filter: any): Promise<any> {
    console.log('getAllAuctionFloors serviceCategory');
    console.log(filter.serviceCategory);

    try {
      let providers = await this.userRepository.find({
        where: { accountType: filter.serviceInRequest },
      });
      console.log('providers');
      console.log(providers);

      if (providers.length === 0) {
        return {
          status: 404,
          error: 'providers not found',
          data: null,
          message: `providers not found`,
        };
      }

      return {
        status: 200,
        error: null,
        data: providers,
        message: '',
      };
    } catch (error) {
      return {
        status: 305,
        error: 'providers fetching fialed',
        data: null,
        message: 'providers fetching fialed',
      };
    }
  }

  async getVendors(filter: any): Promise<any> {
    console.log('getVendors');
    console.log(filter.accountType);

    try {
      let accounts = await this.userRepository.find({
        where: { accountType: filter.accountType },
      });
      if (accounts.length === 0) {
        return {
          status: 404,
          error: 'accounts not found',
          data: null,
          message: `accounts not found`,
        };
      }

      return {
        status: 200,
        error: null,
        data: accounts,
        message: '',
      };
    } catch (error) {
      return {
        status: 305,
        error: 'accounts fetching fialed',
        data: null,
        message: 'accounts fetching fialed',
      };
    }
  }
  async getAllClients(): Promise<Array<User>> {
    let clients = await this.userRepository.find({ where: { role: 'client' } });

    if (!clients) {
      throw new NotFoundException(`Clients not found`);
    } else {
      console.log('clients');
      console.log(clients);
    }
    return clients;
  }

  async getAllEmployees() {
    let employees = await this.userRepository.find({
      where: { accountType: 'employee' },
    });

    if (!employees) {
      throw new NotFoundException(`Employees not found`);
    } else {
      console.log('employees');
      console.log(employees);
      return {
        status: 200,
        error: null,
        data: JSON.stringify(employees),
        message: '',
      };
    }
  }
  async getAllVendors() {
    const searchResult = [];
    const vendors = await this.userRepository.find({
      where: { accountType: 'vendor' },
    });
    await Promise.all(
      vendors.map(async (vendor) => {
        const offerItems = await this.offerItemRepository.find({
          where: { providerID: vendor.userID },
          relations: {
            images: true,
          },
        });
        offerItems.map((itm) => {
          console.log(itm);
        });
        vendor.business.OfferItems = offerItems;

        searchResult.push(vendor);
      }),
    );
    if (!vendors) {
      throw new NotFoundException(`vendors not found`);
    } else {
      console.log('vendors');
      console.log(vendors);
      return {
        status: 200,
        error: null,
        data: JSON.stringify(vendors),
        message: '',
      };
    }
  }
  async update(
    userID: string,
    updateUserInput: UpdateUserInput,
  ): Promise<User> {
    console.log(updateUserInput);
    const user = await this.userRepository.preload({
      userID: userID,
      ...updateUserInput,
    });

    if (!user) {
      throw new NotFoundException(`User #${userID} not found`);
    }
    return this.userRepository.save(user);
  }

  // get all entity objects
  async findAll(): Promise<Array<User>> {
    return await this.userRepository.find({
      relations: { wallet: true, OfferItems: true },
    });
  }

  async getUserByID(userID: string): Promise<User> {
    if (userID == 'admin') {
      try {
        const user = await this.userRepository.findOne({
          where: { accountType: 'admin' },
        });
        return user;
      } catch (error) {
        console.log('error', error);
      }
    }
    const user = await this.userRepository.findOne({
      where: { userID: userID },
    });

    console.log('getUserByID user');
    console.log(user);
    const wallet = await this.walletService.findWallet(user.userID);
    user['wallet'] = wallet;
    return user;
  }
  async findOne(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email: email },
    });
    if (!user) {
      throw new NotFoundException(`User #${email} not found`);
    }
    const wallet = await this.walletService.findWallet(user.userID);
    user['wallet'] = wallet;
    return user;
  }

  async getUserProfile(token: string): Promise<User> {
    const decodedser = await this.decodeUserToken(token);
    let user;
    if (decodedser) {
      user = await this.userRepository.findOne({
        where: { userID: decodedser.sub },
        relations: { business: true, OfferItems: true, wallet: true },
      });
      console.log('getUserProfile');
      console.log(decodedser.sub);
    } else {
      throw new NotFoundException(`User token #${token} not valid`);
    }

    if (!user) {
      throw new NotFoundException(`User #${decodedser.sub} not found`);
    }
    const wallet = await this.walletService.findWallet(user.userID);
    user['wallet'] = wallet;
    return user;
  }

  async findOneByUserID(userID: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { userID: userID },
      relations: {
        business: true,
        OfferItems: true,
        wallet: true,
        warehouseReceipts: true,
      },
    });
    if (!user || user === null) {
      return null;
      // throw new NotFoundException(`User with ${email} not found`);
    }
    return user;
  }

  async findOneByPhone(phone: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { phone: phone },
      relations: {
        business: true,
        OfferItems: true,
        wallet: true,
        warehouseReceipts: true,
        orders: true,
      },
    });
    if (!user || user === null) {
      // throw new NotFoundException(`User #${phone} not found`);
      return null;
    }
    const wallet = await this.walletService.findWallet(user.userID);
    user['wallet'] = wallet;
    return user;
  }

  async findOneByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email: email },
      relations: {
        business: true,
        OfferItems: true,
        wallet: true,
        warehouseReceipts: true,
        orders: true,
      },
    });
    if (!user || user === null) {
      return null;
      // throw new NotFoundException(`User with ${email} not found`);
    }
    const wallet = await this.walletService.findWallet(user.userID);
    user['wallet'] = wallet;
    return user;
  }

  async updateUser(userData) {
    console.log('usr', userData);
    try {
      const user = await this.userRepository.findOne({
        where: { userID: userData.userID },
      });
      user.accountType = userData.accountType;
      user.role = userData.role;
      const data = await this.userRepository.update(user.userID, user);
      return {
        status: 200,
        error: null,
        data: data,
        message: '',
      };
    } catch (error) {}
  }

  async remove(userID: string): Promise<boolean> {
    const user = await this.getUserByID(userID);
    await this.userRepository.remove(user);
    return true;
  }
  async addAvatar(userId: string, fileData: LocalFileDto) {
    const avatar = await this.localFilesService.saveLocalFileData(fileData);
    console.log('avatar', avatar);
    const notUpdatedUser = await this.userRepository.findOne({
      where: { userID: userId },
    });
    notUpdatedUser.avatarId = avatar.id;
    notUpdatedUser.onlineStatus = true;
    notUpdatedUser.password = null;
    notUpdatedUser.email = null;
    (notUpdatedUser.profileImage = avatar.filename),
      (notUpdatedUser.deletedDate = null);
    notUpdatedUser.role = null;
    console.log('notUpdatedUser', notUpdatedUser);

    const updateUser = await this.userRepository.update(
      notUpdatedUser.userID,
      notUpdatedUser,
    );

    const updatedUser = await this.userRepository.findOne({
      where: { userID: userId },
    });
    console.log('updateUser', updateUser);
    return {
      status: 200,
      data: JSON.stringify(updatedUser),
      error: null,
      errorMessage: null,
      successMessage: 'success',
    };
  }

  async onHandleSignUp(createUserDTO: CreateUserDTO) {
    try {
      const checkUser = await this.findOneByPhone(createUserDTO.phone);

      if (!checkUser) {
        console.log('adding new user');
        const req = await this.register(createUserDTO);
        if (req) {
          // return this.authService.generateOTP(newUser.phone);
          return {
            status: 200,
            data: JSON.stringify(req),
            error: null,
            errorMessage: null,
            successMessage: 'success',
          };
        } else {
          return {
            status: 500,
            data: '',
            error: true,
            errorMessage: 'user could not be added, try again.',
            successMessage: null,
          };
        }
      } else {
        console.log('user already exists');
        let response = {
          status: 500,
          data: '',
          error: true,
          errorMessage: 'user already exists, do you you want to login?',
          successMessage: null,
        };
        return null;
      }
    } catch (error) {
      console.log('error exists', error);
      return {
        status: 404,
        data: '',
        error: true,
        errorMessage: 'User #00000 not found',
        successMessage: null,
      };
    }
    return null;
  }

  async addEmployee(createUserDTO: CreateUserDTO, files: any) {
    const employerToken = await this.decodeUserToken(createUserDTO.authToken);

    const employer = await this.userRepository.findOne({
      where: { userID: employerToken.userID },
      relations: {
        business: true,
      },
    });
    let employeeProfile;
    if (employer) {
      const checkUser = await this.findOneByPhone(createUserDTO.phone);

      if (!checkUser) {
        console.log('adding new user');
        employeeProfile = await this.register(createUserDTO);
        let avatar: LocalFile;
        await Promise.all(
          files.map(async (file: LocalFileDto) => {
            const image = {
              path: file.path,
              filename: file.filename,
              mimetype: file.mimetype,
            };
            avatar = await this.localFilesService.saveLocalFileData(image);
            console.log('avatar', avatar);
          }),
        );
        if (employeeProfile) {
          const profImg = files[0].filename;
          if (avatar.filename != null) {
            console.log('profImg', profImg);
            employeeProfile.profileImage = avatar.filename;
            employeeProfile.deletedDate = null;
            await this.userRepository.update(
              employeeProfile.userID,
              employeeProfile,
            );
          }
          const employee = new Employee();
          employee.profile = employeeProfile;
          employee.employeer = employer;
          employee.salary = createUserDTO.salary;
          employee.department = createUserDTO.department;
          employee.jobRole = createUserDTO.jobRole;
          employee.deploymentStatus = createUserDTO.deploymentStatus;
          employee.business = employer.business;
          const saveEmployee = await this.employeeRepository.save(employee);
          if (saveEmployee) {
            console.log('savedEmployee', saveEmployee);
            const newEmployee = await this.findEmployeeByEmployeerId(
              employer.userID,
            );
            return {
              status: 201,
              data: JSON.stringify(newEmployee),
              error: null,
              errorMessage: null,
              successMessage: 'success',
            };
          }
        }
      } else {
        console.log('user already exists');
        let response = {
          status: 405,
          data: '',
          error: true,
          errorMessage: 'user already exists',
          successMessage: null,
        };
        return response;
      }
    } else {
      // const oldEmployee = await this.findEmployeeByEmployeerId(employer.userID);
      return {
        status: 200,
        data: '',
        // data: JSON.stringify(oldEmployee),
        error: null,
        errorMessage: 'employee already exist',
        successMessage: null,
      };
    }
  }

  async findEmployeesByEmployeerId(userID: string): Promise<Employee[]> {
    const queryBuilder = this.employeeRepository.createQueryBuilder('employee');

    // Join with the Customer and Vendor relations
    queryBuilder
      .leftJoinAndSelect('employee.employeer', 'employeer')
      // .leftJoinAndSelect('employee.business', 'business')
      .leftJoinAndSelect('employee.profile', 'profile')
      // .leftJoinAndSelect(
      //   'employee.performedAssignments',
      //   'performedAssignments',
      // );

    // Use OR to match either customer or provider userID
    queryBuilder.where('employeer.userID = :userID', { userID });

    // Execute the query and return the results
    const employees = await queryBuilder.getMany();
    // console.log('@getAccount employees', employees)
    return employees;
  }

  async findEmployeeByEmployeerId(userID: string): Promise<Employee> {
    const queryBuilder = this.employeeRepository.createQueryBuilder('employee');

    // Join with the Customer and Vendor relations
    queryBuilder
      .leftJoinAndSelect('employee.employeer', 'employer')
      // .leftJoinAndSelect('employee.business', 'business')
      .leftJoinAndSelect('employee.profile', 'profile')
      // .leftJoinAndSelect(
      //   'employee.performedAssignments',
      //   'performedAssignments',
      // );

    // Use OR to match either customer or provider userID
    queryBuilder.where('employer.userID = :userID', { userID });

    // Execute the query and return the results
    const employee = await queryBuilder.getOne();
    // console.log('@getAccount employee', employee)
    return employee;
  }

  async decodeUserToken(token: string): Promise<any> {
    if (token == 'admin') {
      try {
        const user = await this.getUserByID('admin');
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
}
