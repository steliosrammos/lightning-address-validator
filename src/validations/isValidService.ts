import { isValidLightningAddress } from './isValidLightningAddress';
import { LightningAddressValidationError } from '../errors';

// Attempt completing STEP 1 of LUD06: https://github.com/lnurl/luds/blob/luds/06.md
export const isValidService = async (lightningAddress: string): Promise<boolean> => {
  isValidLightningAddress(lightningAddress);

  const [username, domain] = lightningAddress.split('@');

  try {
    const response = await fetch(`https://${domain}/.well-known/lnurlp/${username}`);
    const json = await response.json();

    if (response.ok && json.status === 'ERROR') {
      const reason = json.reason || `fetch to service failed `;
      throw new LightningAddressValidationError(`invalid lightning address service: ${reason}`, 'INVALID_SERVICE');
    }

    const expectedKeys = ['callback', 'maxSendable', 'minSendable', 'metadata', 'tag'];

    expectedKeys.forEach((key) => {
      if (!json[key]) {
        throw new LightningAddressValidationError(
          `invalid lightning address service response, missing key: ${key}`,
          'INVALID_SERVICE',
        );
      }
    });

    if (json.tag !== 'payRequest') {
      throw new LightningAddressValidationError(
        `invalid lightning address service response, tag got invalid value: ${json.tag}, expected 'payRequest'`,
        'INVALID_SERVICE',
      );
    }

    return true;
  } catch (error) {
    throw new LightningAddressValidationError(
      `invalid lightning address service: ${(error as Error).message}`,
      'INVALID_SERVICE',
    );
  }
};
