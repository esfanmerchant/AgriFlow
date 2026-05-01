import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../src/context/ThemeContext.jsx';
import '../src/index.css';

export const parameters = {
  backgrounds: {
    default: 'forest',
    values: [
      { name: 'forest', value: '#06120c' },
      { name: 'cream',  value: '#f6f3ee' },
    ],
  },
  controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
};

export const decorators = [
  (Story) => (
    <BrowserRouter>
      <ThemeProvider>
        <div style={{ padding: 24 }}>
          <Story />
        </div>
      </ThemeProvider>
    </BrowserRouter>
  ),
];
