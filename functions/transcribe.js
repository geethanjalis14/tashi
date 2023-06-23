const axios = require("axios");

exports.handler = function(context, event, callback) {
    // Create a TwiML Voice Response object to build the response
    const twiml = new Twilio.twiml.VoiceResponse();
    const apiUrl = "http://13.235.83.225:8000";
    const mobileNumber = event.From;

    const greetingSentences = [
        "Hi there, I am isha, your personal virtual mental health companion. How are you feeling today?",
        "Hello, I'm isha, your dedicated virtual mental health companion. How are you doing today?",
        "Greetings! I'm isha, your reliable virtual mental health companion. How are you feeling today?",
        "Hey there! I'm isha, your trusted virtual mental health companion. How are you doing?",
        "Good day! I'm isha, your compassionate virtual mental health companion. How are you feeling today?",
        "Hi! I'm isha, your supportive virtual mental health companion. How are you doing today?",
        "Hello there, I'm isha, your understanding virtual mental health companion. How are you feeling?",
        "Greetings! I'm isha, your empathetic virtual mental health companion. How are you doing?",
        "Hey! I'm isha, your friendly virtual mental health companion. How are you feeling today?",
        "Good day! I'm isha, your caring virtual mental health companion. How are you doing?",
        "Hi there, I am isha, your personal virtual mental health companion. How are you feeling today?",
        "Hello, I'm isha, your dedicated virtual mental health companion. How are you doing today?",
        "Greetings! I'm isha, your reliable virtual mental health companion. How are you feeling today?",
        "Hey there! I'm isha, your trusted virtual mental health companion. How are you doing?",
        "Good day! I'm isha, your compassionate virtual mental health companion. How are you feeling today?",
        "Hi! I'm isha, your supportive virtual mental health companion. How are you doing today?",
        "Hello there, I'm isha, your understanding virtual mental health companion. How are you feeling?",
        "Greetings! I'm isha, your empathetic virtual mental health companion. How are you doing?",
        "Hey! I'm isha, your friendly virtual mental health companion. How are you feeling today?",
        "Good day! I'm isha, your caring virtual mental health companion. How are you doing?"
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

    // axios({method: 'get', url: apiUrl + `/log/api-call-from-isha-transcribe-from-${mobileNumber}`});

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
