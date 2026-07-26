import React from 'react';
import styled from 'styled-components';

const PostContainer = styled.div`
  border: 1px solid #262626;
  border-radius: 8px;
  background-color: #121212;
  margin-bottom: 20px;
`;

const PostHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 10px 15px;

  img {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    margin-right: 10px;
  }
  
  span {
    font-weight: 600;
  }
`;

const PostImage = styled.img`
  width: 100%;
  height: auto;
  object-fit: cover;
`;

const PostActions = styled.div`
  padding: 10px 15px;

  i {
    font-size: 24px;
    margin-right: 15px;
    cursor: pointer;
  }
`;

const PostLikes = styled.div`
  padding: 0 15px;
  font-size: 14px;
  font-weight: 600;
`;

const PostCaption = styled.div`
  padding: 5px 15px 15px;
  font-size: 14px;

  span {
    font-weight: 600;
    margin-right: 5px;
  }
`;

interface PostProps {
  post: {
    username: string;
    avatar: string;
    imageUrl: string;
    likes: number;
    caption: string;
    likedBy: string;
  };
}

const Post: React.FC<PostProps> = ({ post }) => {
  return (
    <PostContainer>
      <PostHeader>
        <img src={post.avatar} alt={`${post.username}'s avatar`} />
        <span>{post.username}</span>
      </PostHeader>
      <PostImage src={post.imageUrl} alt="Post content" />
      <PostActions>
        <i className="far fa-heart"></i>
        <i className="far fa-comment"></i>
        <i className="far fa-paper-plane"></i>
        <i className="far fa-bookmark" style={{ float: 'right' }}></i>
      </PostActions>
      <PostLikes>
        Liked by <strong>{post.likedBy}</strong> and <strong>{post.likes} others</strong>
      </PostLikes>
      <PostCaption>
        <span>{post.username}</span>
        {post.caption}
      </PostCaption>
    </PostContainer>
  );
};

export default Post;
