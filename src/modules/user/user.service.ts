import {DocumentType, types } from '@typegoose/typegoose';
import { inject, injectable } from 'inversify';

import { AppComponent } from '../../types/app-component.enum.js';
import { UserEntity } from './user.entity.js';
import CreateUserDto from './dto/create-user.dto.js';
import type {UserServiceInterface} from './user-service.interface.js';
import type { LoggerInterface } from '../../core/logger/logger.interface.js';
import { MAX_LENGTH_PASSWORD, MIN_LENGTH_PASSWORD } from './user.const.js';
import UpdateUserDto from './dto/update-user.dto.js';
import type { MongoId } from '../../types/mongoId.type.js';

@injectable()
export default class UserService implements UserServiceInterface {
  constructor(
    @inject(AppComponent.LoggerInterface) private readonly logger: LoggerInterface,
    @inject(AppComponent.UserModel) private readonly userModel: types.ModelType<UserEntity>
  ) {}

  public async updateById(userId: MongoId, dto: UpdateUserDto): Promise<DocumentType<UserEntity> | null> {
    return this.userModel
      .findByIdAndUpdate(userId, dto, {new: true})
      .exec();
  }

  public async create(dto: CreateUserDto, salt: string): Promise<DocumentType<UserEntity>> {
    const user = new UserEntity(dto);

    if (dto.password.length < MIN_LENGTH_PASSWORD || dto.password.length > MAX_LENGTH_PASSWORD) {
      throw new Error(`Password should be between ${MIN_LENGTH_PASSWORD} and ${MAX_LENGTH_PASSWORD} characters.`);
    }

    user.setPassword(dto.password, salt);

    const result = await this.userModel.create(user);
    this.logger.info(`New user created: ${user.email}`);

    return result;
  }

  public async findByEmail(email: string): Promise<DocumentType<UserEntity> | null> {
    return this.userModel.findOne({email});
  }

  public async findOrCreate(dto: CreateUserDto, salt: string): Promise<DocumentType<UserEntity>> {
    const existedUser = await this.findByEmail(dto.email);

    if (existedUser) {
      return existedUser;
    }

    return this.create(dto, salt);
  }

  public async checkUserStatus(userId: MongoId): Promise<DocumentType<UserEntity> | null> {
    const user = await this.userModel.findById(userId);
    return user || null;
  }
}
