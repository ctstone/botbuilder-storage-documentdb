// Type definitions for DocumentDB
// Project: https://github.com/Azure/azure-documentdb-node
// Definitions by: Noel Abrahams <https://github.com/NoelAbrahams>, Brett Gutstein <https://github.com/brettferdosi>, Chris Stone <https://github.com/ctstone>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped/documentdb



/** The feed options and query methods.*/
interface FeedOptions extends RequestOptions {

    /** Max number of items to be returned in the enumeration operation. */
    maxItemCount?: number;

    /** Opaque token for continuing the enumeration. */
    continuation?: string;

    /** Token for use with Session consistency. */
    sessionToken?: string;

    /** Allow scan on the queries which couldn't be served as indexing was opted out on the requested paths. */
    enableScanInQuery?: boolean;
}

/** Options that can be specified for a request issued to the DocumentDB servers. */
interface RequestOptions {

    /** Indicates what is the pre trigger to be invoked before the operation. */
    preTriggerInclude?: string;

    /** Indicates what is the post trigger to be invoked after the operation. */
    postTriggerInclude?: string;

    /** Conditions Associated with the request. */
    accessCondition?: {

        /** Conditional HTTP method header type.*/
        type: string;

        /** Conditional HTTP method header value.*/
        condition: string
    };

    /** Specifies indexing directives (index, do not index ..etc).*/
    indexingDirective?: string;

    /** Consistency level required by the client. */
    consistencyLevel?: string;

    /** Token for use with Session consistency.*/
    sessionToken?: string;

    /** Expiry time (in seconds) for resource token associated with permission (applicable only for requests on permissions).*/
    resourceTokenExpirySeconds?: number;

    /** Offer type when creating document collections. */
    offerType?: string;

    /**
     * The user specified throughput when creating document collections.
     * 
     * Expressed in units of 100 request units per second. This can be between 400 and 250,000 (or higher by requesting a limit increase).
     * 
     * If the x-ms-offer-throughput is over 10,000, then the collection must include a partitionKey definition. If the x-ms-offer-throughput is equal to or under 10,000, then the collection must not include a partitionKey definition.
     * 
     * One of x-ms-offer-throughput or x-ms-offer-type must be specified. Both headers cannot be specified together. */
    offerThroughput?: number;

    /** The partition key value for the requested document or attachment operation. Required for operations against documents and attachments when the collection definition includes a partition key definition. */
    partitionKey?: string|string[];

    /** If the collection is partitioned, this must be set to True to allow execution across multiple partitions. Queries that filter against a single partition key, or against single-partitioned collections do not need to set the header. */
    enableCrossPartitionQuery?: boolean;

    /** If true, parallelize cross-partition queries */
    maxDegreeOfParallelism?: boolean;

    /** If true, populate quota in response */
    populateQuotaInfo?:boolean;
}

interface DocumentOptions extends RequestOptions {
    /** Disables the automatic id generation. If id is missing in the body and this option is true, an error will be returned. */
    disableAutomaticIdGeneration?: boolean;
}

/** The Sql query parameter. */
interface SqlParameter {
    /** The name of the parameter. */
    name: string;

    /** The value of the parameter. */
    value: any;
}

/** The Sql query specification. */
interface SqlQuerySpec {
    /** The body of the query. */
    query: string;

    /** The array of SqlParameters. */
    parameters: SqlParameter[];
}

/** Represents the error object returned from a failed query. */
interface QueryError {

    /** The response code corresponding to the error. */
    code: number;

    /** A string representing the error information. */
    body: string; // { code: string; message: string; };
}

/**
* The callback to execute after the request execution.
* @param error            -       Will contain error information if an error occurs, undefined otherwise.
* @param resource         -       An object that represents the requested resource (Db, collection, document ... etc) if no error happens.
* @param responseHeaders  -       An object that contain the response headers.
*/
interface RequestCallback<TResult> {
    (error: QueryError, resource: TResult, responseHeaders: any): void;
}

/** Reprents an object with a unique identifier. */
interface UniqueId {

    /** The user-defined unique identifier for a document or other DocumentDB object (database, collection, procedure...) */
    id: string;
}

/** Represents the common meta data for all DocumentDB objects. */
interface AbstractMeta extends UniqueId {

    /** The self link.*/
    _self: string;

    /** The time the object was created.*/
    _ts: string;

    _rid?: string;
    _etag?: string;

    _attachments?: string;
}

/** Represents a custom document for storing in DocumentDB  */
interface NewDocument<TContent> extends UniqueId {
    /** The time to live in seconds of the document. */
    ttl?: number;

    /** Custom properties */
    [key:string]: any;
}

/** Represents a document retrieved from storage. 
  * This differs from a new document by the properties in AbstractMeta, which are added by the system.
  */
interface RetrievedDocument<TContent> extends NewDocument<TContent>, AbstractMeta {

}

/** Represents the meta data for a database. */
interface DatabaseMeta extends AbstractMeta {
}

/** Represents the meta data for a collection. */
interface CollectionMeta extends AbstractMeta {
}

/** Represents the meta data for a stored procedure. */
interface ProcedureMeta extends AbstractMeta {
    body: string;
}

/** Represents the meta data for a user-defined function. */
interface UserDefinedFunctionMeta extends AbstractMeta {
}

/** Represents the meta data for a trigger. */
interface TriggerMeta extends AbstractMeta {
    body: string;
    triggerType: string;
    triggerOperation: string;
}

export type UserFunction = ((...params:any[]) => void) | string;

interface UserScriptable extends UniqueId {

    /** The user function. Must set one of body or serverscript */
    body?: UserFunction;

    /** The user function. Must set one of body or serverscript */
    serverScript?: UserFunction;
}

/** An object that is used for authenticating requests and must contain one of the options. */
export interface AuthOptions {

    /** The authorization master key to use to create the client. */
    masterKey?: string;

    /** An object that contains resources tokens. Keys for the object are resource Ids and values are the resource tokens.*/
    resourceTokens?: {[key:string]: string};

    /** An array of {@link Permission} objects. */
    permissionFeed?: Permission[];
}

/** Represents a DocumentDB stored procecedure. */
export interface Procedure extends UserScriptable {
}

/** Represents a DocumentDB user-defined function. */
export interface UserDefinedFunction extends UserScriptable {

    /** Type of function */
    userDefinedFunctionType?: UserDefinedFunctionType;
}

/** Represents a DocumentDB trigger. */
export interface Trigger extends UserScriptable {
    /** The type of the trigger. Should be either 'pre' or 'post'. */
    triggerType?: TriggerType;

    /** The trigger operation. Should be one of 'all', 'create', 'update', 'delete', or 'replace'. */
    triggerOperation: TriggerOperation;
}

