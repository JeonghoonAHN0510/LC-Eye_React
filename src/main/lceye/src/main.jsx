import { createRoot } from 'react-dom/client';
import App from './App';
import store from './admin/store/store';
import { Provider } from 'react-redux';
import './assets/css/main.css';

const root = document.querySelector('#root');
const create = createRoot(root);

create.render(
    <Provider store={store}>
        <App />
    </Provider>
);