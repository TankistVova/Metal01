const webpush = require('web-push');

const keys = webpush.generateVAPIDKeys();

console.log('REACT_APP_VAPID_PUBLIC_KEY=' + keys.publicKey);
console.log('VAPID_PUBLIC_KEY=' + keys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + keys.privateKey);
