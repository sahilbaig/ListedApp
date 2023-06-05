
const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly' , 'https://mail.google.com/']; //Scopes for OAuth

const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file compatible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}



/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth 
 */

async function getThreadMessages(id , auth) {
    const gmail = google.gmail({version: 'v1', auth});
    const res = await gmail.users.threads.get({
        userId: 'me',
        id 
      });

    return (res.data.messages)
    
}


async function checkLabelExists(labelName , auth){
    const gmail = google.gmail({ version: 'v1', auth});
    
    const response  = await gmail.users.labels.list({
        userId : 'me',
    })

    const labels = response.data.labels;
    const existingLabel = labels.find(label => label.name === labelName);
    if(existingLabel){
        return existingLabel.id
    }
    return false


}

async function addLabel(id , auth){
    const gmail = google.gmail({ version: 'v1', auth});
      

    let lableId = await checkLabelExists("Listed-Test-Label" , auth)

    if(!lableId){
        const createLabel = await gmail.users.labels.create({
            userId: 'me',
            requestBody: {
              name: "Listed-Test-Label",
            },
          });

        lableId = createLabel.data.id
        }

    const response = await gmail.users.threads.modify({
        userId: 'me',
        id,
        requestBody: {
            addLabelIds: [lableId],
        },
    });

    return response
  
}
function createRawMessage(emailMessage) {
    const to = emailMessage.to;
    const subject = emailMessage.subject;
    const body = emailMessage.body;
  
    const rawEmail = `To: ${to}\r\n` +
      `Subject: ${subject}\r\n` +
      '\r\n' +
      `${body}`;
  
    // Convert the raw email message to Base64 encoded string
    const encodedEmail = Buffer.from(rawEmail)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  
    return encodedEmail;
  }
  
  

async function sendMessage(auth , threadId , to) {
    const gmail = google.gmail({version: 'v1', auth});

        const emailMessage = {
        to: `${to}`,
        subject: 'new message',
        body: 'This is the email body.',
        };

        const rawMessage = createRawMessage(emailMessage);

        const res = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
              raw: rawMessage,
              threadId
            },
          });

          return res; 
      
}
async function replied (messages) {

    let flag = false
    messages.forEach((message) => {
        if(message.labelIds.includes('SENT')){
            flag=true
        }
        
    })

    return flag
}

async function getSenderEmail(message){
    const senderEmail = message.payload.headers.find(header => header.name === 'From').value;
    return senderEmail
}
async function run(auth) {
  const gmail = google.gmail({version: 'v1', auth});
  const res = await gmail.users.threads.list({
    userId: 'me',
    maxResults:5 //maxResult = 5 for optimizing run time, can be removed in production
  });



  const threads = res.data.threads
  threads.forEach(async (thread)=>{
        const messages  =  await getThreadMessages(thread.id , auth)
        const hasReplied = await replied (messages)

        
        if(!hasReplied){ 
            const senderEmail = await getSenderEmail(messages[0])
            await sendMessage(auth , thread.id , senderEmail )
            await addLabel(thread.id, auth)
            
        }
        
  } )
}

const interval = Math.floor((Math.random() * 120000) + 60000);
const test = true


if(test){
  authorize().then(run).catch(console.error)
}
else{
  setInterval(function(){
    authorize().then(run).catch(console.error)
  }, interval)  
}



// 1. Implement login with google. 
// 2. Isolate emails with no prior reply 
// 3. Reply to that email 
// 4. Tag the email  
// 5. Create tag if not created 
// 6 .Repeat the sequence in random intervals of 60-120 seconds. 
