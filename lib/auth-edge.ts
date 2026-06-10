const JWT_ALGORITHM_NAME = "HMAC";
const JWT_HASH = "SHA-256";

function base64UrlToUint8Array(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");

  if (typeof atob !== "function") {
    throw new Error("Base64 decoding is unavailable in this runtime.");
  }

  const binaryString = atob(padded);
  const bytes = new Uint8Array(binaryString.length);

  for (let index = 0; index < binaryString.length; index += 1) {
    bytes[index] = binaryString.charCodeAt(index);
  }

  return bytes;
}

async function importSigningKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: JWT_ALGORITHM_NAME, hash: JWT_HASH },
    false,
    ["verify"],
  );
}

export async function verifyAuthTokenEdge(token: string, secret: string) {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split(".");

  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    throw new Error("Invalid authentication token.");
  }

  const header = JSON.parse(
    new TextDecoder().decode(base64UrlToUint8Array(encodedHeader)),
  ) as { alg?: string; typ?: string };

  if (header.alg !== "HS256") {
    throw new Error("Invalid authentication token.");
  }

  const payload = JSON.parse(
    new TextDecoder().decode(base64UrlToUint8Array(encodedPayload)),
  ) as { sub?: unknown; exp?: unknown };

  const signature = base64UrlToUint8Array(encodedSignature);
  const key = await importSigningKey(secret);
  const data = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`);
  const isValid = await crypto.subtle.verify(JWT_ALGORITHM_NAME, key, signature, data);

  if (!isValid) {
    throw new Error("Invalid authentication token.");
  }

  if (typeof payload.sub !== "string" || payload.sub.length === 0) {
    throw new Error("Invalid authentication token.");
  }

  if (typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now()) {
    throw new Error("Invalid authentication token.");
  }

  return {
    userId: payload.sub,
  };
}
