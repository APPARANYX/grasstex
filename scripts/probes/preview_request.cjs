'use strict';
/* A brief preview-host TCP interruption is not a tactical regression.
   Retry only transport failures while resolving the immutable final-head
   preview URL. Status codes, redirects, SHA checks and browser assertions
   stay with the calling probe and are never retried/overridden here. */
const TRANSIENT = /\b(?:ECONNREFUSED|ECONNRESET|ETIMEDOUT|EPIPE|ENETUNREACH)\b|socket hang up/i;
async function requestPreview(context, url, opts = {}) {
  const attempts = 5;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await context.request.get(url, {
        maxRedirects: 0,
        timeout: 30000,
        ...opts
      });
    } catch (error) {
      if (attempt === attempts || !TRANSIENT.test(String(error))) throw error;
      console.warn('preview transport unavailable; retry ' + attempt + '/' + (attempts - 1));
      await new Promise(resolve => setTimeout(resolve, attempt * 1200));
    }
  }
}
module.exports = { requestPreview };