/** Represents DocumentDB collection. */
export interface Collection extends UniqueId {

    /** The indexing policy associated with the collection. */
    indexingPolicy?: IndexingPolicy;

    /** The default time to live in seconds for documents in a collection. */
    defaultTtl?: number;
}

/** Represents a DocumentDB attachment */
export interface Attachment {
    /** The MIME contentType of the attachment. */
    contentType: string;

    /** Media link associated with the attachment content. */
    media:string;

    /** Other properties */
    [name:string]: string;
}

export interface AttachmentMeta extends Attachment, AbstractMeta {
}

export interface Permission extends UniqueId {
    /** The mode of the permission */
    permissionMode: PermissionMode;

    /** The link of the resource that the permission will be applied to. */
    resource: string;
}

export interface PermissionMeta extends Permission, AbstractMeta {
}

/**  The Indexing Policy represents the indexing policy configuration for a collection. */
export interface IndexingPolicy {

    /** Specifies whether automatic indexing is enabled for a collection.
        <p>In automatic indexing, documents can be explicitly excluded from indexing using {@link RequestOptions}.
         In manual indexing, documents can be explicitly included. </p> */
    automatic: boolean;

    /** The indexing mode (consistent or lazy) {@link IndexingMode}. */
    indexingMode: IndexingMode;

    /** Represents the paths to be included for indexing. */
    IncludedPaths: IncludedPath[];

    /** Represents the paths to be excluded from indexing. */
    ExcludedPaths: ExcludedPath[];
}

interface ExcludedPath {
    Path: string;
}

interface IncludedPath {
    /** Path to be indexed */
    Path: string;
    Indexes: Index[];
}

/** Specifies the supported Index types. */
interface Index {
    Kind: IndexKind;
    DataType: string;
    Precision: number
}

/** ConnectionPolicy */
export interface ConnectionPolicy {
    /** Attachment content (aka media) download mode.  */
    MediaReadMode: MediaReadMode;

    /** Time to wait for response from network peer for attachment content (aka media) operations. Represented in milliseconds. */
    MediaRequestTimeout: number;

    /** Request timeout (time to wait for response from network peer). Represented in milliseconds. */
    RequestTimeout: number;

    /** Flag to enable/disable automatic redirecting of requests based on read/write operations. */
    EnableEndpointDiscovery: boolean;

    /** List of azure regions to be used as preferred locations for read requests. */
    PreferredLocations: any[];

    /** RetryOptions instance which defines several configurable properties used during retry. */
    RetryOptions: RetryOptions;

    /** Flag to disable SSL verification for the requests. SSL verification is enabled by default. Don't set this when targeting production endpoints. This is intended to be used only when targeting emulator endpoint to avoid failing your requests with SSL related error. */
    DisableSSLVerification: boolean;
}



/** RetryOptions */
export interface RetryOptions {
    /** Max number of retries to be performed for a request. Default value 9. */
    MaxRetryAttemptCount?: number;

    /** Fixed retry interval in milliseconds to wait between each retry ignoring the retryAfter returned as part of the response. */
    FixedRetryIntervalInMilliseconds?: number;

    /** Max wait time in seconds to wait for a request while the retries are happening. Default value 30 seconds. */
    MaxWaitTimeInSeconds?: number;
}


export interface MediaOptions extends RequestOptions {
    /** HTTP Slug header value. */
    slug?: string;

    /** HTTP ContentType header value. */
    contentType?: string;
}

export interface DatabaseAccountRequestOptions extends RequestOptions {
    /** The endpoint url whose database account needs to be retrieved. If not present, current client's url will be used. */
    urlConnection?: string;
}

export interface DatabaseAccount {
    DatabasesLink: string;
    MediaLink: string;
    MaxMediaStorageUsageInMB: number;
    CurrentMediaStorageUsageInMB: number;
    ConsistencyPolicy: ConsistencyPolicy;
    WritableLocations: string[];
    ReadableLocations: string[];
}

export interface ConsistencyPolicy {
    defaultConsistencyLevel: ConsistencyLevel;
    maxStalenessPrefix: number;
    maxStalenessIntervalInSeconds: number;
}

export interface RangeOptions {
    
    /** The low value in the range. */
    low: any;

    /** The high value in the range. */
    high:any;
}

export interface PartitionKeyMap {
    link:string;
    range:Range;
}

export type DocumentQuery = SqlQuerySpec | string;

/**
 * @deprecated Support for IPartitionResolver is now obsolete. It's recommended that you use Partitioned Collections for higher storage and throughput.
 * DEPRECATED Support for IPartitionResolver is now obsolete. It's recommended that you use Partitioned Collections for higher storage and throughput.
 */
export interface PartitionResolver {
    /**
     * Extracts the partition key from the specified document using the partitionKeyExtractor
     * @param document - The document from which to extract the partition key.
     */
    getPartitionKey(document:any): string;

    /**
     * Given a partition key, returns the correct collection link for creating a document.
     * @param partitionKey - The partition key used to determine the target collection for create
     */
    resolveForCreate(partitionKey:string): string;

    /**
     * Given a partition key, returns a list of collection links to read from.
     * @param partitionKey - The partition key used to determine the target collection for query
     */
    resolveForRead(partitionKey:any): string[];
}

/**
 * @deprecated Support for IPartitionResolver is now obsolete. It's recommended that you use Partitioned Collections for higher storage and throughput.
 * DEPRECATED Support for IPartitionResolver is now obsolete. It's recommended that you use Partitioned Collections for higher storage and throughput.
 */
export interface ConsistentHashRingOptions {
    /** Function to compute the hash for a given link or partition key */
    computeHash?: (key:string|number, seed:number) => number;

    /** Number of points in the ring to assign to each collection link */
    numberOfVirtualNodesPerCollection?: number;
}

/** Represents a QueryIterator Object, an implmenetation of feed or query response that enables traversal and iterating over the response in the Azure DocumentDB database service. */
export declare class QueryIterator<TResultRow> {

    /**
     * Constructs a QueryIterator object
     * @param documentclient    - The documentclient object.
     * @param query             - A SQL query.
     * @param options           - Represents the feed options.
     * @param fetchFunctions    - A function to retrieve each page of data. An array of functions may be used to query more than one partition.
     * @param resourceLinkopt   - An optional parameter that represents the resourceLink (will be used in orderby/top/parallel query)
     */
    constructor(documentclient:DocumentClient, query:DocumentQuery, options:FeedOptions, fetchFunctions:RequestCallback<TResultRow>|RequestCallback<TResultRow>[], resourceLinkopt?:string);

