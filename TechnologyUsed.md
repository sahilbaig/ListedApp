# Automated Mail Reply system

###### Technologies used: 

1. **Node.js**: The example code is written in Node.js, a JavaScript runtime environment that allows executing JavaScript code outside of a web browser.
2. **googleapis**: This is a library provided by Google that allows interaction with various Google APIs, including the Gmail API. It provides methods and classes to authenticate, make requests, and handle responses from the API.
3. **OAuth2**: The `OAuth2` class from the `google-auth` library is used for handling the OAuth2 authentication flow. It helps to obtain and manage access tokens required to authorize requests to the Gmail API.
4. **Gmail API**: The Gmail API is a RESTful API provided by Google that allows developers to access and manipulate Gmail mailbox data programmatically. It provides methods to send, receive, search, and modify emails, threads, and labels.
5. **Base64 Encoding**: The `Buffer.from` method in Node.js is used to convert the raw email content to a Base64 encoded string. This is necessary for constructing the `raw` property of the email message, which requires the content to be encoded in Base64.
6. **Promises and Async/Await**: The example code utilizes Promises and the `async/await` syntax to handle asynchronous operations. Promises are used to handle API requests, and `async/await` is used to write asynchronous code in a more synchronous and readable manner.
