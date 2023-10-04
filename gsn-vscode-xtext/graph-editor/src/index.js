import ReactDOM from 'react-dom/client';
//
import App from './App';

// hooks
import { GlobalState } from './hooks/useGlobalState';

// ----------------------------------------------------------------------

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
    <GlobalState>
        <App />
    </GlobalState>
);
