import { IBotStorage, IBotStorageContext, IBotStorageData } from 'botbuilder';
import { DocumentClient as DDB, RequestOptions, RequestCallback } from 'documentdb';

export interface DocumentClient extends DDB {
    readDocument<T>(documentLink: string, options: RequestOptions, callback: RequestCallback<T>): void;
    upsertDocument<T>(documentsFeedOrDatabaseLink: string, body: T, options: RequestOptions, callback: RequestCallback<T>): void;
}

export class DocumentDbBotStorage implements IBotStorage {
    constructor(private client: DocumentClient, private documentsFeedOrDatabaseLink: string, private parallel?: boolean) { }

    getData(context: IBotStorageContext, callback: (err: Error, data: IBotStorageData) => void): void {
      const keys: {userData?:any, privateConversationData?:any, conversationData?:any} = {};
      if (context.userId) {
        if (context.persistUserData) {
          keys.userData = context.userId;
        }
        if (context.conversationId) {
          keys.privateConversationData = `${context.userId}:${context.conversationId}`;
        }
      }
      if (context.persistConversationData && context.conversationId) {
        keys.conversationData = context.conversationId;
      }
      const concurrency = this.parallel ? Object.keys(keys).length : 1;
      async.waterfall([
        (next:any) => async.mapLimit(keys, concurrency, (key, next) => {
          this.client.readDocument(key, null, next);
        }, next),
        (resource:any, resp:any, next:any) => next(null, resource.data),
      ], callback);
    }
    saveData(context: IBotStorageContext, data: IBotStorageData, callback?: (err: Error) => void): void {
      const docs: {key:string, data:any}[] = [];
      if (context.userId) {
        if (context.persistUserData) {
          docs.push({ key: context.userId, data: data.userData });
        }
        if (context.conversationId) {
          docs.push({ key: `${context.userId}:${context.conversationId}`, data: data.privateConversationData });
        }
      }
      if (context.persistConversationData && context.conversationId) {
        docs.push({ key: context.conversationId, data: data.conversationData });
      }
      const concurrency = this.parallel ? docs.length : 1;
      async.eachLimit(docs, concurrency, (data, next:any) => {
        this.client.upsertDocument(this.documentsFeedOrDatabaseLink, { id: data.key, data: data || {} }, null, next);
      }, callback);
    };
}
