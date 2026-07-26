import React from 'react';
import styled from 'styled-components';
import Stories from '../components/Stories';
import Post from '../components/Post';

const FeedContainer = styled.div`
  max-width: 614px;
  margin: 20px auto;
  padding: 0 10px;
`;

const DUMMY_POSTS = [
  {
    username: 'ana',
    avatar: 'https://i.pravatar.cc/150?u=ana',
    imageUrl: 'https://picsum.photos/600/600?random=10',
    likes: 123,
    likedBy: 'marko',
    caption: 'What a beautiful day! #nature',
  },
  {
    username: 'jelena',
    avatar: 'https://i.pravatar.cc/150?u=jelena',
    imageUrl: 'https://picsum.photos/600/600?random=11',
    likes: 45,
    likedBy: 'sofija',
    caption: 'City lights.',
  },
];

const Feed = () => {
  return (
    <FeedContainer>
      <Stories />
      <div>
        {DUMMY_POSTS.map((post, index) => (
          <Post key={index} post={post} />
        ))}
      </div>
    </FeedContainer>
  );
};

export default Feed;
