import { DocumentType } from '@typegoose/typegoose';

import CreateUserDto from './dto/create-user.dto.js';
import { UserEntity } from './user.entity.js';
import UpdateUserDto from './dto/update-user.dto.js';
import { MongoId } from '../../types/mongoId.type.js';

export interface UserServiceInterface {
  create(dto: CreateUserDto, salt: string): Promise<DocumentType<UserEntity>>;
  findByEmail(email: string): Promise<DocumentType<UserEntity> | null>;
  findOrCreate(dto: CreateUserDto, salt: string): Promise<DocumentType<UserEntity>>;
  updateById(userId: MongoId, dto: UpdateUserDto): Promise<DocumentType<UserEntity> | null>;
  checkUserStatus(userId: MongoId): Promise<DocumentType<UserEntity> | null>;
  exists(documentId: string): Promise<boolean>;
}
