from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from langchain import hub
from langchain.agents import AgentExecutor, create_react_agent
from langchain_openai import ChatOpenAI
from os import environ
from langchain_community.utilities import SerpAPIWrapper
from langchain.tools import Tool, tool
from langchain.memory import ChatMessageHistory
from langchain_core.messages import SystemMessage
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader, TextLoader, Docx2txtLoader
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.agents.agent_toolkits import create_retriever_tool
import os

app = Flask(__name__)
CORS(app)
app.config.from_pyfile('config.py')

OPENAI_API_KEY = app.config['OPENAI_API_KEY']
SERPAPI_API_KEY = app.config['SERPAPI_API_KEY']
OPENAI_MODEL = app.config['OPENAI_MODEL']
DOCS_PATH = app.config['DOCS_PATH']

search = SerpAPIWrapper(serpapi_api_key=SERPAPI_API_KEY)

# Load all documents
text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1500,
            chunk_overlap=200
        )

all_documents = []
raw_documents = os.listdir(DOCS_PATH)
raw_documents = [os.path.join(DOCS_PATH, document) for document in raw_documents]
for document in raw_documents:
    print(document)
    if document.endswith('.pdf'):
        data = PyPDFLoader(document).load()
        all_documents.extend(data)
    elif document.endswith('.txt'):
        data = TextLoader(document).load()
        all_documents.extend(data)        
    elif document.endswith('.docx'):
        data = Docx2txtLoader(document).load()
        all_documents.extend(data)
        
# Create the vector database
documents = text_splitter.split_documents(all_documents)

embeddings = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY)
vector_db = FAISS.from_documents(documents, embeddings)

prompt = hub.pull("hwchase17/react-chat")

llm = ChatOpenAI(openai_api_key=OPENAI_API_KEY, model=OPENAI_MODEL, temperature=0)

memory = ChatMessageHistory(session_id="test-session")

baseline_system_prompt = """You are a law assistant for question-answering tasks. \
You are given a question about policies and law. \
You need to provide the best answer based on the information you have, and if you need more information, you can ask for it. \
You can only provide information about policies and law. \
You must answer the question in the language that the question is asked in. \
"""

system_message = SystemMessage(content=baseline_system_prompt)

memory.add_message(system_message)

vector_tool = create_retriever_tool(
            vector_db.as_retriever(),
            "policy_and_law_search",
            "Questions about policies and law"
        )

search_tool = Tool.from_function(
            func=search.run,
            name="Search",
            description="Search the web for information about news, articles, and more about Law"
        )

tools = [vector_tool, search_tool]

agent = create_react_agent(llm, tools, prompt)

agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True, handle_parsing_errors=True)

agent_with_chat_history = RunnableWithMessageHistory(
    agent_executor,
    lambda session_id: memory,
    input_messages_key="input",
    history_messages_key="chat_history",
)

@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        res = Response()
        res.headers['X-Content-Type-Options'] = '*'
        return res

@app.route('/ask', methods=['POST'])
def ask():
    input_message = request.json['input']
    session_id = request.json['session_id']
    result = agent_with_chat_history.invoke(
        {"input": input_message},
        config={"configurable": {"session_id": session_id}},
    )
    return jsonify({"output": result["output"]})

if __name__ == '__main__':
    app.run(debug=True)