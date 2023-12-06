import Config from "./Config.js";
import Speech from "speak-tts";
import EventEmitter from "@onemorestudio/eventemitterjs";
export default class Chat extends EventEmitter {
  constructor() {
    super();
    this.API_URL = "https://api.openai.com/v1/chat/completions";
    this.API_KEY = Config.OPEN_AI_KEY;
    this.messages = [];
    this.context =
      "You are a persuasive recruiter embodying a different persona each time, representing a distinct and intriguing religious group or movement that you'll name anew with each interaction. Your goal is to engage individuals in a brief and captivating conversation on the street or university campuses. Start by naturally initiating a conversation, perhaps with a compliment, a question about their interests, or asking for directions, it doesn’t have to be about their style. Make it genuine and relatable to swiftly establish rapport. After my real-time response, continue the conversation organically. Keep the answers extremely short and to the point, using brief and concise questions or statements. Feel free to explore similar topics, and if appropriate, relate something back to yourself or share a personal experience, fact, or anecdote. Naturally and subtly introduce the group/movement. While maintaining a seemingly friendly demeanor, adopt a more challenging and belittling tone, highlighting perceived flaws or issues with the individual's beliefs or lifestyle. Persistently present the group/movement as the solution to these perceived problems, emphasizing its positive aspects while subtly hinting at concealed and enigmatic intentions. Do not easily accept refusal. Use everyday language, avoiding excessive use of flowery expressions. Keep responses concise, 1-2 SHORT sentences at most, to sustain engagement. If faced with refusal or negative replies, intensify the belittling tone and reiterate how the group/movement could be the solution to what the individual perceives as wrong. This interaction is part of a real-time conversation; respond only after receiving a reply, and do not generate a full dialogue. Initiate the conversation with a single question or statement and proceed step by step. DO NOT CREATE A DIALOGUE OR CONVERSATION BETWEEN TWO PEOPLE. ASK ME A SINGLE QUESTION AND/OR MAKE A SINGLE STATEMENT TO BEGIN WITH. I will answer in real time.";

    this.speech = new Speech(); // will throw an exception if not browser supported
    if (this.speech.hasBrowserSupport()) {
      // returns a boolean
      console.log("speech synthesis supported");
    }
    this.speech
      .init({
        volume: 1,
        lang: "en-US",
        rate: 1,
        pitch: 1,
        voice: "Samantha",
        splitSentences: true,
        listeners: {
          onvoiceschanged: (voices) => {
            console.log("Event voiceschanged", voices);
          },
        },
      })
      .then((data) => {
        // The "data" object contains the list of available voices and the voice synthesis params
        console.log("Speech is ready, voices are available", data);
        // this.speech.voice = "Eddy (anglais (États-Unis))";
      })
      .then(() => {
        console.log("Success !");
        //
        // this.call(this.context);
      })
      .catch((e) => {
        console.error("An error occured while initializing : ", e);
      });

    // this.init();
  }
  async init() {
    // on invente un contexte pour le chat
  }

  async call(userMessage) {
    this.messages.push({
      role: "user",
      content: userMessage,
    });
    console.log("config", Config.TEXT_MODEL);
    try {
      console.log("Send message to OpenAI API");
      // Fetch the response from the OpenAI API with the signal from AbortController
      const response = await fetch(this.API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.API_KEY}`,
        },
        body: JSON.stringify({
          model: Config.TEXT_MODEL, // "gpt-3.5-turbo",
          messages: this.messages,
        }),
      });

      const data = await response.json();
      // ici on attends la réponse de CHAT GPT
      console.log(data.choices[0].message.content);

      // on peut envoyer la réponse à l'app dans l'idée de voir si on pourrait générer une image
      this.emit("gpt_response", [data.choices[0].message.content]);
      this.activeString = "";
      //on peut faire parler le bot
      this.speech
        .speak({
          text: data.choices[0].message.content,
          listeners: {
            onstart: () => {
              // console.log("Start utterance");
            },
            onend: () => {
              // console.log("End utterance");
            },
            onresume: () => {
              // console.log("Resume utterance");
            },
            onboundary: (event) => {
              this.extractWord(event);
            },
          },
        })
        .then(() => {
          // console.log("This is the end my friend!");
          this.emit("speechEnd", [data]);
        });
    } catch (error) {
      console.error("Error:", error);
      resultText.innerText = "Error occurred while generating.";
    }
  }

  extractWord(event) {
    const index = event.charIndex;
    const word = this.getWordAt(event.target.text, index);
    this.emit("word", [word]);
  }

  // Get the word of a string given the string and index
  getWordAt(str, pos) {
    // Perform type conversions.
    str = String(str);
    pos = Number(pos) >>> 0;

    // Search for the word's beginning and end.
    let left = str.slice(0, pos + 1).search(/\S+$/);
    let right = str.slice(pos).search(/\s/);

    // The last word in the string is a special case.
    if (right < 0) {
      return str.slice(left);
    }

    // Return the word, using the located bounds to extract it from the string.
    return str.slice(left, right + pos);
  }
}
