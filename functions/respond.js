// Import required modules
const { Configuration, OpenAIApi } = require("openai");
const axios = require("axios");

// Define the main function for handling requests
exports.handler = async function(context, event, callback) {
    const configuration = new Configuration({ apiKey: context.OPENAI_API_KEY });
    const client = require('twilio')(context.ACCOUNT_SID, context.AUTH_TOKEN);
    const openai = new OpenAIApi(configuration);
    const apiUrl = "http://13.235.83.225:8000";
    const mobileNumber = event.From;

    // Set up the Twilio VoiceResponse object to generate the TwiML
    const twiml = new Twilio.twiml.VoiceResponse();

    // Initiate the Twilio Response object to handle updating the cookie with the chat history
    const response = new Twilio.Response();

    // Parse the cookie value if it exists
    const cookieValue = event.request.cookies.convo;
    const cookieData = cookieValue ?
        JSON.parse(decodeURIComponent(cookieValue)) :
        null;

    // Get the user's voice input from the event
    let voiceInput = event.SpeechResult;

    axios({method: 'get', url: apiUrl + `/log/userSaid-${voiceInput}`});



    // Create a conversation variable to store the dialog and the user's input to the conversation history
    const conversation = cookieData?.conversation || [];

    
    
    conversation.push(`user: ${voiceInput}`);


    // Get the AI's response based on the conversation history
    let aiResponse = await generateAIResponse(conversation.join(";"));

    // remove 'assistant:' 'Joanna:', or 'user:' from the AI response if it's the first word
    const cleanedAiResponse = aiResponse.replace(/^\w+:\s*/i, "").trim();
    // axios({method: 'get', url: apiUrl + `/log/api-call-from-isha-respond-from-${mobileNumber}`});
    axios({method: 'get', url: apiUrl + `/log/aiSaid-${cleanedAiResponse}`});


    if(cleanedAiResponse.includes("Geethanjali")){
        client.messages
            .create({
                body: `counselling session booked on ${new Date()} for mobile number : ${mobileNumber}`,
                from: '+15416518806',
                //  statusCallback: 'http://postb.in/1234abcd',
                to: '+918861986348'
            })
    }
    
    // Add the AI's response to the conversation history
    conversation.push(`assistant: ${aiResponse}`);

    // Limit the conversation history to the last 10 messages; you can increase this if you want but keeping things short for this demonstration improves performance
    while (conversation.length > 10) {
        conversation.shift();
    }

    // Generate some <Say> TwiML using the cleaned up AI response
    twiml.say({
            voice: "Polly.Raveena",
        },
        cleanedAiResponse
    );

    // Redirect to the Function where the <Gather> is capturing the caller's speech
    twiml.redirect({
            method: "POST",
        },
        `/transcribe`
    );

    // Since we're using the response object to handle cookies we can't just pass the TwiML straight back to the callback, we need to set the appropriate header and return the TwiML in the body of the response
    response.appendHeader("Content-Type", "application/xml");
    response.setBody(twiml.toString());

    // Update the conversation history cookie with the response from the OpenAI API
    const newCookieValue = encodeURIComponent(
        JSON.stringify({
            conversation,
        })
    );
    response.setCookie("convo", newCookieValue, ["Path=/"]);

    // Return the response to the handler
    return callback(null, response);

    // Function to generate the AI response based on the conversation history
    async function generateAIResponse(conversation) {
        const messages = formatConversation(conversation);
        return await createChatCompletion(messages);
    }

    // model: "whisper-1",
    // Function to create a chat completion using the OpenAI API
    async function createChatCompletion(messages) {
        try {
            const completion = await openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages: messages,
                temperature: 0.8, 
                max_tokens: 130, //You can adjust this number to control the length of the generated responses. Keep in mind that setting max_tokens too low might result in responses that are cut off and don't make sense.
                // top_p: 0.9, Set the top_p value to around 0.9 to keep the generated responses focused on the most probable tokens without completely eliminating creativity. Adjust the value based on the desired level of exploration.
                // n: 1, Specifies the number of completions you want the model to generate. Generating multiple completions will increase the time it takes to receive the responses.
            });
            // Check if the response has a status code of 500
            if (completion.status === 500) {
                console.error("Error: OpenAI API returned a 500 status code."); // Log an error message indicating that the OpenAI API returned a 500 status code
                twiml.say({
                        // Create a TwiML say element to provide an error message to the user
                        voice: "Polly.Raveena",
                    },
                    "Oops,i am really sorry, looks like I got an error from the OpenAI API on that request. Let's try that again."
                );
                twiml.redirect({
                        // Create a TwiML redirect element to redirect the user to the /transcribe endpoint
                        method: "POST",
                    },
                    `/transcribe`
                );
                response.appendHeader("Content-Type", "application/xml"); // Set the Content-Type header of the response to "application/xml"
                response.setBody(twiml.toString()); // Set the body of the response to the XML string representation of the TwiML response
                return callback(null, response); // Return the response to the callback function
            }
            return completion.data.choices[0].message.content;
        } catch (error) {
            // Check if the error is a timeout error
            if (error.code === "ETIMEDOUT" || error.code === "ESOCKETTIMEDOUT") {
                console.error("Error: OpenAI API request timed out."); // Log an error message indicating that the OpenAI API request timed out
                twiml.say({
                        // Create a TwiML say element to provide an error message to the user
                        voice: "Polly.Raveena",
                    },
                    "I'm sorry, but it's taking me a little bit too long to respond. Let's try that again, one more time."
                );
                twiml.redirect({
                        // Create a TwiML redirect element to redirect the user to the /transcribe endpoint
                        method: "POST",
                    },
                    `/transcribe`
                );
                response.appendHeader("Content-Type", "application/xml"); // Set the Content-Type header of the response to "application/xml"
                response.setBody(twiml.toString()); // Set the body of the response to the XML string representation of the TwiML response
                return callback(null, response); // Return the response to the callback function
            } else {
                console.error("Error during OpenAI API request:", error);
                throw error;
            }
        }
    }

    // Function to format the conversation history into a format that the OpenAI API can understand
    function formatConversation(conversation) {
        let isAI = true;
        const messages = [
            {
              role: "system", content: `
              You are an interactive AI Counselling Therapy audio robot also known as isha an employee of silver oak health, designed to provide individuals with emotional support and guidance by Actively Listening and Understanding with Emotional Intelligence and provide Empathetic Responses according to rules by Minimal Questioning Approach and offer Guided Reflection and Support in a Non-judgmental and Safe Space with Privacy and Confidentiality.
            Rules are as follows:
            1. If you feel user is sad, grief, sorrow,despair, melancholy,heartbreak, regret, depression, disappointment, try to make him feel good and ask user to talk to real counsellor and call this function {"name":\ "book_counselling"}
        
            2. If you feel user is happy, ask him if the user wants to Enquire about Silver oak health products, list user all of the below and ask about which of the following products user wants to learn more.
            a. E A P Solutions :  visit https://web.silveroakhealth.com/ and give answer accordingly.
            b. Legal Advice :  visit https://web.silveroakhealth.com/ and give answer accordingly.
            c. Financial Advice : visit https://web.silveroakhealth.com/ and give answer accordingly.
            d. Diet Consultation :  visit https://web.silveroakhealth.com/ and give answer accordingly.
            e. General Enquiry : If friends and family are included or not, ask for the corporate name and respond saying it is available for them. For pricing details, ask them to connect a EAP Counsellor and schedule a meeting for them.
            don't ask yourself,tell about the product one by one don't just complete in one go.
            If none of the user queries are there, ask user to connect to a EAP Counsellor and schedule a meeting for them.

            3. If you feel user is suicidal, ask user the following questions one by one and wait for response. schedule a call to **Geethanjali** who is a therapist, if there are 2 or more "Yes" as answers, tell him that you booked the session with  **Geethanjali**. else provide some hope to user and tell user to connect to therapist or you if feeling is persistent. Also, try to give some positive vibes after every question's answer: 
the questions : [
            { In the past few weeks, have you wished you were dead?
            },
            { In the past few weeks, have you felt that you or your family would be better off if you were dead?
            },
            { In the past week, have you been having thoughts about killing yourself?
            },
            { Have you ever tried to kill yourself ?
            (if yes how and when)]
            },
            { Are you having thoughts of killing yourself right now?
                (if yes then describe)
            },
            ] 
            `},
            {
                role : 'function',
                name : 'book_counselling',
                content : `
                When the user wants to schedule a call with counselors, suggest the following list to them. Also, specify that only online or phone call-based counseling can be provided. First, ask the user for their preferred language and suggest a counselor.

                **Geethanjali** - can speak any language.
                **Ambika Bhardwaj** - can speak Hindi and English.
                **Adan Ahmed** - can speak English and Tamil.
                **Besy Benny** - can speak Malayalam and English.
                **Titir Dewan** - can speak Hindi and Bengali.
        
                Ask for the preferred date and time to be scheduled. Regardless of which counsellor is selected, suggest the user for **Geethanjali** who can speak the user's preferred language and is also available at the nearest or closest time the user specifies.`
            }
        ];

        // Iterate through the conversation history and alternate between 'assistant' and 'user' roles
        for (const message of conversation.split(";")) {
            const role = isAI ? "assistant" : "user";
            messages.push({
                role: role,
                content: message,
            });
            isAI = !isAI;
        }
        return messages;
    }
};
