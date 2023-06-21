exports.handler = async function(context, event, callback) {
    // Create a TwiML Voice Response object to build the response
    const twiml = new Twilio.twiml.VoiceResponse();
    const axios = require('axios');
    const apiUrl = 'http://15.206.28.116:8000';
    const greetingSentences = [
        "Hi there, I am Riya, your personal virtual mental health companion. How are you feeling today?",
        "Hello, I'm Riya, your dedicated virtual mental health companion. How are you doing today?",
        "Greetings! I'm Riya, your reliable virtual mental health companion. How are you feeling today?",
        "Hey there! I'm Riya, your trusted virtual mental health companion. How are you doing?",
        "Good day! I'm Riya, your compassionate virtual mental health companion. How are you feeling today?",
        "Hi! I'm Riya, your supportive virtual mental health companion. How are you doing today?",
        "Hello there, I'm Riya, your understanding virtual mental health companion. How are you feeling?",
        "Greetings! I'm Riya, your empathetic virtual mental health companion. How are you doing?",
        "Hey! I'm Riya, your friendly virtual mental health companion. How are you feeling today?",
        "Good day! I'm Riya, your caring virtual mental health companion. How are you doing?",
        "Hi there, I am Riya, your personal virtual mental health companion. How are you feeling today?",
        "Hello, I'm Riya, your dedicated virtual mental health companion. How are you doing today?",
        "Greetings! I'm Riya, your reliable virtual mental health companion. How are you feeling today?",
        "Hey there! I'm Riya, your trusted virtual mental health companion. How are you doing?",
        "Good day! I'm Riya, your compassionate virtual mental health companion. How are you feeling today?",
        "Hi! I'm Riya, your supportive virtual mental health companion. How are you doing today?",
        "Hello there, I'm Riya, your understanding virtual mental health companion. How are you feeling?",
        "Greetings! I'm Riya, your empathetic virtual mental health companion. How are you doing?",
        "Hey! I'm Riya, your friendly virtual mental health companion. How are you feeling today?",
        "Good day! I'm Riya, your caring virtual mental health companion. How are you doing?"
    ];

    // If no previous conversation is present, or if the conversation is empty, start the conversation
    if (!event.request.cookies.convo) {
        // Greet the user with a message using AWS Polly Neural voice
        twiml.say({
                voice: 'Polly.Raveena',
            },
            greetingSentences[Math.floor(Math.random() * greetingSentences.length)]
        );
    }
        // Send a POST request
    await axios(apiUrl + '/log/tashi-completed-first-time-now-listening-to-user');

    // Listen to the user's speech and pass the input to the /respond Function
    twiml.gather({
        speechTimeout: 'auto', // Automatically determine the end of user speech
        speechModel: 'experimental_conversations', // Use the conversation-based speech recognition model
        input: 'speech', // Specify speech as the input type
        action: '/respond', // Send the collected input to /respond 
    });
    
    // Create a Twilio Response object
    const response = new Twilio.Response();

    // Set the response content type to XML (TwiML)
    response.appendHeader('Content-Type', 'application/xml');

    // Set the response body to the generated TwiML
    response.setBody(twiml.toString());

    // If no conversation cookie is present, set an empty conversation cookie
    if (!event.request.cookies.convo) {
        response.setCookie('convo', '', ['Path=/']); 
    }

    // Return the response to Twilio
    return callback(null, response);
};
