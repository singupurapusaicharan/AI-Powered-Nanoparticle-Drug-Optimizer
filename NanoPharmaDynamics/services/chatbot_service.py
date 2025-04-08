import logging
import json
import uuid
from .openai_service import generate_chatbot_response
from models import ChatSession, db

logger = logging.getLogger(__name__)

def process_chat_message(message, session_id):
    """
    Process a chat message and generate a response.
    
    Args:
        message (str): User message
        session_id (str): Chat session ID
        
    Returns:
        dict: Response with the assistant's message
    """
    try:
        logger.debug(f"Processing chat message for session {session_id}: {message}")
        
        # Get or create chat session
        chat_session = get_or_create_session(session_id)
        
        # Get conversation history
        conversation_history = json.loads(chat_session.conversation_history) if isinstance(chat_session.conversation_history, str) else chat_session.conversation_history
        
        # Generate response
        response = generate_chatbot_response(message, conversation_history)
        
        # Update conversation history
        conversation_history.append({
            "user": message,
            "assistant": response
        })
        
        # Save updated history
        chat_session.conversation_history = conversation_history
        db.session.commit()
        
        return {
            "session_id": session_id,
            "response": response
        }
    
    except Exception as e:
        logger.error(f"Error processing chat message: {str(e)}")
        return {
            "session_id": session_id,
            "response": "I'm sorry, I'm having trouble processing your request. Please try again later."
        }

def get_or_create_session(session_id):
    """
    Get an existing chat session or create a new one.
    
    Args:
        session_id (str): Chat session ID
        
    Returns:
        ChatSession: The chat session object
    """
    try:
        # Check if session exists
        chat_session = ChatSession.query.filter_by(session_id=session_id).first()
        
        # Create new session if not exists
        if not chat_session:
            logger.info(f"Creating new chat session with ID: {session_id}")
            chat_session = ChatSession(
                session_id=session_id,
                conversation_history=[]
            )
            db.session.add(chat_session)
            db.session.commit()
        
        return chat_session
    
    except Exception as e:
        logger.error(f"Error getting/creating chat session: {str(e)}")
        
        # Create a new session as fallback
        new_session_id = str(uuid.uuid4())
        logger.info(f"Creating fallback chat session with ID: {new_session_id}")
        chat_session = ChatSession(
            session_id=new_session_id,
            conversation_history=[]
        )
        db.session.add(chat_session)
        db.session.commit()
        
        return chat_session

def get_chat_history(session_id):
    """
    Get the conversation history for a chat session.
    
    Args:
        session_id (str): Chat session ID
        
    Returns:
        list: Conversation history
    """
    try:
        chat_session = ChatSession.query.filter_by(session_id=session_id).first()
        
        if not chat_session:
            return []
        
        # Convert to JSON if it's a string
        conversation_history = json.loads(chat_session.conversation_history) if isinstance(chat_session.conversation_history, str) else chat_session.conversation_history
        
        return conversation_history
    
    except Exception as e:
        logger.error(f"Error getting chat history: {str(e)}")
        return []
