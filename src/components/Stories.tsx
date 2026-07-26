import React from 'react';
import styled from 'styled-components';

const StoriesContainer = styled.div`
  display: flex;
  gap: 15px;
  padding: 15px;
  border: 1px solid #262626;
  border-radius: 8px;
  background-color: #121212;
  margin-bottom: 20px;
  overflow-x: auto;
  &::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;
`;

const Story = styled.div`
  cursor: pointer;
  text-align: center;
  flex-shrink: 0;
`;

const StoryAvatar = styled.div`
  width: 66px;
  height: 66px;
  border-radius: 50%;
  border: 3px solid #0095f6;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;

  img {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    object-fit: cover;
  }
`;

const StoryUsername = styled.p`
  margin-top: 5px;
  font-size: 12px;
  white-space: nowrap;
  max-width: 70px;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const DUMMY_STORIES = [
    { user: 'ana', avatar: 'https://i.pravatar.cc/150?u=ana' },
    { user: 'marko', avatar: 'https://i.pravatar.cc/150?u=marko' },
    { user: 'jelena', avatar: 'https://i.pravatar.cc/150?u=jelena' },
    { user: 'stefan', avatar: 'https://i.pravatar.cc/150?u=stefan' },
    { user: 'milica', avatar: 'https://i.pravatar.cc/150?u=milica' },
    { user: 'nikola', avatar: 'https://i.pravatar.cc/150?u=nikola' },
    { user: 'sofija', avatar: 'https://i.pravatar.cc/150?u=sofija' },
    { user: 'luka', avatar: 'https://i.pravatar.cc/150?u=luka' },
];


const Stories = () => {
  return (
    <StoriesContainer>
      {DUMMY_STORIES.map((story, index) => (
        <Story key={index}>
          <StoryAvatar>
            <img src={story.avatar} alt={`${story.user}'s story`} />
          </StoryAvatar>
          <StoryUsername>{story.user}</StoryUsername>
        </Story>
      ))}
    </StoriesContainer>
  );
};

export default Stories;
