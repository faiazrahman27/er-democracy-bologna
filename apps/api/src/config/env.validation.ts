import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),

  PORT: Joi.number().port().default(3001),

  DATABASE_URL: Joi.string().uri().required(),

  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().required(),

  REFRESH_TOKEN_SECRET: Joi.string().min(32).required(),
  REFRESH_TOKEN_EXPIRES_IN_DAYS: Joi.number()
    .integer()
    .min(1)
    .max(365)
    .required(),
  COOKIE_DOMAIN: Joi.string().allow('').default(''),
  COOKIE_SECURE: Joi.boolean()
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.valid(true),
      otherwise: Joi.boolean(),
    })
    .required(),
  CORS_ORIGIN: Joi.string().trim().min(1).required(),

  FRONTEND_URL: Joi.string().uri().required(),
  RESEND_API_KEY: Joi.string().trim().min(1).required(),
  RESEND_FROM_EMAIL: Joi.string().trim().min(1).required(),

  SUPABASE_URL: Joi.string().uri().required(),
  SUPABASE_SERVICE_ROLE_KEY: Joi.string().min(20).required(),
  SUPABASE_STORAGE_BUCKET: Joi.string().min(1).required(),

  UPLOAD_MAX_FILE_SIZE_BYTES: Joi.number()
    .integer()
    .min(1)
    .default(2 * 1024 * 1024),
  UPLOAD_ALLOWED_IMAGE_MIME_TYPES: Joi.string().default(
    'image/jpeg,image/png,image/webp',
  ),
});
