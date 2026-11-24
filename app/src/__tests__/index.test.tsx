import { render, screen } from '@testing-library/react-native';

import HomeScreen from '../app/index';
import { getApiStatus } from '../services/api';

jest.mock('../services/api', () => ({ getApiStatus: jest.fn() }));

test('test_HomeScreen_whenApiIsUp_showsTitleAndConnectedStatus', async () => {
  jest.mocked(getApiStatus).mockResolvedValue('ok');
  await render(<HomeScreen />);
  expect(screen.getByText('Repeat')).toBeTruthy();
  expect(await screen.findByText('API conectada')).toBeTruthy();
});
