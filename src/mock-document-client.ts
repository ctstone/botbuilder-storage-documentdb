import { 
  DocumentClient, DocumentOptions,
  RequestOptions, RequestCallback,
  NewDocument, RetrievedDocument,
  QueryError, UniqueId,
  DatabaseMeta, Collection,
  CollectionMeta } from 'documentdb';


export class MockDocumentClient extends DocumentClient {
  store: {[id:string]:RetrievedDocument<any>} = {};
  args: RequestOptions[] = [];
  database: {body: UniqueId, options?: RequestOptions};
  collection: {body: Collection, options?: RequestOptions};

  constructor(private databaseExists: boolean, private collectionExists: boolean) {
    super('https://mock:443', {masterKey:'123'})
  }
  
  readDocument<T>(documentLink:string, ...args: any[]): void {
    const [options, callback] = this.optionsOrCallback<RequestOptions, RequestCallback<RetrievedDocument<T>>>(args[0], args[1]);
    this.args.push(options);
    if (!this.store.hasOwnProperty(documentLink)) {
      callback({code:404, body:'not found'}, null, null);
    } else {
      callback(null, this.store[documentLink], {});
    }
  }

  upsertDocument<T>(documentsFeedOrDatabaseLink:string, body:NewDocument<T>, ...args:any[]): void {
    const [options, callback] = this.optionsOrCallback<DocumentOptions, RequestCallback<RetrievedDocument<T>>>(args[0], args[1]);
    const doc = <RetrievedDocument<T>>body;
    const docId = `${documentsFeedOrDatabaseLink}/docs/${body.id}`;
    this.args.push(options);
    this.store[docId] = doc;
    callback(null, doc, {});
  }

  createDatabase(body: UniqueId, ...args:any[]): void {
    const [options, callback] = this.optionsOrCallback<RequestOptions, RequestCallback<DatabaseMeta>>(args[0], args[1]);
    const db = <DatabaseMeta>body;
    if (this.databaseExists) {
      callback({code:409, body:'Exists'}, null, null);
    } else {
      this.database = {body: db, options: options}
      callback(null, db, {});
    }
  }

  createCollection(databaseLink: string, body: Collection, ...args:any[]): void {
    const [options, callback] = this.optionsOrCallback<RequestOptions, RequestCallback<CollectionMeta>>(args[0], args[1]);
    const coll = <CollectionMeta>body;
    if (this.collectionExists) {
      callback({code:409, body:'Exists'}, null, null);
    } else {
      this.collection = {body: coll, options: options}
      callback(null, coll, {});
    }
  }

  private optionsOrCallback<TOptions, TCallback>(options:any, callback:any): [TOptions, TCallback] {
    if (typeof(options) == 'function') {
      return [null, options];
    } else {
      return [options, callback];
    }
  }
}