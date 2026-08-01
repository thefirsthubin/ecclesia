import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

import { CognitoVerifierService } from './cognito-verifier.service';
import type { EnvConfig } from '../config/env.schema';

jest.mock('aws-jwt-verify', () => ({
  CognitoJwtVerifier: { create: jest.fn() },
}));

function configServiceStub(values: Partial<EnvConfig>): ConfigService<EnvConfig, true> {
  return {
    get: jest.fn((key: string) => (values as Record<string, unknown>)[key]),
  } as unknown as ConfigService<EnvConfig, true>;
}

describe('CognitoVerifierService', () => {
  const validEnv = {
    COGNITO_USER_POOL_ID: 'us-east-1_AbC123dEf',
    COGNITO_CLIENT_ID: 'client-id',
    COGNITO_REGION: 'us-east-1',
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('constructs a CognitoJwtVerifier with tokenUse: access, per Blueprint §8.3', () => {
    const verify = jest.fn();
    (CognitoJwtVerifier.create as jest.Mock).mockReturnValue({ verify });

    new CognitoVerifierService(configServiceStub(validEnv));

    expect(CognitoJwtVerifier.create).toHaveBeenCalledWith({
      userPoolId: validEnv.COGNITO_USER_POOL_ID,
      tokenUse: 'access',
      clientId: validEnv.COGNITO_CLIENT_ID,
    });
  });

  it('throws at construction if COGNITO_REGION does not match COGNITO_USER_POOL_ID prefix', () => {
    (CognitoJwtVerifier.create as jest.Mock).mockReturnValue({ verify: jest.fn() });

    expect(() => new CognitoVerifierService(configServiceStub({ ...validEnv, COGNITO_REGION: 'eu-west-1' }))).toThrow(
      /does not match/,
    );
  });

  it('returns the verified payload on success', async () => {
    const payload = { sub: 'cognito-sub-123', token_use: 'access' };
    const verify = jest.fn().mockResolvedValue(payload);
    (CognitoJwtVerifier.create as jest.Mock).mockReturnValue({ verify });
    const service = new CognitoVerifierService(configServiceStub(validEnv));

    await expect(service.verifyAccessToken('a.jwt.token')).resolves.toEqual(payload);
    expect(verify).toHaveBeenCalledWith('a.jwt.token');
  });

  it('translates any verification failure into an UnauthorizedException', async () => {
    const verify = jest.fn().mockRejectedValue(new Error('Token expired'));
    (CognitoJwtVerifier.create as jest.Mock).mockReturnValue({ verify });
    const service = new CognitoVerifierService(configServiceStub(validEnv));

    await expect(service.verifyAccessToken('expired.jwt.token')).rejects.toThrow(UnauthorizedException);
  });

  it('falls back to a generic message when the thrown value is not an Error', async () => {
    const verify = jest.fn().mockRejectedValue('not an Error instance');
    (CognitoJwtVerifier.create as jest.Mock).mockReturnValue({ verify });
    const service = new CognitoVerifierService(configServiceStub(validEnv));

    await expect(service.verifyAccessToken('bad.jwt.token')).rejects.toThrow('Token verification failed');
  });
});