    /**
     * Retrieve the current element on the QueryIterator.
     * @param callback Function to execute for the current element.
     */
    current(callback:RequestCallback<TResultRow>): void;

    /**
     * Retrieve the next batch of the feed and pass them as an array to a function
     * @param callback Function execute on the feed response.
     */
    executeNext(callback:RequestCallback<TResultRow[]>): void;

    /**
     * Execute a provided function once per feed element.
     * @param callback Function to execute for each element. the function takes two parameters error, element. Note: the last element the callback will be called on will be undefined. If the callback explicitly returned false, the loop gets stopped.
     */
    forEach(callback:RequestCallback<TResultRow>): void;

    /**
     * DEPRECATED Instead check if callback(undefined, undefined) is invoked by nextItem(callback) or current(callback) Determine if there are still remaining resources to processs based on the value of the continuation token or the elements remaining on the current batch in the QueryIterator.
     * @deprecated Instead check if callback(undefined, undefined) is invoked by nextItem(callback) or current(callback) Determine if there are still remaining resources to processs based on the value of the continuation token or the elements remaining on the current batch in the QueryIterator.
     */
    hasMoreResults(): boolean;

    /**
     * Execute a provided function on the next element in the QueryIterator.
     * @param callback Function to execute for each element.
     */
    nextItem(callback:RequestCallback<TResultRow>): void;

    /**
     * Reset the QueryIterator to the beginning and clear all the resources inside it
     */
    reset(): void;

    /**
     * Retrieve all the elements of the feed and pass them as an array to a function
     * @param callback Function execute on the feed response.
     */
    toArray(callback:RequestCallback<TResultRow[]>): void
}

/** 
 * @deprecated Support for IPartitionResolver is now obsolete. It's recommended that you use Partitioned Collections for higher storage and throughput.
 * DEPRECATED Support for IPartitionResolver is now obsolete. It's recommended that you use Partitioned Collections for higher storage and throughput.
 * HashPartitionResolver implements partitioning based on the value of a hash function, allowing you to evenly distribute requests and data across a number of partitions for the Azure DocumentDB database service. */
export declare class HashPartitionResolver implements PartitionResolver {

    /**
     * DEPRECATED Create new HashPartitionResolver
     * @deprecated Support for IPartitionResolver is now obsolete. It's recommended that you use Partitioned Collections for higher storage and throughput.
     * @param partitionKeyExtractor - If partitionKeyExtractor is a string, it should be the name of the property in the document to execute the hashing on. If partitionKeyExtractor is a function, it should be a function to extract the partition key from an object.
     * @param collectionLink        - Array of strings in the format 'dbs/foo/colls/bar'
     * @param options               - Options forr the ConsistentHashRing (MurmurHash)
     */
    constructor(partitionKeyExtractor:string|((obj:any) => any), collectionLinks:string[], options?:ConsistentHashRingOptions);

    /**
     * Extracts the partition key from the specified document using the partitionKeyExtractor
     * @param document - The document from which to extract the partition key.
     */
    getPartitionKey(document:any): string;

    /**
     * Given a partition key, returns the correct collection link for creating a document.
     * @param partitionKey - The partition key used to determine the target collection for create
     */
    resolveForCreate(partitionKey:string): string;

    /**
     * Given a partition key, returns a list of collection links to read from.
     * @param partitionKey - The partition key used to determine the target collection for query
     */
    resolveForRead(partitionKey:string): string[];
}

/** 
 * @deprecated Support for IPartitionResolver is now obsolete. It's recommended that you use Partitioned Collections for higher storage and throughput.
 * DEPRECATED Support for IPartitionResolver is now obsolete. It's recommended that you use Partitioned Collections for higher storage and throughput.
 * Represents a range object used by the RangePartitionResolver in the Azure DocumentDB database service. */
export declare class Range {

    /**
     * DEPRECATED Create new Range object
     * @deprecated Support for IPartitionResolver is now obsolete. It's recommended that you use Partitioned Collections for higher storage and throughput.
     * @param options -  The Range constructor options.
     */
    constructor(options:RangeOptions);
}

/** 
 * @deprecated Support for IPartitionResolver is now obsolete. It's recommended that you use Partitioned Collections for higher storage and throughput.
 * DEPRECATED Support for IPartitionResolver is now obsolete. It's recommended that you use Partitioned Collections for higher storage and throughput.
 * RangePartitionResolver implements partitioning using a partition map of ranges of values to a collection link in the Azure DocumentDB database service. */
export declare class RangePartitionResolver implements PartitionResolver {
    /**
     * DEPRECATED Create new RangePartitionResolver object
     * @deprecated Support for IPartitionResolver is now obsolete. It's recommended that you use Partitioned Collections for higher storage and throughput.
     * @param partitionKeyExtractor - If partitionKeyExtractor is a string, it should be the name of the property in the document to execute the hashing on. If partitionKeyExtractor is a function, it should be a function to extract the partition key from an object. 
     * @param partitionKeyMap       - The map from Range to collection link that is used for partitioning requests.
     * @param [compareFunction]       - Optional function that accepts two arguments a and b and returns a negative value if a < b, zero if a = b, or a positive value if a > b.
     */
    constructor(partitionKeyExtractor:string|((obj:any) => any), partitionKeyMap:PartitionKeyMap[], compareFunction?:(a:any, b:any) => number);

    /**
     * Extracts the partition key from the specified document using the partitionKeyExtractor
     * @param document - The document from which to extract the partition key.
     */
    getPartitionKey(document:any): string;

    /**
     * Given a partition key, returns the correct collection link for creating a document.
     * @param partitionKey - The partition key used to determine the target collection for create
     */
    resolveForCreate(partitionKey:string): string;

    /**
     * Given a partition key, returns a list of collection links to read from.
     * @param partitionKey - The partition key used to determine the target collection for query
     */
    resolveForRead(partitionKey:string): string[];
}

/** Provides a client-side logical representation of the Azure DocumentDB database account. This client is used to configure and execute requests against the service.
  */
export declare class DocumentClient {
    /**
     * Constructs a DocumentClient.
     * @param urlConnection           - The service endpoint to use to create the client.
     * @param auth                    - An object that is used for authenticating requests and must contains one of the options.
     * @param [connectionPolicy]      - An instance of {@link ConnectionPolicy} class. This parameter is optional and the default connectionPolicy will be used if omitted.
     * @param [consistencyLevel]      - An optional parameter that represents the consistency level. It can take any value from {@link ConsistencyLevel}.
    */
    constructor(urlConnection: string, auth: AuthOptions, connectionPolicy?: ConnectionPolicy, consistencyLevel?: ConsistencyLevel);

