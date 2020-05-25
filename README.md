# graphql-messages
graphql-messages is a minimal twitter-like API, developed using graphQL. Data is stored using lowdb. Functionality includes the following:
- Creating Users with email/phone number and password combination
- Logging in as an existing User with the appropriate credentials
- Posting a Message that is linked to a User account
- Retrieving all Messages posted by a User
- Editing posted Messages
- Deleting posted Messages
- Following other Users
- Unfollowing other Users

## Installation
Use npm to install dependencies.
```bash
npm i
```

## Usage
Run the following command in the ```src``` subdirectory
```bash
node index.js
```

## Tradeoffs
The most notable tradeoff consideration to make is the one regarding authentication. The API handles authentication by controlling individual access to Queries and Mutations. This is beneficial because we can have a very granular control of access to any given endpoint. However, the drawback to this approach is that we must have extra code that is a bit tedious in each endpoint that would not be required if we adopted an all-or-nothing approach. Another drawback of the current implementation is that there is no form of authorization. This results in a simpler authentication check where the Bearer token is used to determine the logged in user. While this simplifies some logic, it introduces the limitation of not being able to perform operations for users other than the currently logged in one. As I had never implemented my own authentication, I opted to not to use any out of the box solutions in order to give it a best attempt. In the future, it would be better to adopt a more robust and tried solution to authentication.

Another consideration was the structure of the data. I opted not to have Message information included as a part of the User entity. While Message information is harder to aggregate (e.g. Message Count for a user), operations such as delete become much simpler to handle since the information is in only one place. Taking the real world example of Twitter, where users typically have more tweets (thousands) than followers (hundreds), I felt it would be much cleaner to exclude Messages from the User objects. This would be a much better approach if we are using a RDBMS such as MySQL or PostgreSQL.  

Moreover, the provided file structure makes it easy to add functionality to the server or break it down into sub-folders to maintain organization.

## Examples
HTTP Headers should be as follows:
```json
{
  "Authorization": "Bearer <TOKEN>"
}
```

Requests should be made to the following endpoint:
```json
http://localhost:4000/
```
Testing was performed in the graphQL playground
## Mutations

### Creating a User
```graphql
mutation {
  createUser(email: "example@gmail.com", password: "pass") {
    token
    user {
      id
      email
      phone
      messages {
        id
        message
      }
      following {
        id
        email
      }
    }
  }
}
```

### Logging in with credentials 
```graphql
mutation TestLogin {
  login(phone:"xxx-xxx-xxxx", password:"pass") {
    user {
      email
      phone
      id
    }
    token
  }
}
```

### Follow a User
```graphql
mutation TestFollow {
  followUser(id: "Fl7a_FV4a") {
    following {
      id
      email
      phone
    }
  }
}
```

### Un-Follow a User
```graphql
mutation TestUnfollow {
  unfollowUser(id: "Fl7a_FV4a") {
    following {
      id
      email
      phone
    }
  }
}
```

### Create a Message
```graphql
mutation TestPost {
  postMessage(message: "some message") {
    id
    message
  }
}
```

### Edit a Message
```graphql
mutation TestEditPost {
  editMessage(id: "8lfHLEOTU", newMessage:"some new message") {
    id
    message
  }
}
```

### Delete a Message
```graphql
mutation TestDeletePost {
  deleteMessage(id:"E6BZK5gnM") {
    id
    message
  }
}
```

## Queries

### Fetch a User
```graphql
query TestUser {
  user(id:"l-ZeKiMtV") {
    id
    email
    phone
    messages {
      id
      message
    }
    following {
      id
      email
      phone
    }
  }
}
```

### Fetch all Users
```graphql
query TestUsers {
  users {
    id
    email
    phone
    following {
      id
      email
      phone
    }
  }
}
```

### Fetch a Message
```graphql
query TestMessage {
  message(id: "D6SJlvHaC") {
    id
    message
    user {
      id
      email
      phone
    }
  }
}
```

### Fetch all Messages
```graphql
query TestMessages {
  messages {
    id 
    message
    user {
      id
      email
      phone
    }
  }
}
```

## Built With (dependencies)

* [Apollo Server](https://www.npmjs.com/package/apollo-server) 
* [bcryptjs](https://www.npmjs.com/package/bcryptjs)
* [email-validator](https://www.npmjs.com/package/email-validator)
* [graphql](https://www.npmjs.com/package/graphql)
* [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken)
* [lodash](https://www.npmjs.com/package/lodash)
* [lowdb](https://www.npmjs.com/package/lowdb)
* [phone](https://www.npmjs.com/package/phone)
* [shortid](https://www.npmjs.com/package/shortid)