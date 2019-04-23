jest.mock('react-native-dev-menu', () => {
  return {
      addItem: jest.fn(() => {})
  };
});