    /** Create an attachment for the document object.
     * <p>
     *  Each document may contain zero or more attachments. Attachments can be of any MIME type - text, image, binary data. <br>
     *  These are stored externally in Azure Blob storage. Attachments are automatically deleted when the parent document is deleted. 
     * </p> 
     * @param documentLink  - The self-link of the document.
     * @param body          - The metadata the defines the attachment media like media, contentType. It can include any other properties as part of the metedata
     * @param [options]     - The request options.
     * @param callback      - The callback for the request.
     * */
    createAttachment(documentLink:string, body:Attachment, options:RequestOptions, callback:RequestCallback<AttachmentMeta>): void;
    createAttachment(documentLink:string, body:Attachment, callback:RequestCallback<AttachmentMeta>): void;

    /**
     * 
     * @param documentLink      - The self-link of the document.
     * @param readableStream    - The stream that represents the media itself that needs to be uploaded.
     * @param [options]         - The request options.
     * @param callback          - The callback for the request.
     */
    createAttachmentAndUploadMedia(documentLink:string, readableStream:NodeJS.ReadableStream, options:MediaOptions, callback:RequestCallback<AttachmentMeta>): void;
    createAttachmentAndUploadMedia(documentLink:string, readableStream:NodeJS.ReadableStream, callback:RequestCallback<AttachmentMeta>): void;

    /** Send a request for creating a database. 
     * <p>
     *  A database manages users, permissions and a set of collections.  <br>
     *  Each Azure DocumentDB Database Account is able to support multiple independent named databases, with the database being the logical container for data. <br>
     *  Each Database consists of one or more collections, each of which in turn contain one or more documents. Since databases are an an administrative resource, the Service Master Key will be required in order to access and successfully complete any action using the User APIs. <br>
     * </p>
     * @param body      - A json object that represents The database to be created.
     * @param [options] - The request options.
     * @param callback  - The callback for the request.
    */
    createDatabase(body: UniqueId, options: RequestOptions, callback: RequestCallback<DatabaseMeta>): void;
    createDatabase(body: UniqueId, callback: RequestCallback<DatabaseMeta>): void;

    /**
     * Creates a collection.
     * <p>
     * A collection is a named logical container for documents. <br>
     * A database may contain zero or more named collections and each collection consists of zero or more JSON documents. <br>
     * Being schema-free, the documents in a collection do not need to share the same structure or fields. <br>
     * Since collections are application resources, they can be authorized using either the master key or resource keys. <br>
     * </p>
     * @param databaseLink  - The self-link of the database.
     * @param body          - Represents the body of the collection.
     * @param [options]     - The request options.
     * @param callback      - The callback for the request.
     */
    createCollection(databaseLink: string, body: Collection, options: RequestOptions, callback: RequestCallback<CollectionMeta>): void;
    createCollection(databaseLink: string, body: Collection, callback: RequestCallback<CollectionMeta>): void;

    /**
     * Create a StoredProcedure.
     * <p>
     * DocumentDB allows stored procedures to be executed in the storage tier, directly against a document collection. The script <br>
     * gets executed under ACID transactions on the primary storage partition of the specified collection. For additional details, <br>
     * refer to the server-side JavaScript API documentation. 
     * </p>
     * @param collectionLink    - The self-link of the collection.
     * @param procedure         - Represents the body of the stored procedure.
     * @param [options]         - The request options.
     * @param callback          - The callback for the request.
     */
    createStoredProcedure(collectionLink: string, procedure: Procedure, options: RequestOptions, callback: RequestCallback<ProcedureMeta>): void;
    createStoredProcedure(collectionLink: string, procedure: Procedure, callback: RequestCallback<ProcedureMeta>): void;

    /**
     * Create a UserDefinedFunction.
     * <p>
     * DocumentDB supports JavaScript UDFs which can be used inside queries, stored procedures and triggers. <br>
     * For additional details, refer to the server-side JavaScript API documentation.
     * </p>
     * @param collectionLink    - The self-link of the collection.
     * @param udf               - Represents the body of the userDefinedFunction.
     * @param [options]         - The request options.
     * @param callback          - The callback for the request.
     */
    createUserDefinedFunction(collectionLink: string, udf: UserDefinedFunction, options: RequestOptions, callback: RequestCallback<UserDefinedFunctionMeta>): void;
    createUserDefinedFunction(collectionLink: string, udf: UserDefinedFunction, callback: RequestCallback<UserDefinedFunctionMeta>): void;

    /**
     * Create a trigger.
     * <p>
     * DocumentDB supports pre and post triggers defined in JavaScript to be executed on creates, updates and deletes. <br>
     * For additional details, refer to the server-side JavaScript API documentation.
     * </p>
     * @param collectionLink  - The self-link of the collection.
     * @param trigger         - Represents the body of the trigger.
     * @param [options]       - The request options.
     * @param callback        - The callback for the request.
     */
    createTrigger(collectionLink: string, trigger: Trigger, options: RequestOptions, callback: RequestCallback<TriggerMeta>): void;
    createTrigger(collectionLink: string, trigger: Trigger, callback: RequestCallback<TriggerMeta>): void;

    /**
     * Create a document.
     * <p> 
     * There is no set schema for JSON documents. They may contain any number of custom properties as well as an optional list of attachments. <br>
     * A Document is an application resource and can be authorized using the master key or resource keys
     * </p>
     * @param documentsFeedOrDatabaseLink    - The self-link of the collection.
     * @param document          - Represents the body of the document. Can contain any number of user defined properties.
     * @param [options]         - The request options.
     * @param callback 			- The callback for the request.
     */
    createDocument<TDocument>(documentsFeedOrDatabaseLink: string, document: NewDocument<TDocument>, options: DocumentOptions, callback: RequestCallback<RetrievedDocument<TDocument>>): void;
    createDocument<TDocument>(documentsFeedOrDatabaseLink: string, document: NewDocument<TDocument>, callback: RequestCallback<RetrievedDocument<TDocument>>): void;

    /**
     * Create a permission. A permission represents a per-User Permission to access a specific resource e.g. Document or Collection.
     * @param userLink      - Self-link of the user.
     * @param body          - Permission body
     * @param options       - Request options
     * @param callback      - Callback for the request
     */
    createPermission(userLink:string, body:Permission, options:RequestOptions, callback:RequestCallback<PermissionMeta>): void;
    createPermission(userLink:string, body:Permission, callback:RequestCallback<PermissionMeta>): void;

    /**
     * 
     * @param databaseLink  - The self-link of the database.
     * @param body          - Represents the body of the user.
     * @param options       - The request options.
     * @param callback      - The callback for the request.
     */
    createUser(databaseLink:string, body:UniqueId, options:RequestOptions, callback:RequestCallback<AbstractMeta>): void;
    createUser(databaseLink:string, body:UniqueId, callback:RequestCallback<AbstractMeta>): void;

