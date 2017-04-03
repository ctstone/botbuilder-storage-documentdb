import { 
  DocumentClient, DocumentOptions,
  RequestOptions, RequestCallback,
  NewDocument, RetrievedDocument,
  QueryError } from 'documentdb';


export class MockDocumentClient extends DocumentClient {
  store: {[id:string]:RetrievedDocument<any>} = {};
  args: RequestOptions[] = [];

  constructor() {
    super('https://mock:443', {masterKey:'123'})
  }
  
  readDocument<T>(documentLink:string, ...args: any[]):void {
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

  private optionsOrCallback<TOptions, TCallback>(options:any, callback:any): [TOptions, TCallback] {
    if (typeof(options) == 'function') {
      return [null, callback];
    } else {
      return [options, callback];
    }
  }
}