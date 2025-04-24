// @ts-check

/** decodeQuery
 * @param {string | string[]} qs
 * @param {string} [sep]
 * @param {string} [eq]
 * @param {any} [options]
 * @returns {{}}
 */
export function decodeQuery(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  const obj = {};
  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }
  const regexp = /\+/g;
  qs = qs.split(sep);
  let maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }
  let len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }
  for (let i = 0; i < len; ++i) {
    const x = qs[i].replace(regexp, '%20'),
      idx = x.indexOf(eq);
    let kstr, vstr;
    if (idx >= 0) {
      kstr = x.substring(0, idx);
      vstr = x.substring(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }
    const k = decodeURIComponent(kstr);
    const v = decodeURIComponent(vstr);
    // if (!hasOwnProperty(obj, k)) {
    if (!Object.prototype.hasOwnProperty.call(obj, k)) {
      obj[k] = v;
    } else if (Array.isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }
  return obj;
}

/** parseQuery -- Parse url query string (in form `?xx=yy&...` or `xx=yy&...`)
 * @param {string} search  - Query string
 * @return {Record<string, string>} query - Query object
 */
export function parseQuery(search) {
  if (!search) {
    return {};
  }
  if (search.indexOf('?') === 0) {
    search = search.substring(1);
  }
  return decodeQuery(search);
}
