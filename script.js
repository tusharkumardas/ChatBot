// Getting Elements from the html

const typingForm = document.querySelector(".typing-form");
const chat = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion");
const toggleTheme = document.querySelector("#theme-toogle-button");
const deleteChat = document.querySelector("#delete-chat-button");

//Default state for api handling.
let userMessage = null;
let apiResponse = false;

//API Configuration

const API_KEY = "AIzaSyA1bCIZyCxfNuykX13Sx-V7kS9TZZJ7yRg";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

// saving the theme in the local storage

const loadData = () => {
  const savedChats = localStorage.getItem("savedchats");
  const isLightMode = localStorage.getItem("themeColor") === "light_mode";
  document.body.classList.toggle("light_mode", isLightMode);
  toggleTheme.innerText = isLightMode ? "dark_mode" : "light_mode";

  //clear the chat when clicking delete || restoring the chats
  chat.innerHTML = savedChats || "";
  document.body.classList.toggle("hide-header", savedChats);
  chat.scrollTo(0, chat.scrollHeight); // scroll to bottom
};

//darkmode lightmode toggle theme

toggleTheme.addEventListener("click", () => {
  const isLightMode = document.body.classList.toggle("light_mode");
  localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode");
  toggleTheme.innerText = isLightMode ? "dark_mode" : "light_mode";
});

//creating a div element for messages

const createMessage = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

//creating the typing effect for displaying words one by one

const typingEffect = (text, textElement, messageDiv) => {
  const words = text.split(" ");
  let currentWordIndex = 0;

  //append the words one by one with space

  const typingInterval = setInterval(() => {
    textElement.innerText +=
      (currentWordIndex === 0 ? "" : " ") + words[currentWordIndex++];
    messageDiv.querySelector(".icon").classList.add("hide");

    //if all the words are displayed
    if (currentWordIndex === words.length) {
      clearInterval(typingInterval);
      apiResponse = false;
      messageDiv.querySelector(".icon").classList.remove("hide");
      localStorage.setItem("savedchats", chat.innerHTML);
    }
    chat.scrollTo(0, chat.scrollHeight); // scroll to bottom
  }, 100);
};

// Fetching the data from the api based on the user prompt

const generateResponse = async (messageDiv) => {
  //Getting the text element and sending it to api

  const textElement = messageDiv.querySelector(".text");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: userMessage }],
          },
        ],
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error.message);

    // Get the response text and removing the unnesscary spaces,asteriks frokm the api
    const apiData = data?.candidates[0].content.parts[0].text.replace(
      /\*\*(.*?)\*\*/g,
      "$1"
    );

    // display the data with typing effect after getting response from the api
    typingEffect(apiData, textElement, messageDiv);
  } catch (error) {
    apiResponse = false;
    textElement.innerText = error.message;
    textElement.parentElement.closest(".message").classList.add("error");
  } finally {
    messageDiv.classList.remove("loading");
  }
};

// Creating a loading animation while waiting for the response from the api
const loadingAnimation = () => {
  const tag = `<div class="message-content">
                     <img class="avatar" src="images/gemini.svg" alt="Gemini logo">
                     <p class="text"></p>
                     <div class="loading-indicator">
                     <div class="loading-bar"></div>
                     <div class="loading-bar"></div>
                     <div class="loading-bar"></div>
                     </div>
                     </div>
                     <span onClick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>`;

  const messageDiv = createMessage(tag, "incoming", "loading");
  chat.appendChild(messageDiv);
  chat.scrollTo(0, chat.scrollHeight); // scroll to bottom
  generateResponse(messageDiv);
};

//copy the responses
const copyMessage = (copyButton) => {
  const messageText = copyButton.parentElement.querySelector(".text").innerText;
  navigator.clipboard.writeText(messageText);
  copyButton.innerText = "done";
  setTimeout(() => (copyButton.innerText = "content_copy"), 1000);
};

// Handling the message from the prompt to API and adding loading effect when the response came.

const sendMessage = () => {
  userMessage =
    typingForm.querySelector(".typing-input").value.trim() || userMessage;
  // Exit if there is no message or response is generating
  if (!userMessage || apiResponse) return;
  apiResponse = true;
  const tag = `<div class="message-content">
                     <img class="avatar" src="images/user.jpg" alt="user profile photo">
                     <p class="text"></p>
                     </div>`;
  const sendMessageDiv = createMessage(tag, "outgoing");
  sendMessageDiv.querySelector(".text").innerText = userMessage;
  chat.appendChild(sendMessageDiv);

  //to clear the prompt values
  typingForm.reset();
  document.body.classList.add("hide-header");
  chat.scrollTo(0, chat.scrollHeight); // scroll to bottom
  setTimeout(loadingAnimation, 500);
};

// Genearting the api response while clicking the suggestions
suggestions.forEach((suggestion) => {
    suggestion.addEventListener("click", () => {
    userMessage = suggestion.querySelector(".text").innerText;
    sendMessage();
  });
});

// Delete button to delete all the chats

deleteChat.addEventListener("click", () => {
  if (confirm("Are you sure you want to delete all the chats")) {
    localStorage.removeItem("savedchats");
    loadData();
  }
});

typingForm.addEventListener("submit", (e) => {
  e.preventDefault();
  sendMessage();
});

loadData();
