import { ServerDataError } from '../js/ServerDataError';

type ServerDataErrorClass = ServerDataError;

type ErrorLike = ServerDataErrorClass | Error | string;
