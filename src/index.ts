import { IBotStorage, IBotStorageContext, IBotStorageData } from 'botbuilder';
import { Collection, DocumentClient, QueryError, RequestCallback, RequestOptions, RetrievedDocument } from 'documentdb';
import async = require('async');

const ONE_WEEK_IN_SECONDS = 604800;
const DEFAULT_THROUGHPUT = 10000;
const DEFAULT_PARALLEL = true;
const HTTP_CONFLICT = 409;
const HTTP_NOT_FOUND = 404;

type DocumentDbCallback = (err: QueryError, ...args: any[]) => void;

export interface DocumentDbBotStorageOptions {
  /** Database name to use for bot session storage (created if it does not exist) */
  databaseName: string;

  /** Collection name to use for bot session storage (created if it does not exist) */
  collectionName: string;

  /** Collection throughput for created collections (default: 10000) */
  collectionThroughput?: number;

  /** Default document time-to-live for created collections (default 1 week; null to disable) */
  defaultTtl?: number;

  /** Write all keys in a session concurrently (default true) */
  parallel?: boolean;
}

export class DocumentDbBotStorage implements IBotStorage {

    private maxConcurrency: number;
    private initialization: boolean|QueryError;
    private partitioned: boolean;
    private pendingInit: Array<(err: QueryError, ...args: any[]) => void> = [];

    /**
     * Create new DocumentDbBotStorage
     * @param client A DocumentDB client object
     * @param options Storage configuration
     */
    constructor(
      private client: DocumentClient,
      private options: DocumentDbBotStorageOptions) {
        this.options.collectionThroughput = this.options.collectionThroughput || DEFAULT_THROUGHPUT;
        this.options.defaultTtl = this.options.defaultTtl === undefined ? ONE_WEEK_IN_SECONDS : this.options.defaultTtl;
        this.options.parallel = this.options.parallel === false ? false : true;
        this.maxConcurrency = options.parallel ? 3 : 1;
        this.partitioned = this.options.collectionThroughput > 10000;
      }

    getData(context: IBotStorageContext, callback: (err: Error, data: IBotStorageData) => void): void {
      const keys: {userData?: string, privateConversationData?: string, conversationData?: string} = {};
      if (context.userId) {
        if (context.persistUserData) {
          keys.userData = this.userId(context);
        }
        if (context.conversationId) {
          keys.privateConversationData = this.privateConversationId(context);
        }
      }
      if (context.persistConversationData && context.conversationId) {
        keys.conversationData = this.conversationId(context);
      }

      async.waterfall([
        (next: (err: QueryError) => void) => this.init(next),
        (next: (err: QueryError) => void) => this.readData(keys, next),
      ], this.mapDocumentDbError(callback));
    }

    saveData(context: IBotStorageContext, data: IBotStorageData, callback?: (err: Error) => void): void {
      const docs: Array<{id: string, data: any}> = [];
      if (context.userId) {
        if (context.persistUserData) {
          docs.push({ id: this.userId(context), data: data.userData });
        }
        if (context.conversationId) {
          docs.push({ id: this.privateConversationId(context), data: data.privateConversationData });
        }
      }
      if (context.persistConversationData && context.conversationId) {
        docs.push({ id: this.conversationId(context), data: data.conversationData });
      }

      async.series([
        (next: (err: QueryError) => void) => this.init(next),
        (next: (err: QueryError) => void) => this.writeData(docs, next),
      ], this.mapDocumentDbError(callback));
    }

    private readData(keys: {userData?: string, privateConversationData?: string, conversationData?: string}, callback: (err: QueryError, data: IBotStorageData) => void): void {
      async.mapValuesLimit(keys, this.maxConcurrency, (docId, type, next) => {
        const partitionKey = this.partitioned ? docId : null;
        const docLink = `dbs/${this.options.databaseName}/colls/${this.options.collectionName}/docs/${docId}`;
        async.waterfall([
          (next: RequestCallback<RetrievedDocument<any>>) => this.tryReadDocument(docLink, { partitionKey }, { data: null }, next),
          (resource: any, headers: any, next: (err: QueryError, data: any) => void) => next(null, resource.data),
        ], next);
      }, callback);
    }

