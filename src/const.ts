import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

import type { CityCoordinates } from './types/city-coordinates.type.js';
import { City } from './types/city.enum.js';

export const cityCoordinates: Record<City, CityCoordinates> = {
  [City.Paris]: { latitude: 48.85661, longitude: 2.351499 },
  [City.Cologne]: { latitude: 50.938361, longitude: 6.959974 },
  [City.Brussels]: { latitude: 50.846557, longitude: 4.351697 },
  [City.Amsterdam]: { latitude: 52.370216, longitude: 4.895168 },
  [City.Hamburg]: { latitude: 53.550341, longitude: 10.000654 },
  [City.Dusseldorf]: { latitude: 51.225402, longitude: 6.776314 }
};

@ValidatorConstraint({ name: 'IsValidCoordinates', async: false })
export class IsValidCoordinates implements ValidatorConstraintInterface {
  validate(coordinates: CityCoordinates) {
    if (
      typeof coordinates === 'object' &&
      typeof coordinates.latitude === 'number' &&
      typeof coordinates.longitude === 'number'
    ) {
      return true;
    }

    return false;
  }

  defaultMessage() {
    return 'Invalid coordinates';
  }
}
