const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://whomessage.vercel.app',
  'https://www.whomessage.chat'
];

export function getAllowedOrigins(): string[] {
  const configured = process.env.CORS_ALLOWED_ORIGINS
    ?.split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

  if (configured && configured.length > 0) {
    return configured;
  }

  return DEFAULT_ALLOWED_ORIGINS;
}

