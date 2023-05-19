import { DEFAULT_DB_PORT, DEFAULT_USER_PASSWORD, cityCoordinates } from '../../const.js';
import { RentalOffer } from '../../types/rental-offer.type.js';
import { getErrorMessage } from '../helpers/common.js';
import { getMongoURI } from '../helpers/db.js';
import { createOffer } from '../helpers/offers.js';
import TSVFileReader from '../file-reader/tsv-file-reader.js';
import MongoClientService from '../database-client/database-client.service.js';
import type { DatabaseClientInterface } from '../database-client/mongo-client.interface.js';
import ConsoleLoggerService from '../logger/console.service.js';
import type { LoggerInterface } from '../logger/logger.interface.js';
import type { CliCommandInterface } from './cli-command.interface.js';

import { AmenityModel } from '../../modules/amenity/amenity.entity.js';
import type { AmenityServiceInterface } from '../../modules/amenity/amenity-service.interface.js';
import AmenityService from '../../modules/amenity/amenity.service.js';

import { CityModel } from '../../modules/city/city.entity.js';
import type { CityServiceInterface } from '../../modules/city/city-service.interface.js';
import CityService from '../../modules/city/city.service.js';

import { TypeOfRentalModel } from './../../modules/type-of-rental/type-of-rental.entity';
import type { TypeOfRentalServiceInterface } from './../../modules/type-of-rental/type-of-rental-service.interface';
import TypeOfRentalService from '../../modules/type-of-rental/type-of-rental.service.js';

import { TypeOfUserModel } from '../../modules/type-of-user/type-of-user.entity';
import type { TypeOfUserServiceInterface } from '../../modules/type-of-user/type-of-user-service.interface';
import TypeOfUserService from '../../modules/type-of-user/type-of-user.service';

import { UserModel } from '../../modules/user/user.entity.js';
import type { UserServiceInterface } from '../../modules/user/user-service.interface.js';
import UserService from '../../modules/user/user.service.js';
import { OfferServiceInterface } from '../../modules/offer/offer-service.interface.js';
import OfferService from '../../modules/offer/offer.service.js';
import { OfferModel } from '../../modules/offer/offer.entity.js';

export default class ImportCommand implements CliCommandInterface {
  public readonly name = '--import';
  private userService!: UserServiceInterface;
  private amenityService!: AmenityServiceInterface;
  private cityService!: CityServiceInterface;
  private typeOfRentalService!: TypeOfRentalServiceInterface;
  private typeOfUserService!: TypeOfUserServiceInterface;
  private offerService!: OfferServiceInterface;
  private databaseService!: DatabaseClientInterface;
  private logger: LoggerInterface;
  private salt!: string;

  constructor() {
    this.onLine = this.onLine.bind(this);
    this.onComplete = this.onComplete.bind(this);

    this.logger = new ConsoleLoggerService();
    this.userService = new UserService(this.logger, UserModel);
    this.amenityService = new AmenityService(this.logger, AmenityModel);
    this.cityService = new CityService(this.logger, CityModel);
    this.typeOfRentalService = new TypeOfRentalService(this.logger, TypeOfRentalModel);
    this.typeOfUserService = new TypeOfUserService(this.logger, TypeOfUserModel);
    this.offerService = new OfferService(this.logger, OfferModel);
    this.databaseService = new MongoClientService(this.logger);
  }

  private async saveOffer(offer: RentalOffer) {

    const user = await this.userService.findOrCreate({
      ...offer.author,
      password: DEFAULT_USER_PASSWORD
    }, this.salt);

    const coordinates = cityCoordinates[offer.city];

    await this.offerService.create({
      ...offer,
      coordinates,
      authorId: user.id,
    });
  }

  private async onLine(line: string, resolve: () => void) {
    const offer = createOffer(line);
    await this.saveOffer(offer);
    resolve();
  }

  private onComplete(count: number) {
    console.log(`${count} rows imported.`);
    this.databaseService.disconnect();
  }

  public async execute(filename: string, login: string, password: string, host: string, dbname: string, salt: string): Promise<void> {
    const uri = getMongoURI(login, password, host, DEFAULT_DB_PORT, dbname);
    this.salt = salt;

    await this.databaseService.connect(uri);
    const fileReader = new TSVFileReader(filename.trim());

    fileReader.on('line', this.onLine);
    fileReader.on('end', this.onComplete);

    fileReader.read()
      .catch((err) => {
        console.log(`Can't read the file: ${getErrorMessage(err)}`);
        throw new Error(err);
      });
  }
}
