import { IBotStorage, IBotStorageContext, IBotStorageData } from 'botbuilder';
import { DocumentClient } from 'documentdb';
import async = require('async');

export class DocumentDbBotStorage implements IBotStorage {

    private maxConcurrency: number;

    /**
     * Create new DocumentDbBotStorage
     * @param client A DocumentDB client Object
     * @param collectionLink The collection where data will be stored
     * @param partitioned True if collection is partitioned on the id property
     * @param parallel True if all keys in a given context should be written concurrently (up to 3 concurrent writes per context)
     */
    constructor(
      private client:DocumentClient,
      private collectionLink:string,
      private partitioned?:boolean,
      parallel?: boolean) {
        this.maxConcurrency = parallel ? 3 : 1;
      }

    getData(context:IBotStorageContext, callback:(err: Error, data: IBotStorageData) => void): void {
      const lookupKeys: {userData?:any, privateConversationData?:any, conversationData?:any} = {};
      if (context.userId) {
        if (context.persistUserData) {
          lookupKeys.userData = this.userId(context);
        }
        if (context.conversationId) {
          lookupKeys.privateConversationData = this.privateConversationId(context);
        }
      }
      if (context.persistConversationData && context.conversationId) {
        lookupKeys.conversationData = this.conversationId(context);
      }
      async.mapValuesLimit(lookupKeys, this.maxConcurrency, (docId, type, next) => {
        const partitionKey = this.partitioned ? docId : null;
        const docLink = `${this.collectionLink}/docs/${docId}`;
        async.waterfall([
          (next:any) => this.client.readDocument(docLink, { partitionKey:partitionKey }, next),
          (resource:any, headers:any, next:any) => next(null, resource.data),
        ], next);
      }, callback);
    }

    saveData(context:IBotStorageContext, data:IBotStorageData, callback?:(err: Error) => void): void {
      const docs: {id:string, data:any}[] = [];
      if (context.userId) {
        if (context.persistUserData) {
          docs.push({ id: this.userId(context), data: data.userData });
        }
        if (context.conversationId) {
          docs.push({ id:this.privateConversationId(context), data: data.privateConversationData });
        }
      }
      if (context.persistConversationData && context.conversationId) {
        docs.push({ id: this.conversationId(context), data: data.conversationData });
      }
      async.eachLimit(docs, this.maxConcurrency, (doc, next:any) => {
        const partitionKey = this.partitioned ? doc.id : null;
        doc.data = doc.data || {};
        this.client.upsertDocument(this.collectionLink, doc, { partitionKey:partitionKey, disableAutomaticIdGeneration:true }, next);
      }, callback);
    }

    private userId(context:IBotStorageContext): string {
      return `user:${context.userId}`;
    }

    private conversationId(context:IBotStorageContext): string {
      return `conversation:${context.conversationId}`;
    }

    private privateConversationId(context:IBotStorageContext): string {
      return `${this.conversationId(context)};${this.userId(context)}`;
    }
}
