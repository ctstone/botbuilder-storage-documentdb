# Installation
```
npm install --save botbuilder-storage-documentdb
```

## Peer dependencies
```
npm install --save documentdb
```

And one or both of
```
npm install --save botbuilder
```

```
npm install --save botbuilder-calling
```

# Usage

## Settings
```JavaScript
const SETTINGS ={
  /** Database name to use for bot session storage (created if it does not exist) */
  databaseName: "myDb",
  /** Collection name to use for bot session storage (created if it does not exist) */
  collectionName: "myCollection",
  /** OPTIONAL Collection throughput for created collections (default: 10000) */
  collectionThroughput: 10000,
  /** OPTIONAL Default document time-to-live for created collections (default 1 week; null to disable) */
  defaultTtl: 604800,
  /** OPTIONAL Write all keys in a session concurrently (default true) */
  parallel: true,
}
```

## TypeScript
```TypeScript
import { DocumentDbBotStorage } from 'botbuilder-storage-documentdb';
import { DocumentClient } from 'documentdb';
import { UniversalBot } from 'botbuilder';
import { UniversalCallBot } from 'botbuilder-calling';

const documents = new DocumentClient(/* params */);
const storage = new DocumentDbBotStorage(documents, SETTINGS);

// use with call bot
const bot = new UniversalCallBot(connector, { storage });
// or bot.set('storage', storage);

// use with chat bot
const bot = new UniversalBot(connector, { storage });
// or bot.set('storage', storage);
```