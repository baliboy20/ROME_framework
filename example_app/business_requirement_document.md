Specification


The Business use case is to develop a  web app  that accepts user input text and on confirmation processesthe information to then display that text in reverse.




The backend: a server that serves one URL POST [URL]/question and returns a reply.
the reply is the payload string in reverse order.

The Usecase /User journey

The app opens directly to the main screen. User enters some text. The user presses the
send button. The app sends this data via HTTP to the backend, the backend returns the same text "Result"
in reverse order. The text is added to an array which maintains state over the cycle of any future requests.
The updated result is then displayed on the main screen 

Technical specification
======================
Frontend: Flutter, BloC, Cupertino icons, equatable
Architecture: Domain-driven design

Input Validation Requirements:
- Maximum input length: 100 characters
- Input field should prevent entry beyond 100 characters
- Display character count (e.g., "87/100")
- Show validation message if limit is reached

Error Handling:
- Network failure: Display "Unable to connect to server. Please try again."
- Server error: Display "Something went wrong. Please try again."
- Empty input: Disable send button and show "Please enter some text"

UI/UX Specifications:
- Loading state: Show spinner while waiting for response
- Success state: Add result to list with smooth animation
- Results list: Display newest results at top
- Each result shows: original text, reversed text, timestamp

Performance Requirements:
- API response time: < 500ms under normal conditions
- UI should remain responsive during API calls

Backend: Node.js, Express, ts-node

Top level Project Structure
===========================
project structure : ./reverse_app
                                 /backend
                                 /frontend