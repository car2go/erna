## Storage Adapter

1. [Enable Available Storage Adapters](#enable-available-storage-adapters)
    1. [InMemoryStorage](#inmemorystorage)
    1. [MongoStorage](#MongoStorage)
1. [Add a Custom Adapter](#add-a-custom-adapter)

--- 

### Enable Available Storage Adapters
Currently are just two adapters available.  
Feel free to create new ones based on the instructions in section ['Add a Custom Adapter'](#add-a-custom-adapter).

In best case choose a database which is also available as a free DBaaS tier: [ripienaar/free-for-dev](https://github.com/ripienaar/free-for-dev#dbaas).

#### InMemoryStorage
The storage is default and initialized when passing no `DB` environment variable. Since it is a in-memory state which is not synced with other instances ensure that the service is deployed exactly once. Even freezing/sleeping of the service might cause a loss of data.

#### MongoStorage
This storage adapts [MongoDB](https://www.mongodb.com) and is initialized when passing a `mongodb://` connection url to `DB` environment variable. There are free DBaaS solutions like [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).

### Add a Custom Adapter
To create a new custom adapter extend the [`adapter`](../lib/storage/adapter.js) and add the custom adapter to [the index](../lib/storage/index.js). You need to implement an interface with the asynchronous methods listed below.

The basic error handling for this functions is implemented in [`composeWrapper`](./lib/storage/composeWrapper.js).

- #### `async init()`
  Run basic initialization tasks like setting up the database connection.

  **Input:**  
  n/a

  **Output:**  
  n/a

- #### `async has(user)`
  Check if a user already has signed up for the next matching.  
  Check all available locations.

  **Input:**  
  `user <string>` – The userId of the slack user

  **Output:**  
  `<boolean>` – Whether the user has signed up already.

- #### `async push(location, user)`
  Add a user to the defined location.  
  Just add the user if the `userId` is not mapped to any location.

  **Input:**  
  `location <string>` – The lowercase name of the location  
  `user <string>` – The userId of the slack user

  **Output:**  
  `<boolean>` – Whether the the user was added to a location 

- #### `async match(cities)`
  Get list of matches of the defined size for all passed locations.  
  Use `this.chunk` and `this.sort` to get chunks of random matches.  
  Use `this.flatten` to flatten the list to get the desired format.

  **Input:**  
  `cities <Array.<string>>` – A list of lowercase names of locations to be used to find matches

  **Output:**  
  `<Array.<Array.<string>>>` – A list of matches where each match is a list of userIds.

- #### `async purge(cities)`
  Delete documents related to the passed location names.  
  Delete the whole object and do not only clear the array of signed up users.

  **Input:**  
  `cities <Array.<string>>` – A list of lowercase names of locations to be deleted.

  **Output:**  
  n/a