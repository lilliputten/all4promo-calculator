// @ts-check

export class ServerDataError extends Error {
  /**
   * @param {string} message
   * @param {string} [details]
   */
  constructor(message, details) {
    super(message);
    this.name = 'ServerDataError';
    this.details = details;
  }
}
