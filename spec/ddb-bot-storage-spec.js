describe('DocumentDB bot storage', () => {
  let DocumentDbBotStorage;
  let MockDocumentClient;
  let botStorage;
  let client;
  let storageContext;
  let storageData;
  let storageConf = { databaseName: 'foo', collectionName: 'bar' };
  let storageConfPartitioned = { databaseName: 'foo', collectionName: 'bar', collectionThroughput:20000 };
  beforeAll(() => {
    DocumentDbBotStorage = require('../dist').DocumentDbBotStorage;
    MockDocumentClient = require('../dist/mock-document-client').MockDocumentClient;
  });

  beforeEach(() => {
    client = new MockDocumentClient();
    botStorage = new DocumentDbBotStorage(client, storageConf);
    storageContext = {userId:'1', conversationId:'1', persistUserData:true, persistConversationData:true};
    storageData = {userData:{foo:{bar:123}}, privateConversationData:{asdf:456}, conversationData:{blah:[1,2,3]}};
  });

  it('should disable automatic id generation', (done) => {
    botStorage.saveData(storageContext, storageData, (err) => {
      if (err) throw err;
      expect(client.args[0].disableAutomaticIdGeneration).toBe(true);
      done()
    });
  });

  describe('when database exists', () => {
    beforeEach(() => {
      client = new MockDocumentClient(true);
      botStorage = new DocumentDbBotStorage(client, storageConf);
    });

    it('should not throw', (done) => {
      botStorage.saveData(storageContext, storageData, (err) => {
        expect(client.database).toBeUndefined();
        expect(err).toBe(null);
        done();
      });
    });
  });

  describe('when collection exists', () => {
    beforeEach(() => {
      client = new MockDocumentClient(false, true);
      botStorage = new DocumentDbBotStorage(client, storageConf);
    });

    it('should not throw', (done) => {
      botStorage.saveData(storageContext, storageData, (err) => {
        expect(client.collection).toBeUndefined();
        expect(err).toBe(null);
        done();
      });
    });
  });

  describe('without partitioning', () => {
    beforeEach(() => {
      botStorage = new DocumentDbBotStorage(client, storageConf);
    });
    it('should not write partitionKey', (done) => {
      botStorage.saveData(storageContext, storageData, (err) => {
        if (err) throw err;
        expect(client.args[0].partitionKey).toBe(null);
        done();
      });
    });
  });

  describe('with partitioning', () => {
    beforeEach(() => {
      botStorage = new DocumentDbBotStorage(client, storageConfPartitioned);
    });
    it('should write partitionKey', (done) => {
      botStorage.saveData(storageContext, storageData, (err) => {
        if (err) throw err;
        expect(client.args[0].partitionKey).toBe('user:1');
        done();
      });
    });
  });

  describe('with all data types enabled', () => {
    it('should write userData', (done) => {
      botStorage.saveData(storageContext, storageData, (err) => {
        if (err) throw err;
        expect(client.store['dbs/foo/colls/bar/docs/user:1']).toEqual({ id:'user:1', data:storageData.userData });
        done();
      });
    });
    it('should write conversationData', (done) => {
      botStorage.saveData(storageContext, storageData, (err) => {
        if (err) throw err;
        expect(client.store['dbs/foo/colls/bar/docs/conversation:1']).toEqual({ id:'conversation:1', data:storageData.conversationData });
        done();
      });
    });
    it('should write privateConversationData', (done) => {
      botStorage.saveData(storageContext, storageData, (err) => {
        if (err) throw err;
        expect(client.store['dbs/foo/colls/bar/docs/conversation:1;user:1']).toEqual({ id:'conversation:1;user:1', data:storageData.privateConversationData });
        done();
      });
    });
  });

  describe('with userData disabled', () => {
    beforeEach(() => {
      storageContext = {userId:'1', conversationId:'1', persistUserData:false, persistConversationData:true};
    });
    it('should omit userData', (done) => {
      botStorage.saveData(storageContext, storageData, (err) => {
        if (err) throw err;
        expect(client.store['dbs/foo/colls/bar/docs/user:1']).toBeUndefined();
        done();
      });
    });
  });

  describe('with missing userId', () => {
    beforeEach(() => {
      storageContext = {conversationId:'1', persistUserData:false, persistConversationData:true};
    });
    it('should omit userData', (done) => {
      botStorage.saveData(storageContext, storageData, (err) => {
        if (err) throw err;
        expect(client.store['dbs/foo/colls/bar/docs/user:1']).toBeUndefined();
        done();
      });
    });
    it('should omit privateConversationData', (done) => {
      botStorage.saveData(storageContext, storageData, (err) => {
        if (err) throw err;
        expect(client.store['dbs/foo/colls/bar/docs/conversation:1;user:1']).toBeUndefined();
        done();
      });
    });
  });

  describe('with conversationData disabled', () => {
    beforeEach(() => {
      storageContext = {userId:'1', conversationId:'1', persistUserData:true, persistConversationData:false};
    });
    it('should omit userData', (done) => {
      botStorage.saveData(storageContext, storageData, (err) => {
        if (err) throw err;
        expect(client.store['dbs/foo/colls/bar/docs/user:1']).toEqual({ id:'user:1', data:storageData.userData });
        done();
      });
    });
  });

  describe('with missing conversationId', () => {
    beforeEach(() => {
      storageContext = {userId:'1', persistUserData:true, persistConversationData:false};
    });
    it('should omit conversationData', (done) => {
      botStorage.saveData(storageContext, storageData, (err) => {
        if (err) throw err;
        expect(client.store['dbs/foo/colls/bar/docs/conversation:1']).toBeUndefined();
        done();
      });
    });
    it('should omit privateConversationData', (done) => {
      botStorage.saveData(storageContext, storageData, (err) => {
        if (err) throw err;
        expect(client.store['dbs/foo/colls/bar/docs/conversation:1;user:1']).toBeUndefined();
        done();
      });
    });
  });
});