    private writeData(docs: Array<{id: string, data: any}>, callback: (err: QueryError) => void): void {
      async.eachLimit(docs, this.maxConcurrency, (doc, next: (err: QueryError) => void) => {
        const partitionKey = this.partitioned ? doc.id : null;
        doc.data = doc.data || {};
        this.client.upsertDocument(`dbs/${this.options.databaseName}/colls/${this.options.collectionName}`, doc, { partitionKey, disableAutomaticIdGeneration: true }, next);
      }, callback);
    }

    private init(callback: (err: QueryError) => void): void {
      // init complete
      if (this.initialization === true) {
        callback(null);

      // init failed
      } else if (this.initialization) {
        callback(this.initialization);

      // init pending
      } else if (this.initialization === false) {
        this.pendingInit.push(callback);

      // do init
      } else {
        this.initialization = false;
        async.series([
          (next: DocumentDbCallback) => {
            this.createDatabaseIfNotExists(next);
          },
          (next: (err: QueryError) => void) => this.createCollectionIfNotExists(next),
        ], (err: any) => {
          this.initialization = err || true;
          callback(err);
          this.pendingInit.forEach((x) => x(err));
          this.pendingInit.length = 0;
        });
      }
    }

    private databaseExists(id: string, callback: (err: QueryError, exists: boolean) => void): void {
      this.client.readDatabase(`dbs/${id}`, (err, db, headers) => {
        callback(err && err.code === HTTP_NOT_FOUND ? null : err, !!db);
      });
    }

    private collectionExists(database: string, id: string, callback: (err: QueryError, exists: boolean) => void): void {
      this.client.readCollection(`dbs/${database}/colls/${id}`, (err, coll, headers) => {
        callback(err && err.code === HTTP_NOT_FOUND ? null : err, !!coll);
      });
    }

    private tryReadDocument(docLink: string, options: RequestOptions, defaultDoc: any, callback: RequestCallback<RetrievedDocument<any>>): void {
      this.client.readDocument(docLink, options, (err, resource, responseHeaders) => {
        callback(err && err.code === HTTP_NOT_FOUND ? null : err, resource || defaultDoc, responseHeaders);
      });
    }

    private createDatabaseIfNotExists(callback: DocumentDbCallback): void {
      async.waterfall([
        (next: any) => this.databaseExists(this.options.databaseName, next),
        (exists: boolean, next: any) => {
          if (exists) {
            return next(null);
          }
          this.client.createDatabase({ id: this.options.databaseName }, (err) => {
            next(err && err.code !== HTTP_CONFLICT ? err : null);
          });
        },
      ], callback);
    }

    private createCollectionIfNotExists(callback: (err: QueryError) => void): void {
      const collection: Collection = {
        defaultTtl: this.options.defaultTtl || null,
        id: this.options.collectionName,
        partitionKey: this.partitioned ? { paths: [ '/id' ], kind: 'Hash' } : null,
      };
      const collectionOpts = { offerThroughput: this.options.collectionThroughput };

      async.waterfall([
        (next: any) => this.collectionExists(this.options.databaseName, this.options.collectionName, next),
        (exists: boolean, next: any) => {
          if (exists) {
            return next(null);
          }
          this.client.createCollection(`dbs/${this.options.databaseName}`, collection, collectionOpts, (err) => {
            next(err && err.code !== HTTP_CONFLICT ? err : null);
          });
        },
      ], callback);
    }

    private userId(context: IBotStorageContext): string {
      return `user:${context.userId}`;
    }

    private conversationId(context: IBotStorageContext): string {
      return `conversation:${context.conversationId}`;
    }

    private privateConversationId(context: IBotStorageContext): string {
      return `${this.conversationId(context)};${this.userId(context)}`;
    }

    private mapDocumentDbError<T>(callback: (err: Error, resource: any) => void): (err: QueryError, resource?: T, headers?: any) => void {
      return (err: QueryError|Error|{message: string}, resource?: T, headers?: any) => {
        if (err instanceof Error) {
          callback(err, null);
        } else if (err && err.hasOwnProperty('message')) {
          callback(new Error((err as {message: string}).message), null);
        } else if (err && err.hasOwnProperty('code')) {
          callback(new Error(`${(err as QueryError).code}: ${(err as QueryError).body}`), null);
        } else if (err) {
          callback(new Error('Unknown error'), null);
        } else {
          callback(null, resource);
        }
      };
    }
}
