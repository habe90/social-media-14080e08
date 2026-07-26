import React from 'react';
import styled from 'styled-components';

const HeaderContainer = styled.header`
  background-color: #121212;
  border-bottom: 1px solid #262626;
  padding: 0 20px;
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 100;
  height: 60px;
`;

const Nav = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 975px;
  margin: 0 auto;
  height: 100%;
`;

const Logo = styled.div`
  font-family: 'Grand Hotel', cursive;
  font-size: 28px;
  color: #0095f6;
`;

const SearchBar = styled.input`
    background-color: #262626;
    border: 1px solid #363636;
    border-radius: 8px;
    padding: 8px 12px;
    color: #fff;
    width: 250px;
    
    @media (max-width: 768px) {
        display: none;
    }
`;

const NavIcons = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  
  img, i {
    cursor: pointer;
    font-size: 24px;
  }
`;

const ProfileIcon = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 50%;
`;


const NavigationBar = () => {
    return (
        <HeaderContainer>
            <link href="https://fonts.googleapis.com/css2?family=Grand+Hotel&display=swap" rel="stylesheet" />
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
            <Nav>
                <Logo>Selamy</Logo>
                <SearchBar type="text" placeholder="Search" />
                <NavIcons>
                    <i className="fas fa-home"></i>
                    <i className="far fa-paper-plane"></i>
                    <i className="far fa-plus-square"></i>
                    <i className="far fa-compass"></i>
                    <i className="far fa-heart"></i>
                    <ProfileIcon src="https://i.pravatar.cc/150?u=currentuser" alt="Profile" />
                </NavIcons>
            </Nav>
        </HeaderContainer>
    );
};

export default NavigationBar;