    /**
     * Execute the StoredProcedure represented by the object.
     * @param procedureLink - The self-link of the stored procedure.
     * @param [params]      - Represents the parameters of the stored procedure.
     * @param options       - The request options
     * @param callback      - The callback for the request.
     */
    executeStoredProcedure<TResult>(procedureLink: string, params: any[], options:RequestOptions, callback: RequestCallback<TResult>): void;
    executeStoredProcedure<TResult>(procedureLink: string, params: any[], callback: RequestCallback<TResult>): void;
    executeStoredProcedure<TResult>(procedureLink: string, options:RequestOptions, callback: RequestCallback<TResult>): void;

    /** Lists all databases that satisfy a query. 
     * @param query     - A SQL query string.
     * @param [options] - The feed options.
     * @returns         - An instance of QueryIterator to handle reading feed.
     */
    queryDatabases(query: DocumentQuery, options?:FeedOptions): QueryIterator<DatabaseMeta>;

    /**
     * Query the collections for the database.
     * @param databaseLink  - The self-link of the database.
     * @param query         - A SQL query string.
     * @param [options]     - Represents the feed options.
     * @returns             - An instance of queryIterator to handle reading feed.
     */
    queryCollections(databaseLink: string, query: DocumentQuery, options?:FeedOptions): QueryIterator<CollectionMeta>;

    /**
     * Query the storedProcedures for the collection.
     * @param collectionLink    - The self-link of the collection.
     * @param query             - A SQL query string.
     * @param [options]         - Represents the feed options.
     * @returns                 - An instance of queryIterator to handle reading feed.
     */
    queryStoredProcedures(collectionLink: string, query: DocumentQuery, options?:FeedOptions): QueryIterator<ProcedureMeta>;

    /**
     * Query the user-defined functions for the collection.
     * @param collectionLink    - The self-link of the collection.
     * @param query             - A SQL query string.
     * @param [options]         - Represents the feed options.
     * @returns                 - An instance of queryIterator to handle reading feed.
     */
    queryUserDefinedFunctions(collectionLink: string, query: DocumentQuery, options?: FeedOptions): QueryIterator<UserDefinedFunctionMeta>;

    /**
    * Query the documents for the collection.
    * @param collectionLink - The self-link of the collection.
    * @param query          - A SQL query string.
    * @param [options]      - Represents the feed options.
    * @returns              - An instance of queryIterator to handle reading feed.
    */
    queryDocuments<TDocument>(collectionLink: string, query: DocumentQuery, options?: FeedOptions): QueryIterator<RetrievedDocument<TDocument>>;

    /**
     * Query the triggers for the collection.
     * @param {string} collectionLink         - The self-link of the collection.
     * @param {SqlQuerySpec | string} query   - A SQL query.
     * @param {FeedOptions} [options]         - Represents the feed options.
     * @returns {QueryIterator}               - An instance of queryIterator to handle reading feed.
     */
    queryTriggers(collectionLink: string, query: DocumentQuery, options?: FeedOptions): QueryIterator<TriggerMeta>;

    /**
     * Query the attachments for the document.
     * @param documentLink      - The self-link of the document.
     * @param query             - A SQL query.
     * @param [options]         - Represents the feed options.
     */
    queryAttachments<T>(documentLink:string, query:DocumentQuery, options?:FeedOptions): QueryIterator<T>;

    /**
     * Query the conflicts for the collection.
     * @param collectionLink    - The self-link of the collection.
     * @param query             - A SQL query.
     * @param [options]         - Represents the feed options.
     */
    queryConflicts(collectionLink:string, query:DocumentQuery, options?:FeedOptions): QueryIterator<any>;

    /**
     * Lists all offers that satisfy a query.
     * @param query     - A SQL query.
     * @param options   - The feed options.
     */
    queryOffers(query:DocumentQuery, options?:FeedOptions): QueryIterator<any>;

    /**
     * Query the permission for the user.
     * @param userLink  - The self-link of the user.
     * @param query     - A SQL query.
     * @param options   - Feed options.
     */
    queryPermissions(userLink:string, query:DocumentQuery, options?:FeedOptions): QueryIterator<PermissionMeta>;

    /**
     * Query the users for the database.
     * @param databaseLink  - The self-link of the database.
     * @param query         - A SQL query.
     * @param options       - Represents the feed options.
     */
    queryUsers(databaseLink:string, query:DocumentQuery, options?:FeedOptions): QueryIterator<AbstractMeta>;

    /**
     * Delete the document object.
     * @param documentLink  - The self-link of the document.
     * @param [options]     - The request options.
     * @param callback      - The callback for the request. 
    */
    deleteDocument(documentLink: string, options: RequestOptions, callback: RequestCallback<void>): void;
    deleteDocument(documentLink: string, callback: RequestCallback<void>): void;

    /**
     * Delete the database object.
     * @param databaseLink  - The self-link of the database.
     * @param [options]     - The request options.
     * @param callback      - The callback for the request. 
    */
    deleteDatabase(databaseLink: string, options: RequestOptions, callback: RequestCallback<void>): void;
    deleteDatabase(databaseLink: string, callback: RequestCallback<void>): void;

    /**
     * Delete the collection object.
     * @param collectionLink    - The self-link of the collection.
     * @param [options]         - The request options.
     * @param callback          - The callback for the request. 
    */
    deleteCollection(collectionLink: string, options: RequestOptions, callback: RequestCallback<void>): void;
    deleteCollection(collectionLink: string, callback: RequestCallback<void>): void;

    /**
     * Delete the StoredProcedure object.
     * @param procedureLink - The self-link of the stored procedure.
     * @param [options]     - The request options.
     * @param callback      - The callback for the request.
    */
    deleteStoredProcedure(procedureLink: string, options: RequestOptions, callback: RequestCallback<void>): void;
    deleteStoredProcedure(procedureLink: string, callback: RequestCallback<void>): void;

    /**
     * Delete an attachment
     * @param attachmentLink    - The self-link of the attachment.
     * @param options           - The request options.
     * @param callback          - The callback for the request.
     */
    deleteAttachment(attachmentLink:string, options:RequestOptions, callback:RequestCallback<void>): void
    deleteAttachment(attachmentLink:string, callback:RequestCallback<void>): void

    /**
     * Delete a conflict
     * @param conflictLink      - The self-link of the conflict.
     * @param options           - The request options.
     * @param callback          - The callback for the request.
     */
    deleteConflict(conflictLink:string, options:RequestOptions, callback:RequestCallback<void>): void;
    deleteConflict(conflictLink:string, callback:RequestCallback<void>): void;

