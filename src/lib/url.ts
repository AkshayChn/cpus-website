const external = /^(?:[a-z][a-z0-9+.-]*:)?\/\//i;
const special = /^(?:#|mailto:|tel:)/i;

/**
 * Prefix an internal path with Astro's configured base path.
 * External URLs, hashes, mailto: and tel: links pass through unchanged.
 */
export function url(path = '/'): string {
  if (external.test(path) || special.test(path)) return path;

  const base = import.meta.env.BASE_URL;
  const clean = path.replace(/^\/+/, '');
  return clean ? `${base}${clean}` : base;
}
