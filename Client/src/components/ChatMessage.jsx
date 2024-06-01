import './messages.css'
import ReactMarkdown from 'react-markdown'  // Need to modify

const ChatMessage = ({ message, isBot }) => {

    const senderName = 'AI'
    const senderMessage = message


    return (
        <>
            {isBot ? (
                <div className='chat__message'>
                    <div className='chat__message__sender'>{senderName}</div>
                    <div className='chat__message__text'>{senderMessage}</div>
                </div>
            ) : (
                <div className='chat__message chat__message__user'>
                    <ReactMarkdown className='chat__message__text__user'>{senderMessage}</ReactMarkdown>
                </div>
            )}
        </>
    )
}

export default ChatMessage