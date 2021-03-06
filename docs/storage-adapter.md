## Storage Adapter

- [Storage Adapter](#storage-adapter)
  - [Enable Available Storage Adapters](#enable-available-storage-adapters)
    - [InMemoryStorage](#inmemorystorage)
    - [MongoStorage](#mongostorage)
  - [Add a Custom Adapter](#add-a-custom-adapter)

--- 

### Enable Available Storage Adapters
Currently are just two adapters available.  
Feel free to create new ones based on the instructions in section ['Add a Custom Adapter'](#add-a-custom-adapter).

In best case choose a database which is also available as a free DBaaS tier: [ripienaar/free-for-dev](https://github.com/ripienaar/free-for-dev#dbaas).

#### InMemoryStorage
The storage is default and initialized when passing no `DB` environment variable. Since it is a in-memory state which is not synced with a database ensure that the service is deployed exactly once.

#### MongoStorage
This storage adapts [MongoDB](https://www.mongodb.com) and is initialized when passing a `mongodb://` connection url to `DB` environment variable. There are free DBaaS solutions like [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).

### Add a Custom Adapter
To create a new custom adapter extend the [`adapter`](../lib/storage/adapter.js) and add the custom adapter to [the index](../lib/storage/index.js). You need to implement an interface with the asynchronous methods listed below.

The basic error handling for this functions is implemented in [`composeWrapper`](./lib/storage/composeWrapper.js).

- #### `async init()`
  Run basic initialization tasks like setting up the database connection.  
  Cleanup all scheduled events which were scheduled before the current datetime string.

  **Input:**  
  n/a

  **Output:**  
  n/a

- #### `async has(user)`
  Check if a user already has ever signed up.  

  **Input:**  
  `user <string>` – The userId of the slack user

  **Output:**  
  `<boolean>` – Whether the user with `userId` has ever signed up.

- #### `async in(user)`
  Check if a user already has signed up for the next matching and in which location.  
  Check all available locations.

  **Input:**  
  `user <string>` – The userId of the slack user

  **Output:**  
  `<string|undefined>` – The name of the location or `undefined`.

- #### `async push(location, user)`
  Add a user to the defined location and to a list of signed up users.  
  Just add the user if the `userId` is not mapped to any location.  
  Additionally add the `userId` to another collection of unique users to identify recurring users.  
  Optionally increment the count in this list to get statistics.

  **Input:**  
  `location <string>` – The name of the location  
  `user <string>` – The userId of the slack user

  **Output:**  
  `<boolean>` – Whether the the user was added to a location 

- #### `async pop(user)`
  Remove a user of all the locations if available.  

  **Input:**  
  `user <string>` – The userId of the slack user

  **Output:**  
  n/a

- #### `async match(locations)`
  Get list of matches of the defined size for all passed locations.  
  Use `this.chunk` and `this.sort` to get chunks of random matches.  
  Use `this.flatten` to flatten the list to get the desired format.

  **Input:**  
  `locations <Array.<string>>` – A list of names of locations to be used to find matches

  **Output:**  
  `<Array.<Array.<string>>>` – A list of matches where each match is a list of userIds.

- #### `async purge(locations)`
  Delete documents related to the passed location names.  
  Delete the whole object and do not only clear the array of signed up users.

  **Input:**  
  `locations <Array.<string>>` – A list of names of locations to be deleted.

  **Output:**  
  n/a

- #### `async setSchedule(user, location, datetime)`
  If there is already an event scheduled at the same time & location, return the event.  
  Otherwise add a scheduled event to the defined location.  
  Additionally add all arguments as new document to another collection.

  **Input:**  
  `user <string>` – The userId of the slack user.  
  `location <string>` – The name of the location.  
  `datetime <string>` – The datetime (UTC) as ISO string.

  **Output:**  
  `<object|undefined>` – The existing event with the same data or `undefined`.

- #### `async getSchedule(datetime)`
  Get list of locations with have an event scheduled at the passed datetime.  
  Remove the datetime in the list of events per location if there was a match.

  **Input:**  
  `datetime <string>` – The datetime (UTC) as ISO string.

  **Output:**  
  `<Array.<string>>` – A list of names of matched locations.

- #### `async nextSchedule(location)`
  Find the first scheduled event for the specific location.  
  Return an object the keys `time` and `title` (optional).  
  If there is no event scheduled, return `{}`.

  **Input:**  
  `location <string>` – The name of the location.

  **Output:**  
  `<object>` – The next scheduled event for the passed location


- #### `async listSchedule()`
  Get mapping of all scheduled events per location.  
  Key is the location name and value the list of datetimes.

  **Input:**  
  n/a

  **Output:**  
  `Object` – List of scheduled events.

- #### `async setSkip(user, datetime)`
  If there is already a skip set at the same date, return the event. Otherwise set a skip.  
  Additionally add all arguments as new document to another collection.

  **Input:**  
  `user <string>` – The userId of the slack user.  
  `datetime <string>` – The datetime (UTC) as ISO string.

  **Output:**  
  `<object|undefined>` – The existing event with the same data or `undefined`.

- #### `async listSkips()`
  Get list of all set skips.  

  **Input:**  
  n/a

  **Output:**  
  `Object` – List of set skips in `YYYY-MM-DD HH:mm`.
