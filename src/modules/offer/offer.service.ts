import { inject, injectable } from 'inversify';
import { DocumentType, ModelType } from '@typegoose/typegoose/lib/types.js';

import { AppComponent } from '../../types/app-component.enum.js';
import type { LoggerInterface } from '../../core/logger/logger.interface.js';
import type { OfferServiceInterface } from './offer-service.interface.js';
import { OfferEntity } from './offer.entity.js';
import CreateOfferDto from './dto/create-offer.dto.js';
import UpdateOfferDto from './dto/update-offer.dto.js';
import type { MongoId } from '../../types/mongoId.type.js';
import { SortType } from '../../types/sort-type.enum.js';
import { DEFAULT_OFFERS_COUNT } from './offer.const.js';


@injectable()
export default class OfferService implements OfferServiceInterface {
  constructor(
    @inject(AppComponent.LoggerInterface) private readonly logger: LoggerInterface,
    @inject(AppComponent.OfferModel) private readonly offerModel: ModelType<OfferEntity>
  ) {}

  public async exists(documentId: string): Promise<boolean> {
    return (await this.offerModel
      .exists({_id: documentId})) !== null;
  }

  public async update(offerId: MongoId, dto: UpdateOfferDto): Promise<DocumentType<OfferEntity> | null> {
    return this.offerModel
      .findByIdAndUpdate(offerId, dto, {new: true})
      .populate(['authorId'])
      .exec();
  }

  public async delete(offerId: MongoId): Promise<DocumentType<OfferEntity> | null> {
    return this.offerModel
      .findByIdAndDelete(offerId)
      .exec();
  }

  public async find(count?: number): Promise<DocumentType<OfferEntity>[]> {
    const limit = count ?? DEFAULT_OFFERS_COUNT;
    return this.offerModel
      .find()
      .populate(['authorId'])
      .sort({publicationDate: SortType.Down})
      .limit(limit)
      .exec();
  }

  public async getPremiumOffersForCity(city: string, count?: number): Promise<DocumentType<OfferEntity>[]> {
    const limit = count ?? DEFAULT_OFFERS_COUNT;
    return this.offerModel
      .find({ city: city, isPremium: true })
      .populate(['authorId'])
      .sort({publicationDate: SortType.Down})
      .limit(limit)
      .exec();
  }

  public async getFavoriteOffers(count?: number): Promise<DocumentType<OfferEntity>[]> {
    const limit = count || DEFAULT_OFFERS_COUNT;
    return this.offerModel
      .find({isFavorite: true })
      .populate(['authorId'])
      .sort({publicationDate: SortType.Down})
      .limit(limit)
      .exec();
  }

  public async addToFavorites(offerId: MongoId): Promise<DocumentType<OfferEntity> | null> {
    return this.offerModel
      .findByIdAndUpdate(offerId,
        { $set: { isFavorite: true } },
        { new: true }
      ).exec();
  }

  public async removeFromFavorites(offerId: MongoId): Promise<DocumentType<OfferEntity> | null> {
    return this.offerModel
      .findByIdAndUpdate(offerId,
        { $set: { isFavorite: false } },
        { new: true }
      ).exec();
  }

  public async incCommentCount(offerId: MongoId): Promise<DocumentType<OfferEntity> | null> {
    return this.offerModel
      .findByIdAndUpdate(offerId, {'$inc': {
        commentCount: 1,
      }}).exec();
  }

  public async create(dto: CreateOfferDto): Promise<DocumentType<OfferEntity>> {
    const result = await this.offerModel.create(dto);
    this.logger.info(`New offer created: ${dto.title}`);
    return result;
  }

  public async getOfferDetails(offerId: MongoId): Promise<DocumentType<OfferEntity> | null> {
    return this.offerModel
      .findById(offerId)
      .populate(['authorId'])
      .exec();
  }

}
