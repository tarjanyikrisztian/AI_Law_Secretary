import { useEffect, useState } from 'react'
import './App.css'
import ChatMessage from './components/ChatMessage'
import axios from 'axios'

function App() {
  // on form submit, add the message to the chat
  const [currentMessage, setCurrentMessage] = useState('')

  const [messages, setMessages] = useState([])

  const [sessionId, setSessionId] = useState('')

  const [waitingForResponse, setWaitingForResponse] = useState(false)

  const promptSuggestions = [
    {
      text: 'Készíts egy edzéstervet',
      prompt: 'Ellenállásos edzést szeretnék végezni. Össze tudnál állítani egy hétnapos edzéstervet, amivel elsajátíthatom az alapokat?',
      icon: 'fa-solid fa-dumbbell suggestion_color',
    },
    {
      text: 'Legnagyobb börtönbüntetések',
      prompt: 'Melyek azok a bűncselekmények, amelyek a legnagyobb börtönbüntetéssel járnak Magyarországon? Tudnál adni egy listát és részletezni, miért büntetik őket ilyen szigorúan és milyen hosszú szabadság vesztésre szólnak?',
      icon: 'fa-solid fa-gavel suggestion_color',
    },
    {
      text: 'Legújabb jogszabályok',
      prompt: 'Mik a legújabb jogi szabályozások Magyarországon? Ismertesd ezeket, és mondd el, milyen hatással lehetnek a mindennapi életünkre és a jogrendszerre!',
      icon: 'fa-solid fa-book suggestion_color',
    },
    {
      text: 'Polgári törvénykönyv szerződések',
      prompt: 'Melyek a magyar polgári törvénykönyv szerződésekre vonatkozó alapelvei? Tudnál részletes magyarázatot adni, és példákat hozni?',
      icon: 'fa-solid fa-question suggestion_color',
    }
  ]


  const generateSessionId = () => {
    const newSessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    setSessionId(newSessionId);
    console.log('New session id:', newSessionId);
    return newSessionId;
  }

  // generate a new session id when the component mounts
  useState(() => {
    generateSessionId();
  }, []);

  const baseUrl = 'http://127.0.0.1:5000/'

  const sendMessageToAPI = async (message) => {
    if (!message || message.trim() === '') {
      return;
    }
    const jsonMessage = JSON.stringify({ "input": message, "session_id": sessionId });
    setWaitingForResponse(true);
    try {
      const response = await axios.post(baseUrl + 'ask', jsonMessage, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data.output;
    } catch (error) {
      console.error('Error sending message:', error);
      return 'An error occurred while processing your request. Please try again later.';
    }
  }

  //while waiting for the response, show a dot animation to indicate that the bot is typing
  useEffect(() => {
    let intervalId;
    
    const addDots = () => {
      // Add dot to messages
      setMessages(prevMessages => [...prevMessages, { text: ". ", isBot: true }]);
      
      // Set interval to change dot to dots
      intervalId = setInterval(() => {
        setMessages(prevMessages => {
          const updatedMessages = [...prevMessages];
          const lastMessageIndex = updatedMessages.length - 1;
          if (updatedMessages[lastMessageIndex].text === ". . .") {
            updatedMessages[lastMessageIndex].text = ". .";
          } else if (updatedMessages[lastMessageIndex].text === ". .") {
            updatedMessages[lastMessageIndex].text = ". ";
          } else {
            updatedMessages[lastMessageIndex].text = ". . .";
          }
          return updatedMessages;
        });
      }, 500);
    };

    const stopAddingDots = () => {
      clearInterval(intervalId);
    };

    if (waitingForResponse) {
      addDots();
    } else {
      stopAddingDots();
    }

    return () => stopAddingDots(); // Cleanup on component unmount
  }, [waitingForResponse]);


  const handleFormSubmit = async (e) => {
    e.preventDefault()
    const newMessage = currentMessage.trim()
    if (newMessage === '' || waitingForResponse) {
      return
    }
    const newMessages = [...messages, { text: newMessage, isBot: false }]
    setMessages(newMessages)
    setCurrentMessage('')
    // while waiting for the response, show a dot animation to indicate that the bot is typing
    const botMessage = await sendMessageToAPI(newMessage)
    const botMessages = [...newMessages, { text: botMessage, isBot: true }]
    setWaitingForResponse(false);
    setMessages(botMessages)
  }

  return (
    <>
      <div className="App">

        <div className="chatbot">
          <div className="chatbot__messages__wrapper">
            <header className="chat__header">
              <h1>ChatBot</h1>
            </header>
            <div className="chatbot__messages">
              {messages.length === 0 ? (
                <form className='prompt__suggestion__wrapper' onSubmit={handleFormSubmit}>
                  {
                    promptSuggestions.map((suggestion, index) => {
                      return (
                        <div className='prompt__suggestion' key={index}>
                          <button
                            type='submit'
                            onClick={() => setCurrentMessage(suggestion.prompt)}
                          >
                            <div className="prompt__suggestion__icon">
                              <i className={suggestion.icon}></i>
                            </div>
                            <div className="prompt__suggestion__text">
                              {suggestion.text}
                            </div>
                          </button>
                        </div>
                      )
                    })
                  }


                </form>
              ) : (
                messages.map((message, index) => {
                  return <ChatMessage message={message.text} isBot={message.isBot} key={index} />
                })
              )
              }
            </div>
          </div>
          <form className="chatbot__input" onSubmit={handleFormSubmit}>
            <input className='input__text' type="text" placeholder="Type a message" value={currentMessage} onChange={(e) => setCurrentMessage(e.target.value)} />
            <button className='button__attach' disabled><i className="fa-solid fa-paperclip"></i></button>
            <button className='button__send' type='submit'
            ><i className="fa-solid fa-paper-plane"></i></button>
          </form>
        </div>
      </div>
    </>
  )
}

export default App