    /**
     * Delete a permission
     * @param permissionLink    - The self-link of the permission.
     * @param options           - The request options.
     * @param callback          - The callback for the request.
     */
    deletePermission(permissionLink:string, options:RequestOptions, callback:RequestCallback<void>): void;
    deletePermission(permissionLink:string, callback:RequestCallback<void>): void;

    /**
     * Delete a trigger
     * @param triggerLink       - The self-link of the trigger.
     * @param options           - The request options.
     * @param callback          - The callback for the request.
     */
    deleteTrigger(triggerLink:string, options:RequestOptions, callback:RequestCallback<void>): void;
    deleteTrigger(triggerLink:string, callback:RequestCallback<void>): void;

    /**
     * Delete a user
     * @param userLink          - The self-link of the user.
     * @param options           - The request options.
     * @param callback          - The callback for the request.
     */
    deleteUser(userLink:string, options:RequestOptions, callback:RequestCallback<void>):void;
    deleteUser(userLink:string, callback:RequestCallback<void>):void;

    /**
     * Delete a user-defined function
     * @param udfLink           - The self-link of the user defined function.
     * @param options           - The request options.
     * @param callback          - The callback for the request.
     */
    deleteUserDefinedFunction(udfLink:string, options:RequestOptions, callback:RequestCallback<void>):void;
    deleteUserDefinedFunction(udfLink:string, callback:RequestCallback<void>):void;

    /**
     * Replace the document object.
     * @param {string} documentLink      - The self-link of the document.
     * @param {object} document          - Represent the new document body.
     * @param {RequestOptions} [options] - The request options.
     * @param {RequestCallback} callback - The callback for the request.
     */
    replaceDocument<TDocument>(documentLink: string, document: NewDocument<TDocument>, options: RequestOptions, callback: RequestCallback<RetrievedDocument<TDocument>>): void;
    replaceDocument<TDocument>(documentLink: string, document: NewDocument<TDocument>, callback: RequestCallback<RetrievedDocument<TDocument>>): void;

    /**
     * Replace the StoredProcedure object.
     * @param procedureLink - The self-link of the stored procedure.
     * @param procedure     - Represent the new procedure body.
     * @param [options]     - The request options.
     * @param callback      - The callback for the request.
     */
    replaceStoredProcedure(procedureLink: string, procedure: Procedure, options: RequestOptions, callback: RequestCallback<ProcedureMeta>): void;
    replaceStoredProcedure(procedureLink: string, procedure: Procedure, callback: RequestCallback<ProcedureMeta>): void;

    /**
     * Replace the attachment object.
     * @param attachmentLink    - The self-link of the attachment.
     * @param attachment        - Represent the new attachment body.
     * @param options           - The request options.
     * @param callback          - The callback for the request.
     */
    replaceAttachment(attachmentLink:string, attachment:Attachment, options:RequestOptions, callback:RequestCallback<AttachmentMeta>): void;
    replaceAttachment(attachmentLink:string, attachment:Attachment, callback:RequestCallback<AttachmentMeta>): void;

    /**
     * Replace the document collection.
     * @param collectionLink    - The self-link of the document collection.
     * @param collection        - Represent the new document collection body.
     * @param options           - The request options.
     * @param callback          - The callback for the request.
     */
    replaceCollection(collectionLink:string, collection:Collection, options:RequestOptions, callback:RequestCallback<CollectionMeta>): void;
    replaceCollection(collectionLink:string, collection:Collection, callback:RequestCallback<CollectionMeta>): void;

    /**
     * Replace the offer object.
     * @param offerLink     - The self-link of the offer.
     * @param offer         - Represent the new offer body.
     * @param callback      - The callback for the request.
     */
    replaceOffer(offerLink:string, offer:any, callback:RequestCallback<any>): void;

    /**
     * Replace the permission object.
     * @param permissionLink    - The self-link of the permission.
     * @param permission        - Represent the new permission body.
     * @param options           - The request options.
     * @param callback          - The callback for the request.
     */
    replacePermission(permissionLink:string, permission:Permission, options:RequestOptions, callback:RequestCallback<PermissionMeta>): void;
    replacePermission(permissionLink:string, permission:Permission, callback:RequestCallback<PermissionMeta>): void;

    /**
     * Replace the trigger object.
     * @param triggerLink   - The self-link of the trigger.
     * @param trigger       - Represent the new trigger body.
     * @param options       - The request options.
     * @param callback      - The callback for the request.
     */
    replaceTrigger(triggerLink:string, trigger:Trigger, options:RequestOptions, callback:RequestCallback<TriggerMeta>): void;
    replaceTrigger(triggerLink:string, trigger:Trigger, callback:RequestCallback<TriggerMeta>): void;

    /**
     * Replace the user object.
     * @param userLink      - The self-link of the user.
     * @param user          - Represent the new user body.
     * @param options       - The request options.
     * @param callback      - The callback for the request.
     */
    replaceUser(userLink:string, user:UniqueId, options:RequestOptions, callback:RequestCallback<AbstractMeta>): void;
    replaceUser(userLink:string, user:UniqueId, callback:RequestCallback<AbstractMeta>): void;

    /**
     * Replace the UserDefinedFunction object.
     * @param udfLink       - The self-link of the user defined function.
     * @param udf           - Represent the new udf body.
     * @param options       - The request options.
     * @param callback      - The callback for the request.
     */
    replaceUserDefinedFunction(udfLink:string, udf:UserDefinedFunction, options:RequestOptions, callback:RequestCallback<UserDefinedFunctionMeta>): void;
    replaceUserDefinedFunction(udfLink:string, udf:UserDefinedFunction, callback:RequestCallback<UserDefinedFunctionMeta>): void;


    /**
     * Read an Attachment object.
     * @param attachmentLink    - The self-link of the attachment.
     * @param options           - The request options.
     * @param callback          - The callback for the request.
     */
    readAttachment(attachmentLink:string, options:RequestOptions, callback:RequestCallback<AttachmentMeta>): void
    readAttachment(attachmentLink:string, callback:RequestCallback<AttachmentMeta>): void

    /**
     * Get all attachments for this document.
     * @param documentLink      - The self-link of the document.
     * @param options           - The feed options.
     */
    readAttachments(documentLink:string, options?:FeedOptions): QueryIterator<AttachmentMeta>;

    /**
     * Read a collection.
     * @param collectionLink    - The self-link of the collection.
     * @param options           - The request options.
     * @param callback          - The callback for the request.
     */
    readCollection(collectionLink:string, options:RequestOptions, callback:RequestCallback<CollectionMeta>): void;
    readCollection(collectionLink:string, callback:RequestCallback<CollectionMeta>): void;

