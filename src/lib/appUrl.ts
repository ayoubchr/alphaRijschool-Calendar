/** Joins APP_URL and a path. A trailing slash on APP_URL must not produce `//`. */
export function appUrl(path: string) {
  const base = (process.env.APP_URL ?? "").replace(/\/+$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}
