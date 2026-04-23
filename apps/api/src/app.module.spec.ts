import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AppModule } from './app.module';

describe('AppModule', () => {
  it('registers the throttler as a global guard', () => {
    const providers = Reflect.getMetadata('providers', AppModule) as Array<
      | {
          provide?: unknown;
          useClass?: unknown;
        }
      | undefined
    >;

    expect(providers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        }),
      ]),
    );
  });
});