    /**
     * Get all collections in this database.
     * @param databaseLink      - The self-link of the database.
     * @param options           - The feed options.
     */
    readCollections(databaseLink:string, options?:FeedOptions): QueryIterator<CollectionMeta>;

    /**
     * Read a conflict.
     * @param conflictLink      - The self-link of the conflict.
     * @param options           - The request options.
     * @param callback          - The callback for the request.
     */
    readConflict(conflictLink:string, options:RequestOptions, callback:RequestCallback<any>): void;
    readConflict(conflictLink:string, callback:RequestCallback<any>): void;

    /**
     * Get all conflicts in this collection.
     * @param collectionLink    - The self-link of the collection.
     * @param options           - The feed options.
     */
    readConflicts(collectionLink:string, options?:FeedOptions): QueryIterator<any>;

    /**
     * Read a database.
     * @param databaseLink      - The self-link of the database.
     * @param options           - The request options.
     * @param callback          - The callback for the request.
     */
    readDatabase(databaseLink:string, options:RequestOptions, callback:RequestCallback<DatabaseMeta>): void;
    readDatabase(databaseLink:string, callback:RequestCallback<DatabaseMeta>): void;

    /**
     * List all databases.
     * @param options       - The request options.
     */
    readDatabases(options?:FeedOptions): QueryIterator<DatabaseMeta>;

    /**
     * Read a document.
     * @param documentLink      - The self-link of the document.
     * @param options           - The request options.
     * @param callback          - The callback for the request.
     */
    readDocument<T>(documentLink:string, options:RequestOptions, callback:RequestCallback<RetrievedDocument<T>>): void;
    readDocument<T>(documentLink:string, callback:RequestCallback<RetrievedDocument<T>>): void;

    /**
     * Get all documents in this collection.
     * @param collectionLink    - The self-link of the collection.
     * @param options           - The feed options.
     */
    readDocuments<T>(collectionLink:string, options?:FeedOptions): QueryIterator<RetrievedDocument<T>>;

    /**
     * Read the media for the attachment object.
     * @param mediaLink     - The media link of the media in the attachment.
     * @param callback      - The callback for the request, the result parameter can be a buffer or a stream depending on the value of MediaReadMode
     */
    readMedia(mediaLink:string, callback:RequestCallback<Buffer|NodeJS.ReadableStream>): void;

    /**
     * Read an offer.
     * @param offerLink     - The self-link of the offer.
     * @param callback      - The callback for the request.
     */
    readOffer(offerLink:string, callback:RequestCallback<any>): void;

    /**
     * List all offers
     * @param options       - The feed options.
     */
    readOffers(options?:FeedOptions): QueryIterator<any[]>;

    /**
     * Read a permission.
     * @param permissionLink    - The self-link of the permission.
     * @param options           - The request options.
     * @param callback          - The callback for the request.
     */
    readPermission(permissionLink:string, options:RequestOptions, callback:RequestCallback<PermissionMeta>): void;
    readPermission(permissionLink:string, callback:RequestCallback<PermissionMeta>): void;

    /**
     * Get all permissions for this user.
     * @param userLink          - The self-link of the user.
     * @param feedOptions       - The feed options
     */
    readPermissions(userLink:string, feedOptions?:FeedOptions): QueryIterator<PermissionMeta>;

    /**
     * 
     * @param sprocLink         - The self-link of the stored procedure.
     * @param options           - The request options.
     * @param callback          - The callback for the request.
     */
    readStoredProcedure(sprocLink:string, options:RequestOptions, callback:RequestCallback<ProcedureMeta>): void;
    readStoredProcedure(sprocLink:string, callback:RequestCallback<ProcedureMeta>): void;

    /**
     * Get all StoredProcedures in this collection.
     * @param collectionLink    - The self-link of the collection.
     * @param options           - The feed options.
     */
    readStoredProcedures(collectionLink:string, options?:RequestOptions): QueryIterator<ProcedureMeta>;

    /**
     * Reads a trigger object.
     * @param triggerLink       - The self-link of the trigger.
     * @param options           - The request options.
     * @param callback          - The callback for the request.
     */
    readTrigger(triggerLink:string, options:RequestOptions, callback:RequestCallback<TriggerMeta>): void;
    readTrigger(triggerLink:string, callback:RequestCallback<TriggerMeta>): void;

    /**
     * Get all triggers in this collection.
     * @param collectionLink    - The self-link of the collection.
     * @param options           - The feed options.
     */
    readTriggers(collectionLink:string, options?:FeedOptions): QueryIterator<TriggerMeta>;

    /**
     * Reads a user.
     * @param userLink  - The self-link of the user.
     * @param options   - The request options.
     * @param callback  - The callback for the request.
     */
    readUser(userLink:string, options:RequestOptions, callback:RequestCallback<AbstractMeta>): void;
    readUser(userLink:string, callback:RequestCallback<AbstractMeta>): void;

    /**
     * Reads a udf object.
     * @param udfLink   - The self-link of the user defined function.
     * @param options   - The request options.
     * @param callback  - The callback for the request.
     */
    readUserDefinedFunction(udfLink:string, options:RequestOptions, callback:RequestCallback<UserDefinedFunctionMeta>): void;
    readUserDefinedFunction(udfLink:string, callback:RequestCallback<UserDefinedFunctionMeta>): void;

    /**
     * Get all UserDefinedFunctions in this collection.
     * @param collectionLink    - The self-link of the collection.
     * @param options           - The feed options.
     */
    readUserDefinedFunctions(collectionLink:string, options?:FeedOptions): QueryIterator<UserDefinedFunctionMeta>;

    /**
     * Get all users in this database.
     * @param databaseLink      - The self-link of the database.
     * @param feedOptions       - The feed options.
     */
    readUsers(databaseLink:string, feedOptions?:FeedOptions): QueryIterator<AbstractMeta[]>;

    /**
     * Update media for the attachment
     * @param mediaLink         - The media link of the media in the attachment.
     * @param readableStream    - The stream that represents the media itself that needs to be uploaded.
     * @param options           - options for the media
     * @param callback          - The callback for the request.
     */
    updateMedia(mediaLink:string, readableStream:NodeJS.ReadableStream, options:MediaOptions, callback:RequestCallback<any>): void;
    updateMedia(mediaLink:string, readableStream:NodeJS.ReadableStream, callback:RequestCallback<any>): void;
    
