import React from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import NavigationBar from './components/NavigationBar';
import Feed from './pages/Feed';

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica,
      Arial, sans-serif;
    background-color: #000;
    color: #fff;
  }
  * {
    box-sizing: border-box;
  }
`;

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const MainContent = styled.main`
  padding-top: 60px; /* To offset the fixed header */
`;

function App() {
  return (
    <>
      <GlobalStyle />
      <AppContainer>
        <NavigationBar />
        <MainContent>
          <Feed />
        </MainContent>
      </AppContainer>
    </>
  );
}

export default App;
