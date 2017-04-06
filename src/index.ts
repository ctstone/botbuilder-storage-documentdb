import { IBotStorage, IBotStorageContext, IBotStorageData } from 'botbuilder';
import { Collection, DocumentClient, QueryError } from 'documentdb';
import async = require('async');

const ONE_WEEK_IN_SECONDS = 604800;
const DEFAULT_THROUGHPUT = 20000;
const HTTP_CONFLICT = 409;

type DocumentDbCallback = (err: QueryError, ...args: any[]) => void;

export class DocumentDbBotStorage implements IBotStorage {

    private maxConcurrency: number;
    private initialization: boolean|QueryError;
    private partitioned: boolean;
    private pendingInit: Array<(err: QueryError, ...args: any[]) => void> = [];

    /**
     * Create new DocumentDbBotStorage
     * @param client A DocumentDB client Object
     * @param databaseName Name of the database to store data. Will be created if it does not exit
     * @param collectionName Name of the collection to store data. Will be created if it does not exit
     * @param collectionThroughput Number of Request Units to reserve for the collection if it does not already exist
     * @param defaultTtl Time-to-live for session data. -1 to never expire.
     * @param parallel True if all keys in a given context should be written concurrently (up to 3 concurrent writes per context)
     */
    constructor( // TODO change options to {}
      private client: DocumentClient,
      private databaseName: string,
      private collectionName: string,
      private collectionThroughput = DEFAULT_THROUGHPUT,
      private defaultTtl = ONE_WEEK_IN_SECONDS,
      parallel = true) {
        this.maxConcurrency = parallel ? 3 : 1;
        this.partitioned = this.collectionThroughput > 10000;
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
        const docLink = `dbs/${this.databaseName}/colls/${this.collectionName}/docs/${docId}`;
        async.waterfall([
          (next: any) => this.client.readDocument(docLink, { partitionKey }, next),
          (resource: any, headers: any, next: any) => next(null, resource.data),
        ], next);
      }, callback);
    }

    private writeData(docs: Array<{id: string, data: any}>, callback: (err: QueryError) => void): void {
      async.eachLimit(docs, this.maxConcurrency, (doc, next: (err: QueryError) => void) => {
        const partitionKey = this.partitioned ? doc.id : null;
        doc.data = doc.data || {};
        this.client.upsertDocument(`dbs/${this.databaseName}/colls/${this.collectionName}`, doc, { partitionKey, disableAutomaticIdGeneration: true }, next);
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
          callback(err);
          this.pendingInit.forEach((x) => x(err));
          this.pendingInit.length = 0;
        });
      }
    }

    private createDatabaseIfNotExists(callback: DocumentDbCallback): void {
      this.client.createDatabase({id: this.databaseName}, (err) => {
        callback(err && err.code !== HTTP_CONFLICT ? err : null);
      });
    }

    private createCollectionIfNotExists(callback: (err: QueryError) => void): void {
      const collection: Collection = {
        defaultTtl: this.defaultTtl,
        id: this.databaseName,
        partitionKey: this.partitioned ? 'id' : null,
      };
      const collectionOpts = { offerThroughput: this.collectionThroughput };
      this.client.createCollection(`dbs/${this.databaseName}`, collection, collectionOpts, (err) => {
        callback(err && err.code !== HTTP_CONFLICT ? err : null);
      });
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
