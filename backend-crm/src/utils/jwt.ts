import jwt from 'jsonwebtoken';
import type { JwtPayload } from '../types';

const ACCESS_SECRET  = process.env.JWT_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_EXPIRY  = process.env.JWT_EXPIRES_IN        || '8h';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export const signAccessToken = (payload: JwtPayload): string =>
  jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY } as jwt.SignOptions);

export const signRefreshToken = (userId: string): string =>
  jwt.sign({ user_id: userId }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY } as jwt.SignOptions);

export const verifyAccessToken = (token: string): JwtPayload =>
  jwt.verify(token, ACCESS_SECRET) as JwtPayload;

export const verifyRefreshToken = (token: string): Pick<JwtPayload, 'user_id'> =>
  jwt.verify(token, REFRESH_SECRET) as Pick<JwtPayload, 'user_id'>;

export const refreshTokenExpiresAt = (): Date => {
  const ms = parseDuration(REFRESH_EXPIRY);
  return new Date(Date.now() + ms);
};

function parseDuration(str: string): number {
  const unit = str.slice(-1);
  const val  = parseInt(str, 10);
  const map: Record<string, number> = {
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return val * (map[unit] ?? 3_600_000);
}