    /**
     * Upsert an attachment for the document object.
     * <p>
     *  Each document may contain zero or more attachments. Attachments can be of any MIME type - text, image, binary data. 
     *  These are stored externally in Azure Blob storage. Attachments are automatically deleted when the parent document is deleted.
     * </p>
     * @param documentLink  - The self-link of the document.
     * @param body          - The metadata the defines the attachment media like media, contentType. It can include any other properties as part of the metedata.
     * @param options       - The request options.
     * @param callback      - The callback for the request.
     */
    upsertAttachment(documentLink:string, body:Attachment, options:RequestOptions, callback:RequestCallback<AttachmentMeta>): void;
    upsertAttachment(documentLink:string, body:Attachment, callback:RequestCallback<AttachmentMeta>): void;

    /**
     * Upsert an attachment for the document object.
     * @param documentLink      - The self-link of the document.
     * @param readableStream    - the stream that represents the media itself that needs to be uploaded.
     * @param options           - The request options.
     * @param callback          - The callback for the request.
     */
    upsertAttachmentAndUploadMedia(documentLink:string, readableStream:NodeJS.ReadableStream, options:MediaOptions, callback:RequestCallback<any>): void;
    upsertAttachmentAndUploadMedia(documentLink:string, readableStream:NodeJS.ReadableStream, callback:RequestCallback<any>): void;

    /**
     * Upsert a document.
     * <p>
     *  There is no set schema for JSON documents. They may contain any number of custom properties as well as an optional list of attachments. 
     *  A Document is an application resource and can be authorized using the master key or resource keys
     * </p>
     * @param documentsFeedOrDatabaseLink   - The collection link or database link if using a partition resolver
     * @param body          - Represents the body of the document. Can contain any number of user defined properties.
     * @param options       - The request options.
     * @param callback      - The callback for the request.
     */
    upsertDocument<T>(documentsFeedOrDatabaseLink:string, body:NewDocument<T>, options:DocumentOptions, callback:RequestCallback<RetrievedDocument<T>>): void;
    upsertDocument<T>(documentsFeedOrDatabaseLink:string, body:NewDocument<T>, callback:RequestCallback<RetrievedDocument<T>>): void;

    /**
     * Upsert a permission.
     * <p>
     *  A permission represents a per-User Permission to access a specific resource e.g. Document or Collection.
     * </p>
     * @param userLink  - The self-link of the user.
     * @param body      - Represents the body of the permission.
     * @param options   - The request options.
     * @param callback  - The callback for the request.
     */
    upsertPermission(userLink:string, body:Permission, options:RequestOptions, callback:RequestCallback<PermissionMeta>): void;
    upsertPermission(userLink:string, body:Permission, callback:RequestCallback<PermissionMeta>): void;

    /**
     * Upsert a StoredProcedure.
     * <p>
     *  DocumentDB allows stored procedures to be executed in the storage tier, directly against a document collection. The script 
     *  gets executed under ACID transactions on the primary storage partition of the specified collection. For additional details, 
     *  refer to the server-side JavaScript API documentation.
     * </p>
     * @param collectionLink    - The self-link of the collection.
     * @param sproc             - Represents the body of the stored procedure.
     * @param options           - The request options.
     * @param callback          - The callback for the request.
     */
    upsertStoredProcedure(collectionLink:string, sproc:Procedure, options:RequestOptions, callback:RequestCallback<ProcedureMeta>): void;
    upsertStoredProcedure(collectionLink:string, sproc:Procedure, callback:RequestCallback<ProcedureMeta>): void;

    /**
     * Upsert a trigger.
     * <p>
     *  DocumentDB supports pre and post triggers defined in JavaScript to be executed on creates, updates and deletes. 
     *  For additional details, refer to the server-side JavaScript API documentation.
     * </p>
     * @param collectionLink    - The self-link of the collection.
     * @param trigger           - Represents the body of the trigger.
     * @param options           - The request options.
     * @param callback          - The callback for the request.
     */
    upsertTrigger(collectionLink:string, trigger:Trigger, options:RequestOptions, callback:RequestCallback<TriggerMeta>): void;
    upsertTrigger(collectionLink:string, trigger:Trigger, callback:RequestCallback<TriggerMeta>): void;

    /**
     * Upsert a database user.
     * @param databaseLink  - The self-link of the database.
     * @param body          - Represents the body of the user.
     * @param options       - The request options.
     * @param callback      - The callback for the request.
     */
    upsertUser(databaseLink:string, body:UniqueId, options:RequestOptions, callback:RequestCallback<AbstractMeta>): void;
    upsertUser(databaseLink:string, body:UniqueId, callback:RequestCallback<AbstractMeta>): void;

    /**
     * Upsert a UserDefinedFunction.
     * <p>
     *  DocumentDB supports JavaScript UDFs which can be used inside queries, stored procedures and triggers. 
     *  For additional details, refer to the server-side JavaScript API documentation.
     * </p>
     * @param collectionLink    - The self-link of the collection.
     * @param udf               - Represents the body of the userDefinedFunction.
     * @param options           - The request options.
     * @param callback          - The callback for the request.
     */
    upsertUserDefinedFunction(collectionLink:string, udf:UserDefinedFunction, options:RequestOptions, callback:RequestCallback<UserDefinedFunctionMeta>): void;
    upsertUserDefinedFunction(collectionLink:string, udf:UserDefinedFunction, callback:RequestCallback<UserDefinedFunctionMeta>): void;

    /**
     * Gets the Database account information.
     * @param options       - The request options
     * @param callback      - The callback for the request
     */
    getDatabaseAccount(options:DatabaseAccountRequestOptions, callback:RequestCallback<DatabaseAccount>):void;
    getDatabaseAccount(callback:RequestCallback<DatabaseAccount>):void;

    /**
     * Gets the curent read endpoint for a geo-replicated database account.
     * @param callback      - The callback for the request
     */
    getReadEndpoint(callback:RequestCallback<string>):void;

    /**
     * Gets the curent write endpoint for a geo-replicated database account.
     * @param callback      - The callback for the request
     */
    getWriteEndpoint(callback:RequestCallback<string>):void;
}

export type MediaReadMode = 'Buffered' | 'Streamed';
export type ConsistencyLevel = 'Strong' | 'BoundedStaleness' | 'Session' | 'Eventual';
export type IndexingMode = 'Consistent' | 'Lazy';
export type IndexKind = 'Hash' | 'Range' | 'Spatial';
export type PermissionMode = 'None' | 'Read' | 'All';
export type TriggerType = 'Pre' | 'Post' | 'pre' | 'post';
export type TriggerOperation = 'All' | 'Create' | 'Update' | 'Delete' | 'Replace' | 'all' | 'create' | 'update' | 'delete' | 'replace';
export type UserDefinedFunctionType = 'Javascript';