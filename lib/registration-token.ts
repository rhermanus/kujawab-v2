import crypto from "crypto";

interface RegistrationData {
  email: string;
  firstName: string;
  lastName: string;
  oauth2Id: string;
  oauth2Provider: string;
  profilePicture: string;
}

interface TokenPayload extends RegistrationData {
  exp: number;
}

const TOKEN_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return secret;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function createRegistrationToken(data: RegistrationData): string {
  const payload: TokenPayload = { ...data, exp: Date.now() + TOKEN_EXPIRY_MS };
  const json = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const hmac = sign(json);
  return `${json}.${hmac}`;
}

export function verifyRegistrationToken(token: string): RegistrationData | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [json, hmac] = parts;
  const expectedHmac = sign(json);
  if (hmac !== expectedHmac) return null;

  try {
    const payload: TokenPayload = JSON.parse(Buffer.from(json, "base64url").toString());
    if (Date.now() > payload.exp) return null;
    const { exp: _, ...data } = payload;
    return data;
  } catch {
    return null;
  }
}
